import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Item } from '../lib/itens';
import { Versao, Comentario } from '../lib/contextos';
import { Cores } from '../theme/cores';
import { carregarVersoes, carregarComentarios, restaurarVersao, comentar } from '../data/cabenna';
import { Janela, Campo } from './formulario';
import { Texto, Botao } from './ui';
export default function DetalhesRegistro({
  item,
  cores,
  fechar,
  atualizar,
  leitura,
}: {
  item: Item;
  cores: Cores;
  fechar: () => void;
  atualizar: () => void;
  leitura: boolean;
}) {
  const [versoes, setVersoes] = useState<Versao[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [escolhida, setEscolhida] = useState<Versao | null>(null);
  const carregar = async () => {
    try {
      const [v, c] = await Promise.all([carregarVersoes(item.id), carregarComentarios(item.id)]);
      setVersoes(v);
      setComentarios(c);
    } catch (e) {
      setErro((e as Error).message);
    }
  };
  useEffect(() => {
    void carregar();
  }, [item.id]);
  const executar = async (f: () => Promise<unknown>) => {
    setOcupado(true);
    setErro('');
    try {
      await f();
      await carregar();
      atualizar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setOcupado(false);
    }
  };
  return (
    <Janela titulo="Histórico e conversa" subtitulo={item.titulo} cores={cores} fechar={fechar}>
      <Texto titulo style={{ color: cores.texto, fontSize: 18 }}>
        Conversa do registro
      </Texto>
      {comentarios.length ? (
        comentarios.map((c) => (
          <View
            key={c.id}
            style={{ backgroundColor: cores.suave, padding: 14, borderRadius: 9, gap: 5 }}
          >
            <Texto style={{ color: cores.texto }}>{c.texto}</Texto>
            <Texto style={{ color: cores.secundario, fontSize: 10 }}>
              {new Date(c.criado_em).toLocaleString('pt-BR')}
            </Texto>
          </View>
        ))
      ) : (
        <Texto style={{ color: cores.secundario }}>As decisões ficam junto do trabalho.</Texto>
      )}
      {!leitura && (
        <>
          <Campo
            cores={cores}
            label="Seu comentário"
            valor={texto}
            mudar={setTexto}
            multiline
            maxLength={5000}
          />
          <Botao
            cores={cores}
            disabled={ocupado || !texto.trim()}
            onPress={() =>
              void executar(async () => {
                await comentar(item.id, texto);
                setTexto('');
              })
            }
          >
            Comentar
          </Botao>
        </>
      )}
      <Texto titulo style={{ color: cores.texto, fontSize: 18 }}>
        Versões disponíveis no seu plano
      </Texto>
      {versoes.map((v) => (
        <View
          key={v.versao}
          style={{ padding: 14, borderWidth: 1, borderColor: cores.borda, borderRadius: 9, gap: 7 }}
        >
          <Texto style={{ color: cores.texto }}>
            Versão {v.versao} · {new Date(v.criado_em).toLocaleString('pt-BR')}
          </Texto>
          <Texto numberOfLines={2} style={{ color: cores.secundario, fontSize: 12 }}>
            {v.conteudo.titulo} — {v.conteudo.texto}
          </Texto>
          {v.versao !== item.versao && !leitura && (
            <Botao cores={cores} secundario disabled={ocupado} onPress={() => setEscolhida(v)}>
              Examinar versão
            </Botao>
          )}
        </View>
      ))}
      {escolhida && (
        <View style={{ padding: 18, backgroundColor: cores.suave, gap: 12, borderRadius: 10 }}>
          <Texto titulo style={{ color: cores.texto }}>
            Restaurar a versão {escolhida.versao}?
          </Texto>
          <Texto style={{ color: cores.texto }}>
            {escolhida.conteudo.texto || escolhida.conteudo.titulo}
          </Texto>
          <Texto style={{ color: cores.secundario }}>
            A restauração cria uma nova versão e mantém o espaço atual. Não recupera permissões
            antigas.
          </Texto>
          <Botao
            cores={cores}
            disabled={ocupado}
            onPress={() =>
              void executar(async () => {
                await restaurarVersao(item, escolhida.versao);
                setEscolhida(null);
                fechar();
              })
            }
          >
            Restaurar conteúdo
          </Botao>
          <Botao cores={cores} secundario onPress={() => setEscolhida(null)}>
            Cancelar
          </Botao>
        </View>
      )}
      {!!erro && (
        <Texto accessibilityRole="alert" style={{ color: cores.erro }}>
          {erro}
        </Texto>
      )}
    </Janela>
  );
}
