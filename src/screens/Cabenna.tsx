import React, { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  useWindowDimensions,
  Modal,
} from 'react-native';
import {
  Home,
  Inbox,
  FileText,
  CheckSquare,
  ListChecks,
  Search,
  Plus,
  Sun,
  Moon,
  ArrowUpRight,
  ChevronRight,
  Star,
  Archive,
  Trash2,
  LogOut,
  Cloud,
  HardDrive,
  ArrowRight,
  Menu,
  X,
  RefreshCw,
  LockKeyhole,
  CheckCheck,
  Leaf,
} from 'lucide-react-native';
import * as Crypto from 'expo-crypto';
import { Session } from '@supabase/supabase-js';
import { Texto, Botao, IconeBotao } from '../components/ui';
import Editor from '../components/Editor';
import Conta from '../components/Conta';
import { temas } from '../theme/cores';
import { useAvaliacao } from '../store/avaliacao';
import { supabase } from '../data/config';
import { carregarItens, salvarItem, mudarArquivo } from '../data/repositorio';
import { Item, Tipo, Entrada, novoItem, ativos } from '../lib/itens';
import Conteudo from './Conteudo';

export type Pagina =
  | 'dia'
  | 'entrada'
  | 'notas'
  | 'tarefas'
  | 'listas'
  | 'favoritos'
  | 'arquivo'
  | 'lixeira'
  | 'roteiro';
const navegacao = [
  { id: 'dia', nome: 'Meu dia', icone: Home },
  { id: 'entrada', nome: 'Caixa de entrada', icone: Inbox },
  { id: 'notas', nome: 'Notas', icone: FileText },
  { id: 'tarefas', nome: 'Tarefas', icone: CheckSquare },
  { id: 'listas', nome: 'Listas', icone: ListChecks },
  { id: 'favoritos', nome: 'Favoritos', icone: Star },
] as const;
const titulos: Record<Pagina, string> = {
  dia: 'Seu dia, com clareza.',
  entrada: 'Primeiro, guarde. Depois, organize.',
  notas: 'Dê espaço às suas ideias.',
  tarefas: 'Um passo de cada vez.',
  listas: 'O que não pode ficar de fora.',
  favoritos: 'Sempre por perto.',
  arquivo: 'Guardado para depois.',
  lixeira: 'Uma chance de voltar.',
  roteiro: 'O Cabenna está tomando forma.',
};

export default function Cabenna() {
  const parametros = useLocalSearchParams<{ conta?: string }>();
  const { width } = useWindowDimensions();
  const mobile = width < 780;
  const loja = useAvaliacao();
  const cores = temas[loja.tema];
  const [pagina, setPagina] = useState<Pagina>('dia');
  const [busca, setBusca] = useState('');
  const [menu, setMenu] = useState(false);
  const [editor, setEditor] = useState<{ item: Item | null; tipo: Tipo } | null>(null);
  const [conta, setConta] = useState(false);
  useEffect(() => {
    if (parametros.conta === 'entrar') setConta(true);
  }, [parametros.conta]);
  const [recuperacao, setRecuperacao] = useState(false);
  const [sessao, setSessao] = useState<Session | null>(null);
  const [nuvem, setNuvem] = useState<Item[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [acoes, setAcoes] = useState<Item | null>(null);
  const [pronto, setPronto] = useState(false);
  const [bloqueado, setBloqueado] = useState<string | null>(null);
  const contaAtual = useRef<string | null>(null);
  const versaoCarga = useRef(0);

  useEffect(() => {
    const iniciar = () => {
      useAvaliacao.getState().iniciar();
      setPronto(true);
    };
    if (useAvaliacao.persist.hasHydrated()) iniciar();
    else return useAvaliacao.persist.onFinishHydration(iniciar);
  }, []);
  useEffect(() => {
    if (!supabase) return;
    let ativo = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((evento, s) => {
      if (!ativo) return;
      if (contaAtual.current !== (s?.user.id ?? null)) {
        contaAtual.current = s?.user.id ?? null;
        versaoCarga.current++;
        setNuvem([]);
        setErro('');
        setEditor(null);
        setAcoes(null);
      }
      setSessao(s);
      if (evento === 'PASSWORD_RECOVERY') {
        setRecuperacao(true);
        setConta(true);
      }
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (ativo) {
        if (error) setErro('Não foi possível verificar sua sessão.');
        contaAtual.current = data.session?.user.id ?? null;
        setSessao(data.session);
      }
    });
    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, []);
  const atualizar = async () => {
    if (!sessao) return;
    const id = sessao.user.id;
    const carga = ++versaoCarga.current;
    setCarregando(true);
    setErro('');
    try {
      const dados = await carregarItens();
      if (contaAtual.current === id && versaoCarga.current === carga) setNuvem(dados);
    } catch (e) {
      if (contaAtual.current === id && versaoCarga.current === carga)
        setErro(e instanceof Error ? e.message : 'Não foi possível carregar.');
    } finally {
      if (versaoCarga.current === carga) setCarregando(false);
    }
  };
  useEffect(() => {
    void atualizar();
  }, [sessao?.user.id]);
  const itens = sessao ? nuvem : loja.itens;
  const vivos = ativos(itens);
  const pendentes = vivos.filter((i) => i.tipo === 'tarefa' && i.estado !== 'Concluída');
  const navegar = (p: Pagina) => {
    setPagina(p);
    setBusca('');
    setMenu(false);
    setErro('');
  };
  const abrir = (tipo: Tipo = 'nota', item: Item | null = null) => {
    setEditor({ tipo, item });
    setErro('');
  };
  const gravar = async (entrada: Entrada) => {
    const anterior = editor?.item;
    const id = anterior?.id ?? Crypto.randomUUID();
    const usuario = contaAtual.current;
    if (sessao) {
      const item = await salvarItem(id, entrada, anterior?.versao ?? 0);
      if (contaAtual.current !== usuario) return;
      setNuvem((atual) => [item, ...atual.filter((i) => i.id !== id)]);
    } else {
      const item = anterior
        ? {
            ...anterior,
            ...entrada,
            atualizado_em: new Date().toISOString(),
            versao: anterior.versao + 1,
          }
        : novoItem(id, entrada);
      await loja.gravar(item);
    }
    setEditor(null);
    setAviso(sessao ? 'Guardado na sua conta.' : 'Guardado neste navegador.');
  };
  const alterar = async (item: Item, alteracoes: Partial<Entrada>) => {
    if (bloqueado) return;
    setBloqueado(item.id);
    setErro('');
    const usuario = contaAtual.current;
    try {
      const atualizado = { ...item, ...alteracoes };
      if (sessao) {
        const novo = await salvarItem(item.id, atualizado, item.versao);
        if (contaAtual.current === usuario)
          setNuvem((atual) => [novo, ...atual.filter((i) => i.id !== item.id)]);
      } else
        await loja.gravar({
          ...atualizado,
          versao: item.versao + 1,
          atualizado_em: new Date().toISOString(),
        });
      setAviso(sessao ? 'Alteração salva na conta.' : 'Alteração salva neste navegador.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível alterar.');
    } finally {
      setBloqueado(null);
    }
  };
  const organizar = async (
    item: Item,
    acao: 'arquivar' | 'desarquivar' | 'excluir' | 'restaurar',
  ) => {
    setAcoes(null);
    setErro('');
    const usuario = contaAtual.current;
    try {
      if (sessao) {
        const novo = await mudarArquivo(item.id, item.versao, acao);
        if (contaAtual.current === usuario)
          setNuvem((atual) => [novo, ...atual.filter((i) => i.id !== item.id)]);
      } else
        await loja.gravar({
          ...item,
          arquivado: acao === 'arquivar' ? true : acao === 'desarquivar' ? false : item.arquivado,
          excluido_em:
            acao === 'excluir'
              ? new Date().toISOString()
              : acao === 'restaurar'
                ? null
                : item.excluido_em,
          versao: item.versao + 1,
          atualizado_em: new Date().toISOString(),
        });
      setAviso(
        acao === 'excluir'
          ? 'Movido para a lixeira.'
          : acao === 'restaurar'
            ? 'Registro restaurado.'
            : 'Registro atualizado.',
      );
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível organizar.');
    }
  };
  const sair = async () => {
    const { error } = await supabase!.auth.signOut();
    if (error) {
      setErro('Não foi possível encerrar a sessão. Tente novamente.');
      return;
    }
    setNuvem([]);
    setEditor(null);
    setAviso('Sessão encerrada. Você está na avaliação local.');
  };

  const lateral = () => (
    <View
      style={{
        width: mobile ? '100%' : 240,
        backgroundColor: cores.lateral,
        paddingHorizontal: 18,
        paddingTop: mobile ? 20 : 34,
        paddingBottom: 18,
        flex: mobile ? 1 : undefined,
      }}
    >
      <View
        style={{
          paddingHorizontal: 13,
          marginBottom: 32,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Image
          source={require('../../assets/logo-branco.png')}
          style={{ width: 166, height: 47 }}
          resizeMode="contain"
        />
        {mobile && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar menu"
            onPress={() => setMenu(false)}
          >
            <X color="#C4E1C7" />
          </Pressable>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setMenu(false);
          abrir();
        }}
        style={{
          minHeight: 48,
          borderRadius: 10,
          backgroundColor: '#C4E1C7',
          flexDirection: 'row',
          gap: 10,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 30,
        }}
      >
        <Plus size={19} color="#092D25" />
        <Texto style={{ color: '#092D25', fontFamily: 'Inter_600SemiBold' }}>
          Guardar uma ideia
        </Texto>
      </Pressable>
      <ScrollView>
        <Texto
          style={{
            fontSize: 10,
            letterSpacing: 1.6,
            color: '#91B4A4',
            paddingHorizontal: 12,
            marginBottom: 12,
          }}
        >
          SEU ESPAÇO
        </Texto>
        {navegacao.map(({ id, nome, icone: I }) => (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityState={{ selected: pagina === id }}
            onPress={() => navegar(id)}
            style={({ hovered }: any) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              marginBottom: 4,
              minHeight: 46,
              borderRadius: 9,
              paddingHorizontal: 13,
              backgroundColor: pagina === id ? '#214D40' : hovered ? '#153C31' : 'transparent',
            })}
          >
            <I size={19} color={pagina === id ? '#E2F2E1' : '#9FBEAF'} />
            <Texto
              style={{
                color: pagina === id ? '#F2F7EE' : '#AFC7BA',
                flex: 1,
                fontSize: 13,
                fontFamily: pagina === id ? 'Inter_600SemiBold' : 'Inter_400Regular',
              }}
            >
              {nome}
            </Texto>
            {id === 'tarefas' && pendentes.length > 0 && (
              <Texto style={{ fontSize: 11, color: '#C4E1C7' }}>{pendentes.length}</Texto>
            )}
          </Pressable>
        ))}
        <View style={{ height: 1, backgroundColor: '#26483A', marginVertical: 22 }} />
        <Texto
          style={{
            fontSize: 10,
            letterSpacing: 1.6,
            color: '#91B4A4',
            paddingHorizontal: 12,
            marginBottom: 12,
          }}
        >
          ORGANIZAÇÃO
        </Texto>
        {(
          [
            { id: 'arquivo', nome: 'Arquivados', icone: Archive },
            { id: 'lixeira', nome: 'Lixeira', icone: Trash2 },
            { id: 'roteiro', nome: 'Próximos passos', icone: ArrowUpRight },
          ] as const
        ).map(({ id, nome, icone: I }) => (
          <Pressable
            key={id}
            accessibilityRole="button"
            onPress={() => navegar(id)}
            style={{
              minHeight: 44,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingHorizontal: 13,
              backgroundColor: pagina === id ? '#214D40' : 'transparent',
              borderRadius: 8,
            }}
          >
            <I size={17} color="#9FBEAF" />
            <Texto style={{ fontSize: 13, color: '#AFC7BA' }}>{nome}</Texto>
          </Pressable>
        ))}
      </ScrollView>
      <View
        style={{
          marginTop: 25,
          padding: 16,
          borderWidth: 1,
          borderColor: '#345848',
          borderRadius: 12,
          gap: 9,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Leaf size={17} color="#C4E1C7" />
          <Texto titulo style={{ color: '#E7F0E4', fontSize: 13 }}>
            Cabe o que importa.
          </Texto>
        </View>
        <Texto style={{ fontSize: 11, color: '#AFC7BA', lineHeight: 18 }}>
          Um lugar para suas ideias, tarefas e pequenos passos.
        </Texto>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => (sessao ? void sair() : setConta(true))}
        style={{ marginTop: 18, padding: 10, flexDirection: 'row', gap: 10, alignItems: 'center' }}
      >
        <View
          style={{
            backgroundColor: '#335749',
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Texto style={{ color: '#E7F0E4', fontSize: 12 }}>
            {sessao?.user.email?.slice(0, 2).toUpperCase() ?? 'CA'}
          </Texto>
        </View>
        <View style={{ flex: 1 }}>
          <Texto numberOfLines={1} style={{ color: '#E7F0E4', fontSize: 12 }}>
            {sessao?.user.email ?? 'Avaliação local'}
          </Texto>
          <Texto style={{ color: '#9FBEAF', fontSize: 10 }}>
            {sessao ? 'Encerrar sessão' : 'Conectar minha conta'}
          </Texto>
        </View>
        {sessao ? <LogOut size={16} color="#AFC7BA" /> : <ArrowRight size={16} color="#AFC7BA" />}
      </Pressable>
    </View>
  );

  if (!pronto)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: cores.fundo,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Texto style={{ color: cores.texto }}>Preparando seu espaço…</Texto>
      </View>
    );
  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo, flexDirection: 'row' }}>
      {!mobile && lateral()}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            minHeight: 78,
            paddingHorizontal: mobile ? 18 : 38,
            borderBottomWidth: 1,
            borderColor: cores.borda,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: cores.painel,
          }}
        >
          {mobile ? (
            <IconeBotao cores={cores} onPress={() => setMenu(true)} label="Abrir menu">
              <Menu size={22} color={cores.texto} />
            </IconeBotao>
          ) : (
            <View style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}>
              <LockKeyhole size={13} color={cores.secundario} />
              <Texto style={{ fontSize: 12, color: cores.secundario }}>Espaço pessoal</Texto>
              <ChevronRight size={13} color={cores.secundario} />
            </View>
          )}
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 9,
              maxWidth: mobile ? undefined : 340,
              marginLeft: mobile ? 0 : 'auto',
              backgroundColor: cores.fundo,
              borderRadius: 9,
              paddingHorizontal: 12,
              minHeight: 40,
            }}
          >
            <Search size={17} color={cores.secundario} />
            <TextInput
              accessibilityLabel="Buscar nos registros pessoais"
              placeholder={mobile ? 'Buscar…' : 'Buscar no seu espaço'}
              placeholderTextColor={cores.secundario}
              value={busca}
              onChangeText={setBusca}
              style={{
                flex: 1,
                color: cores.texto,
                fontFamily: 'Inter_400Regular',
                fontSize: 12,
                paddingVertical: 10,
              }}
            />
            {!!busca && (
              <Pressable
                accessibilityLabel="Limpar busca"
                accessibilityRole="button"
                onPress={() => setBusca('')}
              >
                <X size={16} color={cores.secundario} />
              </Pressable>
            )}
          </View>
          <IconeBotao
            label={loja.tema === 'claro' ? 'Usar tema escuro' : 'Usar tema claro'}
            onPress={loja.alternarTema}
            cores={cores}
          >
            {loja.tema === 'claro' ? (
              <Moon size={19} color={cores.secundario} />
            ) : (
              <Sun size={19} color={cores.secundario} />
            )}
          </IconeBotao>
          {sessao && (
            <IconeBotao label="Atualizar dados" onPress={() => void atualizar()} cores={cores}>
              <RefreshCw size={17} color={cores.secundario} />
            </IconeBotao>
          )}
        </View>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: mobile ? 20 : 38,
            paddingTop: mobile ? 25 : 34,
            paddingBottom: 50,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ width: '100%', maxWidth: 1250, alignSelf: 'center', gap: 27 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
              {sessao ? (
                <Cloud size={15} color={cores.secundario} />
              ) : (
                <HardDrive size={15} color={cores.secundario} />
              )}
              <Texto style={{ fontSize: 11, color: cores.secundario, flex: 1 }}>
                {sessao
                  ? 'Conta conectada · registros pessoais na nuvem'
                  : 'AVALIAÇÃO LOCAL · dados somente neste navegador · exemplos editáveis'}
              </Texto>
              {!sessao && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setConta(true)}
                  style={{ minHeight: 30, justifyContent: 'center' }}
                >
                  <Texto
                    style={{ fontSize: 11, color: cores.destaque, fontFamily: 'Inter_600SemiBold' }}
                  >
                    Conectar conta ↗
                  </Texto>
                </Pressable>
              )}
            </View>
            <View
              style={{
                flexDirection: mobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: mobile ? 'flex-start' : 'center',
                gap: 16,
              }}
            >
              <View style={{ gap: 9, flex: 1 }}>
                <Texto style={{ color: cores.secundario, fontSize: 11, letterSpacing: 1.4 }}>
                  {new Intl.DateTimeFormat('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })
                    .format(new Date())
                    .toLocaleUpperCase('pt-BR')}
                </Texto>
                <Texto
                  titulo
                  style={{
                    fontFamily: 'Manrope_800ExtraBold',
                    color: cores.texto,
                    fontSize: mobile ? 29 : 36,
                    lineHeight: mobile ? 39 : 49,
                    letterSpacing: -1,
                  }}
                >
                  {busca.trim() ? 'Encontre o que você guardou.' : titulos[pagina]}
                </Texto>
                <Texto style={{ color: cores.secundario, fontSize: 13 }}>
                  {busca.trim()
                    ? `Resultados para “${busca}”`
                    : pagina === 'dia'
                      ? 'Menos na cabeça. Mais espaço para o que importa.'
                      : 'Tudo no seu contexto pessoal, visível apenas para você.'}
                </Texto>
              </View>
              {pagina !== 'dia' && pagina !== 'roteiro' && (
                <Botao
                  cores={cores}
                  onPress={() =>
                    abrir(pagina === 'tarefas' ? 'tarefa' : pagina === 'listas' ? 'lista' : 'nota')
                  }
                  icone={<Plus size={17} color={cores.destaqueTexto} />}
                >
                  Novo registro
                </Botao>
              )}
            </View>
            {erro && (
              <View
                accessibilityRole="alert"
                style={{
                  backgroundColor: cores.suave,
                  borderWidth: 1,
                  borderColor: cores.erro,
                  borderRadius: 10,
                  padding: 15,
                  gap: 8,
                }}
              >
                <Texto style={{ color: cores.erro }}>{erro}</Texto>
                {sessao && (
                  <Botao cores={cores} secundario onPress={() => void atualizar()}>
                    Tentar novamente
                  </Botao>
                )}
              </View>
            )}
            {!!aviso && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: cores.suave,
                }}
              >
                <CheckCheck size={18} color={cores.destaque} />
                <Texto
                  accessibilityLiveRegion="polite"
                  style={{ color: cores.texto, fontSize: 12, flex: 1 }}
                >
                  {aviso}
                </Texto>
                <IconeBotao label="Fechar aviso" onPress={() => setAviso('')} cores={cores}>
                  <X size={15} color={cores.secundario} />
                </IconeBotao>
              </View>
            )}
            {carregando && (
              <Texto accessibilityLiveRegion="polite" style={{ color: cores.secundario }}>
                Carregando seus registros…
              </Texto>
            )}
            <Conteudo
              pagina={pagina}
              busca={busca}
              itens={itens}
              cores={cores}
              mobile={mobile}
              compacto={width < 1120}
              sessao={!!sessao}
              bloqueado={!!bloqueado}
              abrir={abrir}
              navegar={navegar}
              alterar={alterar}
              opcoes={setAcoes}
              limpar={loja.limpar}
            />
            <View
              style={{
                marginTop: 10,
                borderTopWidth: 1,
                borderColor: cores.borda,
                paddingTop: 18,
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <Texto style={{ fontSize: 10, color: cores.secundario }}>
                cabenna · um app Inovae
              </Texto>
              <Texto style={{ fontSize: 10, color: cores.secundario }}>Um passo de cada vez.</Texto>
            </View>
          </View>
        </ScrollView>
      </View>
      {mobile && (
        <Modal visible={menu} animationType="fade" onRequestClose={() => setMenu(false)}>
          {lateral()}
        </Modal>
      )}
      {editor && (
        <Editor
          key={editor.item?.id ?? 'novo'}
          item={editor.item}
          tipo={editor.tipo}
          cores={cores}
          onClose={() => setEditor(null)}
          onSave={gravar}
        />
      )}
      {conta && (
        <Conta
          cores={cores}
          recuperacao={recuperacao}
          onClose={() => {
            setConta(false);
            setRecuperacao(false);
          }}
        />
      )}
      {acoes && (
        <Modal transparent animationType="fade" onRequestClose={() => setAcoes(null)}>
          <View
            style={{
              flex: 1,
              backgroundColor: '#031D19AA',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <View
              accessibilityViewIsModal
              style={{
                backgroundColor: cores.painel,
                padding: 24,
                borderRadius: 18,
                width: '100%',
                maxWidth: 400,
                gap: 12,
              }}
            >
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Texto titulo style={{ flex: 1, fontSize: 18, color: cores.texto }}>
                  {acoes.titulo}
                </Texto>
                <IconeBotao cores={cores} label="Fechar opções" onPress={() => setAcoes(null)}>
                  <X size={20} color={cores.secundario} />
                </IconeBotao>
              </View>
              {acoes.excluido_em ? (
                <Botao cores={cores} onPress={() => void organizar(acoes, 'restaurar')}>
                  Restaurar registro
                </Botao>
              ) : (
                <>
                  <Botao
                    cores={cores}
                    onPress={() => {
                      abrir(acoes.tipo, acoes);
                      setAcoes(null);
                    }}
                  >
                    Editar registro
                  </Botao>
                  <Botao
                    cores={cores}
                    secundario
                    onPress={() => {
                      void alterar(acoes, { favorito: !acoes.favorito });
                      setAcoes(null);
                    }}
                  >
                    {acoes.favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  </Botao>
                  <Botao
                    cores={cores}
                    secundario
                    onPress={() =>
                      void organizar(acoes, acoes.arquivado ? 'desarquivar' : 'arquivar')
                    }
                  >
                    {acoes.arquivado ? 'Retirar do arquivo' : 'Arquivar'}
                  </Botao>
                  <Botao cores={cores} secundario onPress={() => void organizar(acoes, 'excluir')}>
                    Mover para a lixeira
                  </Botao>
                </>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
