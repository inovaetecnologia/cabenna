import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../auth/Autenticacao';
import { temas } from '../theme/cores';
import { Item, Entrada, Tipo } from '../lib/itens';
import { Equipe, Espaco, Participante, Plano } from '../lib/contextos';
import * as api from '../data/cabenna';
import { Texto, Botao } from '../components/ui';
import { Campo, Escolha, Janela } from '../components/formulario';
import Experiencia, { InicioRegistro } from '../components/Experiencia';
import EditorRegistro from '../components/EditorRegistro';
import Planos from '../components/Planos';
import GestaoEquipe from '../components/GestaoEquipe';
import Exportacao from '../components/Exportacao';
import DetalhesRegistro from '../components/DetalhesRegistro';
export default function AreaTrabalho() {
  const auth = useAuth();
  const usuario = auth.usuario!;
  const [escuro, setEscuro] = useState(false);
  const c = escuro ? temas.escuro : temas.claro;
  const [equipeId, setEquipeId] = useState<string | null>(null);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [espacos, setEspacos] = useState<Espaco[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [plano, setPlano] = useState<Plano | null>(null);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [dialogo, setDialogo] = useState<
    | 'contextos'
    | 'conta'
    | 'planos'
    | 'equipe'
    | 'novoEspaco'
    | 'novaEquipe'
    | 'exportar'
    | 'master'
    | 'sair'
    | null
  >(null);
  const [nome, setNome] = useState('');
  const [restrito, setRestrito] = useState('nao');
  const [editor, setEditor] = useState<{
    id: string;
    item: Item | null;
    tipo: Tipo;
    inicio?: InicioRegistro;
  } | null>(null);
  const [acoes, setAcoes] = useState<Item | null>(null);
  const [historico, setHistorico] = useState<Item | null>(null);
  const [resumo, setResumo] = useState<{
    contas: number;
    equipes: number;
    registros: number;
    masters: number;
  } | null>(null);
  const [convite, setConvite] = useState(
    Platform.OS === 'web' ? new URLSearchParams(window.location.search).get('convite') : null,
  );
  const seq = useRef(0);
  const equipe = equipes.find((e) => e.id === equipeId) ?? null;
  const contexto = equipe?.nome ?? 'Meu espaço pessoal';
  const atuais = espacos.filter((e) => (e.equipe_id ?? null) === equipeId);
  const eu = participantes.find((p) => p.usuario_id === usuario.id);
  const leitura = plano?.estado === 'consulta';
  const nomeUsuario =
    usuario.user_metadata?.nome ?? usuario.email?.split('@')[0]?.replace(/[._]/g, ' ') ?? 'você';
  const carregar = useCallback(
    async (silencioso = false) => {
      const n = ++seq.current;
      if (!silencioso) setCarregando(true);
      try {
        const ctx = await api.carregarContextos();
        if (n !== seq.current) return;
        setEquipes(ctx.equipes);
        setEspacos(ctx.espacos);
        if (equipeId && !ctx.equipes.some((e) => e.id === equipeId)) {
          setItens([]);
          setPlano(null);
          setParticipantes([]);
          setEquipeId(null);
          setEditor(null);
          setAcoes(null);
          setHistorico(null);
          setDialogo(null);
          setAviso('Seu acesso mudou. Estamos no seu espaço pessoal.');
          return;
        }
        const r = await api.carregarContexto(equipeId);
        if (n !== seq.current) return;
        setItens(r.itens);
        setPlano(r.plano);
        setParticipantes(r.participantes);
        setErro('');
      } catch (e) {
        if (n === seq.current) {
          setErro((e as Error).message);
          setItens([]);
          setPlano(null);
          setParticipantes([]);
          setAcoes(null);
          setHistorico(null);
        }
      } finally {
        if (n === seq.current) setCarregando(false);
      }
    },
    [equipeId],
  );
  useEffect(() => {
    void AsyncStorage.getItem('cabenna:tema').then((v) => setEscuro(v === 'escuro'));
  }, []);
  useEffect(() => {
    setItens([]);
    setPlano(null);
    void carregar();
    const timer = setInterval(() => void carregar(true), 20000);
    const foco = () => void carregar(true);
    if (Platform.OS === 'web') window.addEventListener('focus', foco);
    return () => {
      ++seq.current;
      clearInterval(timer);
      if (Platform.OS === 'web') window.removeEventListener('focus', foco);
    };
  }, [carregar]);
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
  const trocar = (id: string | null) => {
    setEquipeId(id);
    setDialogo(null);
    setEditor(null);
    setAcoes(null);
    setHistorico(null);
    setAviso('');
  };
  const salvar = async (id: string, entrada: Entrada, versao: number) => {
    const r = await api.gravarRegistro(id, entrada, versao, equipeId);
    setItens((v) => [r, ...v.filter((i) => i.id !== id)]);
    return r;
  };
  const novo = (tipo: Tipo, inicio?: InicioRegistro) => {
    if (leitura) return;
    if (!plano) {
      setAviso('Aguarde a abertura do seu contexto para criar um registro.');
      return;
    }
    if ((inicio?.objetivo || inicio?.objetivo_id) && !('master' in (plano ?? {}))) {
      setErro(
        'Planos conectados precisam da atualização 0006. Seu banco atual continua funcionando para notas, tarefas e calendário.',
      );
      return;
    }
    setEditor({ id: Crypto.randomUUID(), item: null, tipo, inicio });
  };
  const abrir = (item: Item) => {
    if (leitura || item.arquivado || item.excluido_em) {
      setAcoes(item);
      return;
    }
    setEditor({ id: item.id, item, tipo: item.tipo });
  };
  const organizar = (item: Item, acao: string) =>
    void executar(async () => {
      await api.organizarRegistro(item, acao);
      setAcoes(null);
      await carregar(true);
    });
  const alternar = (item: Item) =>
    void executar(async () => {
      await salvar(
        item.id,
        { ...item, estado: item.estado === 'Concluída' ? 'A fazer' : 'Concluída' },
        item.versao,
      );
      await carregar(true);
    });
  const tema = () => {
    setEscuro(!escuro);
    void AsyncStorage.setItem('cabenna:tema', !escuro ? 'escuro' : 'claro');
  };
  const erros = !!erro && (
    <Texto accessibilityRole="alert" style={{ color: c.erro, fontSize: 12 }}>
      {erro}
    </Texto>
  );
  return (
    <View style={{ flex: 1 }}>
      <Experiencia
        key={equipeId ?? 'pessoal'}
        nome={nomeUsuario}
        email={usuario.email ?? ''}
        contexto={contexto}
        equipe={!!equipeId}
        itens={itens}
        espacos={atuais}
        plano={plano}
        cores={c}
        escuro={escuro}
        carregando={carregando}
        erro={erro}
        aviso={aviso}
        onAtualizar={() => void carregar()}
        onContexto={() => setDialogo('contextos')}
        onConta={() => setDialogo('conta')}
        onTema={tema}
        onNovo={novo}
        onAbrir={abrir}
        onAcao={setAcoes}
        onConcluir={alternar}
        onFoco={(i, dia) =>
          void executar(async () => {
            await api.definirFoco(i.id, dia);
            await carregar(true);
          })
        }
        onCapturar={async (texto) => {
          await salvar(
            Crypto.randomUUID(),
            {
              tipo: 'nota',
              titulo: texto.trim(),
              texto: '',
              prazo: null,
              estado: 'A fazer',
              checklist: [],
              favorito: false,
              dados: {},
            },
            0,
          );
          setAviso('Ideia guardada. Você pode continuar quando quiser.');
        }}
      />
      {convite && (
        <Janela titulo="Um convite para fazer junto." cores={c} fechar={() => setConvite(null)}>
          <Texto style={{ color: c.secundario }}>
            O convite será aceito com {usuario.email}. Sua área pessoal continua separada.
          </Texto>
          <Botao
            cores={c}
            disabled={ocupado}
            onPress={() =>
              void executar(async () => {
                const id = await api.aceitarConvite(convite);
                setConvite(null);
                if (Platform.OS === 'web') window.history.replaceState(null, '', '/app');
                trocar(id);
              })
            }
          >
            Aceitar convite
          </Botao>
          {erros}
        </Janela>
      )}
      {dialogo === 'contextos' && (
        <Janela titulo="Seu lugar, do seu jeito." cores={c} fechar={() => setDialogo(null)}>
          <Botao cores={c} secundario onPress={() => trocar(null)}>
            Meu espaço pessoal · só você
          </Botao>
          {equipes.map((e) => (
            <Botao key={e.id} cores={c} secundario onPress={() => trocar(e.id)}>
              {e.nome}
            </Botao>
          ))}
          <Botao
            cores={c}
            onPress={() => {
              setNome('');
              setDialogo('novaEquipe');
            }}
          >
            Criar uma equipe
          </Botao>
        </Janela>
      )}
      {dialogo === 'conta' && (
        <Janela
          titulo="Conta e preferências"
          subtitulo={usuario.email}
          cores={c}
          fechar={() => setDialogo(null)}
        >
          <View style={{ padding: 20, borderRadius: 15, backgroundColor: c.suave, gap: 7 }}>
            <Texto titulo style={{ fontSize: 20, color: c.texto }}>
              {plano?.master ? 'Master Inovae' : (plano?.nome ?? 'Sua conta')}
            </Texto>
            <Texto style={{ fontSize: 12, color: c.secundario }}>
              {plano?.licenca_permanente
                ? 'Licença permanente · maior capacidade do catálogo'
                : plano?.estado === 'teste'
                  ? 'Teste até ' + new Date(plano.teste_fim!).toLocaleDateString('pt-BR')
                  : 'Seu contexto: ' + contexto}
            </Texto>
          </View>
          <Botao cores={c} secundario onPress={() => setDialogo('planos')}>
            Meu plano e benefícios
          </Botao>
          <Botao cores={c} secundario onPress={() => setDialogo('equipe')}>
            {equipeId ? 'Pessoas e permissões da equipe' : 'Conhecer o trabalho em equipe'}
          </Botao>
          {!leitura && eu?.papel !== 'convidado' && (
            <Botao
              cores={c}
              secundario
              onPress={() => {
                setNome('');
                setDialogo('novoEspaco');
              }}
            >
              Criar um cantinho
            </Botao>
          )}
          <Botao cores={c} secundario onPress={tema}>
            {escuro ? 'Aparência clara' : 'Aparência escura'}
          </Botao>
          {(!equipeId || eu?.papel === 'proprietario') && (
            <Botao cores={c} secundario onPress={() => setDialogo('exportar')}>
              Exportar meus registros
            </Botao>
          )}
          {plano?.master && (
            <Botao
              cores={c}
              secundario
              onPress={() => {
                setDialogo('master');
                void executar(async () => setResumo(await api.resumoMaster()));
              }}
            >
              Administração Inovae
            </Botao>
          )}
          <View style={{ paddingTop: 15, borderTopWidth: 1, borderColor: c.borda }}>
            <Texto style={{ fontSize: 11, color: c.secundario, lineHeight: 20 }}>
              Seu conteúdo pessoal é privado. Recursos de cofre e criptografia de ponta a ponta
              ainda não estão disponíveis.
            </Texto>
          </View>
          <Botao cores={c} secundario onPress={() => setDialogo('sair')}>
            Sair da conta
          </Botao>
        </Janela>
      )}
      {dialogo === 'planos' && (
        <Janela
          titulo="Mais espaço para crescer"
          cores={c}
          fechar={() => setDialogo('conta')}
          larga
        >
          <Planos
            plano={plano}
            equipe={!!equipeId}
            cores={c}
            atualizar={() => void carregar(true)}
            criarEquipe={() => {
              setNome('');
              setDialogo('novaEquipe');
            }}
          />
        </Janela>
      )}
      {dialogo === 'equipe' && (
        <Janela titulo="Fazer junto" cores={c} fechar={() => setDialogo('conta')} larga>
          <GestaoEquipe
            equipe={equipe}
            participantes={participantes}
            espacos={atuais}
            usuario={usuario.id}
            cores={c}
            atualizar={() => void carregar(true)}
            criar={() => {
              setNome('');
              setDialogo('novaEquipe');
            }}
          />
        </Janela>
      )}
      {(dialogo === 'novoEspaco' || dialogo === 'novaEquipe') && (
        <Janela
          titulo={
            dialogo === 'novaEquipe'
              ? 'Uma equipe para fazer acontecer.'
              : 'Dê um lugar às suas ideias.'
          }
          cores={c}
          fechar={() => !ocupado && setDialogo('conta')}
        >
          <Campo label="Como vamos chamar?" valor={nome} mudar={setNome} cores={c} maxLength={80} />
          {dialogo === 'novoEspaco' && equipeId && (
            <Escolha
              label="Quem pode acessar?"
              cores={c}
              valor={restrito}
              mudar={setRestrito}
              opcoes={[
                { valor: 'nao', nome: 'Participantes da equipe' },
                { valor: 'sim', nome: 'Somente pessoas autorizadas' },
              ]}
            />
          )}
          <Texto style={{ fontSize: 12, color: c.secundario }}>
            {dialogo === 'novaEquipe'
              ? 'Até 15 participantes. Seu espaço pessoal continua só seu.'
              : equipeId
                ? 'As permissões podem ser ajustadas na gestão da equipe.'
                : 'Este cantinho é seu. Você pode guardar diferentes tipos de registro nele.'}
          </Texto>
          <Botao
            cores={c}
            disabled={ocupado || !nome.trim()}
            onPress={() =>
              void executar(async () => {
                if (dialogo === 'novaEquipe') {
                  const id = await api.criarEquipe(nome);
                  trocar(id);
                } else {
                  await api.criarEspaco(nome, '#8AA17C', equipeId, restrito === 'sim');
                  await carregar(true);
                  setDialogo(null);
                }
              })
            }
          >
            Criar
          </Botao>
          {erros}
        </Janela>
      )}
      {dialogo === 'exportar' && (
        <Janela titulo="Seus planos vão com você." cores={c} fechar={() => setDialogo('conta')}>
          <Texto style={{ fontSize: 12, color: c.secundario }}>
            Exportação dos registros autorizados em {contexto}. Inclui arquivo e lixeira, sem
            conteúdo de espaços aos quais você não tem acesso.
          </Texto>
          <Exportacao cores={c} carregar={() => api.exportarContexto(equipeId)} />
        </Janela>
      )}
      {dialogo === 'master' && (
        <Janela
          titulo="Administração Inovae"
          subtitulo="MASTER · LICENÇA PERMANENTE"
          cores={c}
          fechar={() => setDialogo('conta')}
        >
          <Texto style={{ color: c.secundario, fontSize: 12 }}>
            Acesso aos recursos do produto com a maior capacidade disponível no catálogo. O banco
            mantém as permissões de cada conteúdo.
          </Texto>
          {resumo &&
            Object.entries(resumo).map(([k, v]) => (
              <View
                key={k}
                style={{
                  padding: 17,
                  borderRadius: 12,
                  backgroundColor: c.suave,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <Texto style={{ color: c.texto, textTransform: 'capitalize' }}>{k}</Texto>
                <Texto titulo style={{ color: c.texto }}>
                  {v}
                </Texto>
              </View>
            ))}
          {erros}
        </Janela>
      )}
      {dialogo === 'sair' && (
        <Janela titulo="Até o próximo passo." cores={c} fechar={() => setDialogo('conta')}>
          <Texto style={{ color: c.secundario }}>
            Seus registros salvos continuam guardados na sua conta.
          </Texto>
          <Botao cores={c} disabled={ocupado} onPress={() => void executar(() => auth.sair())}>
            Sair
          </Botao>
          <Botao cores={c} secundario onPress={() => setDialogo(null)}>
            Continuar aqui
          </Botao>
          {erros}
        </Janela>
      )}
      {editor && (
        <EditorRegistro
          key={editor.id}
          {...editor}
          espacoInicial={editor.inicio?.espaco_id ?? null}
          espacos={atuais}
          participantes={participantes}
          contexto={contexto}
          cores={c}
          fechar={() => {
            setEditor(null);
            void carregar(true);
          }}
          salvar={salvar}
        />
      )}
      {acoes && (
        <Janela titulo={acoes.titulo} cores={c} fechar={() => setAcoes(null)}>
          <Texto selectable style={{ color: c.texto }}>
            {acoes.texto || acoes.dados?.objetivo?.resultado}
          </Texto>
          <Botao
            cores={c}
            secundario
            onPress={() => {
              setHistorico(acoes);
              setAcoes(null);
            }}
          >
            Histórico e comentários
          </Botao>
          <Exportacao cores={c} carregar={async () => [acoes]} />
          {acoes.dados?.meu_dia && (
            <Botao
              cores={c}
              secundario
              onPress={() =>
                void executar(async () => {
                  await api.definirFoco(acoes.id, null);
                  setAcoes(null);
                  await carregar(true);
                })
              }
            >
              Retirar do foco de hoje
            </Botao>
          )}
          {!leitura && (
            <>
              {acoes.excluido_em ? (
                <Botao cores={c} onPress={() => organizar(acoes, 'restaurar')}>
                  Restaurar da lixeira
                </Botao>
              ) : (
                <>
                  <Botao
                    cores={c}
                    secundario
                    onPress={() => organizar(acoes, acoes.arquivado ? 'desarquivar' : 'arquivar')}
                  >
                    {acoes.arquivado ? 'Trazer de volta do arquivo' : 'Arquivar'}
                  </Botao>
                  <Botao cores={c} secundario onPress={() => organizar(acoes, 'excluir')}>
                    Mover para lixeira
                  </Botao>
                </>
              )}
            </>
          )}
          {erros}
        </Janela>
      )}
      {historico && (
        <DetalhesRegistro
          item={itens.find((i) => i.id === historico.id) ?? historico}
          cores={c}
          fechar={() => setHistorico(null)}
          atualizar={() => void carregar(true)}
          leitura={leitura}
        />
      )}
    </View>
  );
}
