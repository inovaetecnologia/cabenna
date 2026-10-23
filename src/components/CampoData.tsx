import React from 'react';
import { Campo } from './formulario';
import { Cores } from '../theme/cores';
export default function CampoData({
  tipo,
  ...props
}: {
  label: string;
  valor: string;
  mudar: (valor: string) => void;
  cores: Cores;
  tipo?: 'date' | 'datetime-local';
}) {
  return (
    <Campo {...props} placeholder={tipo === 'datetime-local' ? 'AAAA-MM-DDTHH:mm' : 'AAAA-MM-DD'} />
  );
}
