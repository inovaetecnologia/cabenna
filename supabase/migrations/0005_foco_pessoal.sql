begin;
-- Meu Dia é uma escolha individual, mesmo quando a tarefa pertence à equipe.
create table public.focos_diarios(
 usuario_id uuid not null references auth.users(id) on delete cascade,
 registro_id uuid not null references public.registros(id) on delete cascade,
 dia date not null,
 primary key(usuario_id,registro_id)
);
alter table public.focos_diarios enable row level security;
revoke all on public.focos_diarios from public,anon,authenticated;
grant select on public.focos_diarios to authenticated;
create policy foco_pessoal on public.focos_diarios for select to authenticated using(usuario_id=auth.uid() and public.cabenna_acesso_registro(registro_id));
insert into public.focos_diarios(usuario_id,registro_id,dia)
 select usuario_id,id,(dados->>'meu_dia')::date from public.registros where equipe_id is null and dados->>'meu_dia' is not null;
update public.registros set dados=dados-'meu_dia' where dados?'meu_dia';

create function public.cabenna_definir_foco(p_registro uuid,p_dia date default null) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.cabenna_acesso_registro(p_registro) then raise exception 'SEM_PERMISSAO'; end if;
 if p_dia is null then delete from public.focos_diarios where usuario_id=auth.uid() and registro_id=p_registro;
 else insert into public.focos_diarios(usuario_id,registro_id,dia) values(auth.uid(),p_registro,p_dia)
  on conflict(usuario_id,registro_id) do update set dia=excluded.dia; end if;
end; $$;
alter function public.cabenna_salvar_registro(uuid,jsonb,integer,uuid) rename to cabenna_gravar_conteudo_interno;
revoke all on function public.cabenna_gravar_conteudo_interno(uuid,jsonb,integer,uuid) from public,anon,authenticated;
create function public.cabenna_salvar_registro(p_id uuid,p_entrada jsonb,p_versao integer,p_equipe uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare r jsonb; entrada jsonb;
begin
 entrada:=jsonb_set(p_entrada,'{dados}',coalesce(p_entrada->'dados','{}')-'meu_dia');
 r:=public.cabenna_gravar_conteudo_interno(p_id,entrada,p_versao,p_equipe);
 if p_entrada->'dados'?'meu_dia' then perform public.cabenna_definir_foco(p_id,(p_entrada->'dados'->>'meu_dia')::date); end if;
 return jsonb_set(r,'{dados}',(r->'dados')||jsonb_build_object('meu_dia',(select dia::text from public.focos_diarios where usuario_id=auth.uid() and registro_id=p_id)));
end; $$;
revoke all on function public.cabenna_salvar_registro(uuid,jsonb,integer,uuid),public.cabenna_definir_foco(uuid,date) from public,anon;
grant execute on function public.cabenna_salvar_registro(uuid,jsonb,integer,uuid),public.cabenna_definir_foco(uuid,date) to authenticated;
commit;
