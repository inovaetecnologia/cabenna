import { describe, it, expect } from 'vitest';
import { conteudoExportacao } from './exportacao';
import { novoItem } from './itens';
describe('exportação portátil', () => {
  const item = novoItem('a', {
    tipo: 'nota',
    titulo: '=1+1',
    texto: '"Uma ideia"\nOutro trecho',
    estado: 'A fazer',
    prazo: null,
    checklist: [],
    favorito: false,
  });
  it('preserva documentos e metadados em JSON', () => {
    const json = JSON.parse(conteudoExportacao([item], 'json'));
    expect(json.registros[0]).toEqual(item);
  });
  it('escapa fórmulas, aspas e quebras em CSV', () => {
    const csv = conteudoExportacao([item], 'csv');
    expect(csv).toContain('"\'=1+1"');
    expect(csv).toContain('""Uma ideia""');
  });
});
