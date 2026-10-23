import React from 'react';
import { Cores } from '../theme/cores';
export default function CampoData({
  label,
  valor,
  mudar,
  cores,
  tipo = 'date',
}: {
  label: string;
  valor: string;
  mudar: (valor: string) => void;
  cores: Cores;
  tipo?: 'date' | 'datetime-local';
}) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        color: cores.texto,
        fontFamily: 'Inter_600SemiBold, sans-serif',
        fontSize: 12,
      }}
    >
      {label}
      <input
        type={tipo}
        aria-label={label}
        value={valor}
        onChange={(e) => mudar(e.target.value)}
        min={tipo === 'date' ? '1900-01-01' : '1900-01-01T00:00'}
        max={tipo === 'date' ? '2200-12-31' : '2200-12-31T23:59'}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          minHeight: 48,
          padding: 13,
          fontFamily: 'Inter_400Regular, sans-serif',
          fontSize: 14,
          color: cores.texto,
          background: cores.fundo,
          border: '1px solid ' + cores.borda,
          borderRadius: 9,
          colorScheme: cores.fundo === '#0C211D' ? 'dark' : 'light',
        }}
      />
    </label>
  );
}
