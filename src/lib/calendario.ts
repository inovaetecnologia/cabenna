import { Item } from './itens';
import { diaNoFuso, horarioLocal } from './agenda';
export type Segmento = { item: Item; inicio: number; fim: number; coluna: number; colunas: number };
export function segmentosDoDia(itens: Item[], dia: string, fuso: string): Segmento[] {
  const partes = itens
    .flatMap((item) => {
      if (item.arquivado || item.excluido_em || item.dados?.dia_inteiro) return [];
      const ini = item.tipo === 'evento' ? item.dados?.inicio : item.dados?.bloco_inicio;
      const fim = item.tipo === 'evento' ? item.dados?.fim : item.dados?.bloco_fim;
      if (
        !ini ||
        !fim ||
        dia < diaNoFuso(ini, fuso) ||
        dia > diaNoFuso(new Date(Date.parse(fim) - 1).toISOString(), fuso)
      )
        return [];
      const minuto = (v: string) => {
        const h = horarioLocal(v, fuso).slice(11).split(':').map(Number);
        return h[0]! * 60 + h[1]!;
      };
      return [
        {
          item,
          inicio: diaNoFuso(ini, fuso) < dia ? 0 : minuto(ini),
          fim: diaNoFuso(fim, fuso) > dia ? 1440 : minuto(fim),
          coluna: 0,
          colunas: 1,
        },
      ];
    })
    .sort((a, b) => a.inicio - b.inicio || b.fim - a.fim);
  let grupo: Segmento[] = [];
  let fimGrupo = 0;
  let finais: number[] = [];
  const fechar = () => {
    for (const p of grupo) p.colunas = finais.length;
  };
  for (const p of partes) {
    if (grupo.length && p.inicio >= fimGrupo) {
      fechar();
      grupo = [];
      finais = [];
      fimGrupo = 0;
    }
    let coluna = finais.findIndex((f) => f <= p.inicio);
    if (coluna < 0) coluna = finais.length;
    p.coluna = coluna;
    finais[coluna] = p.fim;
    grupo.push(p);
    fimGrupo = Math.max(fimGrupo, p.fim);
  }
  fechar();
  return partes;
}
