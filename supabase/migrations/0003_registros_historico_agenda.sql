begin;

create function public.cabenna_validar_entrada_interno(p jsonb) returns void language plpgsql set search_path='' as $$
declare linha jsonb; d jsonb:=coalesce(p->'dados','{}');
begin
 if p is null or jsonb_typeof(p)<>'object' or p->>'tipo' not in('nota','documento','tarefa','lista','evento')
  or p->>'tipo' is null or p->>'titulo' is null or char_length(trim(p->>'titulo')) not between 1 and 200
  or p->>'texto' is null or char_length(p->>'texto')>50000
  or p->>'estado' is null or p->>'estado' not in('A fazer','Em andamento','Aguardando','Concluída')
  or jsonb_typeof(p->'favorito') is distinct from 'boolean'
  or jsonb_typeof(p->'checklist') is distinct from 'array' or jsonb_array_length(p->'checklist')>300
  or jsonb_typeof(d)<>'object' or octet_length(d::text)>524288 then raise exception 'ENTRADA_INVALIDA'; end if;
 for linha in select value from jsonb_array_elements(p->'checklist') loop
  if jsonb_typeof(linha)<>'object' or char_length(trim(coalesce(linha->>'texto',''))) not between 1 and 500
   or char_length(coalesce(linha->>'id','')) not between 1 and 100 or jsonb_typeof(linha->'feita') is distinct from 'boolean' then raise exception 'LISTA_INVALIDA'; end if;
 end loop;
 if exists(select 1 from jsonb_array_elements(p->'checklist') l group by l->>'id' having count(*)>1) then raise exception 'LISTA_INVALIDA'; end if;
 if d?'etiquetas' then
  if jsonb_typeof(d->'etiquetas')<>'array' or jsonb_array_length(d->'etiquetas')>20 then raise exception 'ETIQUETAS_INVALIDAS'; end if;
  for linha in select value from jsonb_array_elements(d->'etiquetas') loop
   if jsonb_typeof(linha)<>'string' or char_length(trim(linha#>>'{}')) not between 1 and 40 then raise exception 'ETIQUETAS_INVALIDAS'; end if;
  end loop;
 end if;
 if d?'prioridade' and coalesce(d->>'prioridade','') !~ '^[0-3]$' then raise exception 'PRIORIDADE_INVALIDA'; end if;
 if d?'meu_dia' and d->>'meu_dia' is not null then perform (d->>'meu_dia')::date; end if;
 if d?'fuso' and not exists(select 1 from pg_timezone_names where name=d->>'fuso') then raise exception 'FUSO_INVALIDO'; end if;
 if d?'recorrencia' and d->>'recorrencia' not in('nenhuma','diaria','semanal','mensal','apos_concluir') then raise exception 'RECORRENCIA_INVALIDA'; end if;
 if p->>'tipo'='tarefa' and coalesce(d->>'recorrencia','nenhuma') not in('nenhuma','apos_concluir') and p->>'prazo' is null then raise exception 'RECORRENCIA_EXIGE_PRAZO'; end if;
 if p->>'tipo'='evento' then
  if coalesce((d->>'dia_inteiro')::boolean,false) then
   if d->>'data_inicio' is null or d->>'data_fim' is null or (d->>'data_fim')::date<(d->>'data_inicio')::date then raise exception 'EVENTO_INVALIDO'; end if;
  elsif d->>'inicio' is null or d->>'fim' is null or (d->>'fim')::timestamptz<=(d->>'inicio')::timestamptz then raise exception 'EVENTO_INVALIDO'; end if;
 end if;
 if (d->>'bloco_inicio' is null)<>(d->>'bloco_fim' is null) then raise exception 'BLOCO_INVALIDO'; end if;
 if d->>'bloco_inicio' is not null and (d->>'bloco_fim')::timestamptz<=(d->>'bloco_inicio')::timestamptz then raise exception 'BLOCO_INVALIDO'; end if;
 if p->>'tipo'='documento' and d?'documento' and jsonb_typeof(d->'documento')<>'null' then
  if jsonb_typeof(d->'documento')<>'object' or d->'documento'->>'type' is distinct from 'doc' then raise exception 'DOCUMENTO_INVALIDO'; end if;
 end if;
end; $$;

create function public.cabenna_salvar_registro(p_id uuid,p_entrada jsonb,p_versao integer,p_equipe uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare anterior public.registros; r public.registros; novo public.registros; espaco uuid; d jsonb; plano jsonb;
 usado bigint; tamanho bigint; proximo uuid; proxima_data date; base date; mensal date; dia integer; responsavel uuid;
begin
 if auth.uid() is null then raise exception 'SEM_PERMISSAO'; end if;
 if p_id is null or p_versao is null or p_versao<0 then raise exception 'ENTRADA_INVALIDA'; end if;
 perform public.cabenna_validar_entrada_interno(p_entrada);
 espaco:=(p_entrada->>'espaco_id')::uuid;
 d:=coalesce(p_entrada->'dados','{}')-'proxima_ocorrencia'-'serie_id'-'ocorrencia'-'dia_recorrencia';
 if p_equipe is null then perform id from auth.users where id=auth.uid() for update;
 else
  perform id from public.equipes where id=p_equipe for update;
  if public.cabenna_papel(p_equipe) is null or not public.cabenna_equipe_editavel(p_equipe) then raise exception 'EQUIPE_EM_CONSULTA_OU_SEM_PERMISSAO'; end if;
 end if;
 if espaco is not null then
  if not public.cabenna_acesso_espaco(espaco,true) or not exists(select 1 from public.espacos where id=espaco and equipe_id is not distinct from p_equipe) then raise exception 'ESPACO_SEM_PERMISSAO'; end if;
 elsif p_equipe is not null and public.cabenna_papel(p_equipe)='convidado' then raise exception 'ESPACO_SEM_PERMISSAO'; end if;
 if p_versao>0 then
  select * into anterior from public.registros where id=p_id for update;
  if not found or anterior.versao<>p_versao or anterior.equipe_id is distinct from p_equipe or not public.cabenna_acesso_registro(p_id,true) or anterior.excluido_em is not null then raise exception 'CONFLITO_OU_SEM_PERMISSAO'; end if;
  d:=d||(anterior.dados-'prioridade'-'etiquetas'-'meu_dia'-'documento'-'fuso'-'recorrencia'-'responsavel_id'-'inicio'-'fim'-'dia_inteiro'-'data_inicio'-'data_fim'-'bloco_inicio'-'bloco_fim'-'local'-'link'-'lembrete_minutos');
 end if;
 -- Só participantes que conseguem consultar o destino podem ser responsáveis.
 responsavel:=(d->>'responsavel_id')::uuid;
 if responsavel is not null then
  if p_equipe is null and responsavel<>auth.uid() then raise exception 'RESPONSAVEL_INVALIDO'; end if;
  if p_equipe is not null then
   if not exists(select 1 from public.participantes_equipe m where m.equipe_id=p_equipe and m.usuario_id=responsavel
    and (espaco is null and m.papel<>'convidado' or espaco is not null and exists(select 1 from public.espacos e where e.id=espaco and
     (not e.restrito and m.papel<>'convidado' or exists(select 1 from public.permissoes_espaco pe where pe.espaco_id=espaco and pe.usuario_id=responsavel))))) then raise exception 'RESPONSAVEL_INVALIDO'; end if;
  end if;
 end if;
 plano:=public.cabenna_plano(p_equipe);
 select coalesce(sum(octet_length(texto)+octet_length(titulo)+octet_length(dados::text)+octet_length(checklist::text)),0) into usado from public.registros
  where equipe_id is not distinct from p_equipe and (p_equipe is not null or usuario_id=auth.uid()) and id<>p_id;
 tamanho:=octet_length(p_entrada->>'texto')+octet_length(p_entrada->>'titulo')+octet_length(d::text)+octet_length((p_entrada->'checklist')::text);
 if usado+tamanho>(plano->>'armazenamento_bytes')::bigint then raise exception 'LIMITE_ARMAZENAMENTO'; end if;
 if p_versao=0 then
  insert into public.registros(id,usuario_id,equipe_id,espaco_id,tipo,titulo,texto,prazo,estado,checklist,dados,favorito)
   values(p_id,auth.uid(),p_equipe,espaco,p_entrada->>'tipo',trim(p_entrada->>'titulo'),p_entrada->>'texto',(p_entrada->>'prazo')::date,p_entrada->>'estado',p_entrada->'checklist',d,(p_entrada->>'favorito')::boolean) returning * into r;
 else
  update public.registros set espaco_id=espaco,tipo=p_entrada->>'tipo',titulo=trim(p_entrada->>'titulo'),texto=p_entrada->>'texto',prazo=(p_entrada->>'prazo')::date,
   estado=p_entrada->>'estado',checklist=p_entrada->'checklist',dados=d,favorito=(p_entrada->>'favorito')::boolean,atualizado_em=now(),versao=versao+1 where id=p_id returning * into r;
 end if;
 -- Uma conclusão produz no máximo uma próxima ocorrência, mesmo após reabrir.
 if r.tipo='tarefa' and r.estado='Concluída' and (p_versao=0 or anterior.estado<>'Concluída') and coalesce(r.dados->>'recorrencia','nenhuma')<>'nenhuma' and r.dados->>'proxima_ocorrencia' is null then
  base:=coalesce(r.prazo,(now() at time zone coalesce(d->>'fuso','America/Sao_Paulo'))::date);
  if d->>'recorrencia'='diaria' then proxima_data:=base+1;
  elsif d->>'recorrencia'='semanal' then proxima_data:=base+7;
  elsif d->>'recorrencia'='apos_concluir' then proxima_data:=(now() at time zone coalesce(d->>'fuso','America/Sao_Paulo'))::date+1;
  else
   dia:=coalesce((d->>'dia_recorrencia')::integer,extract(day from base)::integer);
   mensal:=(date_trunc('month',base::timestamp)+interval '1 month')::date;
   proxima_data:=mensal+least(dia,extract(day from (mensal+interval '1 month - 1 day'))::integer)-1;
  end if;
  proximo:=gen_random_uuid();
  d:=jsonb_set(r.dados-'meu_dia'-'bloco_inicio'-'bloco_fim','{serie_id}',to_jsonb(coalesce(r.dados->>'serie_id',r.id::text)))||jsonb_build_object('ocorrencia',coalesce((r.dados->>'ocorrencia')::integer,0)+1,'dia_recorrencia',coalesce((r.dados->>'dia_recorrencia')::integer,extract(day from base)::integer));
  if usado+2*tamanho>(plano->>'armazenamento_bytes')::bigint then raise exception 'LIMITE_ARMAZENAMENTO'; end if;
  insert into public.registros(id,usuario_id,equipe_id,espaco_id,tipo,titulo,texto,prazo,checklist,dados,favorito)
   values(proximo,r.usuario_id,r.equipe_id,r.espaco_id,r.tipo,r.titulo,r.texto,proxima_data,
    coalesce((select jsonb_agg(jsonb_set(l,'{feita}','false')) from jsonb_array_elements(r.checklist) l),'[]'),d,r.favorito) returning * into novo;
  insert into public.versoes_registro(registro_id,versao,autor_id,conteudo) values(novo.id,novo.versao,auth.uid(),to_jsonb(novo));
  update public.registros set dados=dados||jsonb_build_object('proxima_ocorrencia',proximo) where id=r.id returning * into r;
 end if;
 insert into public.versoes_registro(registro_id,versao,autor_id,conteudo) values(r.id,r.versao,auth.uid(),to_jsonb(r));
 return to_jsonb(r);
exception when unique_violation then raise exception 'CONFLITO_OU_SEM_PERMISSAO';
end; $$;

create function public.cabenna_organizar_registro(p_id uuid,p_versao integer,p_acao text) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.registros;
begin
 if not public.cabenna_acesso_registro(p_id,true) then raise exception 'SEM_PERMISSAO'; end if;
 if p_acao is null or p_acao not in('arquivar','desarquivar','excluir','restaurar') then raise exception 'ACAO_INVALIDA'; end if;
 update public.registros set arquivado=case when p_acao='arquivar' then true when p_acao='desarquivar' then false else arquivado end,
  excluido_em=case when p_acao='excluir' then now() when p_acao='restaurar' then null else excluido_em end,versao=versao+1,atualizado_em=now()
 where id=p_id and versao=p_versao and ((p_acao='restaurar' and excluido_em is not null) or (p_acao<>'restaurar' and excluido_em is null)) returning * into r;
 if not found then raise exception 'CONFLITO_OU_SEM_PERMISSAO'; end if;
 insert into public.versoes_registro(registro_id,versao,autor_id,conteudo) values(r.id,r.versao,auth.uid(),to_jsonb(r));
 return to_jsonb(r);
end; $$;
create function public.cabenna_restaurar_versao(p_id uuid,p_versao_atual integer,p_versao_historica integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare antigo jsonb; equipe uuid; dias integer;
begin
 if not public.cabenna_acesso_registro(p_id,true) then raise exception 'SEM_PERMISSAO'; end if;
 select equipe_id into equipe from public.registros where id=p_id;
 dias:=(public.cabenna_plano(equipe)->>'historico_dias')::integer;
 select conteudo into antigo from public.versoes_registro where registro_id=p_id and versao=p_versao_historica and criado_em>now()-make_interval(days=>dias);
 if antigo is null then raise exception 'VERSAO_INDISPONIVEL'; end if;
 -- Restaurar conteúdo não altera contexto, exclusão ou vínculo de recorrência.
 antigo:=jsonb_set(antigo,'{espaco_id}',coalesce((select to_jsonb(espaco_id) from public.registros where id=p_id),'null'));
 return public.cabenna_salvar_registro(p_id,antigo,p_versao_atual,equipe);
end; $$;
create function public.cabenna_comentar(p_registro uuid,p_texto text) returns uuid language plpgsql security definer set search_path='' as $$
declare id uuid;
begin
 if not public.cabenna_acesso_registro(p_registro,true) or exists(select 1 from public.registros where registros.id=p_registro and excluido_em is not null) then raise exception 'SEM_PERMISSAO'; end if;
 insert into public.comentarios_registro(registro_id,usuario_id,texto) values(p_registro,auth.uid(),trim(p_texto)) returning comentarios_registro.id into id;
 return id;
end; $$;
create function public.cabenna_remover_comentario(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare c public.comentarios_registro;
begin
 select * into c from public.comentarios_registro where id=p_id;
 if not found or c.usuario_id<>auth.uid() or not public.cabenna_acesso_registro(c.registro_id,true) then raise exception 'SEM_PERMISSAO'; end if;
 update public.comentarios_registro set excluido_em=now() where id=p_id;
end; $$;

-- Conteúdos de equipe sobrevivem à exclusão da conta do autor.
alter table public.registros drop constraint registros_usuario_id_fkey;
alter table public.registros alter column usuario_id drop not null;
alter table public.registros add foreign key(usuario_id) references auth.users(id) on delete set null;
alter table public.espacos drop constraint espacos_usuario_id_fkey;
alter table public.espacos alter column usuario_id drop not null;
alter table public.espacos add foreign key(usuario_id) references auth.users(id) on delete set null;
alter table public.comentarios_registro drop constraint comentarios_registro_usuario_id_fkey;
alter table public.comentarios_registro alter column usuario_id drop not null;
alter table public.comentarios_registro add foreign key(usuario_id) references auth.users(id) on delete set null;
create function public.cabenna_limpar_pessoal_interno() returns trigger language plpgsql security definer set search_path='' as $$
begin
 delete from public.registros where equipe_id is null and usuario_id=old.id;
 delete from public.espacos where equipe_id is null and usuario_id=old.id;
 return old;
end; $$;
create trigger cabenna_limpar_pessoal before delete on auth.users for each row execute function public.cabenna_limpar_pessoal_interno();

do $$ declare f record; begin
 for f in select p.oid::regprocedure assinatura,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'cabenna_%' loop
  execute format('revoke all on function %s from public,anon,authenticated',f.assinatura);
  if f.proname not like '%_interno' then execute format('grant execute on function %s to authenticated',f.assinatura); end if;
 end loop;
end; $$;
commit;
