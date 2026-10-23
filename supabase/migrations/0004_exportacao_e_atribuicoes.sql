begin;
create or replace function public.cabenna_gerir_participante(p_equipe uuid,p_usuario uuid,p_papel text default null,p_remover boolean default false,p_transferir_para uuid default null) returns void language plpgsql security definer set search_path='' as $$
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
  if p_transferir_para is not null and exists(
   select 1 from public.registros r where r.equipe_id=p_equipe and r.dados->>'responsavel_id'=p_usuario::text and (
    (r.espaco_id is null and exists(select 1 from public.participantes_equipe m where m.equipe_id=p_equipe and m.usuario_id=p_transferir_para and m.papel='convidado')) or
    (r.espaco_id is not null and not exists(select 1 from public.espacos s where s.id=r.espaco_id and (
     (not s.restrito and exists(select 1 from public.participantes_equipe m where m.equipe_id=p_equipe and m.usuario_id=p_transferir_para and m.papel<>'convidado')) or
     exists(select 1 from public.permissoes_espaco pe where pe.espaco_id=s.id and pe.usuario_id=p_transferir_para)
    )))
   )
  ) then raise exception 'RESPONSAVEL_INVALIDO'; end if;
  with alterados as(update public.registros set dados=case when p_transferir_para is null then dados-'responsavel_id' else jsonb_set(dados,'{responsavel_id}',to_jsonb(p_transferir_para::text)) end,versao=versao+1,atualizado_em=now()
   where equipe_id=p_equipe and dados->>'responsavel_id'=p_usuario::text returning *)
     insert into public.versoes_registro(registro_id,versao,autor_id,conteudo) select a.id,a.versao,auth.uid(),to_jsonb(a) from alterados a;
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
   if p_papel='convidado' then
      with alterados as(update public.registros set dados=dados-'responsavel_id',versao=versao+1,atualizado_em=now() where equipe_id=p_equipe and dados->>'responsavel_id'=p_usuario::text returning *)
       insert into public.versoes_registro(registro_id,versao,autor_id,conteudo) select a.id,a.versao,auth.uid(),to_jsonb(a) from alterados a;
      delete from public.permissoes_espaco where usuario_id=p_usuario and espaco_id in(select id from public.espacos where equipe_id=p_equipe); end if;
  else raise exception 'PAPEL_INVALIDO'; end if;
 end if;
 insert into public.auditoria_cabenna(usuario_id,equipe_id,acao,alvo_id) values(auth.uid(),p_equipe,case when p_remover then 'participante_removido' else 'papel_alterado' end,p_usuario);
end; $$;


create function public.cabenna_exportar_contexto(p_equipe uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare resultado jsonb;
begin
 if auth.uid() is null then raise exception 'SEM_PERMISSAO'; end if;
 if p_equipe is not null and public.cabenna_papel(p_equipe) is distinct from 'proprietario' then raise exception 'SEM_PERMISSAO'; end if;
 select coalesce(jsonb_agg(to_jsonb(r) order by r.criado_em),'[]'::jsonb) into resultado from public.registros r
 where r.equipe_id is not distinct from p_equipe and public.cabenna_acesso_registro(r.id);
 insert into public.auditoria_cabenna(usuario_id,equipe_id,acao) values(auth.uid(),p_equipe,'contexto_exportado');
 return resultado;
end; $$;
revoke all on function public.cabenna_exportar_contexto(uuid) from public,anon;
grant execute on function public.cabenna_exportar_contexto(uuid) to authenticated;

commit;
