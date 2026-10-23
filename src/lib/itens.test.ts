import { describe, it, expect } from 'vitest';
import { validarEntrada, novoItem, atrasada, buscar, ativos, dataLocal, Entrada } from './itens';
const entrada: Entrada = {
  tipo: 'nota',
  titulo: 'Ideia',
  texto: '',
  prazo: null,
  estado: 'A fazer',
  checklist: [],
  favorito: false,
};
describe('registros pessoais', () => {
  it('exige título e limita conteúdo', () => {
    expect(() => validarEntrada({ ...entrada, titulo: '   ' })).toThrow();
    expect(() => validarEntrada({ ...entrada, texto: 'a'.repeat(50001) })).toThrow();
  });
  it('rejeita datas impossíveis e aceita ano bissexto', () => {
    expect(() => validarEntrada({ ...entrada, prazo: '2026-02-30' })).toThrow();
    expect(validarEntrada({ ...entrada, prazo: '2028-02-29' }).prazo).toBe('2028-02-29');
  });
  it('preserva a data local sem conversão UTC', () => {
    const d = new Date(2026, 9, 23, 23, 59);
    expect(dataLocal(d)).toBe('2026-10-23');
  });
  it('atraso não muda prazo nem conclui tarefa', () => {
    const item = novoItem('1', { ...entrada, tipo: 'tarefa', prazo: '2026-10-22' });
    expect(atrasada(item, '2026-10-23')).toBe(true);
    expect(item.estado).toBe('A fazer');
    expect(item.prazo).toBe('2026-10-22');
    expect(atrasada({ ...item, estado: 'Concluída' }, '2026-10-23')).toBe(false);
  });
  it('busca sem acentos também encontra itens da lista', () => {
    const item = novoItem('1', {
      ...entrada,
      tipo: 'lista',
      titulo: 'Reunião',
      checklist: [{ id: 'a', texto: 'Café', feita: false }],
    });
    expect(buscar([item], 'reuniao cafe')).toHaveLength(1);
  });
  it('arquivo e lixeira não aparecem nas visões ativas', () => {
    const i = novoItem('1', entrada);
    expect(
      ativos([i, { ...i, id: '2', arquivado: true }, { ...i, id: '3', excluido_em: '2026-10-23' }]),
    ).toHaveLength(1);
  });
  it('não permite ids duplicados em listas', () => {
    expect(() =>
      validarEntrada({
        ...entrada,
        checklist: [
          { id: '1', texto: 'a', feita: false },
          { id: '1', texto: 'b', feita: true },
        ],
      }),
    ).toThrow();
  });
});
