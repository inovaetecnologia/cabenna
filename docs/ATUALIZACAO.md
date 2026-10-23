# Ativar a nova versão do Cabenna

As mudanças estão em C:\Projetos\cabenna. A implementação local está pronta para homologação. O banco hospedado ainda precisa receber as migrações desta versão.

## 1. Atualizar o Supabase

1. Abra https://supabase.com/dashboard/project/lgejykmmfybfwzqjgpqq no navegador e confirme que está no projeto Cabenna correto.
2. Abra SQL Editor no menu lateral e clique em New query.
3. Abra o arquivo Atualizacao_Cabenna.sql entregue com esta versão. Ele reúne somente as migrações novas 0002, 0003, 0004 e 0005, nessa ordem. A migração 0001 precisa já existir no banco.
4. Copie o conteúdo completo, cole no SQL Editor e clique em Run. Execute uma única vez. O arquivo cria estruturas, transfere os itens antigos para a nova tabela e mantém os originais preservados.
5. Se surgir erro, pare nesse ponto e guarde a mensagem. Não repita o arquivo inteiro: as transações são por migração e uma etapa anterior pode ter sido concluída. O nome do objeto citado no erro ajuda a identificar onde retomar.

A mudança substitui as funções de escrita antigas; publique o cliente novo na mesma janela de atualização. A versão anterior não deve continuar editando os registros antigos. Esse é um efeito necessário da migração, não apenas uma mudança visual.

## 2. Conferir o acesso por e-mail

1. Em Authentication → Providers, confirme que Email está habilitado e que a confirmação de e-mail é exigida. O aplicativo só libera contas com e-mail confirmado.
2. Em Authentication → URL Configuration, use como Site URL o endereço real do Cabenna publicado.
3. Em Redirect URLs, autorize https://SEU-DOMINIO/app e, para a homologação local, http://localhost:8081/app. Substitua SEU-DOMINIO pelo endereço mostrado pela Vercel. Não use o endereço do painel vercel.com.
4. Use um e-mail seu para cadastrar e confirmar uma conta. Configure SMTP de produção para envio confiável. Não envie senha ou chave secreta ao chat.

Convites de equipe são links gerados dentro do app para você compartilhar com a pessoa; não são e-mails automáticos. O aceite exige a conta confirmada do e-mail convidado.

## 3. Conferir a Vercel e publicar pelo GitHub Desktop

As variáveis públicas continuam as mesmas: EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. A URL é a base do projeto, terminada em supabase.co, sem /rest/v1/.

1. No GitHub Desktop, selecione o repositório cabenna e confira as mudanças.
2. Faça o commit quando quiser publicar esta versão e use Push origin. Se o projeto Vercel está conectado à branch enviada, o push pode iniciar o deploy automaticamente.
3. Na Vercel, confira o build npm run build:web e a pasta de saída dist. Aguarde o deploy terminar antes de testar no endereço público.

O agente não fez commit, push, deploy, contratação nem alteração remota do Supabase.

## 4. Homologar com duas contas

- Sem sessão: /app deve mostrar somente entrada/cadastro. O site / continua público.
- Conta A: criar nota, documento com tabela, lista e tarefa recorrente; recarregar e conferir salvamento. Selecionar Meu Dia não deve mudar o prazo.
- Agenda: criar evento com horário e um de dia inteiro; reservar um bloco numa tarefa e conferir as três visões.
- Pro: iniciar teste e conferir que o plano e prazo vêm do servidor. Não existe botão de compra ou cobrança ativa.
- Equipe A: criar equipe, gerar convite para o e-mail da conta B, entrar como B e aceitar pelo link. O e-mail deve corresponder ao convidado.
- Conta A: criar espaço restrito. B não deve vê-lo antes da concessão. Liberar leitura e confirmar que B não pode editar. Depois conceder edição e testar comentário e alteração.
- Remover B e confirmar que ela perde acesso às novas operações. A tela atualiza em até 20 segundos ou ao voltar à janela.
- Histórico: restaurar versão como A e conferir que nasce uma nova versão. Exportar JSON e abrir o arquivo.
- Recuperação: pedir redefinição de senha e completar pessoalmente pelo e-mail recebido.

Os testes automatizados já exercitam 45 casos locais, mas a homologação acima valida o serviço hospedado, as URLs de retorno e o envio de e-mail.

## Limites desta versão

Cobrança paga, anexos, cofre, notificações e modo offline persistente ainda não estão implementados. Não é preciso enviar chave secreta do Supabase para revisar o visual ou usar o app. Para aplicar o SQL, use seu painel administrativo.
