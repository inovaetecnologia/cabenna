# Cabenna: estudo de produto e decisões de implementação

23 de outubro de 2026 · Inovae · pesquisa documental em fontes oficiais

## A proposta

O diferencial proposto para o Cabenna é a continuidade entre capturar, desenvolver, executar e reservar tempo. Uma nota pode ganhar estrutura de documento ou virar tarefa. A tarefa aparece em lista, quadro, Meu Dia e agenda sem criar cópias independentes. O contexto pessoal fica separado do trabalho em equipe. Esta é uma direção de produto da Inovae; não representa uma superioridade comprovada em testes com usuários.

O estudo consultou a documentação oficial de Notion, Notas e Calendário do iPhone e Microsoft To Do. Não houve acesso a contas privadas nem teste comparativo de desempenho dos concorrentes. As observações abaixo descrevem os padrões documentados; as decisões para o Cabenna são inferências de design, aplicadas ao dossiê de produto.

## Comparação por trabalho que a pessoa precisa realizar

| Trabalho                           | Referência observada                         | Decisão Cabenna                                              | Evidência nesta entrega                             |
| ---------------------------------- | -------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| Capturar sem organizar antes       | Notas: categorização posterior por etiquetas | Nota como captura padrão; título, texto e destino opcional   | Editor único, busca em texto e etiquetas            |
| Desenvolver uma ideia              | Notion: blocos e formatação                  | Documento estruturado com modelos úteis                      | Títulos, listas, checklist, tabela, links, desfazer |
| Encontrar outra perspectiva        | Notion: várias visões da mesma base          | Lista, cartões e quadro consultam os mesmos registros        | Sem duplicar tarefas ao trocar de visão             |
| Decidir o foco de hoje             | To Do: Meu Dia e sugestões                   | Escolha diária separada do vencimento                        | Campo Meu Dia e sugestões por prioridade            |
| Encaixar trabalho no tempo         | Calendário: eventos e lembretes na agenda    | Evento, prazo e bloco de tempo têm significados distintos    | Visões dia/semana/mês e fusos                       |
| Fazer junto                        | Notion: permissões; To Do: responsáveis      | Contexto de equipe, acesso por espaço, responsável explícito | Convites por e-mail, papéis e comentários           |
| Recuperar uma mudança              | Histórico de produto e requisitos Inovae     | Restaurar como nova versão, com conflito detectável          | Histórico de 7/90 dias e versão esperada            |
| Sair sem perder o próprio material | Requisito de portabilidade da Inovae         | Exportação com escopo autorizado                             | JSON, Markdown e CSV                                |

## Notion: flexibilidade com estrutura

A documentação de visualizações explica que a mesma base pode ser apresentada em formatos diferentes, com filtros, ordenações e agrupamentos. O editor descreve páginas compostas de blocos, com títulos, listas e outros conteúdos. As permissões distinguem níveis de acesso e compartilhamento. Fontes: [visões, filtros e ordenações](https://www.notion.com/help/views-filters-and-sorts), [escrita e edição](https://www.notion.com/help/writing-and-editing-basics), [compartilhamento e permissões](https://www.notion.com/help/sharing-and-permissions).

Nossa interpretação: oferecer estrutura progressiva. A pessoa não deve precisar construir uma base, definir propriedades e escolher um modelo de gestão antes de registrar uma ideia. O Cabenna começa com uma nota; a estrutura aparece quando ela resolve desenvolver ou executar. O editor de documentos guarda JSON estruturado, e não HTML arbitrário. As opções iniciais incluem reunião, projeto, estudos, planejamento semanal, diário e viagem.

Lista, quadro e cartões não possuem cópias de conteúdo. Alterar a conclusão em uma visão altera o registro consultado pelas demais. As visualizações nesta entrega são predefinidas, sem o construtor arbitrário de bases, fórmulas e relações do Notion. Isso mantém o escopo coerente e deixa espaço para validar usos reais antes de aumentar a complexidade.

No compartilhamento, escolhemos uma regra explícita: ser administrador ou proprietário da equipe não dá acesso automático a espaços restritos. O servidor verifica concessões antes de ler, alterar, comentar ou restaurar. A busca usa apenas registros já autorizados. Trocar de contexto limpa os registros apresentados antes de carregar os próximos.

## Notas do iPhone: guardar agora, encontrar depois

A Apple documenta etiquetas para categorizar notas e Pastas Inteligentes baseadas em filtros. A organização pode agrupar referências sem obrigar a mover o original entre pastas. Fonte: [etiquetas e Pastas Inteligentes](https://support.apple.com/en-gb/102288).

Nossa interpretação: separar lugar de contexto e classificação. Um espaço responde onde o registro pertence; uma etiqueta responde a quais assuntos ele se relaciona. Uma nota de reunião pode morar no espaço Projeto e usar etiquetas cliente e decisões. Buscar por assunto não exige lembrar o lugar exato. O filtro por etiquetas nesta versão é simples e não equivale a um editor de Pastas Inteligentes com regras salvas.

A captura deve ser leve: texto livre primeiro, campos adicionais opcionais. O salvamento automático só começa com um título válido e entrada consistente; o status informa quando houve confirmação. Uma falha preserva o texto no editor e exibe a necessidade de tentar novamente. Há aviso antes de fechar com alterações pendentes. Essa proteção não representa modo offline: não há fila persistente de rascunhos após fechar o navegador.

Não copiamos a aparência das notas amarelas nem elementos exclusivos de iOS. A identidade verde, a tipografia e o vocabulário são Cabenna. Desenho, scanner, anexos e reconhecimento de escrita não fazem parte deste incremento.

## Calendário do iPhone: compreender o tempo

A Apple distingue o fuso de criação do evento e o fuso de exibição. Também documenta a apresentação de lembretes dentro do Calendário. Fontes: [eventos em outros fusos](https://support.apple.com/en-gb/guide/iphone/iph69525c028/ios), [lembretes no Calendário](https://support.apple.com/en-ie/guide/iphone/iph14f1d32a5/27/ios/27).

Nossa interpretação: prazo, compromisso e tempo reservado não podem compartilhar um único campo. Uma tarefa pode vencer na sexta e ter um bloco de execução na quarta. O prazo continua sexta. Um evento com horário armazena início e fim como instantes, além do fuso informado. Um evento de dia inteiro usa datas, para não mudar de dia ao viajar. A apresentação acompanha o fuso do dispositivo e o mostra na tela.

As visões de dia, semana e mês listam tarefas e eventos do contexto atual. A grade é uma navegação temporal, acompanhada de uma lista legível do dia selecionado. Reservar um bloco não transforma a tarefa em um evento duplicado. Datas impossíveis e fim anterior ao início são rejeitados. Horários locais inexistentes ou ambíguos em mudanças de horário de verão pedem correção explícita.

A escolha atual prioriza correção dos dados; a versão web usa seletores nativos de data e horário. O fluxo completo ainda deve passar por uma rodada de usabilidade. Não há integração com iCloud, Google ou Outlook, nem envio de alarmes ou convites externos.

## Microsoft To Do: escolher o próximo passo

O To Do apresenta Meu Dia como uma seleção diária, com sugestões para retomar tarefas. A documentação de listas compartilhadas permite atribuir tarefas a participantes da lista. Fontes: [Meu Dia e sugestões](https://support.microsoft.com/en-us/todo/my-day-and-suggestions), [atribuição em listas compartilhadas](https://support.microsoft.com/en-au/todo/assign-tasks-in-shared-lists).

Nossa interpretação: o Cabenna deve reduzir o peso do acúmulo sem esconder atrasos. Meu Dia recebe somente escolhas explícitas para a data atual. Ao virar o dia, o filtro muda; os registros continuam guardados. Os prazos e as contagens de atraso não são modificados para fabricar uma sensação de produtividade. As sugestões são determinísticas por prioridade e não usam IA.

Tarefas têm quatro estados, prioridade, passos e repetição. Ao concluir uma tarefa recorrente, o servidor cria no máximo uma próxima ocorrência. Reabrir e concluir novamente não pode duplicá-la. A repetição mensal preserva a intenção do dia original: dia 31 pode passar pelo último dia de fevereiro e voltar ao 31 em março. Na repetição após concluir, a base é a data real da conclusão no fuso escolhido.

O responsável precisa ser participante com acesso ao destino. Removê-lo preserva o material da equipe, limpa a atribuição e registra a mudança no histórico. Não há editor simultâneo: versões esperadas detectam gravações concorrentes e impedem sobrescrita silenciosa.

## Um fluxo Cabenna completo

1. Capture a ideia em uma nota no contexto Pessoal.
2. Desenvolva o conteúdo como documento, usando um modelo se ajudar.
3. Converta o registro em tarefa e acrescente os passos de execução.
4. Escolha o prazo e, separadamente, reserve um bloco na agenda.
5. Traga a tarefa para Meu Dia quando fizer sentido executá-la.
6. Em trabalho compartilhado, crie o material no contexto da equipe e atribua um responsável autorizado.
7. Registre decisões nos comentários e consulte o histórico quando necessário.

Mover material pessoal para uma equipe por simples troca de contexto não é permitido: compartilhar precisa ser uma intenção explícita. A conversão de documento para outro tipo preserva o texto, mas o documento estruturado não deve ser tratado como um sistema completo de relações entre páginas. Referências e vínculos entre registros são uma evolução futura.

## Free, Pro e Equipes

O Free entrega o ciclo básico completo: captura, documentos, tarefas, listas, agenda, organização e histórico de sete dias. Pro amplia histórico para 90 dias e cota de conteúdo. Equipes adiciona contexto compartilhado, até 15 pessoas, papéis, espaços restritos, comentários e atribuições. Os testes duram 14 dias e são concedidos pelo servidor. Convites pendentes reservam vagas e só são aceitos pelo e-mail confirmado correspondente.

O fim do teste não apaga material: o contexto pessoal volta ao Free; equipes passam a consulta. Exportar continua sujeito às permissões atuais. A exportação global da equipe é reservada ao proprietário e não inclui espaços aos quais ele não tem acesso. Uma pessoa pode exportar um registro que pode consultar.

As cotas de texto são verificadas no banco; anexos ainda não estão implementados. Não há contratação paga conectada nem preços publicados. Não ativamos assinaturas por botão no navegador. Cofre, offline persistente, notificações, anexos e cobrança continuam como entregas específicas pendentes.

## Validação e próximo critério de qualidade

A validação automatizada cobre autorização no PostgreSQL/PGlite, conflitos, recorrência, fusos e exportação. Ela não substitui um teste com contas reais no Supabase hospedado. As migrações precisam ser aplicadas antes da atualização do app, e os fluxos de confirmação de e-mail e recuperação dependem das URLs autorizadas e do serviço de envio.

A próxima validação de produto deve observar pessoas executando três tarefas: guardar e reencontrar uma ideia; planejar uma tarefa sem confundir prazo e horário; convidar alguém com acesso restrito. Medir tempo até a primeira captura salva, taxa de reencontro, erros de contexto e compreensão das permissões. Ainda não há resultados desses testes nem métricas de superioridade comercial.
