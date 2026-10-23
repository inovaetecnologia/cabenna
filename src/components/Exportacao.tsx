import React from 'react';
import { Texto } from './ui';
import { Cores } from '../theme/cores';
import { Item } from '../lib/itens';
export default function Exportacao({ cores }: { carregar: () => Promise<Item[]>; cores: Cores }) {
  return (
    <Texto style={{ color: cores.secundario }}>
      A exportação de arquivos está disponível na versão web.
    </Texto>
  );
}
