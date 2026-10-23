import React, { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import {
  Leaf,
  Plus,
  ArrowUpRight,
  Sun,
  CheckSquare,
  CheckCheck,
  LockKeyhole,
  ArrowRight,
  Check,
  MoreHorizontal,
  FileText,
  ListChecks,
  Star,
} from 'lucide-react-native';
import { Botao, Texto, Selo, IconeBotao } from '../components/ui';
import { Cores } from '../theme/cores';
import { Item, Entrada, Tipo, ativos, buscar, atrasada, dataLocal, nomeData } from '../lib/itens';
import type { Pagina } from './Cabenna';

type Props = {
  pagina: Pagina;
  busca: string;
  itens: Item[];
  cores: Cores;
  mobile: boolean;
  compacto: boolean;
  sessao: boolean;
  bloqueado: boolean;
  abrir: (tipo?: Tipo, item?: Item | null) => void;
  navegar: (p: Pagina) => void;
  alterar: (i: Item, a: Partial<Entrada>) => Promise<void>;
  opcoes: (i: Item) => void;
  limpar: () => void;
};
export default function Conteudo({
  pagina,
  busca,
  itens,
  cores,
  mobile,
  compacto,
  sessao,
  bloqueado,
  abrir,
  navegar,
  alterar,
  opcoes,
  limpar,
}: Props) {
  const [quadro, setQuadro] = useState(false);
  const [filtro, setFiltro] = useState<'pendentes' | 'todas' | 'concluidas'>('pendentes');
  const [confirmarLimpeza, setConfirmarLimpeza] = useState(false);
  const vivos = ativos(itens);
  const hoje = dataLocal();
  const tarefas = vivos.filter((i) => i.tipo === 'tarefa');
  const pendentes = tarefas.filter((i) => i.estado !== 'Concluída');
  const foco = pendentes.filter((i) => i.prazo === hoje || atrasada(i) || i.favorito);
  const notas = vivos
    .filter((i) => i.tipo === 'nota')
    .sort((a, b) => b.atualizado_em.localeCompare(a.atualizado_em));
  const iconTipo = (tipo: Tipo) => {
    const I = tipo === 'nota' ? FileText : tipo === 'tarefa' ? CheckSquare : ListChecks;
    return <I size={19} color={cores.destaque} />;
  };
  const vazio = (titulo: string, texto: string, tipo: Tipo = 'nota') => (
    <View
      style={{
        padding: 32,
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: cores.borda,
        borderStyle: 'dashed',
        borderRadius: 14,
      }}
    >
      <Leaf size={30} color={cores.secundario} />
      <Texto titulo style={{ fontSize: 19, color: cores.texto, textAlign: 'center' }}>
        {titulo}
      </Texto>
      <Texto style={{ color: cores.secundario, textAlign: 'center', maxWidth: 360 }}>{texto}</Texto>
      <Botao cores={cores} onPress={() => abrir(tipo)}>
        Criar {tipo === 'nota' ? 'uma nota' : tipo === 'tarefa' ? 'uma tarefa' : 'uma lista'}
      </Botao>
    </View>
  );
  const linhaTarefa = (item: Item) => (
    <View
      key={item.id}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 7,
        borderBottomWidth: 1,
        borderColor: cores.borda,
      }}
    >
      <Pressable
        disabled={bloqueado}
        accessibilityRole="checkbox"
        accessibilityLabel={'Concluir ' + item.titulo}
        accessibilityState={{ checked: item.estado === 'Concluída' }}
        onPress={() =>
          void alterar(item, { estado: item.estado === 'Concluída' ? 'A fazer' : 'Concluída' })
        }
        style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
      >
        <View
          style={{
            width: 21,
            height: 21,
            borderWidth: 1.5,
            borderColor: item.estado === 'Concluída' ? cores.destaque : cores.secundario,
            borderRadius: 7,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: item.estado === 'Concluída' ? cores.destaque : 'transparent',
          }}
        >
          {item.estado === 'Concluída' && <Check size={14} color={cores.destaqueTexto} />}
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={'Editar ' + item.titulo}
        onPress={() => abrir('tarefa', item)}
        style={{ flex: 1, paddingVertical: 6, gap: 3 }}
      >
        <Texto
          style={{
            color: item.estado === 'Concluída' ? cores.secundario : cores.texto,
            textDecorationLine: item.estado === 'Concluída' ? 'line-through' : 'none',
            fontFamily: 'Inter_500Medium',
          }}
        >
          {item.titulo}
        </Texto>
        {mobile && (
          <Texto style={{ fontSize: 11, color: atrasada(item) ? cores.erro : cores.secundario }}>
            {atrasada(item) ? 'Atrasada · ' : ''}
            {nomeData(item.prazo)}
          </Texto>
        )}
      </Pressable>
      {!mobile && (
        <>
          <Selo texto="Pessoal" cores={cores} />
          <Texto
            style={{
              fontSize: 12,
              color: atrasada(item) ? cores.erro : cores.secundario,
              marginHorizontal: 12,
              minWidth: 65,
            }}
          >
            {item.prazo === hoje ? 'Hoje' : nomeData(item.prazo)}
          </Texto>
        </>
      )}
      <IconeBotao cores={cores} label={'Opções de ' + item.titulo} onPress={() => opcoes(item)}>
        <MoreHorizontal size={19} color={cores.secundario} />
      </IconeBotao>
    </View>
  );
  const cartao = (item: Item) => (
    <View
      key={item.id}
      style={{
        backgroundColor: cores.painel,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: cores.borda,
        padding: 20,
        gap: 12,
        width: mobile ? '100%' : compacto ? '48%' : '31.8%',
        minWidth: mobile ? 0 : 230,
        minHeight: 220,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View
          style={{
            width: 36,
            height: 36,
            backgroundColor: cores.suave,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {iconTipo(item.tipo)}
        </View>
        <View style={{ flexDirection: 'row' }}>
          {item.favorito && (
            <View style={{ justifyContent: 'center' }}>
              <Star size={15} color={cores.secundario} />
            </View>
          )}
          <IconeBotao label={'Opções de ' + item.titulo} cores={cores} onPress={() => opcoes(item)}>
            <MoreHorizontal size={19} color={cores.secundario} />
          </IconeBotao>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={'Abrir ' + item.titulo}
        onPress={() => abrir(item.tipo, item)}
        style={{ gap: 8, flex: 1 }}
      >
        <Texto
          titulo
          style={{ fontSize: 17, lineHeight: 25, color: cores.texto }}
          numberOfLines={2}
        >
          {item.titulo}
        </Texto>
        <Texto numberOfLines={3} style={{ color: cores.secundario, fontSize: 13, lineHeight: 22 }}>
          {item.texto ||
            (item.tipo === 'lista'
              ? `${item.checklist.filter((l) => l.feita).length} de ${item.checklist.length} itens concluídos`
              : 'Uma ideia pronta para ganhar forma.')}
        </Texto>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Texto style={{ fontSize: 10, letterSpacing: 0.7, color: cores.secundario }}>
          PESSOAL{!sessao && item.id.startsWith('demo-') ? ' · EXEMPLO' : ''}
        </Texto>
        <Texto style={{ fontSize: 11, color: cores.secundario }}>
          {nomeData(item.atualizado_em.slice(0, 10))}
        </Texto>
      </View>
    </View>
  );
  const listaCard = (item: Item) => (
    <View
      key={item.id}
      style={{
        padding: 22,
        borderWidth: 1,
        borderColor: cores.borda,
        borderRadius: 14,
        backgroundColor: cores.painel,
        width: mobile ? '100%' : '48%',
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {iconTipo('lista')}
        <Pressable
          onPress={() => abrir('lista', item)}
          accessibilityRole="button"
          style={{ flex: 1 }}
        >
          <Texto titulo style={{ fontSize: 18, color: cores.texto }}>
            {item.titulo}
          </Texto>
        </Pressable>
        <IconeBotao label={'Opções de ' + item.titulo} cores={cores} onPress={() => opcoes(item)}>
          <MoreHorizontal color={cores.secundario} size={19} />
        </IconeBotao>
      </View>
      {item.checklist.map((l) => (
        <Pressable
          disabled={bloqueado}
          accessibilityRole="checkbox"
          accessibilityLabel={l.texto}
          accessibilityState={{ checked: l.feita }}
          key={l.id}
          onPress={() =>
            void alterar(item, {
              checklist: item.checklist.map((a) => (a.id === l.id ? { ...a, feita: !a.feita } : a)),
            })
          }
          style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 5,
              borderWidth: 1,
              borderColor: cores.secundario,
              backgroundColor: l.feita ? cores.destaque : 'transparent',
            }}
          >
            {l.feita && <Check size={18} color={cores.destaqueTexto} />}
          </View>
          <Texto
            style={{
              flex: 1,
              color: l.feita ? cores.secundario : cores.texto,
              textDecorationLine: l.feita ? 'line-through' : 'none',
            }}
          >
            {l.texto}
          </Texto>
        </Pressable>
      ))}
      <Botao cores={cores} secundario onPress={() => abrir('lista', item)}>
        Editar lista
      </Botao>
    </View>
  );

  if (pagina === 'dia' && !busca.trim())
    return (
      <>
        <View
          style={{
            backgroundColor: cores.destaque,
            borderRadius: 18,
            padding: mobile ? 24 : 30,
            gap: 20,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <View style={{ flex: 1, gap: 7 }}>
              <Texto
                style={{
                  color: cores.destaqueTexto,
                  fontSize: 10,
                  letterSpacing: 1.6,
                  opacity: 0.7,
                }}
              >
                UMA IDEIA JÁ É UM COMEÇO
              </Texto>
              <Texto
                titulo
                style={{ color: cores.destaqueTexto, fontSize: mobile ? 22 : 25, lineHeight: 34 }}
              >
                O que você quer tirar da cabeça?
              </Texto>
              <Texto style={{ color: cores.destaqueTexto, fontSize: 12, opacity: 0.78 }}>
                Guarde agora. Encontre quando precisar.
              </Texto>
            </View>
            {!mobile && (
              <Leaf
                size={48}
                strokeWidth={1}
                color={cores.destaqueTexto}
                style={{ opacity: 0.35 }}
              />
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => abrir()}
            style={{
              backgroundColor: '#F9FCF5',
              paddingHorizontal: 16,
              minHeight: 54,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderRadius: 10,
            }}
          >
            <Plus size={21} color="#174C42" />
            <Texto style={{ fontSize: 13, color: '#647D70', flex: 1 }}>
              Anote uma ideia, tarefa ou lista…
            </Texto>
            <ArrowUpRight size={20} color="#174C42" />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', gap: mobile ? 8 : 14 }}>
          {[
            {
              nome: 'PARA HOJE',
              numero: pendentes.filter((i) => i.prazo === hoje).length,
              descricao: 'Um foco por vez',
              icone: Sun,
            },
            {
              nome: 'EM ABERTO',
              numero: pendentes.length,
              descricao: 'No seu ritmo',
              icone: CheckSquare,
            },
            {
              nome: 'CONCLUÍDAS',
              numero: tarefas.filter((i) => i.estado === 'Concluída').length,
              descricao: 'Cada passo conta',
              icone: CheckCheck,
            },
          ].map(({ nome, numero, descricao, icone: I }) => (
            <View
              key={nome}
              style={{
                flex: 1,
                padding: mobile ? 14 : 20,
                backgroundColor: cores.painel,
                borderWidth: 1,
                borderColor: cores.borda,
                borderRadius: 13,
                gap: 7,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Texto
                  style={{ fontSize: mobile ? 8 : 10, letterSpacing: 0.8, color: cores.secundario }}
                >
                  {nome}
                </Texto>
                {!mobile && <I size={17} color={cores.secundario} />}
              </View>
              <Texto titulo style={{ fontSize: 30, lineHeight: 40, color: cores.texto }}>
                {String(numero).padStart(2, '0')}
              </Texto>
              {!mobile && (
                <Texto style={{ fontSize: 11, color: cores.secundario }}>{descricao}</Texto>
              )}
            </View>
          ))}
        </View>
        <View style={{ flexDirection: compacto ? 'column' : 'row', gap: 22 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: cores.painel,
              borderWidth: 1,
              borderColor: cores.borda,
              borderRadius: 14,
              padding: mobile ? 14 : 22,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <View>
                <Texto titulo style={{ fontSize: 19, color: cores.texto }}>
                  Meu foco de hoje
                </Texto>
                <Texto style={{ fontSize: 11, color: cores.secundario }}>
                  Para hoje, em atraso e favoritos
                </Texto>
              </View>
              <IconeBotao label="Criar tarefa" cores={cores} onPress={() => abrir('tarefa')}>
                <Plus size={20} color={cores.destaque} />
              </IconeBotao>
            </View>
            {foco.length ? (
              foco.slice(0, 5).map(linhaTarefa)
            ) : (
              <View style={{ paddingVertical: 24, gap: 10 }}>
                <Texto style={{ color: cores.secundario }}>
                  Seu dia tem espaço. Escolha uma tarefa e defina um prazo para hoje.
                </Texto>
                <Botao cores={cores} secundario onPress={() => abrir('tarefa')}>
                  Escolher meu próximo passo
                </Botao>
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={() => navegar('tarefas')}
              style={{
                flexDirection: 'row',
                gap: 7,
                alignItems: 'center',
                paddingTop: 16,
                minHeight: 44,
              }}
            >
              <Texto
                style={{ fontSize: 12, color: cores.destaque, fontFamily: 'Inter_600SemiBold' }}
              >
                Ver todas as tarefas
              </Texto>
              <ArrowRight size={15} color={cores.destaque} />
            </Pressable>
          </View>
          <View
            style={{
              width: compacto ? '100%' : 260,
              backgroundColor: cores.suave,
              borderRadius: 14,
              padding: 24,
              gap: 15,
            }}
          >
            <View
              style={{
                backgroundColor: cores.painel,
                width: 42,
                height: 42,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LockKeyhole size={20} color={cores.destaque} />
            </View>
            <Texto titulo style={{ fontSize: 20, color: cores.texto, lineHeight: 29 }}>
              Um espaço só seu.
            </Texto>
            <Texto style={{ color: cores.secundario, fontSize: 12, lineHeight: 22 }}>
              Suas notas, listas e tarefas pessoais ficam separadas do trabalho em equipe.
            </Texto>
            <Pressable
              accessibilityRole="button"
              onPress={() => navegar('roteiro')}
              style={{ minHeight: 44, flexDirection: 'row', gap: 7, alignItems: 'center' }}
            >
              <Texto
                style={{ fontSize: 12, color: cores.destaque, fontFamily: 'Inter_600SemiBold' }}
              >
                Conheça este incremento
              </Texto>
              <ArrowUpRight size={15} color={cores.destaque} />
            </Pressable>
          </View>
        </View>
        <View style={{ gap: 15 }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Texto titulo style={{ fontSize: 20, color: cores.texto }}>
              Ideias por perto
            </Texto>
            <Pressable
              accessibilityRole="button"
              onPress={() => navegar('notas')}
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Texto style={{ fontSize: 12, color: cores.destaque }}>Ver todas ↗</Texto>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
            {notas.slice(0, 3).map(cartao)}
          </View>
          {!notas.length &&
            vazio('Toda ideia merece um lugar.', 'Sua próxima nota começa com uma linha.')}
        </View>
      </>
    );
  if (pagina === 'roteiro' && !busca.trim())
    return (
      <View style={{ gap: 18 }}>
        <View
          style={{
            padding: 24,
            backgroundColor: cores.painel,
            borderWidth: 1,
            borderColor: cores.borda,
            borderRadius: 14,
            gap: 15,
          }}
        >
          <Texto titulo style={{ fontSize: 21, color: cores.texto }}>
            Primeiro incremento · organização pessoal
          </Texto>
          <Texto style={{ color: cores.secundario }}>
            Captura, notas de texto, tarefas com prazo e estados, listas marcáveis, favoritos,
            busca, arquivo e lixeira. A avaliação local persiste neste navegador. Com Supabase
            configurado, a conta usa e-mail e senha e os registros pessoais são protegidos por
            permissões no banco.
          </Texto>
          <Texto style={{ color: cores.secundario }}>
            Nesta etapa, alterações da conta exigem conexão. O editor mantém o conteúdo aberto se
            houver falha e sinaliza conflitos entre sessões. Registros de avaliação não migram
            automaticamente para uma conta. Não há exclusão definitiva automática neste incremento.
          </Texto>
        </View>
        <View style={{ padding: 24, backgroundColor: cores.suave, borderRadius: 14, gap: 14 }}>
          <Texto titulo style={{ fontSize: 20, color: cores.texto }}>
            Na sequência do desenvolvimento
          </Texto>
          {[
            'Documentos com formatação, anexos e histórico',
            'Agenda interna, recorrência e reserva de tempo',
            'Espaços, projetos, equipes e compartilhamento',
            'Cofre pessoal com criptografia e recuperação',
            'Offline com conciliação, importações e exportações',
            'Planos, cobrança, administração e operação',
          ].map((t, i) => (
            <View key={t} style={{ flexDirection: 'row', gap: 12 }}>
              <Texto style={{ color: cores.secundario, fontSize: 12 }}>
                {String(i + 2).padStart(2, '0')}
              </Texto>
              <Texto style={{ color: cores.texto, flex: 1 }}>{t}</Texto>
            </View>
          ))}
        </View>
        {!sessao && (
          <>
            <Botao cores={cores} secundario onPress={() => setConfirmarLimpeza(true)}>
              Apagar os registros da avaliação local
            </Botao>
            {confirmarLimpeza && (
              <View
                style={{
                  gap: 10,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: cores.erro,
                  borderRadius: 12,
                }}
              >
                <Texto style={{ color: cores.texto }}>
                  Isso apaga os registros de avaliação deste navegador. Não afeta contas conectadas.
                </Texto>
                <Botao
                  cores={cores}
                  onPress={() => {
                    limpar();
                    setConfirmarLimpeza(false);
                  }}
                >
                  Confirmar limpeza local
                </Botao>
                <Botao cores={cores} secundario onPress={() => setConfirmarLimpeza(false)}>
                  Cancelar
                </Botao>
              </View>
            )}
          </>
        )}
      </View>
    );

  let exibidos =
    pagina === 'arquivo'
      ? itens.filter((i) => i.arquivado && !i.excluido_em)
      : pagina === 'lixeira'
        ? itens.filter((i) => !!i.excluido_em)
        : pagina === 'notas' || pagina === 'entrada'
          ? notas
          : pagina === 'listas'
            ? vivos.filter((i) => i.tipo === 'lista')
            : pagina === 'tarefas'
              ? tarefas.filter(
                  (i) =>
                    filtro === 'todas' ||
                    (filtro === 'concluidas' ? i.estado === 'Concluída' : i.estado !== 'Concluída'),
                )
              : pagina === 'favoritos'
                ? vivos.filter((i) => i.favorito)
                : vivos;
  if (busca.trim()) exibidos = buscar(vivos, busca);
  return (
    <>
      {pagina === 'tarefas' && !busca.trim() && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <View style={{ flexDirection: 'row', gap: 7 }}>
            {(['pendentes', 'todas', 'concluidas'] as const).map((f) => (
              <Pressable
                key={f}
                accessibilityRole="button"
                accessibilityState={{ selected: filtro === f }}
                onPress={() => setFiltro(f)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: filtro === f ? cores.destaque : cores.suave,
                }}
              >
                <Texto
                  style={{ fontSize: 12, color: filtro === f ? cores.destaqueTexto : cores.texto }}
                >
                  {f === 'pendentes' ? 'Pendentes' : f === 'todas' ? 'Todas' : 'Concluídas'}
                </Texto>
              </Pressable>
            ))}
          </View>
          <Botao cores={cores} secundario onPress={() => setQuadro(!quadro)}>
            {quadro ? 'Ver em lista' : 'Ver em quadro'}
          </Botao>
        </View>
      )}
      {pagina === 'lixeira' && (
        <Texto style={{ color: cores.secundario }}>
          Os registros podem ser restaurados. A eliminação automática ainda não está ativa neste
          incremento.
        </Texto>
      )}
      {!exibidos.length ? (
        vazio(
          busca ? 'Nenhum registro por aqui.' : 'Este espaço está pronto para começar.',
          busca
            ? 'Tente outra palavra ou limpe a busca.'
            : 'Guarde uma ideia ou crie seu próximo passo.',
          pagina === 'tarefas' ? 'tarefa' : pagina === 'listas' ? 'lista' : 'nota',
        )
      ) : pagina === 'tarefas' && !busca.trim() ? (
        quadro ? (
          <ScrollView horizontal contentContainerStyle={{ gap: 14 }}>
            {(['A fazer', 'Em andamento', 'Aguardando', 'Concluída'] as const).map((e) => (
              <View
                key={e}
                style={{
                  width: 270,
                  backgroundColor: cores.suave,
                  borderRadius: 12,
                  padding: 14,
                  gap: 12,
                }}
              >
                <Texto titulo style={{ color: cores.texto }}>
                  {e} · {exibidos.filter((i) => i.estado === e).length}
                </Texto>
                {exibidos
                  .filter((i) => i.estado === e)
                  .map((i) => (
                    <Pressable
                      key={i.id}
                      accessibilityRole="button"
                      onPress={() => abrir('tarefa', i)}
                      style={{
                        padding: 15,
                        backgroundColor: cores.painel,
                        borderRadius: 10,
                        gap: 10,
                      }}
                    >
                      <Texto style={{ color: cores.texto }}>{i.titulo}</Texto>
                      <Texto
                        style={{ fontSize: 11, color: atrasada(i) ? cores.erro : cores.secundario }}
                      >
                        {nomeData(i.prazo)}
                      </Texto>
                    </Pressable>
                  ))}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View
            style={{
              backgroundColor: cores.painel,
              padding: mobile ? 8 : 18,
              borderWidth: 1,
              borderColor: cores.borda,
              borderRadius: 14,
            }}
          >
            {exibidos.map(linhaTarefa)}
          </View>
        )
      ) : pagina === 'listas' && !busca.trim() ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          {exibidos.map(listaCard)}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
          {exibidos.map(cartao)}
        </View>
      )}
    </>
  );
}
