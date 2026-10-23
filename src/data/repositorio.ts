import { supabase } from './config';
import { Entrada, Item, validarEntrada } from '../lib/itens';
export async function carregarItens(): Promise<Item[]> {
  if (!supabase) throw new Error('Conecte o projeto Supabase.');
  const { data, error } = await supabase
    .from('itens_pessoais')
    .select(
      'id,tipo,titulo,texto,prazo,estado,checklist,favorito,arquivado,excluido_em,criado_em,atualizado_em,versao',
    )
    .order('atualizado_em', { ascending: false });
  if (error)
    throw new Error(
      'Não foi possível carregar seus registros. Confira a conexão e a configuração do banco.',
    );
  return data as Item[];
}
export async function salvarItem(id: string, entrada: Entrada, versao: number): Promise<Item> {
  if (!supabase) throw new Error('Conecte o projeto Supabase.');
  const { data, error } = await supabase.rpc('salvar_item_pessoal', {
    p_id: id,
    p_entrada: validarEntrada(entrada),
    p_versao: versao,
  });
  if (error) {
    if (error.message.includes('CONFLITO'))
      throw new Error(
        'Este registro mudou em outra sessão. Seu texto continua aqui. Copie-o e atualize a página antes de conciliar as versões.',
      );
    throw new Error(
      'Não foi possível salvar na nuvem. Seu conteúdo continua aberto; confira a conexão e tente novamente.',
    );
  }
  return data as Item;
}
export async function mudarArquivo(
  id: string,
  versao: number,
  acao: 'arquivar' | 'desarquivar' | 'excluir' | 'restaurar',
): Promise<Item> {
  if (!supabase) throw new Error('Conecte o projeto Supabase.');
  const { data, error } = await supabase.rpc('organizar_item_pessoal', {
    p_id: id,
    p_versao: versao,
    p_acao: acao,
  });
  if (error)
    throw new Error(
      'O registro mudou ou não pôde ser atualizado. Atualize seus dados e tente novamente.',
    );
  return data as Item;
}
