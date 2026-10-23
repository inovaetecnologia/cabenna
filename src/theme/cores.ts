export const temas = {
  claro: {
    fundo: '#FAF8F3',
    painel: '#FFFFFF',
    lateral: '#092D25',
    texto: '#173B32',
    secundario: '#6B7C74',
    borda: '#E5E9E1',
    suave: '#EFF3EC',
    destaque: '#174C42',
    destaqueTexto: '#FFFFFF',
    salvia: '#C4E1C7',
    erro: '#A34332',
  },
  escuro: {
    fundo: '#0C211D',
    painel: '#12352D',
    lateral: '#071C17',
    texto: '#F4F6EF',
    secundario: '#ACC2B7',
    borda: '#295044',
    suave: '#1B4036',
    destaque: '#C4E1C7',
    destaqueTexto: '#092D25',
    salvia: '#C4E1C7',
    erro: '#FFAF9C',
  },
};
export type Cores = typeof temas.claro;
