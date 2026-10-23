import React from 'react';
import { View } from 'react-native';
import { Autenticacao, useAuth } from '../auth/Autenticacao';
import { Texto, Botao } from '../components/ui';
import { temas } from '../theme/cores';
import Conta from '../components/Conta';
import Acesso from './Acesso';
import AreaTrabalho from './AreaTrabalho';

export type Pagina =
  | 'dia'
  | 'entrada'
  | 'notas'
  | 'documentos'
  | 'tarefas'
  | 'listas'
  | 'agenda'
  | 'favoritos'
  | 'arquivo'
  | 'lixeira'
  | 'equipes'
  | 'planos'
  | 'roteiro';
function Protegido() {
  const auth = useAuth();
  if (auth.estado === 'verificando')
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: temas.claro.fundo,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Texto style={{ color: temas.claro.texto }}>Verificando sua sessão…</Texto>
      </View>
    );
  if (auth.estado === 'erro')
    return (
      <View
        style={{
          flex: 1,
          padding: 30,
          backgroundColor: temas.claro.fundo,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
        }}
      >
        <Texto style={{ color: temas.claro.erro, textAlign: 'center' }}>{auth.erro}</Texto>
        <Botao cores={temas.claro} onPress={() => void auth.verificar()}>
          Verificar novamente
        </Botao>
      </View>
    );
  if (auth.estado !== 'autenticado' || !auth.usuario) return <Acesso />;
  return (
    <>
      <AreaTrabalho key={auth.usuario.id} />
      {auth.recuperacao && (
        <Conta cores={temas.claro} recuperacao onClose={auth.fecharRecuperacao} />
      )}
    </>
  );
}
export default function Cabenna() {
  return (
    <Autenticacao>
      <Protegido />
    </Autenticacao>
  );
}
