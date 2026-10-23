import { Item } from './itens';
export function conteudoExportacao(itens: Item[], formato: 'json' | 'markdown' | 'csv') {
  if (formato === 'json')
    return JSON.stringify(
      { produto: 'Cabenna', versao: 1, exportado_em: new Date().toISOString(), registros: itens },
      null,
      2,
    );
  if (formato === 'markdown')
    return (
      '# Cabenna\n\n' +
      itens
        .map(
          (i) =>
            `## ${i.titulo}\n\n${i.texto}\n\n${i.checklist.map((l) => `- [${l.feita ? 'x' : ' '}] ${l.texto}`).join('\n')}\n\nTipo: ${i.tipo} · Estado: ${i.estado} · Prazo: ${i.prazo ?? '—'}\n`,
        )
        .join('\n---\n\n')
    );
  // Protege células interpretadas como fórmulas por planilhas, inclusive prefixos de controle.
  const celula = (v: string) =>
    '"' + (/^[\s\u0000-\u001f]*[=+@-]/.test(v) ? "'" + v : v).replace(/"/g, '""') + '"';
  return (
    '\uFEFF' +
    [
      ['Título', 'Tipo', 'Conteúdo', 'Estado', 'Prazo', 'Etiquetas'],
      ...itens.map((i) => [
        i.titulo,
        i.tipo,
        i.texto,
        i.estado,
        i.prazo ?? '',
        (i.dados?.etiquetas ?? []).join(', '),
      ]),
    ]
      .map((l) => l.map(celula).join(';'))
      .join('\r\n')
  );
}
