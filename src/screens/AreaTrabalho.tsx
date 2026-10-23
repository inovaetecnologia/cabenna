import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  useWindowDimensions,
  Platform,
  Image,
} from 'react-native';
import {
  Menu,
  Plus,
  Search,
  Sun,
  Moon,
  LogOut,
  Star,
  Check,
  MoreHorizontal,
  ChevronDown,
} from 'lucide-react-native';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../auth/Autenticacao';
import { temas } from '../theme/cores';
import {
  Item,
  Entrada,
  Tipo,
  Estado,
  buscar,
  ativos,
  dataLocal,
  nomeData,
  atrasada,
} from '../lib/itens';
import { Equipe, Espaco, Participante, Plano } from '../lib/contextos';
import * as api from '../data/cabenna';
import { Texto, Botao, IconeBotao, Selo } from '../components/ui';
import { Campo, Escolha, Janela } from '../components/formulario';
import EditorRegistro from '../components/EditorRegistro';
import Agenda from '../components/Agenda';
import Planos from '../components/Planos';
import GestaoEquipe from '../components/GestaoEquipe';
import Exportacao from '../components/Exportacao';
import DetalhesRegistro from '../components/DetalhesRegistro';
import { Pagina } from './Cabenna';

const nomes: Record<Pagina, string> = {
  dia: 'Meu dia',
  entrada: 'Tudo no seu lugar',
  notas: 'Notas',
  documentos: 'Documentos',
  tarefas: 'Tarefas',
  listas: 'Listas',
  agenda: 'Agenda',
  favoritos: 'Favoritos',
  arquivo: 'Arquivo',
  lixeira: 'Lixeira',
  equipes: 'Equipe',
  planos: 'Planos',
  roteiro: 'Novidades',
};
const navegacao: Pagina[] = [
  'dia',
  'entrada',
  'notas',
  'documentos',
  'tarefas',
  'listas',
  'agenda',
  'favoritos',
  'arquivo',
  'lixeira',
  'equipes',
  'planos',
];
export default function AreaTrabalho() {
  const auth = useAuth();
  const usuario = auth.usuario!;
  const { width } = useWindowDimensions();
  const pequeno = width < 850;
  const [escuro, setEscuro] = useState(false);
  const cores = escuro ? temas.escuro : temas.claro;
  const [pagina, setPagina] = useState<Pagina>('dia');
  const [menu, setMenu] = useState(false);
  const [equipeId, setEquipeId] = useState<string | null>(null);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [espacos, setEspacos] = useState<Espaco[]>([]);
  const [espacoId, setEspacoId] = useState<string | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [plano, setPlano] = useState<Plano | null>(null);
  const [busca, setBusca] = useState('');
  const [etiqueta, setEtiqueta] = useState('');
  const [modo, setModo] = useState('lista');
  const [estado, setEstado] = useState('todos');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [contextos, setContextos] = useState(false);
  const [novoEspaco, setNovoEspaco] = useState(false);
  const [novaEquipe, setNovaEquipe] = useState(false);
  const [nome, setNome] = useState('');
  const [restrito, setRestrito] = useState('nao');
  const [ocupado, setOcupado] = useState(false);
  const [editor, setEditor] = useState<{ id: string; item: Item | null; tipo: Tipo } | null>(null);
  const [detalhes, setDetalhes] = useState<Item | null>(null);
  const [acoes, setAcoes] = useState<Item | null>(null);
  const [confirmarSaida, setConfirmarSaida] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [convite, setConvite] = useState(
    Platform.OS === 'web' ? new URLSearchParams(window.location.search).get('convite') : null,
  );
  const sequencia = useRef(0);
  const equipe = equipes.find((e) => e.id === equipeId) ?? null;
  const contexto = equipe?.nome ?? 'Pessoal';
  const espacosAtuais = espacos.filter((e) => (e.equipe_id ?? null) === equipeId);
  const eu = participantes.find((p) => p.usuario_id === usuario.id);
  const leitura = plano?.estado === 'consulta';
  useEffect(() => {
    void AsyncStorage.getItem('cabenna:tema').then((v) => setEscuro(v === 'escuro'));
  }, []);
  const carregar = useCallback(
    async (silencioso = false) => {
      const numero = ++sequencia.current;
      if (!silencioso) setCarregando(true);
      try {
        const c = await api.carregarContextos();
        if (numero !== sequencia.current) return;
        setEquipes(c.equipes);
        setEspacos(c.espacos);
        if (equipeId && !c.equipes.some((e) => e.id === equipeId)) {
          setItens([]);
          setParticipantes([]);
          setPlano(null);
          setEquipeId(null);
          setEspacoId(null);
          setEditor(null);
          setDetalhes(null);
          setAcoes(null);
          setAviso('Seu acesso à equipe mudou. Voltamos ao seu espaço pessoal.');
          return;
        }
        const r = await api.carregarContexto(equipeId);
        if (numero !== sequencia.current) return;
        setItens(r.itens);
        setPlano(r.plano);
        setParticipantes(r.participantes);
        setErro('');
      } catch (e) {
        if (numero === sequencia.current) {
          setErro((e as Error).message);
          setItens([]);
          setPlano(null);
          setParticipantes([]);
          setDetalhes(null);
          setAcoes(null);
        }
      } finally {
        if (numero === sequencia.current) setCarregando(false);
      }
    },
    [equipeId],
  );
  useEffect(() => {
    setItens([]);
    setPlano(null);
    setParticipantes([]);
    void carregar();
    const timer = setInterval(() => void carregar(true), 20000);
    const foco = () => void carregar(true);
    if (Platform.OS === 'web') window.addEventListener('focus', foco);
    return () => {
      ++sequencia.current;
      clearInterval(timer);
      if (Platform.OS === 'web') window.removeEventListener('focus', foco);
    };
  }, [carregar]);
  const trocar = (id: string | null) => {
    setEquipeId(id);
    setEspacoId(null);
    setBusca('');
    setEtiqueta('');
    setPagina('dia');
    setContextos(false);
    setMenu(false);
  };
  const executar = async (f: () => Promise<unknown>) => {
    setOcupado(true);
    setErro('');
    try {
      await f();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setOcupado(false);
    }
  };
  const salvar = async (id: string, entrada: Entrada, versao: number) => {
    const salvo = await api.gravarRegistro(id, entrada, versao, equipeId);
    setItens((ant) => [salvo, ...ant.filter((i) => i.id !== id)]);
    return salvo;
  };
  const abrir = (i: Item) => {
    if (leitura || i.arquivado || i.excluido_em) {
      setAcoes(i);
      return;
    }
    setEditor({ id: i.id, item: i, tipo: i.tipo });
  };
  const novo = (tipo: Tipo = 'nota') => setEditor({ id: Crypto.randomUUID(), item: null, tipo });
  const organizar = (i: Item, acao: string) =>
    void executar(async () => {
      await api.organizarRegistro(i, acao);
      setAcoes(null);
      await carregar(true);
    });
  const alternarTarefa = (i: Item) =>
    void executar(async () => {
      await salvar(
        i.id,
        { ...i, estado: i.estado === 'Concluída' ? 'A fazer' : 'Concluída' },
        i.versao,
      );
      await carregar(true);
    });
  const hoje = dataLocal();
  const visiveis = itens.filter((i) => !espacoId || i.espaco_id === espacoId);
  const base =
    pagina === 'lixeira'
      ? visiveis.filter((i) => i.excluido_em)
      : pagina === 'arquivo'
        ? visiveis.filter((i) => i.arquivado && !i.excluido_em)
        : ativos(visiveis);
  let filtrados = buscar(base, busca).filter(
    (i) => !etiqueta || i.dados?.etiquetas?.includes(etiqueta),
  );
  if (pagina === 'notas') filtrados = filtrados.filter((i) => i.tipo === 'nota');
  if (pagina === 'documentos') filtrados = filtrados.filter((i) => i.tipo === 'documento');
  if (pagina === 'tarefas')
    filtrados = filtrados.filter(
      (i) => i.tipo === 'tarefa' && (estado === 'todos' || i.estado === estado),
    );
  if (pagina === 'listas') filtrados = filtrados.filter((i) => i.tipo === 'lista');
  if (pagina === 'favoritos') filtrados = filtrados.filter((i) => i.favorito);
  const foco = filtrados.filter(
    (i) => i.tipo === 'tarefa' && i.dados?.meu_dia === hoje && i.estado !== 'Concluída',
  );
  const sugestoes = filtrados
    .filter((i) => i.tipo === 'tarefa' && i.estado !== 'Concluída' && i.dados?.meu_dia !== hoje)
    .sort((a, b) => (b.dados?.prioridade ?? 0) - (a.dados?.prioridade ?? 0))
    .slice(0, 5);
  const etiquetas = [...new Set(ativos(visiveis).flatMap((i) => i.dados?.etiquetas ?? []))].sort();
  const cartao = (i: Item) => (
    <View
      key={i.id}
      style={{
        padding: 18,
        backgroundColor: cores.painel,
        borderWidth: 1,
        borderColor: cores.borda,
        borderRadius: 13,
        gap: 10,
        marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        {i.tipo === 'tarefa' && (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel={'Concluir ' + i.titulo}
            accessibilityState={{ checked: i.estado === 'Concluída', disabled: leitura }}
            disabled={leitura || ocupado || !!i.excluido_em || i.arquivado}
            onPress={() => alternarTarefa(i)}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: cores.secundario,
                backgroundColor: i.estado === 'Concluída' ? cores.destaque : 'transparent',
              }}
            >
              {i.estado === 'Concluída' && <Check size={19} color={cores.destaqueTexto} />}
            </View>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Abrir ' + i.titulo}
          onPress={() => abrir(i)}
          style={{ flex: 1, minHeight: 44, justifyContent: 'center' }}
        >
          <Texto
            titulo
            style={{
              fontSize: 16,
              color: cores.texto,
              textDecorationLine:
                i.estado === 'Concluída' && i.tipo === 'tarefa' ? 'line-through' : 'none',
            }}
          >
            {i.titulo}
          </Texto>
        </Pressable>
        {i.favorito && <Star size={15} color={cores.secundario} />}
        <IconeBotao label={'Opções de ' + i.titulo} cores={cores} onPress={() => setAcoes(i)}>
          <MoreHorizontal size={21} color={cores.secundario} />
        </IconeBotao>
      </View>
      {!!i.texto && (
        <Pressable accessibilityRole="button" onPress={() => abrir(i)}>
          <Texto
            numberOfLines={modo === 'cartoes' ? 5 : 2}
            style={{ color: cores.secundario, fontSize: 13 }}
          >
            {i.texto}
          </Texto>
        </Pressable>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
        <Selo cores={cores} texto={i.tipo} />
        {i.tipo === 'tarefa' && <Selo cores={cores} texto={i.estado} />}{' '}
        {!!i.prazo && (
          <Texto style={{ color: atrasada(i) ? cores.erro : cores.secundario, fontSize: 11 }}>
            {nomeData(i.prazo)}
          </Texto>
        )}
        {(i.dados?.prioridade ?? 0) >= 2 && (
          <Selo
            cores={cores}
            texto={i.dados?.prioridade === 3 ? 'Prioridade alta' : 'Prioridade média'}
          />
        )}{' '}
        {(i.dados?.etiquetas ?? []).map((e) => (
          <Selo key={e} cores={cores} texto={'#' + e} />
        ))}
        {!!i.checklist.length && (
          <Texto style={{ color: cores.secundario, fontSize: 11 }}>
            {i.checklist.filter((l) => l.feita).length}/{i.checklist.length} passos
          </Texto>
        )}
      </View>
    </View>
  );
  const lateral = (
    <View
      style={{
        width: pequeno ? '100%' : 240,
        backgroundColor: cores.lateral,
        padding: 22,
        gap: 20,
        flex: pequeno ? 1 : undefined,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Image
          source={require('../../assets/logo-branco.png')}
          resizeMode="contain"
          style={{ width: 150, height: 48 }}
        />
        {pequeno && (
          <Botao cores={cores} secundario onPress={() => setMenu(false)}>
            Fechar
          </Botao>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => setContextos(true)}
        style={{ padding: 13, borderRadius: 10, backgroundColor: '#FFFFFF12', gap: 5 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Texto style={{ color: '#FFFFFF', fontSize: 13 }}>{contexto}</Texto>
          <ChevronDown size={16} color="#C4E1C7" />
        </View>
        <Texto style={{ color: '#B4C8BA', fontSize: 10 }}>
          {plano?.nome ?? 'Carregando'}
          {leitura ? ' · consulta' : ''}
        </Texto>
      </Pressable>
      <ScrollView>
        <View style={{ gap: 3 }}>
          {navegacao.map((p) => (
            <Pressable
              key={p}
              accessibilityRole="button"
              accessibilityState={{ selected: pagina === p }}
              onPress={() => {
                setPagina(p);
                setMenu(false);
              }}
              style={{
                minHeight: 43,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor: pagina === p ? '#C4E1C7' : 'transparent',
              }}
            >
              <Texto
                style={{
                  fontSize: 13,
                  color: pagina === p ? '#092D25' : '#CCDDD0',
                  fontFamily: pagina === p ? 'Inter_600SemiBold' : 'Inter_400Regular',
                }}
              >
                {nomes[p]}
              </Texto>
            </Pressable>
          ))}
        </View>
        <View style={{ gap: 6, marginTop: 24 }}>
          <Texto style={{ color: '#8EAA9B', fontSize: 10, letterSpacing: 1 }}>SEUS ESPAÇOS</Texto>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setEspacoId(null);
              setMenu(false);
            }}
            style={{ paddingVertical: 12 }}
          >
            <Texto style={{ color: !espacoId ? '#C4E1C7' : '#CCDDD0', fontSize: 12 }}>
              Todos os espaços
            </Texto>
          </Pressable>
          {espacosAtuais.map((e) => (
            <Pressable
              key={e.id}
              accessibilityRole="button"
              onPress={() => {
                setEspacoId(e.id);
                setPagina('entrada');
                setMenu(false);
              }}
              style={{ paddingVertical: 10, flexDirection: 'row', gap: 8, alignItems: 'center' }}
            >
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: e.cor }} />
              <Texto style={{ color: espacoId === e.id ? '#C4E1C7' : '#CCDDD0', fontSize: 12 }}>
                {e.nome}
                {e.restrito ? ' · restrito' : ''}
              </Texto>
            </Pressable>
          ))}
          {!leitura && eu?.papel !== 'convidado' && (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setNome('');
                setNovoEspaco(true);
              }}
              style={{ paddingVertical: 12 }}
            >
              <Texto style={{ color: '#C4E1C7', fontSize: 12 }}>+ Novo espaço</Texto>
            </Pressable>
          )}
        </View>
      </ScrollView>
      <View style={{ borderTopWidth: 1, borderColor: '#FFFFFF20', paddingTop: 15, gap: 8 }}>
        {(!equipeId || eu?.papel === 'proprietario') && (
          <Pressable
            accessibilityRole="button"
            onPress={() => setExportando(true)}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Texto style={{ color: '#C4E1C7', fontSize: 12 }}>Exportar contexto</Texto>
          </Pressable>
        )}
        <Texto numberOfLines={1} style={{ fontSize: 10, color: '#A9C2B1' }}>
          {usuario.email}
        </Texto>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <IconeBotao
            label={escuro ? 'Usar tema claro' : 'Usar tema escuro'}
            cores={cores}
            onPress={() => {
              setEscuro(!escuro);
              void AsyncStorage.setItem('cabenna:tema', !escuro ? 'escuro' : 'claro');
            }}
          >
            {escuro ? <Sun size={19} color="#C4E1C7" /> : <Moon size={19} color="#C4E1C7" />}
          </IconeBotao>
          <IconeBotao label="Sair da conta" cores={cores} onPress={() => setConfirmarSaida(true)}>
            <LogOut size={18} color="#C4E1C7" />
          </IconeBotao>
        </View>
      </View>
    </View>
  );
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: cores.fundo }}>
      {!pequeno && lateral}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            paddingHorizontal: pequeno ? 16 : 36,
            paddingVertical: 18,
            borderBottomWidth: 1,
            borderColor: cores.borda,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {pequeno && (
            <IconeBotao label="Abrir navegação" cores={cores} onPress={() => setMenu(true)}>
              <Menu size={22} color={cores.texto} />
            </IconeBotao>
          )}
          <Search size={18} color={cores.secundario} />
          <TextInput
            accessibilityLabel={'Buscar em ' + contexto}
            value={busca}
            onChangeText={(t) => {
              setBusca(t);
              if (['equipes', 'planos'].includes(pagina)) setPagina('entrada');
            }}
            placeholder="Encontre uma ideia, uma tarefa, um plano…"
            placeholderTextColor={cores.secundario}
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 44,
              color: cores.texto,
              fontFamily: 'Inter_400Regular',
              fontSize: 13,
            }}
          />
          {!leitura && plano && (
            <Botao
              cores={cores}
              onPress={() =>
                novo(
                  pagina === 'documentos'
                    ? 'documento'
                    : pagina === 'tarefas'
                      ? 'tarefa'
                      : pagina === 'listas'
                        ? 'lista'
                        : pagina === 'agenda'
                          ? 'evento'
                          : 'nota',
                )
              }
              icone={<Plus size={18} color={cores.destaqueTexto} />}
            >
              {pequeno ? 'Novo' : 'Novo registro'}
            </Botao>
          )}
        </View>
        <ScrollView
          contentContainerStyle={{ padding: pequeno ? 18 : 36, gap: 24, paddingBottom: 90 }}
        >
          <View style={{ gap: 8 }}>
            <Texto style={{ color: cores.secundario, fontSize: 10, letterSpacing: 1 }}>
              {contexto.toLocaleUpperCase('pt-BR')}
              {espacoId ? ' / ' + espacosAtuais.find((e) => e.id === espacoId)?.nome : ''}
            </Texto>
            <Texto
              titulo
              style={{ fontSize: pequeno ? 28 : 36, lineHeight: 46, color: cores.texto }}
            >
              {nomes[pagina]}
              {pagina === 'dia' ? '.' : ''}
            </Texto>
            <Texto style={{ color: cores.secundario }}>
              {pagina === 'dia'
                ? 'Menos coisas na cabeça. Mais espaço para o que importa.'
                : pagina === 'documentos'
                  ? 'Da primeira ideia ao plano completo.'
                  : 'Uma ideia vira ação. Uma ação encontra seu lugar.'}
            </Texto>
          </View>
          {!!convite && (
            <View style={{ padding: 20, backgroundColor: cores.suave, gap: 12, borderRadius: 12 }}>
              <Texto titulo style={{ color: cores.texto }}>
                Você recebeu um convite de equipe.
              </Texto>
              <Texto style={{ color: cores.secundario }}>
                O aceite usa seu e-mail confirmado: {usuario.email}.
              </Texto>
              <Botao
                cores={cores}
                disabled={ocupado}
                onPress={() =>
                  void executar(async () => {
                    const id = await api.aceitarConvite(convite);
                    setConvite(null);
                    if (Platform.OS === 'web') window.history.replaceState(null, '', '/app');
                    trocar(id);
                    await carregar(true);
                  })
                }
              >
                Aceitar convite
              </Botao>
              <Botao cores={cores} secundario onPress={() => setConvite(null)}>
                Agora não
              </Botao>
            </View>
          )}
          {leitura && (
            <Texto style={{ color: cores.erro }}>
              O teste desta equipe terminou. Você pode consultar os registros autorizados. A edição
              está suspensa.
            </Texto>
          )}
          {!!aviso && (
            <Texto accessibilityLiveRegion="polite" style={{ color: cores.texto }}>
              {aviso}
            </Texto>
          )}
          {!!erro && (
            <View
              style={{
                padding: 18,
                borderWidth: 1,
                borderColor: cores.erro,
                borderRadius: 12,
                gap: 12,
              }}
            >
              <Texto accessibilityRole="alert" style={{ color: cores.erro }}>
                {erro}
              </Texto>
              <Botao cores={cores} secundario disabled={ocupado} onPress={() => void carregar()}>
                Atualizar dados
              </Botao>
            </View>
          )}
          {carregando ? (
            <Texto style={{ color: cores.secundario }}>Abrindo seu espaço…</Texto>
          ) : pagina === 'planos' ? (
            <Planos
              plano={plano}
              equipe={!!equipeId}
              cores={cores}
              atualizar={() => void carregar(true)}
              criarEquipe={() => {
                setNome('');
                setNovaEquipe(true);
              }}
            />
          ) : pagina === 'equipes' ? (
            <GestaoEquipe
              equipe={equipe}
              participantes={participantes}
              espacos={espacosAtuais}
              usuario={usuario.id}
              cores={cores}
              atualizar={() => void carregar(true)}
              criar={() => {
                setNome('');
                setNovaEquipe(true);
              }}
            />
          ) : pagina === 'agenda' ? (
            <Agenda itens={filtrados} cores={cores} abrir={abrir} criar={() => novo('evento')} />
          ) : (
            <>
              {!!etiquetas.length && (
                <Escolha
                  label="Filtrar por etiqueta"
                  cores={cores}
                  valor={etiqueta}
                  mudar={setEtiqueta}
                  opcoes={[
                    { valor: '', nome: 'Todas' },
                    ...etiquetas.map((e) => ({ valor: e, nome: '#' + e })),
                  ]}
                />
              )}
              {pagina === 'dia' && !busca ? (
                <>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                    {[
                      { n: foco.length, t: 'no seu foco' },
                      {
                        n: ativos(visiveis).filter((i) => atrasada(i)).length,
                        t: 'tarefas atrasadas',
                      },
                      {
                        n: ativos(visiveis).filter(
                          (i) => i.prazo === hoje && i.estado !== 'Concluída',
                        ).length,
                        t: 'com prazo hoje',
                      },
                    ].map((c) => (
                      <View
                        key={c.t}
                        style={{
                          flex: 1,
                          minWidth: 130,
                          padding: 22,
                          borderRadius: 14,
                          backgroundColor: cores.painel,
                          borderWidth: 1,
                          borderColor: cores.borda,
                          gap: 6,
                        }}
                      >
                        <Texto titulo style={{ fontSize: 30, lineHeight: 40, color: cores.texto }}>
                          {c.n}
                        </Texto>
                        <Texto style={{ fontSize: 11, color: cores.secundario }}>{c.t}</Texto>
                      </View>
                    ))}
                  </View>
                  <Texto titulo style={{ fontSize: 21, color: cores.texto }}>
                    Seu foco hoje
                  </Texto>
                  {foco.length ? (
                    foco.map(cartao)
                  ) : (
                    <View
                      style={{
                        padding: 28,
                        borderRadius: 16,
                        backgroundColor: cores.suave,
                        gap: 9,
                      }}
                    >
                      <Texto titulo style={{ fontSize: 20, color: cores.texto }}>
                        Um dia não precisa carregar tudo.
                      </Texto>
                      <Texto style={{ color: cores.secundario }}>
                        Escolha abaixo as tarefas que merecem sua atenção hoje. Os prazos continuam
                        os mesmos.
                      </Texto>
                      {!itens.length && plano && (
                        <Botao cores={cores} onPress={() => novo('nota')}>
                          Guardar minha primeira ideia
                        </Botao>
                      )}
                    </View>
                  )}
                  <Texto titulo style={{ fontSize: 21, color: cores.texto }}>
                    Traga para hoje
                  </Texto>
                  {sugestoes.length ? (
                    sugestoes.map((i) => (
                      <View key={i.id} style={{ gap: 5 }}>
                        {cartao(i)}
                        {!leitura && (
                          <Botao
                            cores={cores}
                            secundario
                            disabled={ocupado}
                            onPress={() =>
                              void executar(async () => {
                                await api.definirFoco(i.id, hoje);
                                await carregar(true);
                              })
                            }
                          >
                            Adicionar ao Meu Dia
                          </Botao>
                        )}
                      </View>
                    ))
                  ) : (
                    <Texto style={{ color: cores.secundario }}>
                      As próximas tarefas aparecem aqui. Nada é agendado automaticamente.
                    </Texto>
                  )}
                  <Texto titulo style={{ fontSize: 21, color: cores.texto }}>
                    Ideias recentes
                  </Texto>
                  {filtrados
                    .filter((i) => ['nota', 'documento'].includes(i.tipo))
                    .slice(0, 4)
                    .map(cartao)}
                </>
              ) : (
                <>
                  <Escolha
                    label="Visualização dos mesmos registros"
                    cores={cores}
                    valor={modo}
                    mudar={setModo}
                    opcoes={[
                      { valor: 'lista', nome: 'Lista' },
                      { valor: 'cartoes', nome: 'Cartões' },
                      ...(pagina === 'tarefas' ? [{ valor: 'quadro', nome: 'Quadro' }] : []),
                    ]}
                  />
                  {pagina === 'tarefas' && (
                    <Escolha
                      label="Filtrar estado"
                      cores={cores}
                      valor={estado}
                      mudar={setEstado}
                      opcoes={[
                        { valor: 'todos', nome: 'Todos' },
                        ...['A fazer', 'Em andamento', 'Aguardando', 'Concluída'].map((e) => ({
                          valor: e,
                          nome: e,
                        })),
                      ]}
                    />
                  )}
                  {modo === 'quadro' && pagina === 'tarefas' ? (
                    <ScrollView horizontal>
                      <View style={{ flexDirection: 'row', gap: 16 }}>
                        {(['A fazer', 'Em andamento', 'Aguardando', 'Concluída'] as Estado[]).map(
                          (e) => (
                            <View key={e} style={{ width: 270, gap: 12 }}>
                              <Texto titulo style={{ color: cores.texto }}>
                                {e} · {filtrados.filter((i) => i.estado === e).length}
                              </Texto>
                              {filtrados.filter((i) => i.estado === e).map(cartao)}
                            </View>
                          ),
                        )}
                      </View>
                    </ScrollView>
                  ) : modo === 'cartoes' ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
                      {filtrados.map((i) => (
                        <View
                          key={i.id}
                          style={{ width: width < 650 ? '100%' : width < 1200 ? '47%' : '31%' }}
                        >
                          {cartao(i)}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View>{filtrados.map(cartao)}</View>
                  )}
                  {!filtrados.length && (
                    <View
                      style={{
                        padding: 32,
                        backgroundColor: cores.suave,
                        borderRadius: 16,
                        gap: 12,
                      }}
                    >
                      <Texto titulo style={{ color: cores.texto, fontSize: 21 }}>
                        {busca
                          ? 'Ainda não encontrei essa ideia.'
                          : 'Seu próximo começo está aqui.'}
                      </Texto>
                      <Texto style={{ color: cores.secundario }}>
                        {busca
                          ? 'Tente outra palavra ou confira os filtros e o contexto selecionado.'
                          : 'Guarde uma nota, estruture um documento ou transforme uma ideia em tarefa.'}
                      </Texto>
                    </View>
                  )}
                </>
              )}
            </>
          )}
        </ScrollView>
      </View>
      {pequeno && menu && (
        <Janela titulo="Seu Cabenna" cores={cores} fechar={() => setMenu(false)}>
          {lateral}
        </Janela>
      )}
      {contextos && (
        <Janela titulo="Onde vamos trabalhar?" cores={cores} fechar={() => setContextos(false)}>
          <Botao cores={cores} secundario onPress={() => trocar(null)}>
            Pessoal · só você
          </Botao>
          {equipes.map((e) => (
            <Botao key={e.id} cores={cores} secundario onPress={() => trocar(e.id)}>
              {e.nome}
            </Botao>
          ))}
          <Botao
            cores={cores}
            onPress={() => {
              setContextos(false);
              setNome('');
              setNovaEquipe(true);
            }}
          >
            Criar equipe
          </Botao>
        </Janela>
      )}
      {(novoEspaco || novaEquipe) && (
        <Janela
          titulo={novaEquipe ? 'Uma equipe, um novo começo.' : 'Crie seu espaço'}
          cores={cores}
          fechar={() => {
            if (!ocupado) {
              setNovoEspaco(false);
              setNovaEquipe(false);
            }
          }}
        >
          <Campo label="Nome" valor={nome} mudar={setNome} cores={cores} maxLength={80} />
          {novoEspaco && equipeId && (
            <Escolha
              label="Quem pode acessar"
              cores={cores}
              valor={restrito}
              mudar={setRestrito}
              opcoes={[
                { valor: 'nao', nome: 'Equipe · exceto convidados' },
                { valor: 'sim', nome: 'Restrito · acesso explícito' },
              ]}
            />
          )}
          <Texto style={{ color: cores.secundario }}>
            {novaEquipe
              ? 'Teste Equipes por 14 dias, sem cartão. Até 15 participantes. Seus registros pessoais não são compartilhados.'
              : equipeId
                ? 'Gerencie acessos em Equipe depois de criar.'
                : 'Este espaço pertence somente à sua conta.'}
          </Texto>
          <Botao
            cores={cores}
            disabled={ocupado || !nome.trim()}
            onPress={() =>
              void executar(async () => {
                if (novaEquipe) {
                  const id = await api.criarEquipe(nome);
                  setNovaEquipe(false);
                  trocar(id);
                } else {
                  const id = await api.criarEspaco(nome, '#77A88C', equipeId, restrito === 'sim');
                  setNovoEspaco(false);
                  setEspacoId(id);
                  setPagina('entrada');
                  await carregar(true);
                }
              })
            }
          >
            Criar {novaEquipe ? 'equipe' : 'espaço'}
          </Botao>
          {!!erro && <Texto style={{ color: cores.erro }}>{erro}</Texto>}
        </Janela>
      )}
      {editor && (
        <EditorRegistro
          key={editor.id}
          {...editor}
          espacoInicial={espacoId}
          espacos={espacosAtuais}
          participantes={participantes}
          contexto={contexto}
          cores={cores}
          fechar={() => {
            setEditor(null);
            void carregar(true);
          }}
          salvar={salvar}
        />
      )}
      {acoes && (
        <Janela
          titulo={acoes.titulo}
          subtitulo={contexto}
          cores={cores}
          fechar={() => setAcoes(null)}
        >
          <Texto selectable style={{ color: cores.texto }}>
            {acoes.texto}
          </Texto>
          <Botao
            cores={cores}
            secundario
            onPress={() => {
              setDetalhes(acoes);
              setAcoes(null);
            }}
          >
            Histórico e comentários
          </Botao>
          <Exportacao cores={cores} carregar={async () => [acoes]} />
          {!leitura && (
            <>
              {acoes.excluido_em ? (
                <Botao
                  cores={cores}
                  disabled={ocupado}
                  onPress={() => organizar(acoes, 'restaurar')}
                >
                  Restaurar da lixeira
                </Botao>
              ) : (
                <>
                  <Botao
                    cores={cores}
                    secundario
                    disabled={ocupado}
                    onPress={() => organizar(acoes, acoes.arquivado ? 'desarquivar' : 'arquivar')}
                  >
                    {acoes.arquivado ? 'Retirar do arquivo' : 'Arquivar registro'}
                  </Botao>
                  <Botao
                    cores={cores}
                    secundario
                    disabled={ocupado}
                    onPress={() => organizar(acoes, 'excluir')}
                  >
                    Mover para a lixeira
                  </Botao>
                </>
              )}
            </>
          )}
          {!!erro && <Texto style={{ color: cores.erro }}>{erro}</Texto>}
        </Janela>
      )}
      {detalhes && (
        <DetalhesRegistro
          item={itens.find((i) => i.id === detalhes.id) ?? detalhes}
          cores={cores}
          fechar={() => setDetalhes(null)}
          atualizar={() => void carregar(true)}
          leitura={leitura}
        />
      )}
      {exportando && (
        <Janela
          titulo="Leve seus registros com você"
          subtitulo={contexto}
          cores={cores}
          fechar={() => setExportando(false)}
        >
          <Texto style={{ color: cores.secundario }}>
            Inclui os registros que você pode consultar neste contexto, inclusive arquivo e lixeira.
            Espaços sem sua permissão permanecem de fora.
          </Texto>
          <Exportacao cores={cores} carregar={() => api.exportarContexto(equipeId)} />
        </Janela>
      )}
      {confirmarSaida && (
        <Janela titulo="Sair da conta?" cores={cores} fechar={() => setConfirmarSaida(false)}>
          <Texto style={{ color: cores.secundario }}>
            Os registros salvos continuam na sua conta. Você precisará entrar novamente para acessar
            o app.
          </Texto>
          <Botao cores={cores} onPress={() => void executar(() => auth.sair())}>
            Sair
          </Botao>
          <Botao cores={cores} secundario onPress={() => setConfirmarSaida(false)}>
            Continuar aqui
          </Botao>
          {!!erro && <Texto style={{ color: cores.erro }}>{erro}</Texto>}
        </Janela>
      )}
    </View>
  );
}
