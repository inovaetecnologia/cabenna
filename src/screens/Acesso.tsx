import React, { useState } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  Image,
  Pressable,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { ArrowLeft, ArrowRight, Check, LockKeyhole } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase, configurado } from '../data/config';
import { useAuth } from '../auth/Autenticacao';
import { Texto, Botao } from '../components/ui';
import { temas } from '../theme/cores';

export default function Acesso() {
  const parametros = useLocalSearchParams<{ conta?: string; convite?: string }>();
  const { width } = useWindowDimensions();
  const c = temas.claro;
  const auth = useAuth();
  const [modo, setModo] = useState<'entrar' | 'criar' | 'recuperar'>(
    parametros.conta === 'criar' ? 'criar' : 'entrar',
  );
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const executar = async (acao?: 'reenviar') => {
    setErro('');
    setMensagem('');
    if (!supabase) {
      setErro('O ambiente ainda não está conectado ao Supabase.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErro('Informe um e-mail válido.');
      return;
    }
    if (!acao && modo !== 'recuperar' && (modo === 'criar' ? senha.length < 10 : !senha)) {
      setErro(
        modo === 'criar' ? 'Use uma senha com pelo menos 10 caracteres.' : 'Informe sua senha.',
      );
      return;
    }
    setOcupado(true);
    try {
      const redirect = typeof window !== 'undefined' ? window.location.origin + '/app' : undefined;
      if (acao === 'reenviar') {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email.trim(),
          options: { emailRedirectTo: redirect },
        });
        if (error) throw error;
        setMensagem('Se houver confirmação pendente, enviaremos um novo e-mail.');
      } else if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });
        if (error) throw error;
        setSenha('');
        await auth.verificar();
      } else if (modo === 'criar') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: { emailRedirectTo: redirect },
        });
        if (error) throw error;
        setSenha('');
        setMensagem(
          'Confira seu e-mail para confirmar o cadastro. Depois, entre com sua senha. Se recebeu um convite, volte ao link após confirmar.',
        );
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: redirect,
        });
        if (error) throw error;
        setMensagem(
          'Se houver uma conta com esse e-mail, você receberá as instruções para redefinir sua senha.',
        );
      }
    } catch {
      setErro(
        modo === 'entrar'
          ? 'Não foi possível entrar. Confira seu e-mail, senha e confirmação de cadastro.'
          : 'Não foi possível concluir. Confira a conexão e tente novamente em instantes.',
      );
    } finally {
      setOcupado(false);
    }
  };
  const input = {
    backgroundColor: c.painel,
    borderWidth: 1,
    borderColor: c.borda,
    paddingHorizontal: 15,
    minHeight: 52,
    borderRadius: 10,
    color: c.texto,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.fundo, flexDirection: 'row' }}>
      {width >= 1000 && (
        <View
          style={{
            width: '43%',
            backgroundColor: c.lateral,
            padding: 55,
            justifyContent: 'space-between',
          }}
        >
          <Image
            source={require('../../assets/logo-branco.png')}
            resizeMode="contain"
            style={{ width: 190, height: 58, alignSelf: 'flex-start' }}
          />
          <View style={{ gap: 24 }}>
            <Texto style={{ fontSize: 11, letterSpacing: 2, color: '#B9D6BE' }}>
              O SEU DIA COMEÇA AQUI.
            </Texto>
            <Texto
              titulo
              style={{ fontSize: 46, lineHeight: 58, color: '#FAF8F3', letterSpacing: -1.5 }}
            >
              Um lugar para{'\n'}tudo que importa.
            </Texto>
            <Texto style={{ color: '#B4CDBD', fontSize: 16, lineHeight: 29 }}>
              Da primeira ideia ao próximo compromisso. Organize a vida e acompanhe seus projetos
              com clareza.
            </Texto>
            <View style={{ gap: 15, marginTop: 10 }}>
              {[
                'Notas, documentos, tarefas e agenda conectados',
                'Espaço pessoal separado das equipes',
                'Um foco por vez, no seu ritmo',
              ].map((t) => (
                <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                  <Check size={17} color="#C4E1C7" />
                  <Texto style={{ color: '#D5E5D7', fontSize: 12, flex: 1 }}>{t}</Texto>
                </View>
              ))}
            </View>
          </View>
          <Texto style={{ color: '#8FAF9C', fontSize: 11 }}>cabenna · um app Inovae</Texto>
        </View>
      )}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: width < 600 ? 24 : 50,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: '100%', maxWidth: 420, gap: 23 }}>
          <Pressable
            accessibilityRole="link"
            onPress={() => {
              if (Platform.OS === 'web') window.location.assign('/');
            }}
            style={{
              minHeight: 44,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              alignSelf: 'flex-start',
            }}
          >
            <ArrowLeft size={16} color={c.secundario} />
            <Texto style={{ color: c.secundario, fontSize: 12 }}>Voltar para o site</Texto>
          </Pressable>
          {width < 1000 && (
            <Image
              source={require('../../assets/logo-verde.png')}
              resizeMode="contain"
              style={{ width: 175, height: 50, alignSelf: 'flex-start' }}
            />
          )}
          <View style={{ gap: 10 }}>
            <Texto
              titulo
              style={{ fontSize: 32, lineHeight: 43, color: c.texto, letterSpacing: -1 }}
            >
              {modo === 'entrar'
                ? 'Seu espaço está aqui.'
                : modo === 'criar'
                  ? 'Tudo começa com você.'
                  : 'Vamos recuperar seu acesso.'}
            </Texto>
            <Texto style={{ color: c.secundario, fontSize: 14, lineHeight: 24 }}>
              {parametros.convite
                ? 'Entre com o e-mail que recebeu o convite para continuar.'
                : modo === 'entrar'
                  ? 'Entre para encontrar suas ideias e continuar de onde parou.'
                  : modo === 'criar'
                    ? 'Crie sua conta gratuita e dê espaço ao que importa.'
                    : 'Enviaremos um link para você escolher uma nova senha.'}
            </Texto>
          </View>
          {modo !== 'recuperar' && (
            <View
              style={{
                flexDirection: 'row',
                padding: 4,
                backgroundColor: c.suave,
                borderRadius: 11,
              }}
            >
              {(['entrar', 'criar'] as const).map((m) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: modo === m }}
                  disabled={ocupado}
                  key={m}
                  onPress={() => {
                    setModo(m);
                    setErro('');
                    setMensagem('');
                  }}
                  style={{
                    flex: 1,
                    minHeight: 44,
                    backgroundColor: modo === m ? c.painel : 'transparent',
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Texto
                    style={{
                      color: modo === m ? c.texto : c.secundario,
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 13,
                    }}
                  >
                    {m === 'entrar' ? 'Entrar' : 'Criar conta'}
                  </Texto>
                </Pressable>
              ))}
            </View>
          )}
          <View style={{ gap: 8 }}>
            <Texto style={{ color: c.texto, fontSize: 12 }}>Seu e-mail</Texto>
            <TextInput
              accessibilityLabel="Seu e-mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="voce@exemplo.com"
              placeholderTextColor={c.secundario}
              style={input}
            />
          </View>
          {modo !== 'recuperar' && (
            <View style={{ gap: 8 }}>
              <Texto style={{ color: c.texto, fontSize: 12 }}>
                Senha {modo === 'criar' ? '· pelo menos 10 caracteres' : ''}
              </Texto>
              <TextInput
                accessibilityLabel="Sua senha"
                value={senha}
                onChangeText={setSenha}
                autoCapitalize="none"
                autoComplete={modo === 'criar' ? 'new-password' : 'current-password'}
                secureTextEntry
                style={input}
                onSubmitEditing={() => void executar()}
              />
            </View>
          )}
          {(erro || auth.erro) && (
            <Texto accessibilityRole="alert" style={{ color: c.erro, fontSize: 13 }}>
              {erro || auth.erro}
            </Texto>
          )}
          {!!mensagem && (
            <View style={{ padding: 16, backgroundColor: c.suave, borderRadius: 10 }}>
              <Texto
                accessibilityLiveRegion="polite"
                style={{ color: c.texto, fontSize: 13, lineHeight: 24 }}
              >
                {mensagem}
              </Texto>
            </View>
          )}
          {!configurado && (
            <Texto style={{ color: c.erro, fontSize: 12 }}>
              O serviço de contas ainda não está configurado neste ambiente.
            </Texto>
          )}
          <Botao
            cores={c}
            disabled={ocupado || !configurado}
            onPress={() => void executar()}
            icone={<ArrowRight size={17} color="#FFF" />}
          >
            {ocupado
              ? 'Aguarde…'
              : modo === 'entrar'
                ? 'Entrar no meu espaço'
                : modo === 'criar'
                  ? 'Criar minha conta gratuita'
                  : 'Enviar link de recuperação'}
          </Botao>
          <View style={{ gap: 4 }}>
            {modo === 'entrar' && (
              <Pressable
                accessibilityRole="button"
                disabled={ocupado}
                onPress={() => {
                  setModo('recuperar');
                  setErro('');
                  setMensagem('');
                }}
                style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
              >
                <Texto style={{ color: c.destaque, fontSize: 12 }}>Esqueci minha senha</Texto>
              </Pressable>
            )}
            {modo === 'recuperar' ? (
              <Botao cores={c} secundario onPress={() => setModo('entrar')}>
                Voltar para entrar
              </Botao>
            ) : (
              <Pressable
                accessibilityRole="button"
                disabled={ocupado}
                onPress={() => void executar('reenviar')}
                style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
              >
                <Texto style={{ color: c.secundario, fontSize: 11 }}>
                  Reenviar confirmação de e-mail
                </Texto>
              </Pressable>
            )}
          </View>
          <View
            style={{
              borderTopWidth: 1,
              borderColor: c.borda,
              paddingTop: 18,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <LockKeyhole size={14} color={c.secundario} />
            <Texto style={{ color: c.secundario, fontSize: 11, flex: 1 }}>
              O aplicativo requer uma conta. Seus registros pessoais permanecem vinculados a você.
            </Texto>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
