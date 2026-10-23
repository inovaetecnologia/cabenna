export type Tipo = 'nota' | 'documento' | 'tarefa' | 'lista' | 'evento';
export type DocumentoJSON = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: DocumentoJSON[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};
export type DadosItem = {
  objetivo?: {
    resultado: string;
    data_alvo: string | null;
    situacao: 'ativo' | 'pausado' | 'concluido';
  };
  objetivo_id?: string | null;
  prioridade?: number;
  etiquetas?: string[];
  meu_dia?: string | null;
  responsavel_id?: string | null;
  documento?: DocumentoJSON | null;
  recorrencia?: 'nenhuma' | 'diaria' | 'semanal' | 'mensal' | 'apos_concluir';
  fuso?: string;
  inicio?: string | null;
  fim?: string | null;
  dia_inteiro?: boolean;
  data_inicio?: string | null;
  data_fim?: string | null;
  bloco_inicio?: string | null;
  bloco_fim?: string | null;
  local?: string;
  link?: string;
};
export type Estado = 'A fazer' | 'Em andamento' | 'Aguardando' | 'Concluída';
export type Linha = { id: string; texto: string; feita: boolean };
export type Item = {
  id: string;
  tipo: Tipo;
  titulo: string;
  texto: string;
  prazo: string | null;
  estado: Estado;
  checklist: Linha[];
  favorito: boolean;
  arquivado: boolean;
  excluido_em: string | null;
  criado_em: string;
  atualizado_em: string;
  versao: number;
  espaco_id?: string | null;
  equipe_id?: string | null;
  usuario_id?: string | null;
  dados?: DadosItem;
};
export type Entrada = Pick<
  Item,
  'tipo' | 'titulo' | 'texto' | 'prazo' | 'estado' | 'checklist' | 'favorito'
> & { espaco_id?: string | null; dados?: DadosItem };
export function dataLocal(data = new Date()): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}
export function validarEntrada(entrada: Entrada): Entrada {
  const titulo = entrada.titulo.trim();
  if (!titulo) throw new Error('Escreva um título para guardar.');
  if (titulo.length > 200 || entrada.texto.length > 50000)
    throw new Error('Use até 200 caracteres no título e 50 mil no conteúdo.');
  if (entrada.prazo) {
    const [ano, mes, dia] = entrada.prazo.split('-').map(Number);
    if (
      !ano ||
      !mes ||
      !dia ||
      !/^\d{4}-\d{2}-\d{2}$/.test(entrada.prazo) ||
      dataLocal(new Date(ano, mes - 1, dia)) !== entrada.prazo ||
      ano < 1900 ||
      ano > 2200
    )
      throw new Error('Informe uma data válida no formato AAAA-MM-DD.');
  }
  if (
    entrada.checklist.length > 300 ||
    entrada.checklist.some((l) => !l.texto.trim() || l.texto.length > 500 || !l.id)
  )
    throw new Error('Confira os itens da lista (até 300 itens de 500 caracteres).');
  if (new Set(entrada.checklist.map((l) => l.id)).size !== entrada.checklist.length)
    throw new Error('Há itens repetidos na lista.');
  if (
    (entrada.dados?.etiquetas?.length ?? 0) > 20 ||
    entrada.dados?.etiquetas?.some((e) => !e.trim() || e.length > 40)
  )
    throw new Error('Use até 20 etiquetas de até 40 caracteres.');
  if (
    entrada.tipo === 'tarefa' &&
    entrada.dados?.recorrencia &&
    !['nenhuma', 'apos_concluir'].includes(entrada.dados.recorrencia) &&
    !entrada.prazo
  )
    throw new Error('Defina um prazo para repetir essa tarefa.');
  return { ...entrada, titulo };
}
export function novoItem(id: string, entrada: Entrada, agora = new Date().toISOString()): Item {
  return {
    ...validarEntrada(entrada),
    id,
    criado_em: agora,
    atualizado_em: agora,
    arquivado: false,
    excluido_em: null,
    versao: 1,
  };
}
export function normalizarBusca(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}
export function buscar(itens: Item[], busca: string) {
  const termos = normalizarBusca(busca).trim().split(/\s+/);
  return itens.filter((i) =>
    termos.every((t) =>
      normalizarBusca(
        `${i.titulo} ${i.texto} ${i.dados?.objetivo?.resultado ?? ''} ${(i.dados?.etiquetas ?? []).join(' ')} ${i.checklist.map((l) => l.texto).join(' ')}`,
      ).includes(t),
    ),
  );
}
export function atrasada(item: Item, hoje = dataLocal()) {
  return item.tipo === 'tarefa' && item.estado !== 'Concluída' && !!item.prazo && item.prazo < hoje;
}
export function ativos(itens: Item[]) {
  return itens.filter((i) => !i.arquivado && !i.excluido_em);
}
export function nomeData(data: string | null) {
  if (!data) return 'Sem prazo';
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(
    new Date(data + 'T12:00:00'),
  );
}
