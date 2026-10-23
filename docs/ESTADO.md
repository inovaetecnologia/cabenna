# Estado do desenvolvimento

23 de outubro de 2026. Base: dossiê Cabenna v1 de Luís Felipe Marques, decisões D01 a D74, e guia técnico da Inovae. O produto começa como web responsiva/PWA. Aplicativos nativos ficam para depois. Calendários externos, login social e provedores de IA não fazem parte desta etapa.

## Implementado no incremento 1

- Identidade oficial, temas, tipografias, desktop e menu de celular.
- Captura como nota por padrão, edição de texto, conversão de tipo preservando texto, favoritos.
- Tarefas com título, descrição, prazo opcional e quatro estados; lista e quadro usam os mesmos registros.
- Listas com itens marcáveis, inclusão, edição e remoção de itens.
- Meu dia com contagens derivadas dos registros, foco de hoje/atrasos/favoritos, notas recentes.
- Busca sem acentos em títulos, conteúdo e itens da lista; arquivo e lixeira excluídos da busca geral.
- Arquivo, exclusão lógica, restauração sem prazo automático nesta etapa.
- Avaliação local persistente separada da conta, com exemplos identificados e limpeza com confirmação.
- Cliente Supabase e formulário de acesso por e-mail/senha; cadastro, recuperação e troca de senha.
- Migração pessoal com RLS, SELECT por proprietário e escrita apenas via funções com proprietário explícito. Versão esperada em cada escrita impede perda silenciosa de atualização concorrente.
- Infraestrutura inicial de build, manifesto PWA, cabeçalhos Vercel, CI e conferência de segredos no build.

## Validação local

TypeScript aprovado e 17 testes aprovados (7 de domínio e 10 de PostgreSQL). A migração foi executada em PostgreSQL PGlite com papéis anon/authenticated e duas contas simuladas. Esses testes não equivalem à validação no Supabase hospedado.

No navegador: criação de nota, recarga com persistência, busca sem acentos, conclusão com atualização de contagens, exclusão lógica e restauração. Conferência visual em desktop e 390 px; tema escuro conferido na etapa de QA. Repetir fluxos de autenticação, confirmação de e-mail e recuperação depois de configurar Supabase e SMTP.

## Pendências por incremento

2. Espaços, pastas, etiquetas, documentos ricos, modelos, anexos e histórico. Nota atual é texto simples e grava manualmente; não representa o editor de documentos do escopo.
3. Subtarefas, ações em lote, recorrência, agenda interna, blocos de tempo e fusos.
4. Equipes, espaços restritos, convite/aceite transacional até 15 pessoas, compartilhamento de listas, comentários, menções, notificações e líder. Aplicar autorização antes de busca/exportação/canais.
5. Cofre pessoal: definir bibliotecas, derivação e gestão de chaves, recuperação e exportação criptografada. Bloqueio e revisão específicos. Não guardar segredos em itens_pessoais.
6. Offline de notas/listas pessoais para contas, fila persistente por usuário e conciliação de conflitos. Documentos compartilhados/equipe/cofre ficam online. Importação/exportação, lixeira e retenção comerciais.
7. Planos configuráveis, cobrança Asaas em sandbox, administração, suporte autorizado, monitoramento de erros, backups e restauração real. Preços do dossiê continuam hipóteses e não foram publicados.

## Infraestrutura aguardando configuração

- GitHub origem e histórico vinculados localmente; nenhum commit ou push criado nesta entrega.
- URL correta confirmada pelo responsável: https://lgejykmmfybfwzqjgpqq.supabase.co. URL e chave publicável configuradas no .env local, ignorado pelo Git. Teste remoto de autenticação respondeu HTTP 200, com e-mail e cadastro habilitados. A tabela itens_pessoais respondeu HTTP 401 / 42501 ao acesso anônimo, indicando que existe e bloqueia leitura sem sessão. Ainda falta validar CRUD e funções com contas autenticadas, confirmação de e-mail e recuperação; a existência da tabela não comprova toda a migração.
- Vercel informada, configuração de build versionada; nenhum deploy efetuado.
- SMTP, ambientes isolados, política de retenção e monitoramento ainda não configurados.

## Dependências e segurança

O SDK 57 foi escolhido para seguir o padrão técnico recebido (React 19 e RN 0.86). A auditoria npm de instalação apresenta alertas transitivos em braces/micromatch/Metro, node-forge e decode-uri-component/query-string. `npm audit fix` sem força foi executado; alertas ainda presentes dependem de atualização upstream ou migração de SDK e devem ser reavaliados antes de produção. Não foi aplicada sugestão automática de rebaixar Expo para 44. Esses avisos não substituem a revisão de segurança antes da liberação comercial.

CSP inicial permite scripts inline requeridos pela saída Expo e conexão ao Supabase. Revisar com URLs definitivas e hashes/nonces antes da produção. A política de microfone será ajustada quando gravação de áudio for implementada. Sessão do Supabase segue o mecanismo de armazenamento da plataforma; dados de conteúdo da conta não ficam na store persistida de avaliação.
