export type Papel = 'proprietario' | 'administrador' | 'membro' | 'convidado';
export type Equipe = {
  id: string;
  nome: string;
  proprietario_id: string;
  teste_fim: string;
  pago_ate: string | null;
  encerrada_em: string | null;
};
export type Participante = {
  equipe_id: string;
  usuario_id: string;
  papel: Papel;
  email: string;
  entrou_em: string;
};
export type Espaco = {
  id: string;
  nome: string;
  cor: string;
  restrito: boolean;
  equipe_id: string | null;
  usuario_id: string | null;
};
export type Plano = {
  codigo: 'gratuito' | 'pro' | 'equipes';
  nome: string;
  estado: 'gratuito' | 'teste' | 'ativo' | 'consulta';
  historico_dias: number;
  armazenamento_bytes: number;
  anexo_bytes: number;
  participantes_max: number;
  teste_fim: string | null;
  teste_utilizado: boolean;
};
export type Convite = {
  id: string;
  equipe_id: string;
  email: string;
  papel: Papel;
  criado_em: string;
  vence_em: string;
  estado: string;
};
export type Versao = {
  registro_id: string;
  versao: number;
  criado_em: string;
  autor_id: string | null;
  conteudo: import('./itens').Item;
};
export type Comentario = {
  id: string;
  registro_id: string;
  usuario_id: string | null;
  texto: string;
  criado_em: string;
};
