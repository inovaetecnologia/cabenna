begin;

-- Catálogo configurável. Cobrança e concessão de plano pago são exclusivas do servidor.
create table public.catalogo_planos (
  codigo text primary key check(codigo in ('gratuito','pro','equipes')),
  nome text not null,
  historico_dias integer not null check(historico_dias > 0),
  armazenamento_bytes bigint not null check(armazenamento_bytes > 0),
  anexo_bytes bigint not null check(anexo_bytes > 0),
  participantes_max integer not null default 1,
  teste_dias integer not null default 14
);
insert into public.catalogo_planos values
 ('gratuito','Gratuito',7,262144000,20971520,1,14),
 ('pro','Pro',90,5368709120,104857600,1,14),
 ('equipes','Equipes',90,21474836480,104857600,15,14);

create table public.assinaturas_pessoais (
 usuario_id uuid primary key references auth.users(id) on delete cascade,
 teste_inicio timestamptz,
 teste_fim timestamptz,
 pago_ate timestamptz,
 check(teste_fim is null or teste_fim > teste_inicio)
);
create table public.equipes (
 id uuid primary key default gen_random_uuid(),
 nome text not null check(char_length(trim(nome)) between 1 and 80),
 proprietario_id uuid not null references auth.users(id),
 criado_em timestamptz not null default now(),
 teste_inicio timestamptz not null default now(),
 teste_fim timestamptz not null,
 pago_ate timestamptz,
 encerrada_em timestamptz
);
create table public.participantes_equipe (
 equipe_id uuid not null references public.equipes(id) on delete cascade,
 usuario_id uuid not null references auth.users(id) on delete cascade,
 papel text not null check(papel in ('proprietario','administrador','membro','convidado')),
 email text not null,
 entrou_em timestamptz not null default now(),
 primary key(equipe_id,usuario_id)
);
create unique index um_proprietario_equipe on public.participantes_equipe(equipe_id) where papel='proprietario';
create index equipes_por_usuario on public.participantes_equipe(usuario_id,equipe_id);
create table public.convites_equipe (
 id uuid primary key default gen_random_uuid(),
 equipe_id uuid not null references public.equipes(id) on delete cascade,
 email text not null check(char_length(email) between 3 and 254),
 papel text not null check(papel in ('administrador','membro','convidado')),
 token_hash text not null unique,
 criado_por uuid not null references auth.users(id),
 criado_em timestamptz not null default now(),
 vence_em timestamptz not null default now()+interval '7 days',
 estado text not null default 'pendente' check(estado in ('pendente','aceito','revogado'))
);
create index convites_da_equipe on public.convites_equipe(equipe_id,estado,vence_em);
create table public.espacos (
 id uuid primary key default gen_random_uuid(),
 usuario_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 equipe_id uuid references public.equipes(id) on delete cascade,
 nome text not null check(char_length(trim(nome)) between 1 and 80),
 cor text not null default '#7EAE92' check(cor ~ '^#[A-Fa-f0-9]{6}$'),
 restrito boolean not null default false,
 criado_em timestamptz not null default now()
);
create table public.permissoes_espaco (
 espaco_id uuid not null references public.espacos(id) on delete cascade,
 usuario_id uuid not null references auth.users(id) on delete cascade,
 pode_editar boolean not null default false,
 primary key(espaco_id,usuario_id)
);

create table public.registros (
 id uuid primary key default gen_random_uuid(),
 usuario_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 equipe_id uuid references public.equipes(id) on delete cascade,
 espaco_id uuid references public.espacos(id),
 tipo text not null check(tipo in ('nota','documento','tarefa','lista','evento')),
 titulo text not null check(char_length(trim(titulo)) between 1 and 200),
 texto text not null default '' check(char_length(texto)<=50000),
 prazo date check(prazo between '1900-01-01' and '2200-12-31'),
 estado text not null default 'A fazer' check(estado in ('A fazer','Em andamento','Aguardando','Concluída')),
 checklist jsonb not null default '[]' check(jsonb_typeof(checklist)='array' and jsonb_array_length(checklist)<=300),
 dados jsonb not null default '{}' check(jsonb_typeof(dados)='object' and octet_length(dados::text)<=524288),
 favorito boolean not null default false,
 arquivado boolean not null default false,
 excluido_em timestamptz,
 criado_em timestamptz not null default now(),
 atualizado_em timestamptz not null default now(),
 versao integer not null default 1 check(versao>0)
);
create index registros_pessoais on public.registros(usuario_id,atualizado_em desc) where equipe_id is null;
create index registros_equipe on public.registros(equipe_id,atualizado_em desc) where equipe_id is not null;
create index registros_espaco on public.registros(espaco_id);
create table public.versoes_registro (
 registro_id uuid not null references public.registros(id) on delete cascade,
 versao integer not null,
 autor_id uuid references auth.users(id) on delete set null,
 criado_em timestamptz not null default now(),
 conteudo jsonb not null,
 primary key(registro_id,versao)
);
create table public.comentarios_registro (
 id uuid primary key default gen_random_uuid(),
 registro_id uuid not null references public.registros(id) on delete cascade,
 usuario_id uuid not null references auth.users(id) on delete cascade,
 texto text not null check(char_length(trim(texto)) between 1 and 4000),
 criado_em timestamptz not null default now(),
 excluido_em timestamptz
);
create table public.auditoria_cabenna (
 id bigint generated always as identity primary key,
 usuario_id uuid references auth.users(id) on delete set null,
 equipe_id uuid references public.equipes(id) on delete cascade,
 acao text not null,
 alvo_id uuid,
 criado_em timestamptz not null default now()
);

-- Migração preserva os registros e suas datas. Os RPCs antigos deixam de escrever
-- para evitar divergência entre clientes v1 e v2 durante a troca de aplicação.
insert into public.registros(id,usuario_id,tipo,titulo,texto,prazo,estado,checklist,favorito,arquivado,excluido_em,criado_em,atualizado_em,versao)
 select id,usuario_id,tipo,titulo,texto,prazo,estado,checklist,favorito,arquivado,excluido_em,criado_em,atualizado_em,versao from public.itens_pessoais;
insert into public.versoes_registro(registro_id,versao,autor_id,criado_em,conteudo)
 select id,versao,usuario_id,atualizado_em,to_jsonb(r) from public.registros r;
revoke execute on function public.salvar_item_pessoal(uuid,jsonb,integer) from authenticated;
revoke execute on function public.organizar_item_pessoal(uuid,integer,text) from authenticated;

create function public.cabenna_papel(p_equipe uuid) returns text language sql stable security definer set search_path='' as $$
 select papel from public.participantes_equipe where equipe_id=p_equipe and usuario_id=auth.uid();
$$;
create function public.cabenna_equipe_editavel(p_equipe uuid) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select encerrada_em is null and (teste_fim>now() or pago_ate>now()) from public.equipes where id=p_equipe and public.cabenna_papel(p_equipe) is not null),false);
$$;
create function public.cabenna_acesso_espaco(p_espaco uuid,p_escrita boolean default false) returns boolean language plpgsql stable security definer set search_path='' as $$
declare e public.espacos; papel text;
begin
 if auth.uid() is null then return false; end if;
 select * into e from public.espacos where id=p_espaco;
 if not found then return false; end if;
 if e.equipe_id is null then return e.usuario_id=auth.uid(); end if;
 papel:=public.cabenna_papel(e.equipe_id);
 if papel is null or (p_escrita and not public.cabenna_equipe_editavel(e.equipe_id)) then return false; end if;
 if not e.restrito and papel<>'convidado' then return true; end if;
 return exists(select 1 from public.permissoes_espaco where espaco_id=p_espaco and usuario_id=auth.uid() and (not p_escrita or pode_editar));
end; $$;
create function public.cabenna_acesso_registro(p_registro uuid,p_escrita boolean default false) returns boolean language plpgsql stable security definer set search_path='' as $$
declare r public.registros; papel text;
begin
 if auth.uid() is null then return false; end if;
 select * into r from public.registros where id=p_registro;
 if not found then return false; end if;
 if r.espaco_id is not null then return public.cabenna_acesso_espaco(r.espaco_id,p_escrita); end if;
 if r.equipe_id is null then return r.usuario_id=auth.uid(); end if;
 papel:=public.cabenna_papel(r.equipe_id);
 return papel is not null and papel<>'convidado' and (not p_escrita or public.cabenna_equipe_editavel(r.equipe_id));
end; $$;
create function public.cabenna_plano(p_equipe uuid default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_codigo text:='gratuito'; fim timestamptz; pago timestamptz; c public.catalogo_planos; estado text:='gratuito';
begin
 if auth.uid() is null then raise exception 'SEM_PERMISSAO'; end if;
 if p_equipe is not null then
  if public.cabenna_papel(p_equipe) is null then raise exception 'SEM_PERMISSAO'; end if;
  select teste_fim,pago_ate into fim,pago from public.equipes where id=p_equipe;
  v_codigo:='equipes'; estado:=case when pago>now() then 'ativo' when fim>now() then 'teste' else 'consulta' end;
 else
  select teste_fim,pago_ate into fim,pago from public.assinaturas_pessoais where usuario_id=auth.uid();
  if pago>now() then v_codigo:='pro';estado:='ativo'; elsif fim>now() then v_codigo:='pro';estado:='teste'; end if;
 end if;
 select * into c from public.catalogo_planos where catalogo_planos.codigo=v_codigo;
 return to_jsonb(c)||jsonb_build_object('estado',estado,'teste_fim',fim,'pago_ate',pago,'teste_utilizado',fim is not null);
end; $$;
create function public.cabenna_testar_pro() returns jsonb language plpgsql security definer set search_path='' as $$
declare dias integer;
begin
 if auth.uid() is null then raise exception 'SEM_PERMISSAO'; end if;
 perform id from auth.users where id=auth.uid() for update;
 if exists(select 1 from public.assinaturas_pessoais where usuario_id=auth.uid() and (teste_inicio is not null or pago_ate>now())) then raise exception 'TESTE_JA_UTILIZADO'; end if;
 select teste_dias into dias from public.catalogo_planos where codigo='pro';
 insert into public.assinaturas_pessoais(usuario_id,teste_inicio,teste_fim) values(auth.uid(),now(),now()+make_interval(days=>dias))
 on conflict(usuario_id) do update set teste_inicio=excluded.teste_inicio,teste_fim=excluded.teste_fim;
 insert into public.auditoria_cabenna(usuario_id,acao) values(auth.uid(),'teste_pro_iniciado');
 return public.cabenna_plano();
end; $$;

create function public.cabenna_criar_equipe(p_nome text) returns uuid language plpgsql security definer set search_path='' as $$
declare equipe uuid; email text; dias integer;
begin
 if auth.uid() is null then raise exception 'SEM_PERMISSAO'; end if;
 select lower(u.email) into email from auth.users u where id=auth.uid() and email_confirmed_at is not null;
 if email is null then raise exception 'CONFIRME_EMAIL'; end if;
 select teste_dias into dias from public.catalogo_planos where codigo='equipes';
 insert into public.equipes(nome,proprietario_id,teste_fim) values(trim(p_nome),auth.uid(),now()+make_interval(days=>dias)) returning id into equipe;
 insert into public.participantes_equipe(equipe_id,usuario_id,papel,email) values(equipe,auth.uid(),'proprietario',email);
 insert into public.auditoria_cabenna(usuario_id,equipe_id,acao,alvo_id) values(auth.uid(),equipe,'equipe_criada',equipe);
 return equipe;
end; $$;
create function public.cabenna_criar_espaco(p_nome text,p_cor text default '#7EAE92',p_equipe uuid default null,p_restrito boolean default false) returns uuid language plpgsql security definer set search_path='' as $$
declare espaco uuid; papel text;
begin
 if auth.uid() is null then raise exception 'SEM_PERMISSAO'; end if;
 if p_equipe is not null then
  papel:=public.cabenna_papel(p_equipe);
  if papel is null or papel='convidado' or not public.cabenna_equipe_editavel(p_equipe) then raise exception 'SEM_PERMISSAO'; end if;
 end if;
 insert into public.espacos(usuario_id,equipe_id,nome,cor,restrito) values(auth.uid(),p_equipe,trim(p_nome),p_cor,p_restrito or p_equipe is null) returning id into espaco;
 insert into public.permissoes_espaco(espaco_id,usuario_id,pode_editar) values(espaco,auth.uid(),true);
 return espaco;
end; $$;
create function public.cabenna_autorizar_espaco(p_espaco uuid,p_usuario uuid,p_editar boolean,p_revogar boolean default false) returns void language plpgsql security definer set search_path='' as $$
declare equipe uuid;
begin
 select equipe_id into equipe from public.espacos where id=p_espaco;
 if equipe is null or coalesce(public.cabenna_papel(equipe),'') not in ('proprietario','administrador') or not public.cabenna_acesso_espaco(p_espaco,true) then raise exception 'SEM_PERMISSAO'; end if;
 if not exists(select 1 from public.participantes_equipe where equipe_id=equipe and usuario_id=p_usuario) then raise exception 'PARTICIPANTE_INVALIDO'; end if;
 if p_usuario=auth.uid() and p_revogar then raise exception 'NAO_REMOVA_SEU_PROPRIO_ACESSO'; end if;
 if p_revogar then delete from public.permissoes_espaco where espaco_id=p_espaco and usuario_id=p_usuario;
 else insert into public.permissoes_espaco values(p_espaco,p_usuario,p_editar) on conflict(espaco_id,usuario_id) do update set pode_editar=excluded.pode_editar; end if;
end; $$;

create function public.cabenna_convidar(p_equipe uuid,p_email text,p_papel text,p_token text) returns uuid language plpgsql security definer set search_path='' as $$
declare convite uuid; limite integer; email_destino text:=lower(trim(p_email));
begin
 if coalesce(public.cabenna_papel(p_equipe),'') not in ('proprietario','administrador') or not public.cabenna_equipe_editavel(p_equipe) then raise exception 'SEM_PERMISSAO'; end if;
 if p_papel not in ('administrador','membro','convidado') or p_papel is null or p_token is null or char_length(p_token)<64 or char_length(p_token)>150 or email_destino !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'CONVITE_INVALIDO'; end if;
 perform id from public.equipes where id=p_equipe for update;
 if exists(select 1 from public.participantes_equipe where equipe_id=p_equipe and participantes_equipe.email=email_destino) then raise exception 'JA_PARTICIPA'; end if;
 if exists(select 1 from public.convites_equipe c where c.equipe_id=p_equipe and c.email=email_destino and estado='pendente' and vence_em>now()) then raise exception 'CONVITE_PENDENTE'; end if;
 select participantes_max into limite from public.catalogo_planos where codigo='equipes';
 if (select count(*) from public.participantes_equipe where equipe_id=p_equipe)+(select count(*) from public.convites_equipe where equipe_id=p_equipe and estado='pendente' and vence_em>now())>=limite then raise exception 'LIMITE_PARTICIPANTES'; end if;
 insert into public.convites_equipe(equipe_id,email,papel,token_hash,criado_por) values(p_equipe,email_destino,p_papel,encode(sha256(convert_to(p_token,'UTF8')),'hex'),auth.uid()) returning id into convite;
 insert into public.auditoria_cabenna(usuario_id,equipe_id,acao,alvo_id) values(auth.uid(),p_equipe,'convite_criado',convite);
 return convite;
end; $$;
create function public.cabenna_aceitar_convite(p_token text) returns uuid language plpgsql security definer set search_path='' as $$
declare c public.convites_equipe; email text; limite integer; equipe uuid;
begin
 if auth.uid() is null then raise exception 'SEM_PERMISSAO'; end if;
 select lower(u.email) into email from auth.users u where id=auth.uid() and email_confirmed_at is not null;
 if email is null then raise exception 'CONFIRME_EMAIL'; end if;
 select equipe_id into equipe from public.convites_equipe where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex');
 if equipe is null then raise exception 'CONVITE_INDISPONIVEL'; end if;
 perform id from public.equipes where id=equipe for update;
 select * into c from public.convites_equipe where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') for update;
 if c.estado<>'pendente' or c.vence_em<=now() or c.email<>email then raise exception 'CONVITE_INDISPONIVEL'; end if;
 if not exists(select 1 from public.equipes where id=equipe and encerrada_em is null and (teste_fim>now() or pago_ate>now())) then raise exception 'EQUIPE_EM_CONSULTA'; end if;
 if exists(select 1 from public.participantes_equipe where equipe_id=equipe and usuario_id=auth.uid()) then raise exception 'JA_PARTICIPA'; end if;
 select participantes_max into limite from public.catalogo_planos where codigo='equipes';
 if (select count(*) from public.participantes_equipe where equipe_id=equipe)>=limite then raise exception 'LIMITE_PARTICIPANTES'; end if;
 insert into public.participantes_equipe(equipe_id,usuario_id,papel,email) values(equipe,auth.uid(),c.papel,email);
 update public.convites_equipe set estado='aceito' where id=c.id;
 insert into public.auditoria_cabenna(usuario_id,equipe_id,acao,alvo_id) values(auth.uid(),equipe,'convite_aceito',c.id);
 return equipe;
end; $$;
create function public.cabenna_revogar_convite(p_convite uuid) returns void language plpgsql security definer set search_path='' as $$
declare equipe uuid;
begin
 select equipe_id into equipe from public.convites_equipe where id=p_convite;
 if coalesce(public.cabenna_papel(equipe),'') not in ('proprietario','administrador') then raise exception 'SEM_PERMISSAO'; end if;
 perform id from public.equipes where id=equipe for update;
 update public.convites_equipe set estado='revogado' where id=p_convite and estado='pendente';
end; $$;
create function public.cabenna_gerir_participante(p_equipe uuid,p_usuario uuid,p_papel text default null,p_remover boolean default false,p_transferir_para uuid default null) returns void language plpgsql security definer set search_path='' as $$
declare papel text; alvo text;
begin
 perform id from public.equipes where id=p_equipe for update;
 papel:=public.cabenna_papel(p_equipe);
 select participantes_equipe.papel into alvo from public.participantes_equipe where equipe_id=p_equipe and usuario_id=p_usuario;
 if papel is null or alvo is null then raise exception 'SEM_PERMISSAO'; end if;
 if p_remover then
  if p_usuario<>auth.uid() and papel not in ('proprietario','administrador') then raise exception 'SEM_PERMISSAO'; end if;
  if alvo='proprietario' then raise exception 'TRANSFIRA_A_PROPRIEDADE'; end if;
  if papel='administrador' and alvo='administrador' and p_usuario<>auth.uid() then raise exception 'SEM_PERMISSAO'; end if;
  if p_transferir_para is not null and not exists(select 1 from public.participantes_equipe where equipe_id=p_equipe and usuario_id=p_transferir_para and usuario_id<>p_usuario) then raise exception 'PARTICIPANTE_INVALIDO'; end if;
  update public.registros set dados=case when p_transferir_para is null then dados-'responsavel_id' else jsonb_set(dados,'{responsavel_id}',to_jsonb(p_transferir_para::text)) end,versao=versao+1,atualizado_em=now()
   where equipe_id=p_equipe and dados->>'responsavel_id'=p_usuario::text;
  delete from public.permissoes_espaco where usuario_id=p_usuario and espaco_id in (select id from public.espacos where equipe_id=p_equipe);
  delete from public.participantes_equipe where equipe_id=p_equipe and usuario_id=p_usuario;
 else
  if papel<>'proprietario' then raise exception 'SEM_PERMISSAO'; end if;
  if p_papel='proprietario' then
   update public.participantes_equipe set papel='administrador' where equipe_id=p_equipe and usuario_id=auth.uid();
   update public.participantes_equipe set papel='proprietario' where equipe_id=p_equipe and usuario_id=p_usuario;
   update public.equipes set proprietario_id=p_usuario where id=p_equipe;
  elsif p_papel in ('administrador','membro','convidado') and alvo<>'proprietario' then
   update public.participantes_equipe set papel=p_papel where equipe_id=p_equipe and usuario_id=p_usuario;
   if p_papel='convidado' then delete from public.permissoes_espaco where usuario_id=p_usuario and espaco_id in(select id from public.espacos where equipe_id=p_equipe); end if;
  else raise exception 'PAPEL_INVALIDO'; end if;
 end if;
 insert into public.auditoria_cabenna(usuario_id,equipe_id,acao,alvo_id) values(auth.uid(),p_equipe,case when p_remover then 'participante_removido' else 'papel_alterado' end,p_usuario);
end; $$;

-- RLS e grants explícitos; nenhuma tabela de negócio permite escrita direta.
do $$ declare nome text; begin
 foreach nome in array array['catalogo_planos','assinaturas_pessoais','equipes','participantes_equipe','convites_equipe','espacos','permissoes_espaco','registros','versoes_registro','comentarios_registro','auditoria_cabenna'] loop
  execute format('alter table public.%I enable row level security',nome);
  execute format('revoke all on public.%I from public,anon,authenticated',nome);
  if nome<>'convites_equipe' then execute format('grant select on public.%I to authenticated',nome); end if;
 end loop;
end; $$;
grant select(id,equipe_id,email,papel,criado_em,vence_em,estado) on public.convites_equipe to authenticated;
create policy catalogo_logado on public.catalogo_planos for select to authenticated using(auth.uid() is not null);
create policy assinatura_propria on public.assinaturas_pessoais for select to authenticated using(usuario_id=auth.uid());
create policy equipes_autorizadas on public.equipes for select to authenticated using(public.cabenna_papel(id) is not null);
create policy membros_mesma_equipe on public.participantes_equipe for select to authenticated using(public.cabenna_papel(equipe_id) is not null);
create policy convites_admin on public.convites_equipe for select to authenticated using(public.cabenna_papel(equipe_id) in ('proprietario','administrador'));
create policy espacos_autorizados on public.espacos for select to authenticated using(public.cabenna_acesso_espaco(id));
create policy permissoes_visiveis on public.permissoes_espaco for select to authenticated using(public.cabenna_acesso_espaco(espaco_id));
create policy registros_autorizados on public.registros for select to authenticated using(public.cabenna_acesso_registro(id));
create policy versoes_autorizadas on public.versoes_registro for select to authenticated using(public.cabenna_acesso_registro(registro_id) and criado_em>now()-make_interval(days=>(public.cabenna_plano((select equipe_id from public.registros where id=registro_id))->>'historico_dias')::integer));
create policy comentarios_autorizados on public.comentarios_registro for select to authenticated using(excluido_em is null and public.cabenna_acesso_registro(registro_id));
create policy auditoria_autorizada on public.auditoria_cabenna for select to authenticated using(usuario_id=auth.uid() or public.cabenna_papel(equipe_id) in ('proprietario','administrador'));

-- Todas as funções desta migração recebem identidade somente de auth.uid().
do $$ declare f record; begin
 for f in select p.oid::regprocedure assinatura from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'cabenna_%' loop
  execute format('revoke all on function %s from public,anon,authenticated',f.assinatura);
  execute format('grant execute on function %s to authenticated',f.assinatura);
 end loop;
end; $$;
commit;
