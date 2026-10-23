# Revisão da experiência Cabenna

23 de outubro de 2026 · Pesquisa exploratória de dores e decisões de produto

O feedback de Luís Felipe mostrou que a interface anterior reproduzia o mapa técnico do produto: uma entrada para cada formato de dado e outras para gestão. A revisão usa três destinos principais: Hoje, Calendário e Meu espaço. Planos, anotações, tarefas e listas ficam agrupados. Gestão de equipe, assinatura, tema e exportação ficam nas preferências da conta/contexto.

## Evidência e decisões

| Evidência consultada                                                                                                                                                    | Dor ou observação                                                                                                      | Decisão aplicada                                                                                        | Critério verificável                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [Discussão original sobre complexidade no Notion](https://www.reddit.com/r/Notion/comments/1jcw3y1/are_we_making_notion_too_complicated_after_6/)                       | Autor relata excesso de configuração antes de começar. Há discordâncias e divulgação de material próprio na discussão. | Captura de uma linha em Hoje; organização e modelos opcionais.                                          | Criar uma nota sem escolher pasta, etiqueta ou modelo.                 |
| [Relato sobre mês/lista no Calendário do iPhone](https://www.reddit.com/r/ios/comments/1cngizc/ios_calendar_monthlist_view_is_gone_and_the/)                            | Pessoa experiente não reencontra uma visualização por comandos contextuais.                                            | Calendário no primeiro nível; Dia, Semana, Mês e Hoje escritos.                                         | Encontrar amanhã e voltar a Hoje sem gesto oculto.                     |
| [Guia oficial das visualizações do Calendário Apple](https://support.apple.com/en-asia/guide/iphone/iphfd1054569/ios)                                                   | Diferentes densidades e maneiras de ler eventos.                                                                       | Grade de horas com duração, sobreposições em colunas, faixa de dia inteiro/prazo e mês para orientação. | Evento 10–11h ocupa uma hora; prazo não vira evento à meia-noite.      |
| [Relato original de desaparecimento aparente de notas](https://www.reddit.com/r/ios/comments/1t2o9ok/notes_disappeared/)                                                | Descrição de perda aparente e recuperação; causa não comprovada.                                                       | Salvamento confirmado, falha visível, histórico, lixeira e exportação mantidos.                         | Falha de rede não mostra “salvo”; conflito preserva o texto no editor. |
| [Suporte Apple para notas não encontradas](https://support.apple.com/en-au/102476)                                                                                      | Conta, pasta e itens apagados precisam ser verificados.                                                                | Contexto pessoal/equipe identificado; erro de carregamento separado de vazio.                           | Trocar de equipe não mistura dados; busca informa alcance e filtros.   |
| [Pedido de prazos próprios para etapas no Microsoft Q&A](https://learn.microsoft.com/en-au/answers/questions/5628944/is-it-possible-to-set-different-due-dates-for-the) | Checklist pode ser insuficiente para ações com datas próprias.                                                         | Plano liga referências e tarefas independentes, cada uma com prazo e bloco de tempo.                    | A mesma tarefa aparece no plano, em Hoje e no calendário.              |
| [Meu Dia na documentação Microsoft](https://support.microsoft.com/en-us/todo/my-day-and-suggestions)                                                                    | Seleção diária não deve mudar a permanência da tarefa.                                                                 | Foco individual com remoção explícita sem exclusão.                                                     | Escolher hoje preserva vencimento e não altera foco de outra pessoa.   |
| [Permissões na documentação Notion](https://www.notion.com/help/sharing-and-permissions)                                                                                | Vários níveis e caminhos de compartilhamento exigem clareza.                                                           | Audiência indicada, permissões no banco e licença Master separada de autorização de conteúdo.           | Master recebe a maior licença e não lê áreas pessoais alheias.         |

## Produto e design

Hoje é uma recepção: captura rápida, foco escolhido, agenda à vista e continuidade das ideias. O calendário oferece percepção temporal real; ele não é apenas uma tabela de datas. Meu espaço organiza planos e objetivos, anotações e tarefas/listas. Um plano contém resultado desejado, data-alvo opcional e tarefas vinculadas. O progresso deriva das tarefas, sem números inventados. As mesmas tarefas recebem foco e horário.

O institucional foi refeito para demonstrar esse percurso. A direção combina verde profundo, papel claro, detalhes quentes, ilustrações feitas em CSS/SVG e tipografia editorial. A demonstração é explicitamente ilustrativa. As etapas são interativas e acessíveis por teclado, com movimento reduzido respeitado. Não há testemunhos, métricas de adoção ou superioridade inventados.

O editor deixa conversão de tipo, etiquetas e organização em detalhes opcionais. Compromissos criados por toque numa hora recebem dia e horário correspondentes. No celular, a navegação inferior mantém os três destinos acessíveis. A semana pode ser deslizada horizontalmente quando a largura é pequena.

## Privacidade e Master

Master é um privilégio administrativo concedido por UUID no banco, após localizar uma conta com e-mail confirmado. O navegador não pode promover contas. A licença é permanente e acompanha a maior capacidade configurada no catálogo, inclusive para equipes do proprietário. As regras de privacidade de conteúdos continuam vigentes. O resumo administrativo mostra contagens agregadas, não registros pessoais.

A promessa de acolher planos e segredos exige cuidado técnico: o cofre com criptografia de ponta a ponta permanece uma entrega específica pendente. Esta revisão não o simula com uma aba ou com um cadeado decorativo.

## Limites da pesquisa

Amostra intencional de oito fontes: quatro relatos de usuários e quatro documentos oficiais. Buscar problemas introduz viés negativo. Votos e comentários não medem prevalência; relatos não comprovam causa técnica. Não houve entrevistas ou teste populacional. As recomendações são hipóteses de design, não prova de superioridade.

## Validação

Os componentes reais foram usados numa conferência visual isolada com dados fictícios em memória, sem acesso ao banco e fora das rotas de produção. Verificar captura, escolha do foco, abertura de plano e criação por horário em desktop e celular, claro/escuro. Testes de PostgreSQL cobrem Master, privilégios, plano permanente e vínculos entre registros; testes de domínio cobrem duração e sobreposição.

A próxima rodada recomendada é com cinco participantes de perfis diferentes, observando captura de ideia, reencontro de amanhã, planejamento de três ações, restauração e identificação de audiência. Medir sucesso sem ajuda, erros, tempo e hesitações. Essa rodada ainda não foi executada.
