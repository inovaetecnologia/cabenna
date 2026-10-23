import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { User } from '@supabase/supabase-js';
import { supabase } from '../data/config';

type Auth = {
  usuario: User | null;
  estado: 'verificando' | 'anonimo' | 'autenticado' | 'erro';
  erro: string;
  recuperacao: boolean;
  fecharRecuperacao: () => void;
  verificar: () => Promise<void>;
  sair: () => Promise<void>;
};
const Contexto = createContext<Auth | null>(null);
export function Autenticacao({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [estado, setEstado] = useState<Auth['estado']>('verificando');
  const [erro, setErro] = useState('');
  const [recuperacao, setRecuperacao] = useState(false);
  const seq = useRef(0);
  const ativo = useRef(true);
  const verificar = async () => {
    const atual = ++seq.current;
    if (!supabase) {
      setUsuario(null);
      setEstado('anonimo');
      return;
    }
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!ativo.current || seq.current !== atual) return;
      if (error) {
        if (error.name === 'AuthSessionMissingError') {
          setUsuario(null);
          setEstado('anonimo');
          setErro('');
          return;
        }
        throw error;
      }
      if (!data.user?.email_confirmed_at) {
        setUsuario(null);
        setEstado('anonimo');
        setErro(data.user ? 'Confirme o e-mail para acessar sua conta.' : '');
        return;
      }
      setUsuario(data.user);
      setEstado('autenticado');
      setErro('');
    } catch {
      if (ativo.current && seq.current === atual) {
        setUsuario(null);
        setEstado('erro');
        setErro('Não foi possível verificar sua sessão. Confira a conexão e tente novamente.');
      }
    }
  };
  useEffect(() => {
    ativo.current = true;
    void verificar();
    if (!supabase)
      return () => {
        ativo.current = false;
      };
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === 'SIGNED_OUT') {
        seq.current++;
        setUsuario(null);
        setEstado('anonimo');
        setRecuperacao(false);
        return;
      }
      if (evento === 'PASSWORD_RECOVERY') setRecuperacao(true);
      setTimeout(() => {
        if (ativo.current) void verificar();
      }, 0);
    });
    const listener = AppState.addEventListener('change', (estadoApp) => {
      if (Platform.OS !== 'web') {
        if (estadoApp === 'active') {
          supabase!.auth.startAutoRefresh();
          void verificar();
        } else supabase!.auth.stopAutoRefresh();
      }
    });
    return () => {
      ativo.current = false;
      seq.current++;
      subscription.unsubscribe();
      listener.remove();
    };
  }, []);
  const sair = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error('Não foi possível encerrar a sessão. Tente novamente.');
    setUsuario(null);
    setEstado('anonimo');
  };
  return (
    <Contexto.Provider
      value={{
        usuario,
        estado,
        erro,
        recuperacao,
        fecharRecuperacao: () => setRecuperacao(false),
        verificar,
        sair,
      }}
    >
      {children}
    </Contexto.Provider>
  );
}
export function useAuth() {
  const c = useContext(Contexto);
  if (!c) throw new Error('Autenticacao ausente');
  return c;
}
