import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { ChevronLeft, ChevronRight, Plus, Clock3 } from 'lucide-react-native';
import { Item, dataLocal } from '../lib/itens';
import { diasDoMes, estaNaAgenda, fusoDoDispositivo, horarioLocal } from '../lib/agenda';
import { deslocarDia } from '../lib/experiencia';
import { segmentosDoDia } from '../lib/calendario';
import { Cores } from '../theme/cores';
import { Texto, Botao, IconeBotao } from './ui';
function PainelCalendario({
  horizontal,
  children,
}: {
  horizontal: boolean;
  children: React.ReactNode;
}) {
  return horizontal ? (
    <ScrollView
      horizontal
      contentContainerStyle={{
        flexDirection: 'row',
        gap: 22,
        alignItems: 'flex-start',
        flexGrow: 1,
      }}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={{ flexDirection: 'row', gap: 22, alignItems: 'flex-start' }}>{children}</View>
  );
}
const diasSemana = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
export function MiniMes({
  dia,
  mudar,
  cores,
}: {
  dia: string;
  mudar: (dia: string) => void;
  cores: Cores;
}) {
  const d = new Date(dia + 'T12:00:00');
  const [mes, setMes] = useState({ ano: d.getFullYear(), mes: d.getMonth() });
  useEffect(() => setMes({ ano: d.getFullYear(), mes: d.getMonth() }), [dia]);
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Texto
          titulo
          style={{ color: cores.texto, flex: 1, fontSize: 13, textTransform: 'capitalize' }}
        >
          {new Date(mes.ano, mes.mes, 1).toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric',
          })}
        </Texto>
        {[-1, 1].map((n) => (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={n < 0 ? 'Mês anterior' : 'Próximo mês'}
            onPress={() => {
              const a = new Date(mes.ano, mes.mes + n, 1);
              setMes({ ano: a.getFullYear(), mes: a.getMonth() });
            }}
            style={{ width: 32, height: 36, alignItems: 'center', justifyContent: 'center' }}
          >
            {n < 0 ? (
              <ChevronLeft size={15} color={cores.secundario} />
            ) : (
              <ChevronRight size={15} color={cores.secundario} />
            )}
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {diasSemana.map((a, i) => (
          <View key={i} style={{ width: '14.2857%', alignItems: 'center', paddingBottom: 8 }}>
            <Texto style={{ fontSize: 9, color: cores.secundario }}>{a.slice(0, 1)}</Texto>
          </View>
        ))}
        {diasDoMes(mes.ano, mes.mes).map((a) => (
          <Pressable
            key={a}
            accessibilityRole="button"
            accessibilityLabel={'Selecionar ' + a}
            accessibilityState={{ selected: dia === a }}
            aria-pressed={dia === a}
            onPress={() => mudar(a)}
            style={{
              width: '14.2857%',
              height: 34,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 29,
                height: 29,
                borderRadius: 15,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor:
                  dia === a ? cores.destaque : a === dataLocal() ? cores.suave : 'transparent',
              }}
            >
              <Texto
                style={{
                  fontSize: 11,
                  color:
                    dia === a
                      ? cores.destaqueTexto
                      : Number(a.slice(5, 7)) !== mes.mes + 1
                        ? cores.secundario
                        : cores.texto,
                  opacity: Number(a.slice(5, 7)) !== mes.mes + 1 ? 0.45 : 1,
                }}
              >
                {Number(a.slice(8))}
              </Texto>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
export default function Agenda({
  itens,
  cores,
  abrir,
  criar,
  leitura = false,
}: {
  itens: Item[];
  cores: Cores;
  abrir: (i: Item) => void;
  criar: (dia?: string, hora?: string) => void;
  leitura?: boolean;
}) {
  const { width } = useWindowDimensions();
  const [modo, setModo] = useState<'dia' | 'semana' | 'mes'>(width < 700 ? 'dia' : 'semana');
  const [dia, setDia] = useState(dataLocal());
  const rolagem = useRef<ScrollView>(null);
  const fuso = fusoDoDispositivo();
  const base = new Date(dia + 'T12:00:00');
  const segunda = deslocarDia(dia, -((base.getDay() + 6) % 7));
  const dias =
    modo === 'dia' ? [dia] : Array.from({ length: 7 }, (_, i) => deslocarDia(segunda, i));
  const mover = (n: number) => {
    if (modo === 'mes') {
      const d = new Date(base.getFullYear(), base.getMonth() + n, 1, 12);
      setDia(dataLocal(d));
    } else setDia(deslocarDia(dia, n * (modo === 'semana' ? 7 : 1)));
  };
  useEffect(() => {
    if (modo !== 'mes') rolagem.current?.scrollTo({ y: 7 * 64, animated: false });
  }, [modo]);
  const corItem = (i: Item) => (i.tipo === 'tarefa' ? '#A85D43' : cores.destaque);
  const fundos = (i: Item) =>
    i.tipo === 'tarefa' ? (cores.fundo === '#0C211D' ? '#49372F' : '#FAE9D9') : cores.suave;
  return (
    <View style={{ gap: 20 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
        <View style={{ flex: 1, minWidth: 170 }}>
          <Texto
            titulo
            style={{
              fontSize: 30,
              lineHeight: 41,
              color: cores.texto,
              textTransform: 'capitalize',
            }}
          >
            {base.toLocaleDateString('pt-BR', { month: 'long' })}{' '}
            <Texto style={{ fontSize: 26, color: cores.secundario }}>{base.getFullYear()}</Texto>
          </Texto>
          <Texto style={{ fontSize: 11, color: cores.secundario }}>
            Seu tempo, com espaço para viver.
          </Texto>
        </View>
        <View
          style={{
            flexDirection: 'row',
            padding: 4,
            backgroundColor: cores.suave,
            borderRadius: 11,
          }}
        >
          {(['dia', 'semana', 'mes'] as const).map((m) => (
            <Pressable
              key={m}
              accessibilityRole="button"
              accessibilityState={{ selected: m === modo }}
              aria-pressed={m === modo}
              onPress={() => setModo(m)}
              style={{
                minHeight: 38,
                paddingHorizontal: 13,
                borderRadius: 8,
                justifyContent: 'center',
                backgroundColor: m === modo ? cores.painel : 'transparent',
              }}
            >
              <Texto style={{ fontSize: 12, color: cores.texto }}>
                {m === 'dia' ? 'Dia' : m === 'semana' ? 'Semana' : 'Mês'}
              </Texto>
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconeBotao cores={cores} label="Período anterior" onPress={() => mover(-1)}>
            <ChevronLeft size={19} color={cores.texto} />
          </IconeBotao>
          <Botao cores={cores} secundario onPress={() => setDia(dataLocal())}>
            Hoje
          </Botao>
          <IconeBotao cores={cores} label="Próximo período" onPress={() => mover(1)}>
            <ChevronRight size={19} color={cores.texto} />
          </IconeBotao>
        </View>
        {!leitura && (
          <Botao
            cores={cores}
            onPress={() => criar(dia, '09:00')}
            icone={<Plus size={16} color={cores.destaqueTexto} />}
          >
            Compromisso
          </Botao>
        )}
      </View>
      <PainelCalendario horizontal={width < 700 && modo === 'semana'}>
        {width > 1150 && (
          <View style={{ width: 210, gap: 28, paddingTop: 8 }}>
            <MiniMes dia={dia} mudar={setDia} cores={cores} />
            <View style={{ gap: 12 }}>
              <Texto titulo style={{ color: cores.texto, fontSize: 12 }}>
                NO SEU CALENDÁRIO
              </Texto>
              {[
                { cor: cores.destaque, n: 'Compromissos' },
                { cor: '#A85D43', n: 'Tempo para tarefas' },
              ].map((v) => (
                <View key={v.n} style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 3, backgroundColor: v.cor }} />
                  <Texto style={{ fontSize: 12, color: cores.secundario }}>{v.n}</Texto>
                </View>
              ))}
              <Texto style={{ fontSize: 10, color: cores.secundario, lineHeight: 18 }}>
                Os prazos aparecem no topo. Reserve um horário na tarefa para dar tempo à execução.
              </Texto>
            </View>
          </View>
        )}
        <View
          style={{
            flex: 1,
            minWidth: width < 700 && modo === 'semana' ? 650 : 0,
            borderWidth: 1,
            borderColor: cores.borda,
            borderRadius: 16,
            backgroundColor: cores.painel,
            overflow: 'hidden',
          }}
        >
          {modo === 'mes' ? (
            <>
              <View style={{ flexDirection: 'row' }}>
                {diasSemana.map((d) => (
                  <View
                    key={d}
                    style={{ width: '14.2857%', paddingVertical: 15, alignItems: 'center' }}
                  >
                    <Texto style={{ fontSize: 10, color: cores.secundario }}>{d}</Texto>
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {diasDoMes(base.getFullYear(), base.getMonth()).map((d) => {
                  const rs = itens.filter((i) => estaNaAgenda(i, d, fuso));
                  return (
                    <Pressable
                      key={d}
                      accessibilityRole="button"
                      accessibilityLabel={'Abrir ' + d + ', ' + rs.length + ' registros'}
                      onPress={() => {
                        setDia(d);
                        setModo('dia');
                      }}
                      style={{
                        width: '14.2857%',
                        minHeight: width < 650 ? 80 : 120,
                        borderTopWidth: 1,
                        borderRightWidth: 1,
                        borderColor: cores.borda,
                        padding: width < 650 ? 4 : 9,
                        backgroundColor: d === dia ? cores.suave : cores.painel,
                        gap: 5,
                      }}
                    >
                      <Texto
                        style={{
                          fontSize: 13,
                          color: d === dataLocal() ? '#B65640' : cores.texto,
                          opacity: d.slice(5, 7) === dia.slice(5, 7) ? 1 : 0.4,
                          fontFamily: 'Inter_600SemiBold',
                        }}
                      >
                        {Number(d.slice(8))}
                      </Texto>
                      {rs.slice(0, width < 650 ? 1 : 3).map((i) => (
                        <View
                          key={i.id}
                          style={{
                            padding: 3,
                            borderLeftWidth: 2,
                            borderColor: corItem(i),
                            backgroundColor: fundos(i),
                            borderRadius: 3,
                          }}
                        >
                          <Texto
                            numberOfLines={1}
                            style={{ fontSize: 10, lineHeight: 15, color: cores.texto }}
                          >
                            {i.titulo}
                          </Texto>
                        </View>
                      ))}
                      {rs.length > (width < 650 ? 1 : 3) && (
                        <Texto style={{ fontSize: 9, color: cores.secundario }}>
                          +{rs.length - (width < 650 ? 1 : 3)}
                        </Texto>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  paddingLeft: 48,
                  borderBottomWidth: 1,
                  borderColor: cores.borda,
                }}
              >
                {dias.map((d) => (
                  <Pressable
                    key={d}
                    accessibilityRole="button"
                    accessibilityLabel={'Ver dia ' + d}
                    onPress={() => {
                      setDia(d);
                      if (modo === 'semana' && width < 650) setModo('dia');
                    }}
                    style={{ flex: 1, alignItems: 'center', paddingVertical: 13, gap: 4 }}
                  >
                    <Texto style={{ fontSize: 9, color: cores.secundario }}>
                      {new Date(d + 'T12:00:00')
                        .toLocaleDateString('pt-BR', { weekday: 'short' })
                        .toUpperCase()}
                    </Texto>
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor:
                          d === dataLocal() ? '#B65B42' : d === dia ? cores.suave : 'transparent',
                      }}
                    >
                      <Texto
                        titulo
                        style={{
                          fontSize: 18,
                          lineHeight: 27,
                          color: d === dataLocal() ? '#FFFFFF' : cores.texto,
                        }}
                      >
                        {Number(d.slice(8))}
                      </Texto>
                    </View>
                  </Pressable>
                ))}
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  paddingLeft: 48,
                  borderBottomWidth: 1,
                  borderColor: cores.borda,
                  minHeight: 48,
                }}
              >
                {dias.map((d) => (
                  <View
                    key={d}
                    style={{
                      flex: 1,
                      gap: 4,
                      padding: 4,
                      borderLeftWidth: 1,
                      borderColor: cores.borda,
                    }}
                  >
                    {itens
                      .filter(
                        (i) =>
                          estaNaAgenda(i, d, fuso) &&
                          (i.dados?.dia_inteiro || (i.tipo === 'tarefa' && i.prazo === d)),
                      )
                      .map((i) => (
                        <Pressable
                          key={i.id}
                          accessibilityRole="button"
                          onPress={() => abrir(i)}
                          style={{ padding: 5, backgroundColor: fundos(i), borderRadius: 4 }}
                        >
                          <Texto numberOfLines={1} style={{ fontSize: 10, color: cores.texto }}>
                            {i.tipo === 'tarefa' ? 'Prazo · ' : ''}
                            {i.titulo}
                          </Texto>
                        </Pressable>
                      ))}
                  </View>
                ))}
              </View>
              <ScrollView
                ref={rolagem}
                style={{ height: width < 650 ? 520 : 580 }}
                nestedScrollEnabled
              >
                <View style={{ flexDirection: 'row', height: 24 * 64 }}>
                  <View style={{ width: 48 }}>
                    {Array.from({ length: 24 }, (_, h) => (
                      <View key={h} style={{ height: 64, alignItems: 'center' }}>
                        <Texto style={{ fontSize: 10, lineHeight: 17, color: cores.secundario }}>
                          {String(h).padStart(2, '0')}:00
                        </Texto>
                      </View>
                    ))}
                  </View>
                  {dias.map((d) => (
                    <View key={d} style={{ flex: 1, borderLeftWidth: 1, borderColor: cores.borda }}>
                      {Array.from({ length: 24 }, (_, h) => (
                        <Pressable
                          key={h}
                          accessibilityRole="button"
                          accessibilityLabel={
                            'Reservar ' + d + ' às ' + String(h).padStart(2, '0') + ' horas'
                          }
                          disabled={leitura}
                          onPress={() => criar(d, String(h).padStart(2, '0') + ':00')}
                          style={{
                            position: 'absolute',
                            top: h * 64,
                            left: 0,
                            right: 0,
                            height: 64,
                            borderTopWidth: 1,
                            borderColor: cores.borda,
                          }}
                        />
                      ))}
                      {segmentosDoDia(itens, d, fuso).map((s) => (
                        <Pressable
                          key={s.item.id}
                          accessibilityRole="button"
                          accessibilityLabel={
                            s.item.titulo +
                            ', ' +
                            horarioLocal(
                              (s.item.tipo === 'evento'
                                ? s.item.dados?.inicio
                                : s.item.dados?.bloco_inicio)!,
                              fuso,
                            ).slice(11)
                          }
                          onPress={() => abrir(s.item)}
                          style={{
                            position: 'absolute',
                            top: (s.inicio / 60) * 64 + 1,
                            height: Math.max(27, ((s.fim - s.inicio) / 60) * 64 - 3),
                            left: ((s.coluna / s.colunas) * 100 + '%') as `${number}%`,
                            width: (100 / s.colunas + '%') as `${number}%`,
                            borderLeftWidth: 3,
                            borderColor: corItem(s.item),
                            backgroundColor: fundos(s.item),
                            borderRadius: 5,
                            padding: 6,
                            overflow: 'hidden',
                          }}
                        >
                          <Texto
                            numberOfLines={2}
                            style={{
                              fontSize: 11,
                              lineHeight: 16,
                              fontFamily: 'Inter_600SemiBold',
                              color: cores.texto,
                            }}
                          >
                            {s.item.titulo}
                          </Texto>
                          <Texto numberOfLines={1} style={{ fontSize: 9, color: cores.secundario }}>
                            {horarioLocal(
                              (s.item.tipo === 'evento'
                                ? s.item.dados?.inicio
                                : s.item.dados?.bloco_inicio)!,
                              fuso,
                            ).slice(11)}
                          </Texto>
                        </Pressable>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </>
          )}
          <View
            style={{
              padding: 12,
              borderTopWidth: 1,
              borderColor: cores.borda,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Clock3 size={12} color={cores.secundario} />
            <Texto style={{ fontSize: 10, color: cores.secundario }}>
              Agenda do contexto atual · {fuso}
              {!leitura ? ' · Toque em um horário para reservar.' : ''}
            </Texto>
          </View>
        </View>
      </PainelCalendario>
    </View>
  );
}
