import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Item, dataLocal } from '../lib/itens';
import { diasDoMes, estaNaAgenda, fusoDoDispositivo, horarioLocal } from '../lib/agenda';
import { Cores } from '../theme/cores';
import { Texto, Botao } from './ui';
import { Escolha } from './formulario';
export default function Agenda({
  itens,
  cores,
  abrir,
  criar,
}: {
  itens: Item[];
  cores: Cores;
  abrir: (i: Item) => void;
  criar: () => void;
}) {
  const [centro, setCentro] = useState(dataLocal());
  const [modo, setModo] = useState('mes');
  const [selecionado, setSelecionado] = useState(dataLocal());
  const base = new Date(centro + 'T12:00:00');
  const fuso = fusoDoDispositivo();
  const mover = (n: number) => {
    const d = new Date(base);
    if (modo === 'mes') d.setMonth(d.getMonth() + n, 1);
    else d.setDate(d.getDate() + n * (modo === 'semana' ? 7 : 1));
    setCentro(dataLocal(d));
    setSelecionado(dataLocal(d));
  };
  const mes = diasDoMes(base.getFullYear(), base.getMonth());
  const segunda = new Date(base);
  segunda.setDate(segunda.getDate() - ((segunda.getDay() + 6) % 7));
  const dias =
    modo === 'mes'
      ? mes
      : modo === 'semana'
        ? Array.from({ length: 7 }, (_, i) =>
            dataLocal(
              new Date(segunda.getFullYear(), segunda.getMonth(), segunda.getDate() + i, 12),
            ),
          )
        : [centro];
  const doDia = itens.filter((i) => estaNaAgenda(i, selecionado, fuso));
  return (
    <View style={{ gap: 20 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <Botao cores={cores} secundario onPress={() => mover(-1)} rotulo="Período anterior">
          ←
        </Botao>
        <Texto titulo style={{ color: cores.texto, flex: 1, minWidth: 140, fontSize: 19 }}>
          {base.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </Texto>
        <Botao
          cores={cores}
          secundario
          onPress={() => {
            setCentro(dataLocal());
            setSelecionado(dataLocal());
          }}
        >
          Hoje
        </Botao>
        <Botao cores={cores} secundario onPress={() => mover(1)} rotulo="Próximo período">
          →
        </Botao>
      </View>
      <Escolha
        label={'Agenda interna · ' + fuso}
        valor={modo}
        mudar={setModo}
        cores={cores}
        opcoes={[
          { valor: 'dia', nome: 'Dia' },
          { valor: 'semana', nome: 'Semana' },
          { valor: 'mes', nome: 'Mês' },
        ]}
      />
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          borderTopWidth: 1,
          borderLeftWidth: 1,
          borderColor: cores.borda,
        }}
      >
        {dias.map((d) => {
          const registros = itens.filter((i) => estaNaAgenda(i, d, fuso));
          return (
            <Pressable
              key={d}
              accessibilityRole="button"
              accessibilityLabel={d + ', ' + registros.length + ' registros'}
              onPress={() => setSelecionado(d)}
              style={{
                width: modo === 'dia' ? '100%' : '14.2857%',
                minHeight: modo === 'mes' ? 85 : 120,
                padding: 7,
                borderRightWidth: 1,
                borderBottomWidth: 1,
                borderColor: cores.borda,
                backgroundColor: d === selecionado ? cores.suave : cores.painel,
              }}
            >
              <Texto
                style={{
                  color: d === dataLocal() ? cores.destaque : cores.secundario,
                  fontSize: 12,
                  fontFamily: 'Inter_600SemiBold',
                }}
              >
                {new Date(d + 'T12:00:00').getDate()}
              </Texto>
              {registros.slice(0, 2).map((i) => (
                <Texto
                  key={i.id}
                  numberOfLines={1}
                  style={{ fontSize: 10, lineHeight: 17, color: cores.texto }}
                >
                  {i.tipo === 'tarefa' ? '✓ ' : ''}
                  {i.titulo}
                </Texto>
              ))}
              {registros.length > 2 && (
                <Texto style={{ fontSize: 10, color: cores.secundario }}>
                  +{registros.length - 2}
                </Texto>
              )}
            </Pressable>
          );
        })}
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Texto titulo style={{ color: cores.texto, fontSize: 18 }}>
          {new Date(selecionado + 'T12:00:00').toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
          })}
        </Texto>
        <Botao cores={cores} onPress={criar}>
          Novo evento
        </Botao>
      </View>
      {!doDia.length && (
        <Texto style={{ color: cores.secundario }}>
          Seu dia está aberto. Reserve tempo para o que importa.
        </Texto>
      )}
      {doDia.map((i) => (
        <Pressable
          key={i.id}
          accessibilityRole="button"
          onPress={() => abrir(i)}
          style={{
            padding: 18,
            gap: 5,
            borderLeftWidth: 3,
            borderColor: cores.destaque,
            backgroundColor: cores.painel,
            borderRadius: 8,
          }}
        >
          <Texto titulo style={{ color: cores.texto }}>
            {i.titulo}
          </Texto>
          <Texto style={{ fontSize: 12, color: cores.secundario }}>
            {i.tipo === 'evento'
              ? i.dados?.dia_inteiro
                ? 'Dia inteiro'
                : i.dados?.inicio
                  ? horarioLocal(i.dados.inicio, fuso).replace('T', ' · ')
                  : 'Evento'
              : [
                  i.prazo === selecionado ? 'Prazo da tarefa' : '',
                  i.dados?.bloco_inicio
                    ? 'Tempo reservado · ' + horarioLocal(i.dados.bloco_inicio, fuso).slice(11)
                    : '',
                ]
                  .filter(Boolean)
                  .join(' · ')}
            {i.dados?.local ? ' · ' + i.dados.local : ''}
          </Texto>
        </Pressable>
      ))}
    </View>
  );
}
