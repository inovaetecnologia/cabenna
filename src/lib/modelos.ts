import { DocumentoJSON } from './itens';
const p = (texto: string) => ({ type: 'paragraph', content: [{ type: 'text', text: texto }] });
const h = (texto: string) => ({
  type: 'heading',
  attrs: { level: 2 },
  content: [{ type: 'text', text: texto }],
});
export const modelos: { nome: string; documento: DocumentoJSON }[] = [
  { nome: 'Em branco', documento: { type: 'doc', content: [{ type: 'paragraph' }] } },
  {
    nome: 'Reunião',
    documento: {
      type: 'doc',
      content: [
        h('Pauta da reunião'),
        p('Data e participantes'),
        h('O que precisamos decidir'),
        p('Registre os assuntos e as decisões.'),
        h('Próximos passos'),
        p('O que será feito, por quem e até quando?'),
      ],
    },
  },
  {
    nome: 'Planejamento semanal',
    documento: {
      type: 'doc',
      content: [
        h('Uma semana com intenção'),
        p('O que merece meu foco nesta semana?'),
        h('Prioridades'),
        p('Escolha até três prioridades.'),
        h('Espaço para imprevistos'),
        p('O que posso simplificar ou adiar?'),
      ],
    },
  },
  {
    nome: 'Projeto',
    documento: {
      type: 'doc',
      content: [
        h('Por que este projeto existe'),
        p('Qual problema queremos resolver?'),
        h('Resultado esperado'),
        p('Como vamos saber que ficou pronto?'),
        h('Etapas e responsáveis'),
        p('Divida o caminho em passos claros.'),
      ],
    },
  },
  {
    nome: 'Estudos',
    documento: {
      type: 'doc',
      content: [
        h('O que estou aprendendo'),
        p('Tema, fontes e objetivos.'),
        h('Anotações'),
        p('Registre as ideias com suas palavras.'),
        h('Revisão'),
        p('O que ainda preciso entender melhor?'),
      ],
    },
  },
  {
    nome: 'Diário',
    documento: {
      type: 'doc',
      content: [
        h('Um momento para mim'),
        p('Como foi meu dia?'),
        h('O que quero guardar'),
        p('Pequenos momentos também contam.'),
        h('Amanhã'),
        p('Uma intenção para o próximo dia.'),
      ],
    },
  },
  {
    nome: 'Viagem',
    documento: {
      type: 'doc',
      content: [
        h('Nossa próxima viagem'),
        p('Destino, datas e companhia.'),
        h('Roteiro'),
        p('Lugares para conhecer, sem esquecer do tempo livre.'),
        h('Antes de sair'),
        p('Reservas, documentos e o que levar.'),
      ],
    },
  },
  {
    nome: 'Lista de mercado',
    documento: {
      type: 'doc',
      content: [
        h('O que precisamos comprar'),
        p('Separe por categoria e confira o que já tem em casa.'),
        {
          type: 'taskList',
          content: [
            { type: 'taskItem', attrs: { checked: false }, content: [p('Frutas e verduras')] },
            { type: 'taskItem', attrs: { checked: false }, content: [p('Itens da despensa')] },
          ],
        },
      ],
    },
  },
];
