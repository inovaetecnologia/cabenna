begin;

-- PrivilÃ©gio de produto e licenÃ§a sÃ£o separados da autorizaÃ§Ã£o de conteÃºdo.
create table public.administradores_produto(
 usuario_id uuid primary key references auth.users(id) on delete cascade,
 ativo boolean not null default true,
 criado_em timestamptz not null default now()
);
alter table public.administradores_produto enable row level security;
revoke all on public.administradores_produto from public,anon,authenticated;
grant select on public.administradores_produto to authenticated;
create policy administrador_proprio on public.administradores_produto for select to authenticated using(usuario_id=auth.uid());

create function public.cabenna_master() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.administradores_produto where usuario_id=auth.uid() and ativo);
$$;
create function public.cabenna_licenca_equipe_interno(p_equipe uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.equipes e join public.administradores_produto a on a.usuario_id=e.proprietario_id and a.ativo where e.id=p_equipe and e.encerrada_em is null);
$$;
create or replace function public.cabenna_equipe_editavel(p_equipe uuid) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select encerrada_em is null and (teste_fim>now() or pago_ate>now() or public.cabenna_licenca_equipe_interno(p_equipe)) from public.equipes where id=p_equipe and public.cabenna_papel(p_equipe) is not null),false);
$$;
do $copia$ declare definicao text; begin
 select pg_get_functiondef('public.cabenna_plano(uuid)'::regprocedure) into definicao;
 execute replace(definicao,'FUNCTION public.cabenna_plano(','FUNCTION public.cabenna_plano_base_interno(');
end; $copia$;
revoke all on function public.cabenna_plano_base_interno(uuid) from public,anon,authenticated;
create or replace function public.cabenna_plano(p_equipe uuid default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare p jsonb; permanente boolean;
begin
 p:=public.cabenna_plano_base_interno(p_equipe);
 permanente:=case when p_equipe is null then public.cabenna_master() else public.cabenna_licenca_equipe_interno(p_equipe) end;
 if permanente then
  if p_equipe is null then
   select to_jsonb(c) into p from public.catalogo_planos c where codigo<>'gratuito' order by armazenamento_bytes desc,historico_dias desc limit 1;
   p:=p||jsonb_build_object('nome','Master Inovae','historico_dias',(select max(historico_dias) from public.catalogo_planos),'armazenamento_bytes',(select max(armazenamento_bytes) from public.catalogo_planos),'anexo_bytes',(select max(anexo_bytes) from public.catalogo_planos));
  end if;
  p:=p||jsonb_build_object('estado','ativo','teste_fim',null,'pago_ate',null,'teste_utilizado',true,'licenca_permanente',true);
 end if;
 return p||jsonb_build_object('master',public.cabenna_master());
end; $$;

-- Metas sÃ£o documentos estruturados; tarefas e notas podem apontar para o mesmo plano.
do $copia$ declare definicao text; begin
 select pg_get_functiondef('public.cabenna_salvar_registro(uuid,jsonb,integer,uuid)'::regprocedure) into definicao;
 execute replace(definicao,'FUNCTION public.cabenna_salvar_registro(','FUNCTION public.cabenna_salvar_base_interno(');
end; $copia$;
revoke all on function public.cabenna_salvar_base_interno(uuid,jsonb,integer,uuid) from public,anon,authenticated;
create or replace function public.cabenna_salvar_registro(p_id uuid,p_entrada jsonb,p_versao integer,p_equipe uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare r jsonb; alvo uuid; meta jsonb; meta_valida jsonb; antigo public.registros;
begin
 if auth.uid() is null then raise exception 'SEM_PERMISSAO'; end if;
 alvo:=(p_entrada->'dados'->>'objetivo_id')::uuid;
 meta:=p_entrada->'dados'->'objetivo';
 if alvo is not null then
  if alvo=p_id or not exists(select 1 from public.registros g where g.id=alvo and g.equipe_id is not distinct from p_equipe and g.dados?'objetivo' and g.excluido_em is null and not g.arquivado and public.cabenna_acesso_registro(g.id)) then raise exception 'OBJETIVO_INDISPONIVEL'; end if;
  if not public.cabenna_acesso_registro(alvo,true) then raise exception 'OBJETIVO_SEM_EDICAO'; end if;
  -- A ligaÃ§Ã£o nÃ£o pode levar conteÃºdo de um espaÃ§o restrito para outro contexto de acesso.
  if not exists(select 1 from public.registros g where g.id=alvo and g.espaco_id is not distinct from (p_entrada->>'espaco_id')::uuid) then raise exception 'OBJETIVO_ESPACO_DIFERENTE'; end if;
 end if;
 if meta is not null and meta<>'null'::jsonb then
  if p_entrada->>'tipo'<>'documento' or jsonb_typeof(meta)<>'object' or char_length(coalesce(meta->>'resultado','')) not between 1 and 2000 or coalesce(meta->>'situacao','ativo') not in ('ativo','pausado','concluido') then raise exception 'OBJETIVO_INVALIDO'; end if;
  if meta->>'data_alvo' is not null then perform (meta->>'data_alvo')::date; end if;
  meta_valida:=jsonb_build_object('resultado',meta->>'resultado','data_alvo',meta->>'data_alvo','situacao',coalesce(meta->>'situacao','ativo'));
 end if;
 -- Mesma ordem de bloqueios das gravações e da gestão de participantes.
 if p_equipe is null then perform id from auth.users where id=auth.uid() for update;
 else perform id from public.equipes where id=p_equipe for update; end if;
 if p_versao>0 then
  select * into antigo from public.registros where id=p_id for update;
  if found and antigo.versao=p_versao and antigo.equipe_id is not distinct from p_equipe and public.cabenna_acesso_registro(p_id,true) and antigo.excluido_em is null then
   update public.registros set dados=dados-'objetivo'-'objetivo_id' where id=p_id;
  end if;
 end if;
 r:=public.cabenna_salvar_base_interno(p_id,p_entrada,p_versao,p_equipe);
 -- FunÃ§Ãµes anteriores preservam chaves desconhecidas. Atualizamos apenas as duas novas chaves validadas.
 update public.registros set dados=(dados-'objetivo'-'objetivo_id')||case when meta_valida is null then '{}'::jsonb else jsonb_build_object('objetivo',meta_valida) end||case when alvo is null then '{}'::jsonb else jsonb_build_object('objetivo_id',alvo::text) end where id=p_id returning to_jsonb(registros) into r;
 update public.versoes_registro set conteudo=r where registro_id=p_id and versao=(r->>'versao')::integer;
 return jsonb_set(r,'{dados}',(r->'dados')||jsonb_build_object('meu_dia',(select dia::text from public.focos_diarios where usuario_id=auth.uid() and registro_id=p_id)));
end; $$;

create function public.cabenna_resumo_master() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not public.cabenna_master() then raise exception 'SEM_PERMISSAO'; end if;
 return jsonb_build_object('contas',(select count(*) from auth.users),'equipes',(select count(*) from public.equipes),'registros',(select count(*) from public.registros),'masters',(select count(*) from public.administradores_produto where ativo));
end; $$;

revoke all on function public.cabenna_master(),public.cabenna_plano(uuid),public.cabenna_salvar_registro(uuid,jsonb,integer,uuid),public.cabenna_resumo_master() from public,anon;
grant execute on function public.cabenna_master(),public.cabenna_plano(uuid),public.cabenna_salvar_registro(uuid,jsonb,integer,uuid),public.cabenna_resumo_master() to authenticated;
revoke all on function public.cabenna_licenca_equipe_interno(uuid) from public,anon,authenticated;
commit;
