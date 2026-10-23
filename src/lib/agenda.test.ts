import { describe, it, expect } from 'vitest';
import { diasDoMes, diaNoFuso, instanteDoHorarioLocal, estaNaAgenda } from './agenda';
import { novoItem } from './itens';
describe('datas e agenda', () => {
  it('calendário começa na segunda e inclui mês anterior', () => {
    const dias = diasDoMes(2026, 10);
    expect(dias).toHaveLength(42);
    expect(dias[0]).toBe('2026-10-26');
  });
  it('converte horário de São Paulo sem deslocar o compromisso', () => {
    expect(instanteDoHorarioLocal('2026-10-23T09:00', 'America/Sao_Paulo')).toBe(
      '2026-10-23T12:00:00.000Z',
    );
    expect(diaNoFuso('2026-10-24T01:00:00Z', 'America/Sao_Paulo')).toBe('2026-10-23');
  });
  it('rejeita horários inexistentes e ambíguos do horário de verão', () => {
    expect(() => instanteDoHorarioLocal('2026-03-08T02:30', 'America/New_York')).toThrow(
      'não existe',
    );
    expect(() => instanteDoHorarioLocal('2026-11-01T01:30', 'America/New_York')).toThrow(
      'se repete',
    );
  });
  it('dia inteiro não muda com fuso e bloco não muda prazo', () => {
    const i = novoItem('e', {
      tipo: 'evento',
      titulo: 'Feriado',
      texto: '',
      prazo: null,
      estado: 'A fazer',
      favorito: false,
      checklist: [],
      dados: { dia_inteiro: true, data_inicio: '2026-10-23', data_fim: '2026-10-23' },
    });
    expect(estaNaAgenda(i, '2026-10-23', 'Asia/Tokyo')).toBe(true);
    expect(estaNaAgenda(i, '2026-10-24', 'Asia/Tokyo')).toBe(false);
  });
});
