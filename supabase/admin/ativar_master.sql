-- Executar como administrador do banco, após 0006. Nunca expor esta operação ao cliente.
do $master$
declare escolhido uuid;
begin
 select id into escolhido from auth.users where lower(trim(email))=lower('PREENCHA_EMAIL') and email_confirmed_at is not null;
 if escolhido is null then raise exception 'CONTA_CONFIRMADA_NAO_ENCONTRADA: confirme o cadastro do e-mail informado antes de ativar Master'; end if;
 insert into public.administradores_produto(usuario_id,ativo) values(escolhido,true)
 on conflict(usuario_id) do update set ativo=true;
 insert into public.auditoria_cabenna(usuario_id,acao,alvo_id) values(escolhido,'master_ativado_pelo_administrador',escolhido);
end; $master$;
