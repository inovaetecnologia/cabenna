import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, TextInput, Platform } from 'react-native';
import { Check, Plus, Trash2, Star } from 'lucide-react-native';
import * as Crypto from 'expo-crypto';
import {
  Item,
  Entrada,
  Tipo,
  Estado,
  Linha,
  DadosItem,
  DocumentoJSON,
  validarEntrada,
  dataLocal,
} from '../lib/itens';
import { Espaco, Participante } from '../lib/contextos';
import {
  fusoDoDispositivo,
  horarioLocal,
  instanteDoHorarioLocal,
  textoDocumento,
} from '../lib/agenda';
import { modelos } from '../lib/modelos';
import { Cores } from '../theme/cores';
import { Texto, Botao, IconeBotao } from './ui';
import { Campo, Escolha, Janela } from './formulario';
import DocumentoEditor from './DocumentoEditor';
import CampoData from './CampoData';

type Props = {
  id: string;
  item: Item | null;
  tipo: Tipo;
  espacoInicial: string | null;
  espacos: Espaco[];
  participantes: Participante[];
  contexto: string;
  cores: Cores;
  fechar: () => void;
  salvar: (id: string, dados: Entrada, versao: number) => Promise<Item>;
};
export default function EditorRegistro({
  id,
  item,
  tipo,
  espacoInicial,
  espacos,
  participantes,
  contexto,
  cores,
  fechar,
  salvar,
}: Props) {
  const [atual, setAtual] = useState<Tipo>(item?.tipo ?? tipo);
  const [titulo, setTitulo] = useState(item?.titulo ?? '');
  const [texto, setTexto] = useState(item?.texto ?? '');
  const [prazo, setPrazo] = useState(item?.prazo ?? '');
  const [estado, setEstado] = useState<Estado>(item?.estado ?? 'A fazer');
  const [checklist, setChecklist] = useState<Linha[]>(item?.checklist ?? []);
  const [novaLinha, setNovaLinha] = useState('');
  const [favorito, setFavorito] = useState(item?.favorito ?? false);
  const [espaco, setEspaco] = useState(item?.espaco_id ?? espacoInicial ?? '');
  const [etiquetas, setEtiquetas] = useState((item?.dados?.etiquetas ?? []).join(', '));
  const [prioridade, setPrioridade] = useState(String(item?.dados?.prioridade ?? 0));
  const [meuDia, setMeuDia] = useState(item?.dados?.meu_dia ?? null);
  const [responsavel, setResponsavel] = useState(item?.dados?.responsavel_id ?? '');
  const [recorrencia, setRecorrencia] = useState<DadosItem['recorrencia']>(
    item?.dados?.recorrencia ?? 'nenhuma',
  );
  const [fuso, setFuso] = useState(item?.dados?.fuso ?? fusoDoDispositivo());
  const [inicio, setInicio] = useState(
    item?.dados?.inicio ? horarioLocal(item.dados.inicio, fuso) : dataLocal() + 'T09:00',
  );
  const [fim, setFim] = useState(
    item?.dados?.fim ? horarioLocal(item.dados.fim, fuso) : dataLocal() + 'T10:00',
  );
  const [diaInteiro, setDiaInteiro] = useState(item?.dados?.dia_inteiro ?? false);
  const [dataInicio, setDataInicio] = useState(item?.dados?.data_inicio ?? dataLocal());
  const [dataFim, setDataFim] = useState(item?.dados?.data_fim ?? dataLocal());
  const [local, setLocal] = useState(item?.dados?.local ?? '');
  const [reservar, setReservar] = useState(!!item?.dados?.bloco_inicio);
  const [blocoInicio, setBlocoInicio] = useState(
    item?.dados?.bloco_inicio
      ? horarioLocal(item.dados.bloco_inicio, fuso)
      : dataLocal() + 'T09:00',
  );
  const [blocoFim, setBlocoFim] = useState(
    item?.dados?.bloco_fim ? horarioLocal(item.dados.bloco_fim, fuso) : dataLocal() + 'T10:00',
  );
  const [documento, setDocumento] = useState<DocumentoJSON | null>(
    item?.dados?.documento ??
      (item?.texto
        ? {
            type: 'doc',
            content: item.texto
              .split('\n')
              .map((t) => ({ type: 'paragraph', content: t ? [{ type: 'text', text: t }] : [] })),
          }
        : null),
  );
  const [editorSeed, setEditorSeed] = useState(0);
  const [modeloPendente, setModeloPendente] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [situacao, setSituacao] = useState(item ? 'Salvo' : 'Ainda não salvo');
  const [confirmar, setConfirmar] = useState(false);
  const versao = useRef(item?.versao ?? 0);
  const salvandoRef = useRef(false);
  const montado = useRef(true);
  const assinatura = JSON.stringify({
    atual,
    titulo,
    texto,
    prazo,
    estado,
    checklist,
    favorito,
    espaco,
    etiquetas,
    prioridade,
    meuDia,
    responsavel,
    recorrencia,
    fuso,
    inicio,
    fim,
    diaInteiro,
    dataInicio,
    dataFim,
    local,
    reservar,
    blocoInicio,
    blocoFim,
    documento,
  });
  const ultimoSalvo = useRef(item ? assinatura : '');
  const [revisao, setRevisao] = useState(0);
  const temAlteracao = assinatura !== ultimoSalvo.current;
  const assinaturaAtual = useRef(assinatura);
  assinaturaAtual.current = assinatura;
  const obterEntrada = (): Entrada => {
    const d: DadosItem = {
      prioridade: Number(prioridade),
      etiquetas: [
        ...new Set(etiquetas.split(',').map((t) => t.trim().replace(/^#/, ''))).values(),
      ].filter(Boolean),
      fuso,
      meu_dia: meuDia,
      responsavel_id: responsavel || null,
      recorrencia: atual === 'tarefa' ? recorrencia : 'nenhuma',
    };
    if (atual === 'documento')
      d.documento = documento ?? { type: 'doc', content: [{ type: 'paragraph' }] };
    if (atual === 'evento') {
      d.dia_inteiro = diaInteiro;
      d.local = local;
      if (diaInteiro) {
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(dataInicio) ||
          !/^\d{4}-\d{2}-\d{2}$/.test(dataFim) ||
          dataFim < dataInicio
        )
          throw new Error('Confira as datas de início e fim.');
        d.data_inicio = dataInicio;
        d.data_fim = dataFim;
      } else {
        d.inicio = instanteDoHorarioLocal(inicio, fuso);
        d.fim = instanteDoHorarioLocal(fim, fuso);
        if (d.fim <= d.inicio) throw new Error('O fim precisa ser depois do início.');
      }
    }
    if (atual === 'tarefa' && reservar) {
      d.bloco_inicio = instanteDoHorarioLocal(blocoInicio, fuso);
      d.bloco_fim = instanteDoHorarioLocal(blocoFim, fuso);
      if (d.bloco_fim <= d.bloco_inicio)
        throw new Error('Confira o horário reservado para a tarefa.');
    }
    return validarEntrada({
      tipo: atual,
      titulo,
      texto,
      prazo: atual === 'tarefa' ? prazo || null : null,
      estado,
      checklist: checklist,
      dados: d,
      favorito,
      espaco_id: espaco || null,
    });
  };
  const gravar = async (sair = false) => {
    if (salvandoRef.current) return;
    if (novaLinha.trim()) {
      setErro('Adicione o item pendente à lista antes de guardar.');
      return;
    }
    let entrada: Entrada;
    try {
      entrada = obterEntrada();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Confira os campos.');
      return;
    }
    const capturada = assinatura;
    salvandoRef.current = true;
    setSalvando(true);
    setErro('');
    setSituacao('Salvando…');
    try {
      const novo = await salvar(id, entrada, versao.current);
      versao.current = novo.versao;
      ultimoSalvo.current = capturada;
      if (montado.current) {
        setSituacao('Salvo na sua conta');
        setRevisao((v) => v + 1);
        if (sair && assinaturaAtual.current === capturada) fechar();
      }
    } catch (e) {
      if (montado.current) {
        setErro(e instanceof Error ? e.message : 'Não foi possível salvar.');
        setSituacao('Não salvo · tente novamente');
      }
    } finally {
      salvandoRef.current = false;
      if (montado.current) setSalvando(false);
    }
  };
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);
  useEffect(() => {
    setErro('');
    if (assinatura !== ultimoSalvo.current) setSituacao('Alterações a salvar');
  }, [assinatura]);
  useEffect(() => {
    if (!temAlteracao || !titulo.trim() || salvando || erro || novaLinha.trim()) return;
    const timer = setTimeout(() => {
      void gravar();
    }, 1400);
    return () => clearTimeout(timer);
  }, [assinatura, salvando, erro, revisao, novaLinha]);
  useEffect(() => {
    if (Platform.OS !== 'web' || (!temAlteracao && !novaLinha.trim())) return;
    const aviso = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', aviso);
    return () => window.removeEventListener('beforeunload', aviso);
  }, [temAlteracao, novaLinha]);
  const fecharSeguro = () => {
    if (salvandoRef.current) return;
    if (
      (temAlteracao || novaLinha.trim()) &&
      (titulo.trim() || texto.trim() || checklist.length || novaLinha.trim())
    )
      setConfirmar(true);
    else fechar();
  };
  const adicionar = () => {
    if (!novaLinha.trim()) return;
    setChecklist([
      ...checklist,
      { id: Crypto.randomUUID(), texto: novaLinha.trim(), feita: false },
    ]);
    setNovaLinha('');
  };
  const aplicarModelo = (indice: number) => {
    const m = modelos[indice]!;
    setDocumento(m.documento);
    setTexto(textoDocumento(m.documento));
    if (!titulo.trim()) setTitulo(m.nome === 'Em branco' ? '' : m.nome);
    setEditorSeed((v) => v + 1);
    setModeloPendente(null);
  };
  return (
    <Janela
      titulo={item ? 'Seu registro' : 'O que vamos guardar?'}
      subtitulo={contexto.toLocaleUpperCase('pt-BR')}
      cores={cores}
      fechar={fecharSeguro}
      larga={atual === 'documento'}
      rodape={
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <Texto
            accessibilityLiveRegion="polite"
            style={{ color: cores.secundario, fontSize: 11, flex: 1 }}
          >
            {situacao}
          </Texto>
          <Botao
            cores={cores}
            disabled={salvando || !!novaLinha.trim()}
            onPress={() => void gravar(true)}
          >
            {salvando ? 'Salvando…' : 'Guardar e fechar'}
          </Botao>
        </View>
      }
    >
      <Escolha
        label="Tipo de registro"
        cores={cores}
        valor={atual}
        mudar={setAtual}
        opcoes={[
          { valor: 'nota', nome: 'Nota' },
          { valor: 'documento', nome: 'Documento' },
          { valor: 'tarefa', nome: 'Tarefa' },
          { valor: 'lista', nome: 'Lista' },
          { valor: 'evento', nome: 'Evento' },
        ]}
      />
      <Campo
        label="Título"
        valor={titulo}
        mudar={setTitulo}
        cores={cores}
        placeholder="Dê um nome à sua ideia"
      />
      {atual === 'documento' ? (
        <>
          {!item && (
            <Escolha
              label="Começar com um modelo"
              cores={cores}
              valor=""
              mudar={(v) => {
                const n = Number(v);
                if (texto.trim()) setModeloPendente(n);
                else aplicarModelo(n);
              }}
              opcoes={modelos.map((m, i) => ({ valor: String(i), nome: m.nome }))}
            />
          )}
          {modeloPendente !== null && (
            <View style={{ padding: 16, gap: 10, backgroundColor: cores.suave, borderRadius: 10 }}>
              <Texto style={{ color: cores.texto }}>
                Substituir o conteúdo pelo modelo? O texto atual será trocado.
              </Texto>
              <Botao cores={cores} onPress={() => aplicarModelo(modeloPendente)}>
                Usar modelo
              </Botao>
              <Botao cores={cores} secundario onPress={() => setModeloPendente(null)}>
                Manter meu texto
              </Botao>
            </View>
          )}
          <DocumentoEditor
            key={editorSeed}
            valor={documento}
            mudar={(json, t) => {
              setDocumento(json);
              setTexto(t);
            }}
            cores={cores}
          />
        </>
      ) : (
        <Campo
          label={atual === 'nota' ? 'Sua ideia' : 'Observações'}
          valor={texto}
          mudar={setTexto}
          cores={cores}
          multiline
          maxLength={50000}
          placeholder="Comece a escrever. Organize depois."
        />
      )}
      {(atual === 'lista' || atual === 'tarefa') && (
        <View style={{ gap: 7 }}>
          <Texto titulo style={{ color: cores.texto, fontSize: 15 }}>
            {atual === 'tarefa' ? 'Passos da tarefa' : 'Itens da lista'}
          </Texto>
          {checklist.map((l) => (
            <View key={l.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel={l.texto}
                accessibilityState={{ checked: l.feita }}
                onPress={() =>
                  setChecklist(
                    checklist.map((a) => (a.id === l.id ? { ...a, feita: !a.feita } : a)),
                  )
                }
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderWidth: 1,
                    borderColor: cores.secundario,
                    borderRadius: 5,
                    backgroundColor: l.feita ? cores.destaque : 'transparent',
                  }}
                >
                  {l.feita && <Check size={18} color={cores.destaqueTexto} />}
                </View>
              </Pressable>
              <TextInput
                accessibilityLabel="Editar item da lista"
                value={l.texto}
                onChangeText={(t) =>
                  setChecklist(checklist.map((a) => (a.id === l.id ? { ...a, texto: t } : a)))
                }
                style={{
                  flex: 1,
                  minHeight: 44,
                  padding: 10,
                  color: cores.texto,
                  borderBottomWidth: 1,
                  borderColor: cores.borda,
                  fontFamily: 'Inter_400Regular',
                }}
              />
              <IconeBotao
                label={'Remover ' + l.texto}
                cores={cores}
                onPress={() => setChecklist(checklist.filter((a) => a.id !== l.id))}
              >
                <Trash2 size={17} color={cores.secundario} />
              </IconeBotao>
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              accessibilityLabel="Novo passo ou item"
              value={novaLinha}
              onChangeText={setNovaLinha}
              placeholder="Adicionar um item…"
              placeholderTextColor={cores.secundario}
              onSubmitEditing={adicionar}
              maxLength={500}
              style={{
                flex: 1,
                minHeight: 48,
                padding: 12,
                color: cores.texto,
                backgroundColor: cores.suave,
                borderRadius: 8,
                fontFamily: 'Inter_400Regular',
              }}
            />
            <Botao cores={cores} secundario onPress={adicionar}>
              Adicionar
            </Botao>
          </View>
        </View>
      )}
      {atual === 'tarefa' && (
        <>
          <CampoData label="Prazo" valor={prazo} mudar={setPrazo} cores={cores} />
          <Escolha
            label="Estado"
            cores={cores}
            valor={estado}
            mudar={setEstado}
            opcoes={(['A fazer', 'Em andamento', 'Aguardando', 'Concluída'] as Estado[]).map(
              (e) => ({ valor: e, nome: e }),
            )}
          />
          <Escolha
            label="Prioridade"
            cores={cores}
            valor={prioridade}
            mudar={setPrioridade}
            opcoes={[
              { valor: '0', nome: 'Normal' },
              { valor: '1', nome: 'Baixa' },
              { valor: '2', nome: 'Média' },
              { valor: '3', nome: 'Alta' },
            ]}
          />
          <Escolha
            label="Repetição · uma próxima ocorrência é criada ao concluir"
            cores={cores}
            valor={recorrencia ?? 'nenhuma'}
            mudar={setRecorrencia}
            opcoes={[
              { valor: 'nenhuma', nome: 'Não repetir' },
              { valor: 'diaria', nome: 'Diária' },
              { valor: 'semanal', nome: 'Semanal' },
              { valor: 'mensal', nome: 'Mensal' },
              { valor: 'apos_concluir', nome: 'Um dia após concluir' },
            ]}
          />
          <Escolha
            label="Meu dia · não muda o prazo"
            cores={cores}
            valor={meuDia === dataLocal() ? 'sim' : 'nao'}
            mudar={(v) => setMeuDia(v === 'sim' ? dataLocal() : null)}
            opcoes={[
              { valor: 'sim', nome: 'Faz parte do meu foco hoje' },
              { valor: 'nao', nome: 'Escolher em outro momento' },
            ]}
          />
          <Escolha
            label="Reservar tempo na agenda"
            cores={cores}
            valor={reservar ? 'sim' : 'nao'}
            mudar={(v) => setReservar(v === 'sim')}
            opcoes={[
              { valor: 'nao', nome: 'Sem bloco de horário' },
              { valor: 'sim', nome: 'Reservar horário' },
            ]}
          />
          {reservar && (
            <>
              <CampoData
                label="Início do bloco"
                valor={blocoInicio}
                mudar={setBlocoInicio}
                cores={cores}
                tipo="datetime-local"
              />
              <CampoData
                label="Fim do bloco"
                valor={blocoFim}
                mudar={setBlocoFim}
                cores={cores}
                tipo="datetime-local"
              />
              <Texto style={{ fontSize: 11, color: cores.secundario }}>
                O horário reservado é independente do prazo da tarefa.
              </Texto>
            </>
          )}
        </>
      )}
      {atual === 'evento' && (
        <>
          <Escolha
            label="Duração"
            cores={cores}
            valor={diaInteiro ? 'dia' : 'hora'}
            mudar={(v) => setDiaInteiro(v === 'dia')}
            opcoes={[
              { valor: 'hora', nome: 'Com horário' },
              { valor: 'dia', nome: 'Dia inteiro' },
            ]}
          />
          {diaInteiro ? (
            <>
              <CampoData
                label="Data inicial"
                valor={dataInicio}
                mudar={setDataInicio}
                cores={cores}
              />
              <CampoData label="Último dia" valor={dataFim} mudar={setDataFim} cores={cores} />
            </>
          ) : (
            <>
              <CampoData
                label="Início"
                valor={inicio}
                mudar={setInicio}
                cores={cores}
                tipo="datetime-local"
              />
              <CampoData
                label="Fim"
                valor={fim}
                mudar={setFim}
                cores={cores}
                tipo="datetime-local"
              />
            </>
          )}
          <Campo label="Local ou link da reunião" valor={local} mudar={setLocal} cores={cores} />
        </>
      )}
      {(atual === 'evento' || reservar || recorrencia !== 'nenhuma') && (
        <Campo
          label="Fuso do horário · exemplo America/Sao_Paulo"
          valor={fuso}
          mudar={setFuso}
          cores={cores}
        />
      )}
      <Escolha
        label="Espaço de destino"
        cores={cores}
        valor={espaco}
        mudar={setEspaco}
        opcoes={[
          { valor: '', nome: 'Sem espaço' },
          ...espacos.map((e) => ({
            valor: e.id,
            nome: e.nome + (e.restrito ? ' · restrito' : ''),
          })),
        ]}
      />
      {!!participantes.length && (
        <Escolha
          label="Responsável principal"
          cores={cores}
          valor={responsavel}
          mudar={setResponsavel}
          opcoes={[
            { valor: '', nome: 'Não atribuído' },
            ...participantes.map((p) => ({ valor: p.usuario_id, nome: p.email })),
          ]}
        />
      )}
      <Campo
        label="Etiquetas · separadas por vírgula"
        valor={etiquetas}
        mudar={setEtiquetas}
        cores={cores}
        maxLength={820}
        placeholder="trabalho, casa, ideias"
      />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: favorito }}
        accessibilityLabel="Favorito"
        onPress={() => setFavorito(!favorito)}
        style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 9 }}
      >
        <Star size={19} color={cores.destaque} fill={favorito ? cores.destaque : 'transparent'} />
        <Texto style={{ color: cores.texto }}>Manter nos favoritos</Texto>
      </Pressable>
      {!!erro && (
        <Texto accessibilityRole="alert" style={{ color: cores.erro }}>
          {erro}
        </Texto>
      )}
      {confirmar && (
        <View style={{ gap: 10, padding: 16, backgroundColor: cores.suave, borderRadius: 10 }}>
          <Texto style={{ color: cores.texto }}>Há alterações ainda não salvas.</Texto>
          <Botao cores={cores} onPress={() => void gravar(true)}>
            Guardar e fechar
          </Botao>
          <Botao cores={cores} secundario onPress={() => setConfirmar(false)}>
            Continuar editando
          </Botao>
          <Botao cores={cores} secundario onPress={fechar}>
            Descartar alterações pendentes
          </Botao>
        </View>
      )}
    </Janela>
  );
}
