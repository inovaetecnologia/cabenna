import React, { useState } from 'react';
import { Modal, View, TextInput, ScrollView } from 'react-native';
import { X, LockKeyhole } from 'lucide-react-native';
import { supabase, configurado } from '../data/config';
import { Cores } from '../theme/cores';
import { Texto, Botao, IconeBotao } from './ui';
export default function Conta({
  cores,
  onClose,
  recuperacao = false,
}: {
  cores: Cores;
  onClose: () => void;
  recuperacao?: boolean;
}) {
  const [modo, setModo] = useState<'entrar' | 'criar' | 'recuperar' | 'novaSenha'>(
    recuperacao ? 'novaSenha' : 'entrar',
  );
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const executar = async () => {
    if (!supabase) return;
    setErro('');
    setMensagem('');
    setOcupado(true);
    try {
      const redirect = typeof window !== 'undefined' ? window.location.origin : undefined;
      if (modo === 'novaSenha') {
        if (senha.length < 10) throw new Error('Use pelo menos 10 caracteres.');
        const { error } = await supabase.auth.updateUser({ password: senha });
        if (error) throw error;
        setSenha('');
        onClose();
      } else if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });
        if (error) throw error;
        onClose();
      } else if (modo === 'criar') {
        if (senha.length < 10) throw new Error('Use pelo menos 10 caracteres.');
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: { emailRedirectTo: redirect },
        });
        if (error) throw error;
        setMensagem(
          'Se o cadastro puder ser concluído, você receberá um e-mail de confirmação. Confira sua caixa de entrada.',
        );
        setSenha('');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: redirect,
        });
        if (error) throw error;
        setMensagem(
          'Se houver uma conta para esse e-mail, enviaremos as instruções de recuperação.',
        );
      }
    } catch (e) {
      setErro(
        e instanceof Error && e.message === 'Use pelo menos 10 caracteres.'
          ? e.message
          : modo === 'entrar'
            ? 'Não foi possível entrar. Confira e-mail, senha e confirmação do cadastro.'
            : 'Não foi possível concluir. Confira a conexão e tente novamente.',
      );
    } finally {
      setOcupado(false);
    }
  };
  const input = {
    backgroundColor: cores.fundo,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    padding: 14,
    color: cores.texto,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  };
  return (
    <Modal
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!ocupado) onClose();
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: '#031D19AA',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <View
          accessibilityViewIsModal
          style={{
            backgroundColor: cores.painel,
            borderRadius: 20,
            padding: 26,
            width: '100%',
            maxWidth: 470,
            maxHeight: '95%',
            gap: 18,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <LockKeyhole size={28} color={cores.destaque} />
            <IconeBotao
              cores={cores}
              onPress={() => {
                if (!ocupado) onClose();
              }}
              label="Fechar conta"
            >
              <X color={cores.secundario} />
            </IconeBotao>
          </View>
          <ScrollView contentContainerStyle={{ gap: 18 }}>
            <Texto titulo style={{ fontSize: 28, lineHeight: 36, color: cores.texto }}>
              {modo === 'entrar'
                ? 'Seu espaço está aqui.'
                : modo === 'criar'
                  ? 'Comece do seu jeito.'
                  : modo === 'novaSenha'
                    ? 'Escolha sua nova senha.'
                    : 'Recupere seu acesso.'}
            </Texto>
            <Texto style={{ color: cores.secundario }}>Conta pessoal · e-mail e senha</Texto>
            {!configurado ? (
              <View
                style={{ padding: 16, backgroundColor: cores.suave, borderRadius: 10, gap: 10 }}
              >
                <Texto style={{ color: cores.texto }}>
                  O Supabase ainda não foi vinculado a este ambiente.
                </Texto>
                <Texto style={{ color: cores.secundario }}>
                  Por enquanto, explore a avaliação local. Os registros desse modo ficam apenas
                  neste navegador e não são enviados para uma conta.
                </Texto>
              </View>
            ) : (
              <>
                {modo !== 'novaSenha' && (
                  <>
                    <Texto style={{ color: cores.texto }}>E-mail</Texto>
                    <TextInput
                      accessibilityLabel="E-mail"
                      autoCapitalize="none"
                      autoComplete="email"
                      keyboardType="email-address"
                      value={email}
                      onChangeText={setEmail}
                      placeholder="voce@exemplo.com"
                      placeholderTextColor={cores.secundario}
                      style={input}
                    />
                  </>
                )}
                {modo !== 'recuperar' && (
                  <>
                    <Texto style={{ color: cores.texto }}>
                      Senha{' '}
                      {modo === 'criar' || modo === 'novaSenha' ? '· pelo menos 10 caracteres' : ''}
                    </Texto>
                    <TextInput
                      accessibilityLabel="Senha"
                      autoCapitalize="none"
                      autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                      secureTextEntry
                      value={senha}
                      onChangeText={setSenha}
                      style={input}
                      onSubmitEditing={() => void executar()}
                    />
                  </>
                )}
                {erro && (
                  <Texto accessibilityRole="alert" style={{ color: cores.erro }}>
                    {erro}
                  </Texto>
                )}
                {mensagem && (
                  <Texto accessibilityLiveRegion="polite" style={{ color: cores.texto }}>
                    {mensagem}
                  </Texto>
                )}
                <Botao cores={cores} disabled={ocupado} onPress={() => void executar()}>
                  {ocupado
                    ? 'Aguarde…'
                    : modo === 'entrar'
                      ? 'Entrar'
                      : modo === 'criar'
                        ? 'Criar conta'
                        : modo === 'novaSenha'
                          ? 'Salvar nova senha'
                          : 'Enviar instruções'}
                </Botao>
                {modo !== 'novaSenha' && (
                  <View style={{ gap: 8 }}>
                    <Botao
                      cores={cores}
                      secundario
                      onPress={() => {
                        setModo(modo === 'entrar' ? 'criar' : 'entrar');
                        setMensagem('');
                        setErro('');
                      }}
                    >
                      {modo === 'entrar' ? 'Ainda não tenho conta' : 'Já tenho uma conta'}
                    </Botao>
                    {modo === 'entrar' && (
                      <Botao cores={cores} secundario onPress={() => setModo('recuperar')}>
                        Esqueci minha senha
                      </Botao>
                    )}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
