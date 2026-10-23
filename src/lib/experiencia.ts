import { Item, dataLocal, ativos } from './itens';
export function resumoObjetivo(objetivo: Item, itens: Item[]) {
  const tarefas = ativos(itens).filter(
    (i) => i.tipo === 'tarefa' && i.dados?.objetivo_id === objetivo.id,
  );
  const concluidas = tarefas.filter((i) => i.estado === 'Concluída').length;
  return {
    tarefas,
    concluidas,
    total: tarefas.length,
    percentual: tarefas.length ? Math.round((concluidas / tarefas.length) * 100) : 0,
  };
}
export function saudacao(agora = new Date()) {
  const hora = agora.getHours();
  return hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
}
export function deslocarDia(dia: string, quantidade: number) {
  const d = new Date(dia + 'T12:00:00');
  d.setDate(d.getDate() + quantidade);
  return dataLocal(d);
}
