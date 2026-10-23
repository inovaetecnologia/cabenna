import { supabase } from './config';
import { Entrada, Item, validarEntrada } from '../lib/itens';
import { Equipe, Espaco, Participante, Plano, Convite, Versao, Comentario } from '../lib/contextos';

const mensagens: Record<string, string> = {
  CONFLITO:
    'Este registro mudou em outra sessão. Seu texto foi preservado no editor. Feche após copiá-lo e atualize os registros para conciliar.',
  EQUIPE_EM_CONSULTA:
    'O teste da equipe terminou ou o acesso mudou. Consulta e exportação continuam disponíveis para participantes autorizados.',
  SEM_PERMISSAO: 'Você não tem permissão para essa ação. Atualize seus contextos.',
  ESPACO_SEM_PERMISSAO: 'Esse espaço não está disponível para edição nesta equipe.',
  LIMITE_PARTICIPANTES:
    'A equipe já tem 15 vagas ocupadas ou reservadas por convites. Revogue um convite pendente ou remova um participante.',
  CONVITE_PENDENTE:
    'Já existe um convite pendente para esse e-mail. Revogue-o antes de gerar outro.',
  CONVITE_INDISPONIVEL:
    'O convite expirou, foi revogado ou pertence a outro e-mail. Entre com o e-mail convidado.',
  CONFIRME_EMAIL: 'Confirme seu e-mail antes de participar de equipes.',
  JA_PARTICIPA: 'Essa pessoa já faz parte da equipe.',
  TESTE_JA_UTILIZADO: 'O teste Pro já foi utilizado por esta conta.',
  TRANSFIRA_A_PROPRIEDADE: 'Transfira a propriedade antes de sair da equipe.',
  RESPONSAVEL_INVALIDO: 'Escolha uma pessoa com acesso ao contexto deste registro.',
  LIMITE_ARMAZENAMENTO:
    'O limite de armazenamento do contexto foi atingido. Seus registros continuam disponíveis para consulta.',
};
export function erroDoServidor(erro: { message: string; code?: string }): Error {
  if (['PGRST202', 'PGRST205', '42P01'].includes(erro.code ?? ''))
    return new Error(
      'A atualização do banco ainda não foi aplicada. Execute as migrações 0002 a 0005 do Cabenna no Supabase antes de usar esta versão.',
    );
  const chave = Object.keys(mensagens).find((c) => erro.message.includes(c));
  return new Error(
    chave ? mensagens[chave] : 'Não foi possível concluir. Confira sua conexão e tente novamente.',
  );
}
export async function rpc<T>(nome: string, parametros: Record<string, unknown> = {}): Promise<T> {
  if (!supabase) throw new Error('O Supabase não está configurado neste ambiente.');
  const { data, error } = await supabase.rpc(nome, parametros);
  if (error) throw erroDoServidor(error);
  return data as T;
}
async function resultado<T>(
  consulta: PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }>,
): Promise<T> {
  const { data, error } = await consulta;
  if (error) throw erroDoServidor(error);
  return data as T;
}
export async function carregarContextos() {
  if (!supabase) throw new Error('Conexão não configurada.');
  const [equipes, espacos] = await Promise.all([
    resultado<Equipe[]>(supabase.from('equipes').select('*').order('criado_em')),
    resultado<Espaco[]>(supabase.from('espacos').select('*').order('nome')),
  ]);
  return { equipes, espacos };
}
export async function carregarContexto(equipe: string | null) {
  if (!supabase) throw new Error('Conexão não configurada.');
  let q = supabase.from('registros').select('*').order('atualizado_em', { ascending: false });
  q = equipe ? q.eq('equipe_id', equipe) : q.is('equipe_id', null);
  const [itens, plano, participantes, focos] = await Promise.all([
    resultado<Item[]>(q),
    rpc<Plano>('cabenna_plano', { p_equipe: equipe }),
    equipe
      ? resultado<Participante[]>(
          supabase.from('participantes_equipe').select('*').eq('equipe_id', equipe),
        )
      : Promise.resolve([] as Participante[]),
    resultado<{ registro_id: string; dia: string }[]>(
      supabase.from('focos_diarios').select('registro_id,dia'),
    ),
  ]);
  return {
    itens: itens.map((i) => ({
      ...i,
      dados: { ...i.dados, meu_dia: focos.find((f) => f.registro_id === i.id)?.dia ?? null },
    })),
    plano,
    participantes,
  };
}
export const gravarRegistro = (
  id: string,
  entrada: Entrada,
  versao: number,
  equipe: string | null,
) =>
  rpc<Item>('cabenna_salvar_registro', {
    p_id: id,
    p_entrada: validarEntrada(entrada),
    p_versao: versao,
    p_equipe: equipe,
  });
export const organizarRegistro = (item: Item, acao: string) =>
  rpc<Item>('cabenna_organizar_registro', { p_id: item.id, p_versao: item.versao, p_acao: acao });
export const criarEspaco = (nome: string, cor: string, equipe: string | null, restrito: boolean) =>
  rpc<string>('cabenna_criar_espaco', {
    p_nome: nome,
    p_cor: cor,
    p_equipe: equipe,
    p_restrito: restrito,
  });
export const criarEquipe = (nome: string) => rpc<string>('cabenna_criar_equipe', { p_nome: nome });
export const iniciarTeste = () => rpc<Plano>('cabenna_testar_pro');
export const aceitarConvite = (token: string) =>
  rpc<string>('cabenna_aceitar_convite', { p_token: token });
export const convidar = (equipe: string, email: string, papel: string, token: string) =>
  rpc<string>('cabenna_convidar', {
    p_equipe: equipe,
    p_email: email,
    p_papel: papel,
    p_token: token,
  });
export const revogarConvite = (id: string) =>
  rpc<void>('cabenna_revogar_convite', { p_convite: id });
export const gerirParticipante = (
  equipe: string,
  usuario: string,
  papel: string | null,
  remover = false,
  transferir: string | null = null,
) =>
  rpc<void>('cabenna_gerir_participante', {
    p_equipe: equipe,
    p_usuario: usuario,
    p_papel: papel,
    p_remover: remover,
    p_transferir_para: transferir,
  });
export const autorizarEspaco = (
  espaco: string,
  usuario: string,
  editar: boolean,
  revogar = false,
) =>
  rpc<void>('cabenna_autorizar_espaco', {
    p_espaco: espaco,
    p_usuario: usuario,
    p_editar: editar,
    p_revogar: revogar,
  });
export const carregarConvites = (equipe: string) =>
  resultado<Convite[]>(
    supabase!
      .from('convites_equipe')
      .select('id,equipe_id,email,papel,criado_em,vence_em,estado')
      .eq('equipe_id', equipe)
      .order('criado_em', { ascending: false }),
  );
export const carregarVersoes = (id: string) =>
  resultado<Versao[]>(
    supabase!
      .from('versoes_registro')
      .select('*')
      .eq('registro_id', id)
      .order('versao', { ascending: false }),
  );
export const restaurarVersao = (item: Item, versao: number) =>
  rpc<Item>('cabenna_restaurar_versao', {
    p_id: item.id,
    p_versao_atual: item.versao,
    p_versao_historica: versao,
  });
export const carregarComentarios = (id: string) =>
  resultado<Comentario[]>(
    supabase!.from('comentarios_registro').select('*').eq('registro_id', id).order('criado_em'),
  );
export const comentar = (id: string, texto: string) =>
  rpc<string>('cabenna_comentar', { p_registro: id, p_texto: texto });

export const exportarContexto = (equipe: string | null) =>
  rpc<Item[]>('cabenna_exportar_contexto', { p_equipe: equipe });

export const definirFoco = (id: string, dia: string | null) =>
  rpc<void>('cabenna_definir_foco', { p_registro: id, p_dia: dia });

export const carregarPermissoes = (espaco: string) =>
  resultado<{ usuario_id: string; pode_editar: boolean }[]>(
    supabase!.from('permissoes_espaco').select('usuario_id,pode_editar').eq('espaco_id', espaco),
  );
