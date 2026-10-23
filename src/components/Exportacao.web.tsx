import React, { useState } from 'react';
import { View } from 'react-native';
import { Item } from '../lib/itens';
import { Cores } from '../theme/cores';
import { Texto, Botao } from './ui';
import { Escolha } from './formulario';
import { conteudoExportacao } from '../lib/exportacao';
export default function Exportacao({
  carregar,
  cores,
}: {
  carregar: () => Promise<Item[]>;
  cores: Cores;
}) {
  const [formato, setFormato] = useState<'json' | 'markdown' | 'csv'>('json');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  return (
    <View style={{ gap: 14 }}>
      <Escolha
        label="Formato do arquivo"
        cores={cores}
        valor={formato}
        mudar={setFormato}
        opcoes={[
          { valor: 'json', nome: 'JSON · dados completos' },
          { valor: 'markdown', nome: 'Markdown · texto' },
          { valor: 'csv', nome: 'CSV · planilha' },
        ]}
      />
      <Texto style={{ color: cores.secundario, fontSize: 12 }}>
        JSON preserva a estrutura dos documentos. Markdown e CSV são versões de leitura. Links
        internos e comentários não são incluídos.
      </Texto>
      <Botao
        cores={cores}
        disabled={ocupado}
        onPress={() => {
          setOcupado(true);
          setErro('');
          void carregar()
            .then((itens) => {
              const blob = new Blob([conteudoExportacao(itens, formato)], {
                type:
                  formato === 'json'
                    ? 'application/json;charset=utf-8'
                    : formato === 'csv'
                      ? 'text/csv;charset=utf-8'
                      : 'text/markdown;charset=utf-8',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download =
                'cabenna-' +
                new Date().toISOString().slice(0, 10) +
                '.' +
                (formato === 'markdown' ? 'md' : formato);
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            })
            .catch((e) => setErro(e.message))
            .finally(() => setOcupado(false));
        }}
      >
        {ocupado ? 'Preparando…' : 'Baixar arquivo'}
      </Botao>
      {!!erro && <Texto style={{ color: cores.erro }}>{erro}</Texto>}
    </View>
  );
}
