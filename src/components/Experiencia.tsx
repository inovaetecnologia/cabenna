import React, { useState } from 'react';
import { View, ScrollView, Pressable, TextInput, Image, useWindowDimensions } from 'react-native';
import {
  Sun,
  CalendarDays,
  Layers3,
  Plus,
  ArrowUpRight,
  ArrowLeft,
  Check,
  MoreHorizontal,
  Search,
  Settings2,
  ChevronDown,
  Target,
  FileText,
  CheckSquare,
  ListChecks,
  StickyNote,
  LockKeyhole,
  ArrowRight,
  ChevronRight,
  Heart,
  FolderOpen,
} from 'lucide-react-native';
import { Texto, Botao, IconeBotao } from './ui';
import { Cores } from '../theme/cores';
import { Item, Tipo, DadosItem, ativos, buscar, dataLocal, nomeData } from '../lib/itens';
import { Espaco, Plano } from '../lib/contextos';
import { resumoObjetivo, saudacao } from '../lib/experiencia';
import { estaNaAgenda, horarioLocal, fusoDoDispositivo } from '../lib/agenda';
import Agenda from './Agenda';
export type InicioRegistro = {
  dia?: string;
  hora?: string;
  objetivo?: boolean;
  objetivo_id?: string;
  objetivo_nome?: string;
  espaco_id?: string | null;
};
export type ExperienciaProps = {
  nome: string;
  email: string;
  contexto: string;
  equipe: boolean;
  itens: Item[];
  espacos: Espaco[];
  plano: Plano | null;
  cores: Cores;
  escuro: boolean;
  carregando: boolean;
  erro: string;
  aviso: string;
  onAtualizar: () => void;
  onContexto: () => void;
  onConta: () => void;
  onTema: () => void;
  onNovo: (tipo: Tipo, inicio?: InicioRegistro) => void;
  onAbrir: (item: Item) => void;
  onConcluir: (item: Item) => void;
  onFoco: (item: Item, dia: string | null) => void;
  onAcao: (item: Item) => void;
  onCapturar: (texto: string) => Promise<void>;
};
type Destino = 'hoje' | 'calendario' | 'espaco';
type Colecao = 'planos' | 'anotacoes' | 'acoes';
const atalhos = [
  { tipo: 'nota' as Tipo, nome: 'Uma ideia', Icone: StickyNote },
  { tipo: 'tarefa' as Tipo, nome: 'Uma tarefa', Icone: CheckSquare },
  { tipo: 'lista' as Tipo, nome: 'Uma lista', Icone: ListChecks },
  { tipo: 'documento' as Tipo, nome: 'Um documento', Icone: FileText },
];
export default function Experiencia(p: ExperienciaProps) {
  const { cores: c, itens } = p;
  const { width } = useWindowDimensions();
  const mobile = width < 800;
  const [d, setD] = useState<Destino>('hoje');
  const [colecao, setColecao] = useState<Colecao>('planos');
  const [espaco, setEspaco] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [busca, setBusca] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [falhaCaptura, setFalhaCaptura] = useState('');
  const [escolhendoFoco, setEscolhendoFoco] = useState(false);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('todos');
  const [modoAcoes, setModoAcoes] = useState('lista');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const leitura = p.plano?.estado === 'consulta';
  const hoje = dataLocal();
  const fuso = fusoDoDispositivo();
  const disponiveis = ativos(itens);
  const atuais = disponiveis.filter((i) => !espaco || i.espaco_id === espaco);
  const objetivos = atuais.filter((i) => i.dados?.objetivo);
  const plano = disponiveis.find((i) => i.id === selecionado && i.dados?.objetivo);
  const foco = atuais.filter(
    (i) => i.tipo === 'tarefa' && i.dados?.meu_dia === hoje && i.estado !== 'Concluída',
  );
  const sugestoes = atuais
    .filter((i) => i.tipo === 'tarefa' && i.estado !== 'Concluída' && i.dados?.meu_dia !== hoje)
    .sort((a, b) => (b.dados?.prioridade ?? 0) - (a.dados?.prioridade ?? 0))
    .slice(0, 6);
  const agenda = atuais
    .filter((i) => estaNaAgenda(i, hoje, fuso) && (i.tipo !== 'tarefa' || i.estado !== 'Concluída'))
    .sort((a, b) =>
      (a.dados?.inicio ?? a.dados?.bloco_inicio ?? '').localeCompare(
        b.dados?.inicio ?? b.dados?.bloco_inicio ?? '',
      ),
    );
  const prontos = atuais.filter(
    (i) => i.tipo === 'tarefa' && i.dados?.meu_dia === hoje && i.estado === 'Concluída',
  ).length;
  const navegar = (destino: Destino) => {
    setD(destino);
    setSelecionado(null);
    setBusca('');
  };
  const criarPlano = () => p.onNovo('documento', { objetivo: true, espaco_id: espaco });
  const novo = (tipo: Tipo) => p.onNovo(tipo, { espaco_id: espaco });
  const cor = (i: Item) =>
    i.tipo === 'tarefa' ? '#B5684D' : i.tipo === 'lista' ? '#8B7B4F' : c.destaque;
  const icone = (i: Item) =>
    i.tipo === 'nota'
      ? StickyNote
      : i.tipo === 'documento'
        ? FileText
        : i.tipo === 'tarefa'
          ? CheckSquare
          : i.tipo === 'lista'
            ? ListChecks
            : CalendarDays;
  const barra = (percentual: number) => (
    <View style={{ height: 5, backgroundColor: c.suave, borderRadius: 3, overflow: 'hidden' }}>
      <View
        style={{ height: 5, width: `${percentual}%`, borderRadius: 3, backgroundColor: c.destaque }}
      />
    </View>
  );
  const linha = (i: Item) => {
    const Icone = icone(i);
    return (
      <View
        key={i.id}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderBottomWidth: 1,
          borderColor: c.borda,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {i.tipo === 'tarefa' ? (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: i.estado === 'Concluída' }}
            aria-checked={i.estado === 'Concluída'}
            accessibilityLabel={'Concluir ' + i.titulo}
            disabled={leitura || !!i.excluido_em || i.arquivado}
            onPress={() => p.onConcluir(i)}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
          >
            <View
              style={{
                width: 21,
                height: 21,
                borderRadius: 7,
                borderWidth: 1.5,
                borderColor: i.estado === 'Concluída' ? c.destaque : c.borda,
                backgroundColor: i.estado === 'Concluída' ? c.destaque : 'transparent',
              }}
            >
              {i.estado === 'Concluída' && <Check size={18} color={c.destaqueTexto} />}
            </View>
          </Pressable>
        ) : (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: c.suave,
            }}
          >
            <Icone size={18} color={cor(i)} />
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Abrir ' + i.titulo}
          onPress={() => p.onAbrir(i)}
          style={{ flex: 1, minHeight: 44, justifyContent: 'center', gap: 4 }}
        >
          <Texto
            style={{
              fontSize: 13,
              color: c.texto,
              fontFamily: 'Inter_600SemiBold',
              textDecorationLine:
                i.tipo === 'tarefa' && i.estado === 'Concluída' ? 'line-through' : 'none',
            }}
          >
            {i.titulo}
          </Texto>
          <Texto numberOfLines={1} style={{ fontSize: 10, color: c.secundario }}>
            {[
              i.prazo ? nomeData(i.prazo) : i.tipo === 'tarefa' ? i.estado : i.tipo,
              i.dados?.objetivo_id
                ? disponiveis.find((g) => g.id === i.dados?.objetivo_id)?.titulo
                : undefined,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Texto>
        </Pressable>
        <IconeBotao cores={c} label={'Opções de ' + i.titulo} onPress={() => p.onAcao(i)}>
          <MoreHorizontal size={18} color={c.secundario} />
        </IconeBotao>
      </View>
    );
  };
  const cartaoPlano = (g: Item, compacto = false) => {
    const r = resumoObjetivo(g, itens);
    return (
      <Pressable
        key={g.id}
        accessibilityRole="button"
        onPress={() => {
          setD('espaco');
          setColecao('planos');
          setSelecionado(g.id);
        }}
        style={{
          padding: compacto ? 17 : 24,
          borderWidth: 1,
          borderColor: c.borda,
          borderRadius: compacto ? 15 : 21,
          backgroundColor: c.painel,
          gap: compacto ? 12 : 20,
          flex: compacto ? undefined : 1,
          minWidth: compacto ? undefined : mobile ? 250 : 240,
        }}
      >
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <View style={{ padding: 10, borderRadius: 12, backgroundColor: c.suave }}>
            <Target size={18} color={c.destaque} />
          </View>
          <ArrowUpRight size={16} color={c.secundario} />
        </View>
        <View style={{ gap: 7 }}>
          <Texto titulo style={{ fontSize: compacto ? 14 : 20, color: c.texto }}>
            {g.titulo}
          </Texto>
          {!compacto && (
            <Texto numberOfLines={2} style={{ fontSize: 12, color: c.secundario, lineHeight: 21 }}>
              {g.dados?.objetivo?.resultado}
            </Texto>
          )}
        </View>
        <View style={{ gap: 9 }}>
          {barra(r.percentual)}
          <Texto style={{ fontSize: 10, color: c.secundario }}>
            {r.total
              ? `${r.concluidas} de ${r.total} passos concluídos`
              : 'Pronto para o primeiro passo'}
            {g.dados?.objetivo?.data_alvo ? ' · ' + nomeData(g.dados.objetivo.data_alvo) : ''}
          </Texto>
        </View>
      </Pressable>
    );
  };
  const vazio = (titulo: string, descricao: string, acao?: string, onPress?: () => void) => (
    <View
      style={{
        padding: mobile ? 24 : 32,
        borderRadius: 19,
        backgroundColor: c.suave,
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <View style={{ padding: 10, backgroundColor: c.painel, borderRadius: 12 }}>
        <FolderOpen size={21} color={c.destaque} />
      </View>
      <Texto titulo style={{ fontSize: 20, lineHeight: 29, color: c.texto }}>
        {titulo}
      </Texto>
      <Texto style={{ color: c.secundario, fontSize: 12, lineHeight: 22, maxWidth: 430 }}>
        {descricao}
      </Texto>
      {acao && onPress && !leitura && (
        <Botao cores={c} secundario onPress={onPress}>
          {acao} ↗
        </Botao>
      )}
    </View>
  );
  const tituloSecao = (texto: string, acao?: string, funcao?: () => void) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 4,
      }}
    >
      <Texto titulo style={{ fontSize: 18, lineHeight: 28, color: c.texto }}>
        {texto}
      </Texto>
      {acao && funcao && (
        <Pressable
          accessibilityRole="button"
          onPress={funcao}
          style={{ minHeight: 40, justifyContent: 'center' }}
        >
          <Texto style={{ fontSize: 11, color: c.destaque, fontFamily: 'Inter_600SemiBold' }}>
            {acao}
          </Texto>
        </Pressable>
      )}
    </View>
  );
  const destinos = [
    { id: 'hoje' as Destino, n: 'Hoje', I: Sun },
    { id: 'calendario' as Destino, n: 'Calendário', I: CalendarDays },
    { id: 'espaco' as Destino, n: 'Meu espaço', I: Layers3 },
  ];
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: c.fundo }}>
      {!mobile && (
        <View
          style={{
            width: 218,
            padding: 23,
            backgroundColor: c.painel,
            borderRightWidth: 1,
            borderColor: c.borda,
            gap: 29,
          }}
        >
          <Image
            source={
              p.escuro
                ? require('../../assets/logo-branco.png')
                : require('../../assets/logo-verde.png')
            }
            resizeMode="contain"
            style={{ width: 148, height: 45, alignSelf: 'flex-start' }}
          />
          <Pressable
            accessibilityRole="button"
            onPress={p.onContexto}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingVertical: 13,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: c.borda,
            }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 9,
                backgroundColor: c.suave,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Texto titulo style={{ fontSize: 11, color: c.texto }}>
                {p.contexto.slice(0, 1)}
              </Texto>
            </View>
            <View style={{ flex: 1 }}>
              <Texto
                numberOfLines={1}
                style={{ fontSize: 12, color: c.texto, fontFamily: 'Inter_600SemiBold' }}
              >
                {p.contexto}
              </Texto>
              <Texto style={{ fontSize: 9, color: c.secundario }}>
                {p.equipe ? 'Espaço compartilhado' : 'Só você'}
              </Texto>
            </View>
            <ChevronDown size={13} color={c.secundario} />
          </Pressable>
          <View style={{ gap: 8 }}>
            {destinos.map((v) => (
              <Pressable
                key={v.id}
                accessibilityRole="button"
                accessibilityState={{ selected: d === v.id }}
                aria-pressed={d === v.id}
                onPress={() => navegar(v.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 13,
                  padding: 14,
                  minHeight: 49,
                  borderRadius: 13,
                  backgroundColor: d === v.id ? c.suave : 'transparent',
                }}
              >
                <v.I size={19} color={d === v.id ? c.destaque : c.secundario} />
                <Texto
                  style={{
                    color: d === v.id ? c.destaque : c.secundario,
                    fontSize: 13,
                    fontFamily: d === v.id ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  }}
                >
                  {v.n}
                </Texto>
              </Pressable>
            ))}
          </View>
          <View style={{ gap: 12, flex: 1 }}>
            <Texto style={{ fontSize: 9, letterSpacing: 1.8, color: c.secundario }}>
              SEUS CANTINHOS
            </Texto>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setEspaco(null);
                navegar('espaco');
              }}
              style={{ paddingVertical: 10 }}
            >
              <Texto style={{ fontSize: 11, color: !espaco ? c.destaque : c.secundario }}>
                Tudo que é seu
              </Texto>
            </Pressable>
            {p.espacos.slice(0, 5).map((e) => (
              <Pressable
                key={e.id}
                accessibilityRole="button"
                onPress={() => {
                  setEspaco(e.id);
                  navegar('espaco');
                }}
                style={{ flexDirection: 'row', gap: 9, alignItems: 'center', minHeight: 35 }}
              >
                <View style={{ width: 7, height: 7, borderRadius: 3, backgroundColor: e.cor }} />
                <Texto
                  numberOfLines={1}
                  style={{
                    fontSize: 11,
                    color: espaco === e.id ? c.destaque : c.secundario,
                    flex: 1,
                  }}
                >
                  {e.nome}
                </Texto>
                {e.restrito && <LockKeyhole size={10} color={c.secundario} />}
              </Pressable>
            ))}
          </View>
          <View style={{ gap: 10, paddingTop: 17, borderTopWidth: 1, borderColor: c.borda }}>
            {p.plano?.master && (
              <View
                style={{
                  alignSelf: 'flex-start',
                  paddingVertical: 4,
                  paddingHorizontal: 9,
                  borderRadius: 6,
                  backgroundColor: c.suave,
                }}
              >
                <Texto style={{ fontSize: 9, color: c.destaque, fontFamily: 'Inter_600SemiBold' }}>
                  MASTER INOVAE · PERMANENTE
                </Texto>
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={p.onConta}
              style={{ flexDirection: 'row', gap: 10, alignItems: 'center', minHeight: 44 }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#DBBFA1',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Texto style={{ fontSize: 12, color: '#4B3725' }}>
                  {p.nome.slice(0, 1).toUpperCase()}
                </Texto>
              </View>
              <View style={{ flex: 1 }}>
                <Texto numberOfLines={1} style={{ fontSize: 11, color: c.texto }}>
                  {p.nome}
                </Texto>
                <Texto style={{ fontSize: 9, color: c.secundario }}>Conta e preferências</Texto>
              </View>
              <Settings2 size={16} color={c.secundario} />
            </Pressable>
          </View>
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            paddingHorizontal: mobile ? 20 : 34,
            paddingVertical: mobile ? 12 : 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderBottomWidth: 1,
            borderColor: c.borda,
          }}
        >
          {mobile ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Trocar contexto"
              onPress={p.onContexto}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 }}
            >
              <View style={{ gap: 1 }}>
                <Image
                  source={
                    p.escuro
                      ? require('../../assets/logo-branco.png')
                      : require('../../assets/logo-verde.png')
                  }
                  resizeMode="contain"
                  style={{ width: 102, height: 35 }}
                />
                <Texto
                  numberOfLines={1}
                  style={{ fontSize: 9, lineHeight: 14, color: c.secundario, maxWidth: 135 }}
                >
                  {p.equipe ? p.contexto : 'Pessoal · só você'}
                </Texto>
              </View>
              <ChevronDown size={13} color={c.secundario} />
            </Pressable>
          ) : (
            <Texto style={{ flex: 1, fontSize: 11, color: c.secundario }}>
              {p.contexto} <Texto style={{ fontSize: 11, color: c.borda }}> / </Texto>{' '}
              {destinos.find((x) => x.id === d)?.n}
            </Texto>
          )}
          {buscando ? (
            <TextInput
              autoFocus
              accessibilityLabel="Buscar em todo o contexto"
              value={busca}
              onChangeText={(v) => {
                setBusca(v);
                setD('espaco');
                setSelecionado(null);
              }}
              placeholder="O que você guardou?"
              placeholderTextColor={c.secundario}
              style={{
                width: mobile ? 130 : 280,
                padding: 10,
                minHeight: 42,
                borderRadius: 10,
                color: c.texto,
                backgroundColor: c.suave,
                fontFamily: 'Inter_400Regular',
                fontSize: 12,
              }}
            />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Buscar no meu contexto"
              onPress={() => setBuscando(true)}
              style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 9 }}
            >
              <Search size={17} color={c.secundario} />
              {!mobile && <Texto style={{ fontSize: 11, color: c.secundario }}>Buscar algo</Texto>}
            </Pressable>
          )}
          <IconeBotao
            cores={c}
            label={
              mobile ? 'Conta e preferências' : p.escuro ? 'Usar tema claro' : 'Usar tema escuro'
            }
            onPress={mobile ? p.onConta : p.onTema}
          >
            {mobile ? (
              <Settings2 size={18} color={c.secundario} />
            ) : (
              <Sun size={18} color={c.secundario} />
            )}
          </IconeBotao>
        </View>
        <ScrollView
          contentContainerStyle={{
            padding: mobile ? 20 : 34,
            gap: 26,
            paddingBottom: mobile ? 105 : 45,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {!!p.erro && (
            <View
              style={{
                padding: 18,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: c.erro,
                gap: 10,
              }}
            >
              <Texto accessibilityRole="alert" style={{ color: c.erro }}>
                {p.erro}
              </Texto>
              <Botao cores={c} secundario onPress={p.onAtualizar}>
                Tentar novamente
              </Botao>
            </View>
          )}
          {!!p.aviso && (
            <Texto accessibilityLiveRegion="polite" style={{ fontSize: 12, color: c.destaque }}>
              {p.aviso}
            </Texto>
          )}
          {leitura && (
            <Texto style={{ color: c.erro, fontSize: 12 }}>
              Este contexto está em consulta. Seus registros continuam disponíveis.
            </Texto>
          )}
          {d === 'hoje' ? (
            <>
              <View style={{ gap: 8 }}>
                <Texto style={{ fontSize: 10, color: c.secundario, letterSpacing: 1.3 }}>
                  {new Date()
                    .toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
                    .toUpperCase()}
                </Texto>
                <Texto
                  titulo
                  style={{
                    fontSize: mobile ? 29 : 38,
                    lineHeight: mobile ? 42 : 52,
                    color: c.texto,
                    letterSpacing: -1.2,
                  }}
                >
                  {saudacao()}, {p.nome.split(' ')[0]}
                  <Texto titulo style={{ color: '#BA7352', fontSize: mobile ? 29 : 38 }}>
                    .
                  </Texto>
                </Texto>
                <Texto style={{ color: c.secundario, fontSize: 13 }}>
                  Vamos dar espaço ao que importa para você?
                </Texto>
              </View>
              {!leitura && (
                <View
                  style={{
                    padding: mobile ? 16 : 20,
                    borderWidth: 1,
                    borderColor: c.borda,
                    borderRadius: 19,
                    backgroundColor: c.painel,
                    gap: 14,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 11,
                        backgroundColor: c.suave,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Plus size={18} color={c.destaque} />
                    </View>
                    <TextInput
                      accessibilityLabel="Capturar uma ideia"
                      value={texto}
                      onChangeText={setTexto}
                      onSubmitEditing={() => {
                        if (!texto.trim() || guardando || !p.plano) return;
                        setGuardando(true);
                        setFalhaCaptura('');
                        void p
                          .onCapturar(texto)
                          .then(() => setTexto(''))
                          .catch((e) => setFalhaCaptura(e.message))
                          .finally(() => setGuardando(false));
                      }}
                      placeholder="O que está passando pela sua cabeça?"
                      placeholderTextColor={c.secundario}
                      maxLength={200}
                      style={{
                        flex: 1,
                        minHeight: 44,
                        minWidth: 0,
                        color: c.texto,
                        fontFamily: 'Inter_400Regular',
                        fontSize: mobile ? 12 : 14,
                      }}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Guardar ideia"
                      disabled={!texto.trim() || guardando || !p.plano}
                      onPress={() => {
                        setGuardando(true);
                        setFalhaCaptura('');
                        void p
                          .onCapturar(texto)
                          .then(() => setTexto(''))
                          .catch((e) => setFalhaCaptura(e.message))
                          .finally(() => setGuardando(false));
                      }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: c.destaque,
                        opacity: texto.trim() ? 1 : 0.4,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ArrowRight size={18} color={c.destaqueTexto} />
                    </Pressable>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 8,
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderColor: c.borda,
                    }}
                  >
                    {atalhos.slice(0, 3).map((a) => (
                      <Pressable
                        key={a.tipo}
                        accessibilityRole="button"
                        onPress={() => novo(a.tipo)}
                        style={{
                          flexDirection: 'row',
                          gap: 6,
                          alignItems: 'center',
                          paddingHorizontal: 10,
                          minHeight: 35,
                          borderRadius: 8,
                          backgroundColor: c.suave,
                        }}
                      >
                        <a.Icone size={13} color={c.secundario} />
                        <Texto style={{ fontSize: 10, color: c.secundario }}>{a.nome}</Texto>
                      </Pressable>
                    ))}
                    <Pressable
                      accessibilityRole="button"
                      onPress={criarPlano}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 10,
                        minHeight: 35,
                        gap: 6,
                      }}
                    >
                      <Target size={13} color={c.destaque} />
                      <Texto style={{ fontSize: 10, color: c.destaque }}>Um plano maior</Texto>
                    </Pressable>
                  </View>
                  {!!falhaCaptura && (
                    <Texto accessibilityRole="alert" style={{ color: c.erro, fontSize: 12 }}>
                      {falhaCaptura}
                    </Texto>
                  )}
                </View>
              )}
              <View
                style={{
                  flexDirection: width < 1120 ? 'column' : 'row',
                  gap: 26,
                  alignItems: 'stretch',
                }}
              >
                <View style={{ flex: 1, gap: 22 }}>
                  <View
                    style={{
                      padding: mobile ? 22 : 28,
                      borderRadius: 22,
                      backgroundColor: p.escuro ? c.painel : '#EAF0E5',
                      gap: 20,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <View style={{ flex: 1, gap: 7 }}>
                        <Texto style={{ fontSize: 9, letterSpacing: 1.5, color: c.secundario }}>
                          UM PASSO DE CADA VEZ
                        </Texto>
                        <Texto titulo style={{ fontSize: 25, lineHeight: 36, color: c.texto }}>
                          Seu foco tem lugar aqui.
                        </Texto>
                        <Texto
                          style={{
                            fontSize: 12,
                            lineHeight: 21,
                            color: c.secundario,
                            maxWidth: 340,
                          }}
                        >
                          Você escolhe o que cabe em hoje. O restante continua guardado, sem pressa.
                        </Texto>
                      </View>
                      <Sun size={35} strokeWidth={1} color="#AE8057" />
                    </View>
                    {tituloSecao('Meu foco de hoje', !leitura ? 'Escolher foco' : undefined, () =>
                      setEscolhendoFoco(!escolhendoFoco),
                    )}
                    {foco.length ? (
                      <View
                        style={{ backgroundColor: c.painel, borderRadius: 13, overflow: 'hidden' }}
                      >
                        {foco.map(linha)}
                      </View>
                    ) : (
                      <View
                        style={{
                          padding: 18,
                          borderRadius: 13,
                          borderWidth: 1,
                          borderColor: c.borda,
                          backgroundColor: c.painel,
                          gap: 6,
                        }}
                      >
                        <Texto style={{ color: c.texto, fontSize: 13 }}>
                          Escolha uma coisa para começar.
                        </Texto>
                        <Texto style={{ color: c.secundario, fontSize: 11, lineHeight: 19 }}>
                          Uma tarefa simples já pode abrir caminho.
                        </Texto>
                      </View>
                    )}
                    {escolhendoFoco && (
                      <View style={{ gap: 9 }}>
                        {sugestoes.length ? (
                          sugestoes.map((i) => (
                            <Pressable
                              key={i.id}
                              accessibilityRole="button"
                              onPress={() => {
                                p.onFoco(i, hoje);
                                setEscolhendoFoco(false);
                              }}
                              style={{
                                flexDirection: 'row',
                                gap: 10,
                                alignItems: 'center',
                                padding: 14,
                                backgroundColor: c.painel,
                                borderRadius: 10,
                              }}
                            >
                              <Plus size={15} color={c.destaque} />
                              <Texto style={{ fontSize: 12, color: c.texto, flex: 1 }}>
                                {i.titulo}
                              </Texto>
                            </Pressable>
                          ))
                        ) : (
                          <Botao cores={c} secundario onPress={() => novo('tarefa')}>
                            Criar minha primeira tarefa
                          </Botao>
                        )}
                      </View>
                    )}
                    {prontos > 0 && (
                      <Texto style={{ fontSize: 11, color: c.destaque }}>
                        {prontos} {prontos === 1 ? 'passo concluído' : 'passos concluídos'} hoje.
                        Cada um conta.
                      </Texto>
                    )}
                  </View>
                  <View style={{ gap: 12 }}>
                    {tituloSecao('Ideias para continuar', 'Ver meu espaço', () => {
                      setD('espaco');
                      setColecao('anotacoes');
                    })}
                    {atuais.filter(
                      (i) => ['nota', 'documento'].includes(i.tipo) && !i.dados?.objetivo,
                    ).length ? (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                        {atuais
                          .filter(
                            (i) => ['nota', 'documento'].includes(i.tipo) && !i.dados?.objetivo,
                          )
                          .slice(0, 3)
                          .map((i) => (
                            <Pressable
                              key={i.id}
                              accessibilityRole="button"
                              onPress={() => p.onAbrir(i)}
                              style={{
                                flex: 1,
                                minWidth: mobile ? 250 : 190,
                                padding: 20,
                                borderRadius: 16,
                                backgroundColor: c.painel,
                                borderWidth: 1,
                                borderColor: c.borda,
                                gap: 13,
                              }}
                            >
                              <StickyNote size={17} color="#AA7A4A" />
                              <Texto titulo style={{ fontSize: 14, color: c.texto }}>
                                {i.titulo}
                              </Texto>
                              <Texto
                                numberOfLines={3}
                                style={{ fontSize: 11, lineHeight: 20, color: c.secundario }}
                              >
                                {i.texto || 'Sua próxima ideia pode começar aqui.'}
                              </Texto>
                            </Pressable>
                          ))}
                      </View>
                    ) : (
                      vazio(
                        'Sua cabeça não precisa guardar tudo.',
                        'Uma ideia, uma lembrança ou um começo de projeto. Anote agora; encontre quando precisar.',
                        'Anotar uma ideia',
                        () => novo('nota'),
                      )
                    )}
                  </View>
                </View>
                <View style={{ width: width < 1120 ? '100%' : 290, gap: 24 }}>
                  <View
                    style={{
                      padding: 23,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: c.borda,
                      backgroundColor: c.painel,
                      gap: 15,
                    }}
                  >
                    {tituloSecao('Seu dia, à vista', 'Abrir calendário', () => setD('calendario'))}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingBottom: 14,
                        borderBottomWidth: 1,
                        borderColor: c.borda,
                      }}
                    >
                      {Array.from({ length: 5 }, (_, n) => {
                        const dt = new Date();
                        dt.setDate(dt.getDate() + n - 2);
                        const h = dataLocal(dt) === hoje;
                        return (
                          <View
                            key={n}
                            style={{
                              gap: 5,
                              alignItems: 'center',
                              padding: 8,
                              borderRadius: 11,
                              backgroundColor: h ? c.destaque : 'transparent',
                            }}
                          >
                            <Texto
                              style={{ fontSize: 9, color: h ? c.destaqueTexto : c.secundario }}
                            >
                              {dt.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}
                            </Texto>
                            <Texto
                              titulo
                              style={{ fontSize: 16, color: h ? c.destaqueTexto : c.texto }}
                            >
                              {dt.getDate()}
                            </Texto>
                          </View>
                        );
                      })}
                    </View>
                    {agenda.length ? (
                      agenda.slice(0, 4).map((i) => (
                        <Pressable
                          key={i.id}
                          accessibilityRole="button"
                          onPress={() => p.onAbrir(i)}
                          style={{
                            paddingLeft: 13,
                            borderLeftWidth: 2,
                            borderColor: cor(i),
                            gap: 5,
                            paddingVertical: 5,
                          }}
                        >
                          <Texto style={{ fontSize: 9, color: c.secundario }}>
                            {i.dados?.dia_inteiro
                              ? 'DIA INTEIRO'
                              : (i.tipo === 'evento' ? i.dados?.inicio : i.dados?.bloco_inicio)
                                ? horarioLocal(
                                    (i.tipo === 'evento'
                                      ? i.dados?.inicio
                                      : i.dados?.bloco_inicio)!,
                                    fuso,
                                  ).slice(11)
                                : 'PRAZO HOJE'}
                          </Texto>
                          <Texto
                            style={{
                              fontSize: 12,
                              color: c.texto,
                              fontFamily: 'Inter_600SemiBold',
                            }}
                          >
                            {i.titulo}
                          </Texto>
                        </Pressable>
                      ))
                    ) : (
                      <View style={{ gap: 7, paddingVertical: 10 }}>
                        <CalendarDays size={22} color={c.secundario} />
                        <Texto style={{ fontSize: 12, color: c.texto }}>
                          Seu tempo também merece cuidado.
                        </Texto>
                        <Texto style={{ fontSize: 11, lineHeight: 20, color: c.secundario }}>
                          Reserve um momento para fazer acontecer.
                        </Texto>
                      </View>
                    )}
                    {!leitura && (
                      <Botao
                        cores={c}
                        secundario
                        onPress={() => p.onNovo('evento', { dia: hoje, hora: '09:00' })}
                      >
                        Reservar um horário
                      </Botao>
                    )}
                  </View>
                  <View style={{ gap: 13 }}>
                    {tituloSecao('O que você quer fazer acontecer?')}
                    {objetivos.length
                      ? objetivos.slice(0, 2).map((g) => cartaoPlano(g, true))
                      : vazio(
                          'Um plano começa pequeno.',
                          'Dê nome a um objetivo. Depois, escolha o primeiro passo.',
                          'Criar um plano',
                          criarPlano,
                        )}
                  </View>
                </View>
              </View>
            </>
          ) : d === 'calendario' ? (
            <Agenda
              itens={atuais}
              cores={c}
              leitura={leitura}
              abrir={p.onAbrir}
              criar={(dia, hora) => p.onNovo('evento', { dia, hora, espaco_id: espaco })}
            />
          ) : (
            <>
              {plano ? (
                <>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setSelecionado(null)}
                    style={{ flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 44 }}
                  >
                    <ArrowLeft size={15} color={c.secundario} />
                    <Texto style={{ fontSize: 12, color: c.secundario }}>Meus planos</Texto>
                  </Pressable>
                  <View
                    style={{
                      padding: mobile ? 23 : 32,
                      borderRadius: 23,
                      backgroundColor: c.suave,
                      gap: 17,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Target size={28} color={c.destaque} />
                      <IconeBotao cores={c} label="Opções do plano" onPress={() => p.onAcao(plano)}>
                        <MoreHorizontal size={20} color={c.secundario} />
                      </IconeBotao>
                    </View>
                    <Texto titulo style={{ fontSize: 30, lineHeight: 42, color: c.texto }}>
                      {plano.titulo}
                    </Texto>
                    <Texto style={{ fontSize: 14, lineHeight: 25, color: c.secundario }}>
                      {plano.dados?.objetivo?.resultado}
                    </Texto>
                    {barra(resumoObjetivo(plano, itens).percentual)}
                    <Texto style={{ fontSize: 11, color: c.secundario }}>
                      {resumoObjetivo(plano, itens).total
                        ? `${resumoObjetivo(plano, itens).percentual}% dos passos concluídos`
                        : 'Escolha seu primeiro passo'}
                      {plano.dados?.objetivo?.data_alvo
                        ? ' · Até ' + nomeData(plano.dados.objetivo.data_alvo)
                        : ''}
                    </Texto>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      <Botao cores={c} secundario onPress={() => p.onAbrir(plano)}>
                        Abrir meu planejamento
                      </Botao>
                      {!leitura && (
                        <Botao
                          cores={c}
                          onPress={() =>
                            p.onNovo('tarefa', {
                              objetivo_id: plano.id,
                              objetivo_nome: plano.titulo,
                              espaco_id: plano.espaco_id,
                            })
                          }
                        >
                          Adicionar próximo passo
                        </Botao>
                      )}
                    </View>
                  </View>
                  <View style={{ gap: 12 }}>
                    {tituloSecao('O caminho, um passo de cada vez')}
                    {resumoObjetivo(plano, itens).tarefas.length ? (
                      <View
                        style={{ backgroundColor: c.painel, borderRadius: 16, overflow: 'hidden' }}
                      >
                        {resumoObjetivo(plano, itens).tarefas.map(linha)}
                      </View>
                    ) : (
                      vazio(
                        'Qual é o primeiro passo?',
                        'Divida seu objetivo em ações pequenas. Cada tarefa pode ter seu próprio prazo e horário.',
                      )
                    )}
                  </View>
                  <View style={{ gap: 12 }}>
                    {tituloSecao('Referências e ideias', 'Adicionar nota', () =>
                      p.onNovo('nota', {
                        objetivo_id: plano.id,
                        objetivo_nome: plano.titulo,
                        espaco_id: plano.espaco_id,
                      }),
                    )}
                    {atuais
                      .filter((i) => i.dados?.objetivo_id === plano.id && i.tipo !== 'tarefa')
                      .map(linha)}
                  </View>
                </>
              ) : (
                <>
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      alignItems: 'flex-start',
                      gap: 15,
                    }}
                  >
                    <View style={{ flex: 1, gap: 8 }}>
                      <Texto
                        titulo
                        style={{
                          fontSize: mobile ? 30 : 36,
                          lineHeight: 46,
                          color: c.texto,
                          letterSpacing: -1,
                        }}
                      >
                        Tudo que tem a ver com você.
                      </Texto>
                      <Texto style={{ fontSize: 12, color: c.secundario }}>
                        Planos, ideias e próximos passos. Cada coisa encontra seu lugar.
                      </Texto>
                    </View>
                    {!leitura && (
                      <Botao
                        cores={c}
                        onPress={
                          colecao === 'planos'
                            ? criarPlano
                            : () => novo(colecao === 'acoes' ? 'tarefa' : 'nota')
                        }
                        icone={<Plus size={17} color={c.destaqueTexto} />}
                      >
                        {colecao === 'planos'
                          ? 'Criar plano'
                          : colecao === 'acoes'
                            ? 'Nova tarefa'
                            : 'Nova anotação'}
                      </Botao>
                    )}
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 10,
                      alignItems: 'center',
                      borderBottomWidth: 1,
                      borderColor: c.borda,
                    }}
                  >
                    {[
                      { id: 'planos' as Colecao, n: 'Planos e objetivos' },
                      { id: 'anotacoes' as Colecao, n: 'Anotações' },
                      { id: 'acoes' as Colecao, n: 'Tarefas e listas' },
                    ].map((v) => (
                      <Pressable
                        key={v.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: colecao === v.id }}
                        aria-pressed={colecao === v.id}
                        onPress={() => {
                          setColecao(v.id);
                          setFiltro('todos');
                        }}
                        style={{
                          paddingHorizontal: mobile ? 4 : 15,
                          paddingVertical: 15,
                          minHeight: 49,
                          borderBottomWidth: 2,
                          borderColor: colecao === v.id ? c.destaque : 'transparent',
                        }}
                      >
                        <Texto
                          style={{
                            fontSize: mobile ? 11 : 13,
                            color: colecao === v.id ? c.destaque : c.secundario,
                            fontFamily: colecao === v.id ? 'Inter_600SemiBold' : 'Inter_400Regular',
                          }}
                        >
                          {v.n}
                        </Texto>
                      </Pressable>
                    ))}
                    <View style={{ flex: 1 }} />
                    <IconeBotao
                      cores={c}
                      label="Filtros e organização"
                      onPress={() => setMostrarFiltros(!mostrarFiltros)}
                    >
                      <Settings2 size={17} color={c.secundario} />
                    </IconeBotao>
                  </View>
                  {colecao !== 'planos' && !leitura && (
                    <View style={{ flexDirection: 'row', gap: 9, alignItems: 'center' }}>
                      <Botao
                        cores={c}
                        secundario
                        onPress={() => novo(colecao === 'anotacoes' ? 'documento' : 'lista')}
                      >
                        {colecao === 'anotacoes' ? 'Escrever um documento' : 'Criar uma lista'}
                      </Botao>
                      {colecao === 'acoes' && (
                        <View style={{ flexDirection: 'row', gap: 6, marginLeft: 'auto' }}>
                          {['lista', 'quadro'].map((m) => (
                            <Pressable
                              key={m}
                              accessibilityRole="button"
                              aria-pressed={modoAcoes === m}
                              onPress={() => setModoAcoes(m)}
                              style={{
                                padding: 10,
                                minHeight: 44,
                                borderRadius: 8,
                                backgroundColor: modoAcoes === m ? c.suave : 'transparent',
                              }}
                            >
                              <Texto
                                style={{
                                  fontSize: 11,
                                  color: c.texto,
                                  textTransform: 'capitalize',
                                }}
                              >
                                {m}
                              </Texto>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                  {mostrarFiltros && (
                    <View
                      style={{ gap: 12, padding: 17, backgroundColor: c.suave, borderRadius: 13 }}
                    >
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {['todos', 'favoritos', 'arquivo', 'lixeira'].map((f) => (
                          <Pressable
                            key={f}
                            accessibilityRole="button"
                            accessibilityState={{ selected: filtro === f }}
                            aria-pressed={filtro === f}
                            onPress={() => setFiltro(f)}
                            style={{
                              padding: 11,
                              borderRadius: 8,
                              backgroundColor: filtro === f ? c.painel : 'transparent',
                            }}
                          >
                            <Texto
                              style={{ fontSize: 11, color: c.texto, textTransform: 'capitalize' }}
                            >
                              {f === 'todos' ? 'Ativos' : f}
                            </Texto>
                          </Pressable>
                        ))}
                      </View>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setEspaco(null)}
                          style={{ padding: 10 }}
                        >
                          <Texto style={{ fontSize: 11, color: c.texto }}>Todos os cantinhos</Texto>
                        </Pressable>
                        {p.espacos.map((e) => (
                          <Pressable
                            key={e.id}
                            accessibilityRole="button"
                            onPress={() => setEspaco(e.id)}
                            style={{
                              padding: 10,
                              borderRadius: 8,
                              backgroundColor: espaco === e.id ? c.painel : 'transparent',
                            }}
                          >
                            <Texto style={{ fontSize: 11, color: c.texto }}>{e.nome}</Texto>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}
                  {!!busca && (
                    <Texto style={{ fontSize: 12, color: c.secundario }}>
                      Resultados em {p.contexto} para “{busca}” · todos os formatos
                    </Texto>
                  )}
                  {espaco && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setEspaco(null)}
                      style={{
                        alignSelf: 'flex-start',
                        padding: 10,
                        backgroundColor: c.suave,
                        borderRadius: 9,
                      }}
                    >
                      <Texto style={{ fontSize: 11, color: c.destaque }}>
                        Cantinho: {p.espacos.find((e) => e.id === espaco)?.nome} · limpar filtro ×
                      </Texto>
                    </Pressable>
                  )}
                  {(() => {
                    let registros =
                      filtro === 'lixeira'
                        ? itens.filter((i) => i.excluido_em)
                        : filtro === 'arquivo'
                          ? itens.filter((i) => i.arquivado && !i.excluido_em)
                          : atuais;
                    registros = registros.filter(
                      (i) =>
                        (!espaco || i.espaco_id === espaco) &&
                        (filtro !== 'favoritos' || i.favorito),
                    );
                    if (busca) registros = buscar(registros, busca);
                    else if (filtro === 'todos')
                      registros = registros.filter((i) =>
                        colecao === 'planos'
                          ? i.dados?.objetivo
                          : colecao === 'anotacoes'
                            ? ['nota', 'documento'].includes(i.tipo) && !i.dados?.objetivo
                            : ['tarefa', 'lista'].includes(i.tipo),
                      );
                    if (p.carregando)
                      return <Texto style={{ color: c.secundario }}>Abrindo seu espaço…</Texto>;
                    if (!registros.length && !p.erro)
                      return vazio(
                        busca
                          ? 'Ainda não encontrei essa ideia.'
                          : colecao === 'planos'
                            ? 'Dê um lugar ao que você sonha.'
                            : colecao === 'anotacoes'
                              ? 'Uma ideia pode mudar o dia.'
                              : 'Grandes coisas começam em passos pequenos.',
                        busca
                          ? 'Tente outra palavra ou limpe os filtros.'
                          : 'Comece com o que importa agora. Você organiza o restante no caminho.',
                        busca
                          ? undefined
                          : colecao === 'planos'
                            ? 'Criar meu primeiro plano'
                            : 'Guardar meu primeiro registro',
                        busca
                          ? undefined
                          : colecao === 'planos'
                            ? criarPlano
                            : () => novo(colecao === 'acoes' ? 'tarefa' : 'nota'),
                      );
                    if (colecao === 'planos' && !busca && filtro === 'todos')
                      return (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 17 }}>
                          {registros.map((g) => cartaoPlano(g))}
                        </View>
                      );
                    if (
                      colecao === 'acoes' &&
                      modoAcoes === 'quadro' &&
                      !busca &&
                      filtro === 'todos'
                    )
                      return (
                        <View style={{ gap: 20 }}>
                          <ScrollView horizontal>
                            <View style={{ flexDirection: 'row', gap: 14 }}>
                              {['A fazer', 'Em andamento', 'Aguardando', 'Concluída'].map((e) => (
                                <View key={e} style={{ width: 260, gap: 12 }}>
                                  <Texto titulo style={{ color: c.texto, fontSize: 14 }}>
                                    {e}
                                  </Texto>
                                  <View
                                    style={{
                                      backgroundColor: c.painel,
                                      borderRadius: 12,
                                      overflow: 'hidden',
                                    }}
                                  >
                                    {registros
                                      .filter((i) => i.tipo === 'tarefa' && i.estado === e)
                                      .map(linha)}
                                  </View>
                                </View>
                              ))}
                            </View>
                          </ScrollView>
                          {registros.some((i) => i.tipo === 'lista') && (
                            <View style={{ gap: 10 }}>
                              <Texto titulo style={{ color: c.texto, fontSize: 16 }}>
                                Suas listas
                              </Texto>
                              {registros.filter((i) => i.tipo === 'lista').map(linha)}
                            </View>
                          )}
                        </View>
                      );
                    return (
                      <View
                        style={{
                          borderWidth: 1,
                          borderColor: c.borda,
                          borderRadius: 16,
                          overflow: 'hidden',
                          backgroundColor: c.painel,
                        }}
                      >
                        {registros.map(linha)}
                      </View>
                    );
                  })()}
                </>
              )}
            </>
          )}
          {p.carregando && d === 'hoje' && (
            <Texto style={{ fontSize: 11, color: c.secundario }}>Atualizando seus registros…</Texto>
          )}
        </ScrollView>
        {mobile && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              paddingTop: 9,
              paddingBottom: 17,
              paddingHorizontal: 14,
              backgroundColor: c.painel,
              borderTopWidth: 1,
              borderColor: c.borda,
              flexDirection: 'row',
              gap: 10,
            }}
          >
            {destinos.map((v) => (
              <Pressable
                key={v.id}
                accessibilityRole="button"
                accessibilityState={{ selected: d === v.id }}
                aria-pressed={d === v.id}
                onPress={() => navegar(v.id)}
                style={{
                  flex: 1,
                  gap: 4,
                  alignItems: 'center',
                  paddingVertical: 7,
                  borderRadius: 12,
                  backgroundColor: d === v.id ? c.suave : 'transparent',
                }}
              >
                <v.I size={20} color={d === v.id ? c.destaque : c.secundario} />
                <Texto style={{ fontSize: 9, color: d === v.id ? c.destaque : c.secundario }}>
                  {v.n}
                </Texto>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
