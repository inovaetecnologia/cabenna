# Revisão de experiência — 23 de outubro de 2026

Esta revisão reorganiza o aplicativo em Hoje, Calendário e Meu espaço. A navegação anterior por 12 módulos foi substituída por agrupamentos de intenção. Notas e documentos ficam em Anotações; tarefas e listas ficam juntas, com quadro opcional; planos vinculam resultado desejado, tarefas e referências. As tarefas continuam as mesmas em Hoje e no calendário. Planos, gestão, exportação e tema ficam nas preferências.

Calendário agora tem eixo de horas, duração, sobreposições em colunas, faixa de prazo/dia inteiro, minicalendário e controles escritos Dia/Semana/Mês. Criar num horário preenche a data correspondente. Editor com opções progressivas; objetivo começa com nome e resultado, e planejamento detalhado é opcional. O site recebeu nova composição editorial, ilustrações CSS/SVG e demonstração interativa do percurso de uso.

**Banco:** o responsável confirmou a execução de 0002 a 0005. A nova migração 0006 e a ativação Master ainda NÃO foram executadas remotamente pelo agente. Leia ATUALIZACAO_0006.md antes do próximo push. Nenhuma migração aplicada anteriormente foi modificada. O cliente detecta ausência da 0006 e bloqueia a criação de planos conectados, mantendo as funções anteriores utilizáveis.

**Master:** privilégio por UUID, concedido somente pelo administrador do banco após localizar e-mail confirmado. Licença permanente com maior capacidade configurada no catálogo, estendida às equipes de propriedade do Master. Nenhum bypass de privacidade ou RLS foi criado. Resumo administrativo agregado, sem conteúdos privados. O arquivo específico da conta está nos outputs da conversa; o repositório contém apenas modelo administrativo com placeholder.

**Validação:** 56 testes aprovados na última execução local, incluindo novos casos de duração, sobreposição, Master, licença e vínculo entre plano/tarefa. Interface real conferida com dados fictícios em memória em ambiente isolado na porta 8090, fora das rotas/build de produção; temas e 390 px conferidos. SQL hospedado, licença da conta real e fluxo autenticado ainda precisam da homologação após 0006. A revisão não fez commit, push ou deploy.

Pesquisa exploratória com limitações e decisões: PESQUISA_DORES.md. Cofre, anexos, cobrança paga, notificações e offline persistente continuam pendentes. Não há edição simultânea de documentos; conflitos continuam controlados por versão.

---

## Registro da entrega anterior

# Estado do desenvolvimento

23 de outubro de 2026. Escopo: web responsiva/PWA. Base: dossiê Cabenna v1 e referências oficiais de produto documentadas em ESTUDO_PRODUTO.md.

## Implementado nesta versão local

- Acesso obrigatório por e-mail e senha: cadastro, confirmação, entrada, recuperação e saída. Sessão verificada com getUser; sem sessão validada não se monta a área de dados. Conta sem e-mail confirmado não entra.
- Site institucional comercial: proposta de valor, demonstração ilustrativa, Free/Pro/Equipes, chamadas para criar conta e FAQ. Sem preços hipotéticos ou depoimentos inventados.
- Cinco tipos de registro: nota, documento, tarefa, lista e evento. Conversão de tipo preserva texto e passos. Espaços, etiquetas, busca sem acentos, favoritos, arquivo e exclusão lógica com restauração.
- Documentos web com Tiptap: títulos, negrito, itálico, listas, checklist, tabela, citação, links e desfazer/refazer. Modelos de reunião, projeto, estudos, planejamento, diário, viagem e mercado. No nativo, apenas edição simples de texto; esta entrega é web.
- Salvamento automático com estado visível, versão esperada e proteção para alterações pendentes. Falha não transforma conteúdo em "salvo". Não existe fila offline persistente; fechar o navegador sem confirmação de salvamento pode perder rascunho.
- Meu Dia individual por usuário e registro, inclusive em equipes. Prazo, foco de hoje e bloco de execução são separados. Sugestões por prioridade, sem IA.
- Tarefas com estados, prioridade, responsável, passos e recorrência diária, semanal, mensal ou no dia seguinte à conclusão. Próxima ocorrência criada no servidor, sem duplicar ao reabrir e concluir. Intenção de dia mensal preservada.
- Agenda interna com dia/semana/mês, prazos, blocos de tarefas e eventos. Eventos de dia inteiro usam datas; eventos com horário usam instantes e fuso. Validação de horários ambíguos/inexistentes por mudança de horário de verão. Seletores nativos de data e horário no navegador, com validação de fuso.
- Equipes com até 15 participantes incluindo proprietário. Proprietário, administrador, membro e convidado restrito. Convites por link com token armazenado como hash, e-mail confirmado correspondente, expiração e revogação. Convites pendentes reservam vagas. O app não envia e-mail de convite automaticamente.
- Espaços abertos/restritos e concessões de leitura/edição. Administradores e proprietário também precisam de concessão explícita nos restritos. Gestão mostra concessões atuais. Atribuição exige que a pessoa tenha acesso ao destino.
- Remoção de participante revoga o acesso no banco, preserva material da equipe, retira atribuições e gera histórico. Troca de papel e transferência de propriedade exigem regras do servidor. Equipe não fica sem proprietário.
- Comentários e versões com as permissões do registro. Restauração cria nova versão, sem recuperar permissões históricas. Histórico visível: sete dias no Free, 90 no Pro/Equipes.
- Exportação de registro e contexto em JSON, Markdown e CSV. CSV protege fórmulas. JSON preserva documento estruturado. Exportação global de equipe exige proprietário e respeita espaços visíveis; comentários e permissões não são exportados. Importação não está implementada.
- Catálogo e cotas no servidor; teste Pro de 14 dias uma vez por conta; teste Equipes de 14 dias por nova equipe. Sem cartão e sem cobrança automática. Expiração pessoal volta ao Free; equipe fica em consulta. Não há ativação paga pelo cliente.

## Banco e implantação

Migrações novas 0002, 0003, 0004 e 0005 estão locais, testadas em PostgreSQL/PGlite e ainda não executadas no Supabase hospedado por este agente. A migração 0001 foi preservada. Leia ATUALIZACAO.md antes de publicar o app novo. A chave publicável não concede administração do banco.

A migração 0002 copia itens_pessoais para registros e retira a escrita pelas funções antigas para evitar duas fontes divergentes. Registros antigos continuam preservados na tabela original; a versão anterior do cliente deve ser substituída. Migração é executada uma vez, em ordem. Reverter só o código do cliente antigo não restaura a arquitetura anterior.

A autorização é feita pelo banco por chamada. O cliente atualiza listas a cada 20 segundos e ao voltar à janela; uma remoção pode permanecer visualmente no cache até essa atualização, mas novas operações já são bloqueadas. Não há edição colaborativa simultânea nem canais Realtime.

## Validação

45 testes aprovados: domínio, fusos, portabilidade e PostgreSQL/PGlite. Incluem isolamento pessoal, espaços restritos, read-only, convites vinculados ao e-mail, limite de vagas, proteção de plano, expiração, remoção de membro, exportação, histórico e recorrência. TypeScript e build web aprovados pelo comando npm run check. Esses testes não substituem a validação com contas reais no Supabase hospedado.

Conferência no navegador do site e tela de acesso em desktop e 390 px. Fluxos autenticados completos precisam ser homologados depois das migrações, com duas contas e confirmação de e-mail funcionando. Tema escuro da área autenticada está implementado, mas ainda precisa dessa conferência com sessão real.

## Pendências reais

- Aplicar migrações e homologar cadastro, confirmação, recuperação, CRUD, colaboração e e-mails no Supabase real.
- Contratação paga, Asaas, webhooks idempotentes, administração comercial e preços aprovados. Pro/Equipes nesta entrega funcionam por testes; não por compra.
- Anexos/Storage, importação, pastas hierárquicas e filtros inteligentes salvos. Cotas atuais são de conteúdo textual/JSON; não incluem armazenamento de arquivos nem cálculo físico das versões do banco.
- Cofre com revisão específica de criptografia e gestão de chaves; não guardar segredos em notas como substituto.
- Offline persistente e conciliação, notificações, menções, alarmes, calendário externo e relacionamentos entre registros.
- Rodada de usabilidade da agenda e do editor; painel de liderança mais completo, operações em lote, gerenciamento de encerramento de equipe.
- Backups e restauração hospedados, SMTP de produção, monitoramento e revisão de dependências. Nenhum push/deploy foi realizado pelo agente nesta etapa.
