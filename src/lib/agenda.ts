import { Item, dataLocal } from './itens';

export const fusoDoDispositivo = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
export function diaNoFuso(instante: string, fuso: string): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: fuso,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(instante));
  return `${partes.find((p) => p.type === 'year')?.value}-${partes.find((p) => p.type === 'month')?.value}-${partes.find((p) => p.type === 'day')?.value}`;
}
export function horarioLocal(instante: string, fuso: string) {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: fuso,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(instante));
  const pegar = (tipo: string) => partes.find((p) => p.type === tipo)?.value;
  return `${pegar('year')}-${pegar('month')}-${pegar('day')}T${pegar('hour')}:${pegar('minute')}`;
}
export function instanteDoHorarioLocal(horario: string, fuso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(horario))
    throw new Error('Informe data e horário no formato AAAA-MM-DDTHH:mm.');
  const base = Date.parse(horario + 'Z');
  if (!Number.isFinite(base)) throw new Error('Confira a data e o horário.');
  // Verifica offsets atuais em passos de 15 min, incluindo horários inexistentes/ambíguos do horário de verão.
  const encontrados: string[] = [];
  for (let offset = -14 * 60; offset <= 14 * 60; offset += 15) {
    const iso = new Date(base - offset * 60000).toISOString();
    if (horarioLocal(iso, fuso) === horario) encontrados.push(iso);
  }
  if (!encontrados.length)
    throw new Error(
      'Esse horário não existe no fuso escolhido. Confira a mudança de horário de verão.',
    );
  if (encontrados.length > 1)
    throw new Error(
      'Esse horário se repete na mudança de horário de verão. Escolha um horário fora desse intervalo.',
    );
  return encontrados[0]!;
}
export function diasDoMes(ano: number, mes: number) {
  const primeiro = new Date(ano, mes, 1, 12);
  const deslocamento = (primeiro.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) =>
    dataLocal(new Date(ano, mes, 1 - deslocamento + i, 12)),
  );
}
export function estaNaAgenda(item: Item, dia: string, fuso = fusoDoDispositivo()) {
  if (item.arquivado || item.excluido_em) return false;
  if (item.tipo === 'tarefa' && item.prazo === dia) return true;
  const d = item.dados;
  if (item.tipo === 'evento' && d?.dia_inteiro)
    return !!d.data_inicio && !!d.data_fim && dia >= d.data_inicio && dia <= d.data_fim;
  const inicio = item.tipo === 'evento' ? d?.inicio : d?.bloco_inicio;
  const fim = item.tipo === 'evento' ? d?.fim : d?.bloco_fim;
  if (!inicio || !fim) return false;
  return (
    dia >= diaNoFuso(inicio, fuso) &&
    dia <= diaNoFuso(new Date(new Date(fim).getTime() - 1).toISOString(), fuso)
  );
}
export function textoDocumento(no: import('./itens').DocumentoJSON): string {
  if (no.text) return no.text;
  return (no.content ?? [])
    .map(textoDocumento)
    .join(
      ['doc', 'bulletList', 'orderedList', 'taskList', 'table', 'tableRow'].includes(no.type)
        ? '\n'
        : '',
    );
}
