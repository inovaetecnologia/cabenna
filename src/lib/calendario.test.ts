import { describe, it, expect } from 'vitest';
import { novoItem } from './itens';
import { segmentosDoDia } from './calendario';
import { resumoObjetivo } from './experiencia';
const evento = (id: string, inicio: string, fim: string) =>
  novoItem(id, {
    tipo: 'evento',
    titulo: id,
    texto: '',
    prazo: null,
    estado: 'A fazer',
    checklist: [],
    favorito: false,
    dados: { inicio, fim },
  });
describe('calendário com duração', () => {
  it('separa sobreposições e reaproveita colunas após o fim', () => {
    const r = segmentosDoDia(
      [
        evento('a', '2026-10-23T12:00Z', '2026-10-23T13:00Z'),
        evento('b', '2026-10-23T12:30Z', '2026-10-23T13:30Z'),
        evento('c', '2026-10-23T13:00Z', '2026-10-23T14:00Z'),
      ],
      '2026-10-23',
      'America/Sao_Paulo',
    );
    expect(r.map((i) => i.coluna)).toEqual([0, 1, 0]);
    expect(r.every((i) => i.colunas === 2)).toBe(true);
    expect(r[0]?.inicio).toBe(540);
  });
  it('recorta eventos que atravessam meia-noite sem deslocar a data', () => {
    const e = evento('a', '2026-10-24T02:00Z', '2026-10-24T04:00Z');
    expect(segmentosDoDia([e], '2026-10-23', 'America/Sao_Paulo')[0]).toMatchObject({
      inicio: 1380,
      fim: 1440,
    });
    expect(segmentosDoDia([e], '2026-10-24', 'America/Sao_Paulo')[0]).toMatchObject({
      inicio: 0,
      fim: 60,
    });
  });
  it('não inventa horário para uma tarefa que só tem prazo', () => {
    const t = {
      ...evento('a', '2026-10-23T12:00Z', '2026-10-23T13:00Z'),
      tipo: 'tarefa' as const,
      prazo: '2026-10-23',
      dados: {},
    };
    expect(segmentosDoDia([t], '2026-10-23', 'America/Sao_Paulo')).toEqual([]);
  });
  it('progresso do plano deriva das tarefas ligadas e ativas', () => {
    const meta = evento('g', '2026-10-23T12:00Z', '2026-10-23T13:00Z');
    const t = {
      ...meta,
      id: 't',
      tipo: 'tarefa' as const,
      estado: 'Concluída' as const,
      dados: { objetivo_id: 'g' },
    };
    expect(
      resumoObjetivo(meta, [t, { ...t, id: 'outro', dados: { objetivo_id: 'outro' } }]),
    ).toMatchObject({ total: 1, concluidas: 1, percentual: 100 });
    expect(resumoObjetivo(meta, [{ ...t, arquivado: true }]).total).toBe(0);
  });
});
