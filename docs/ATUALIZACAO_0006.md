# Publicar a revisão da experiência Cabenna

23 de outubro de 2026

## Situação exata

- As migrações 0002 a 0005 foram aplicadas por você, conforme sua confirmação nesta conversa.
- O redesenho está no código local. O agente não fez commit, push ou deploy.
- Sua conta ainda NÃO foi promovida no Supabase. Falta executar a nova atualização 0006.
- O redesenho visual pode ler o banco anterior; planos conectados e Master ficam bloqueados até a 0006. Para publicar o conjunto anunciado pelo site, execute a nova atualização primeiro.

## 1. Ativar a nova estrutura e a sua conta

1. Abra o projeto Cabenna no Supabase: https://supabase.com/dashboard/project/lgejykmmfybfwzqjgpqq
2. Entre em SQL Editor e crie uma consulta nova.
3. Abra 006_Atualizar_e_Ativar_Master.sql entregue nesta revisão e copie o arquivo inteiro.
4. Cole e execute. Se aparecer o aviso do editor, use “Run without RLS”: o script já ativa RLS e cria suas políticas explicitamente. Esse botão executa o SQL fornecido e não desativa a proteção definida nele.
5. O resultado final deve mostrar luisfelipemordones@icloud.com e master_ativo = true.
6. Se aparecer CONTA_CONFIRMADA_NAO_ENCONTRADA, confirme o e-mail do cadastro. A transação não será aplicada; corrija isso antes de repetir. Se aparecer outro erro, pare e guarde a mensagem.

Não execute novamente 0002 a 0005 nem o arquivo consolidado anterior. O arquivo novo contém somente a etapa 0006 e a ativação da conta informada. Depois de sucesso, não repita a etapa inteira.

Master é concedido ao UUID da conta confirmada, por comando administrativo. O cliente não pode promover contas. A licença é permanente, usa a maior capacidade do catálogo e mantém ativas as equipes de sua propriedade. Os demais participantes dessas equipes recebem o benefício do contexto, respeitando seus papéis. Se o catálogo ganhar maior capacidade no futuro, a licença acompanha os limites consultados no servidor.

Administração Inovae mostra contagens agregadas. Master não concede leitura automática de áreas pessoais ou espaços restritos alheios. Cofre com criptografia de ponta a ponta não está disponível nesta revisão.

## 2. Publicar

Depois do sucesso no Supabase, confira o diff no GitHub Desktop, faça seu commit e Push origin. Se a Vercel estiver conectada à branch, o push poderá disparar o deploy. O comando de build continua npm run build:web e a saída continua dist. Não é preciso cadastrar nova variável ou fornecer chave secreta ao app.

## 3. Conferir no app real

Saia da conta e entre novamente. Em Conta e preferências, confira Master Inovae, licença permanente e Administração Inovae. Crie um plano, acrescente uma tarefa, traga-a para o foco de hoje e reserve um horário. A mesma tarefa deve aparecer no plano, em Hoje e no Calendário. Confirme a atualização do progresso depois de concluir.

## Prévias locais

- Institucional e app com login: http://localhost:8091
- Conferência da interface interna: http://localhost:8090 — dados fictícios em memória, sem conexão com o banco, fora das rotas e do build de produção. Não representa sua conta real.

A porta 8091 foi usada para isolar a prévia do Cabenna de outro serviço que já ocupava a porta 8081.

## Validação e limites

Os testes automatizados e a conferência visual são locais. A execução hospedada do SQL, a confirmação da sua conta Master e os fluxos com registros reais dependem da etapa acima. Cobrança paga, anexos, cofre, notificações e offline persistente continuam pendentes.
