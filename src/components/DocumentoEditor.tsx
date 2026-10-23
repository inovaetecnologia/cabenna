import React from 'react';
import { TextInput } from 'react-native';
import { DocumentoJSON } from '../lib/itens';
import { textoDocumento } from '../lib/agenda';
import { Cores } from '../theme/cores';
export default function DocumentoEditor({
  valor,
  mudar,
  cores,
}: {
  valor: DocumentoJSON | null;
  mudar: (json: DocumentoJSON, texto: string) => void;
  cores: Cores;
}) {
  return (
    <TextInput
      accessibilityLabel="Conteúdo do documento"
      multiline
      value={valor ? textoDocumento(valor) : ''}
      onChangeText={(t) =>
        mudar(
          {
            type: 'doc',
            content: [{ type: 'paragraph', content: t ? [{ type: 'text', text: t }] : [] }],
          },
          t,
        )
      }
      style={{
        minHeight: 240,
        padding: 18,
        backgroundColor: cores.fundo,
        color: cores.texto,
        borderWidth: 1,
        borderColor: cores.borda,
        borderRadius: 10,
        textAlignVertical: 'top',
      }}
    />
  );
}
