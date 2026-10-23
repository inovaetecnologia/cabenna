begin;

create table public.itens_pessoais (
  id uuid primary key,
  usuario_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  tipo text not null check (tipo in ('nota', 'tarefa', 'lista')),
  titulo text not null check (char_length(trim(titulo)) between 1 and 200),
  texto text not null default '' check (char_length(texto) <= 50000),
  prazo date check (prazo between '1900-01-01' and '2200-12-31'),
  estado text not null default 'A fazer' check (estado in ('A fazer', 'Em andamento', 'Aguardando', 'Concluída')),
  checklist jsonb not null default '[]'::jsonb check (jsonb_typeof(checklist) = 'array' and jsonb_array_length(checklist) <= 300),
  favorito boolean not null default false,
  arquivado boolean not null default false,
  excluido_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  versao integer not null default 1 check (versao > 0)
);
create index itens_pessoais_usuario_atualizado on public.itens_pessoais(usuario_id, atualizado_em desc);
alter table public.itens_pessoais enable row level security;
revoke all on public.itens_pessoais from public, anon, authenticated;
grant select on public.itens_pessoais to authenticated;
create policy leitura_propria on public.itens_pessoais for select to authenticated using ((select auth.uid()) = usuario_id);

-- Escrita apenas por RPC: impede forjar proprietário, versão e datas pelo REST.
-- SECURITY DEFINER tem search_path fixo e verifica proprietário explicitamente.
create function public.salvar_item_pessoal(p_id uuid, p_entrada jsonb, p_versao integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  usuario uuid := auth.uid();
  registro public.itens_pessoais;
  linha jsonb;
begin
  if usuario is null then raise exception 'SEM_PERMISSAO'; end if;
  if p_versao is null or p_versao < 0 or p_id is null then raise exception 'ENTRADA_INVALIDA'; end if;
  if jsonb_typeof(p_entrada) <> 'object' or p_entrada is null
    or p_entrada->>'tipo' is null or p_entrada->>'titulo' is null
    or p_entrada->>'estado' is null or p_entrada->>'texto' is null
    or jsonb_typeof(p_entrada->'checklist') is distinct from 'array'
    or jsonb_typeof(p_entrada->'favorito') is distinct from 'boolean'
    then raise exception 'ENTRADA_INVALIDA'; end if;
  for linha in select value from jsonb_array_elements(p_entrada->'checklist') loop
    if jsonb_typeof(linha) <> 'object' or char_length(trim(coalesce(linha->>'texto', ''))) not between 1 and 500
      or char_length(coalesce(linha->>'id','')) not between 1 and 100
      or jsonb_typeof(linha->'feita') is distinct from 'boolean' then raise exception 'LISTA_INVALIDA'; end if;
  end loop;
  if exists (select 1 from jsonb_array_elements(p_entrada->'checklist') l group by l->>'id' having count(*) > 1) then raise exception 'LISTA_INVALIDA'; end if;
  if p_versao = 0 then
    insert into public.itens_pessoais(id, usuario_id, tipo, titulo, texto, prazo, estado, checklist, favorito)
    values(p_id, usuario, p_entrada->>'tipo', trim(p_entrada->>'titulo'), p_entrada->>'texto', (p_entrada->>'prazo')::date,
      p_entrada->>'estado', p_entrada->'checklist', (p_entrada->>'favorito')::boolean)
    returning * into registro;
  else
    update public.itens_pessoais set tipo=p_entrada->>'tipo', titulo=trim(p_entrada->>'titulo'), texto=p_entrada->>'texto',
      prazo=(p_entrada->>'prazo')::date, estado=p_entrada->>'estado', checklist=p_entrada->'checklist',
      favorito=(p_entrada->>'favorito')::boolean, atualizado_em=now(), versao=versao+1
    where id=p_id and usuario_id=usuario and versao=p_versao and excluido_em is null
    returning * into registro;
    if not found then raise exception 'CONFLITO_OU_SEM_PERMISSAO'; end if;
  end if;
  return to_jsonb(registro) - 'usuario_id';
exception when unique_violation then raise exception 'CONFLITO_OU_SEM_PERMISSAO';
end;
$$;
revoke all on function public.salvar_item_pessoal(uuid,jsonb,integer) from public, anon, authenticated;
grant execute on function public.salvar_item_pessoal(uuid,jsonb,integer) to authenticated;

create function public.organizar_item_pessoal(p_id uuid, p_versao integer, p_acao text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare registro public.itens_pessoais; usuario uuid := auth.uid();
begin
  if usuario is null then raise exception 'SEM_PERMISSAO'; end if;
  if p_acao not in ('arquivar','desarquivar','excluir','restaurar') or p_acao is null then raise exception 'ACAO_INVALIDA'; end if;
  update public.itens_pessoais set
    arquivado=case when p_acao='arquivar' then true when p_acao='desarquivar' then false else arquivado end,
    excluido_em=case when p_acao='excluir' then now() when p_acao='restaurar' then null else excluido_em end,
    atualizado_em=now(), versao=versao+1
  where id=p_id and usuario_id=usuario and versao=p_versao
    and ((p_acao='restaurar' and excluido_em is not null) or (p_acao<>'restaurar' and excluido_em is null))
  returning * into registro;
  if not found then raise exception 'CONFLITO_OU_SEM_PERMISSAO'; end if;
  return to_jsonb(registro) - 'usuario_id';
end;
$$;
revoke all on function public.organizar_item_pessoal(uuid,integer,text) from public, anon, authenticated;
grant execute on function public.organizar_item_pessoal(uuid,integer,text) to authenticated;

comment on table public.itens_pessoais is 'Incremento 1: conteúdo pessoal comum. Nunca armazena segredos ou conteúdo de cofre.';
commit;
