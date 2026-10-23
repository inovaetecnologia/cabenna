import React, { useState } from 'react';
import { Modal, View, TextInput, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { X, Plus, Trash2, Check, Star } from 'lucide-react-native';
import * as Crypto from 'expo-crypto';
import { Texto, Botao, IconeBotao } from './ui';
import { Cores } from '../theme/cores';
import { Entrada, Item, Tipo, Estado, Linha, validarEntrada } from '../lib/itens';
export default function Editor({
  item,
  tipo,
  cores,
  onClose,
  onSave,
}: {
  item: Item | null;
  tipo: Tipo;
  cores: Cores;
  onClose: () => void;
  onSave: (entrada: Entrada) => Promise<void>;
}) {
  const [atual, setAtual] = useState<Tipo>(item?.tipo ?? tipo);
  const [titulo, setTitulo] = useState(item?.titulo ?? '');
  const [texto, setTexto] = useState(item?.texto ?? '');
  const [prazo, setPrazo] = useState(item?.prazo ?? '');
  const [estado, setEstado] = useState<Estado>(item?.estado ?? 'A fazer');
  const [linhas, setLinhas] = useState<Linha[]>(item?.checklist ?? []);
  const [novaLinha, setNovaLinha] = useState('');
  const [favorito, setFavorito] = useState(item?.favorito ?? false);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const { width } = useWindowDimensions();
  const entrada = () => ({
    tipo: atual,
    titulo,
    texto,
    prazo: atual === 'tarefa' ? prazo || null : null,
    estado,
    checklist: linhas,
    favorito,
  });
  const mudou =
    JSON.stringify(entrada()) !==
    JSON.stringify({
      tipo: item?.tipo ?? tipo,
      titulo: item?.titulo ?? '',
      texto: item?.texto ?? '',
      prazo: item?.prazo ?? null,
      estado: item?.estado ?? 'A fazer',
      checklist: item?.checklist ?? [],
      favorito: item?.favorito ?? false,
    });
  const fechar = () => {
    if (salvando) return;
    if (mudou) setConfirmar(true);
    else onClose();
  };
  const salvar = async () => {
    setErro('');
    setSalvando(true);
    try {
      let dados = entrada();
      if (novaLinha.trim())
        dados = {
          ...dados,
          checklist: [
            ...linhas,
            { id: Crypto.randomUUID(), texto: novaLinha.trim(), feita: false },
          ],
        };
      await onSave(validarEntrada(dados));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };
  const input = {
    color: cores.texto,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    backgroundColor: cores.fundo,
  };
  return (
    <Modal transparent animationType="fade" onRequestClose={fechar}>
      <View
        style={{
          flex: 1,
          backgroundColor: '#031D19AA',
          justifyContent: 'center',
          alignItems: 'center',
          padding: width < 600 ? 12 : 30,
        }}
      >
        <View
          accessibilityViewIsModal
          style={{
            width: '100%',
            maxWidth: 660,
            maxHeight: '94%',
            backgroundColor: cores.painel,
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              padding: 22,
              borderBottomWidth: 1,
              borderColor: cores.borda,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View>
              <Texto style={{ color: cores.secundario, fontSize: 11, letterSpacing: 1 }}>
                PESSOAL · PRIVADO
              </Texto>
              <Texto titulo style={{ fontSize: 22, color: cores.texto, lineHeight: 32 }}>
                {item ? 'Editar registro' : 'O que você quer guardar?'}
              </Texto>
            </View>
            <IconeBotao onPress={fechar} label="Fechar editor" cores={cores}>
              <X color={cores.secundario} size={20} />
            </IconeBotao>
          </View>
          <ScrollView
            contentContainerStyle={{ padding: 22, gap: 18 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['nota', 'tarefa', 'lista'] as Tipo[]).map((t) => (
                <Pressable
                  key={t}
                  accessibilityRole="button"
                  accessibilityState={{ selected: atual === t }}
                  onPress={() => setAtual(t)}
                  style={{
                    flex: 1,
                    minHeight: 44,
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: atual === t ? cores.destaque : cores.suave,
                    alignItems: 'center',
                  }}
                >
                  <Texto style={{ color: atual === t ? cores.destaqueTexto : cores.secundario }}>
                    {t === 'nota' ? 'Nota' : t === 'tarefa' ? 'Tarefa' : 'Lista'}
                  </Texto>
                </Pressable>
              ))}
            </View>
            <View style={{ gap: 6 }}>
              <Texto style={{ color: cores.texto }}>Título</Texto>
              <TextInput
                autoFocus
                accessibilityLabel="Título do registro"
                placeholder="Dê um nome à sua ideia"
                placeholderTextColor={cores.secundario}
                maxLength={200}
                value={titulo}
                onChangeText={setTitulo}
                style={[input, { fontSize: 18, fontFamily: 'Manrope_600SemiBold' }]}
              />
            </View>
            <View style={{ gap: 6 }}>
              <Texto style={{ color: cores.texto }}>
                {atual === 'nota' ? 'Sua ideia' : 'Observações'}
              </Texto>
              <TextInput
                accessibilityLabel="Conteúdo do registro"
                placeholder="Comece a escrever. Organize depois."
                placeholderTextColor={cores.secundario}
                value={texto}
                onChangeText={setTexto}
                multiline
                maxLength={50000}
                style={[
                  input,
                  {
                    minHeight: atual === 'nota' ? 170 : 85,
                    textAlignVertical: 'top',
                    lineHeight: 24,
                  },
                ]}
              />
            </View>
            {atual === 'tarefa' && (
              <>
                <View style={{ gap: 6 }}>
                  <Texto style={{ color: cores.texto }}>Prazo · opcional</Texto>
                  <TextInput
                    accessibilityLabel="Prazo no formato AAAA-MM-DD"
                    placeholder="AAAA-MM-DD"
                    placeholderTextColor={cores.secundario}
                    value={prazo}
                    onChangeText={setPrazo}
                    style={input}
                  />
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {(['A fazer', 'Em andamento', 'Aguardando', 'Concluída'] as Estado[]).map((e) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: estado === e }}
                      key={e}
                      onPress={() => setEstado(e)}
                      style={{
                        padding: 10,
                        borderRadius: 8,
                        backgroundColor: estado === e ? cores.destaque : cores.suave,
                      }}
                    >
                      <Texto
                        style={{
                          fontSize: 12,
                          color: estado === e ? cores.destaqueTexto : cores.texto,
                        }}
                      >
                        {e}
                      </Texto>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
            {atual === 'lista' && (
              <View style={{ gap: 8 }}>
                {linhas.map((l) => (
                  <View key={l.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityLabel={l.texto}
                      accessibilityState={{ checked: l.feita }}
                      onPress={() =>
                        setLinhas(
                          linhas.map((a) => (a.id === l.id ? { ...a, feita: !a.feita } : a)),
                        )
                      }
                      style={{
                        width: 44,
                        height: 44,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: cores.secundario,
                          backgroundColor: l.feita ? cores.destaque : 'transparent',
                        }}
                      >
                        {l.feita && <Check size={20} color={cores.destaqueTexto} />}
                      </View>
                    </Pressable>
                    <TextInput
                      accessibilityLabel="Texto do item da lista"
                      value={l.texto}
                      onChangeText={(v) =>
                        setLinhas(linhas.map((a) => (a.id === l.id ? { ...a, texto: v } : a)))
                      }
                      maxLength={500}
                      style={[input, { flex: 1 }]}
                    />
                    <IconeBotao
                      label={'Remover ' + l.texto}
                      onPress={() => setLinhas(linhas.filter((a) => a.id !== l.id))}
                      cores={cores}
                    >
                      <Trash2 size={17} color={cores.secundario} />
                    </IconeBotao>
                  </View>
                ))}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    accessibilityLabel="Novo item da lista"
                    placeholder="Adicionar um item"
                    placeholderTextColor={cores.secundario}
                    value={novaLinha}
                    onChangeText={setNovaLinha}
                    maxLength={500}
                    onSubmitEditing={() => {
                      if (novaLinha.trim()) {
                        setLinhas([
                          ...linhas,
                          { id: Crypto.randomUUID(), texto: novaLinha.trim(), feita: false },
                        ]);
                        setNovaLinha('');
                      }
                    }}
                    style={[input, { flex: 1 }]}
                  />
                  <Botao
                    cores={cores}
                    secundario
                    onPress={() => {
                      if (novaLinha.trim()) {
                        setLinhas([
                          ...linhas,
                          { id: Crypto.randomUUID(), texto: novaLinha.trim(), feita: false },
                        ]);
                        setNovaLinha('');
                      }
                    }}
                  >
                    Adicionar
                  </Botao>
                </View>
              </View>
            )}
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel="Fixar nos favoritos"
              accessibilityState={{ checked: favorito }}
              onPress={() => setFavorito(!favorito)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}
            >
              <Star
                size={18}
                color={cores.destaque}
                fill={favorito ? cores.destaque : 'transparent'}
              />
              <Texto style={{ color: cores.texto }}>Fixar nos favoritos</Texto>
            </Pressable>
            {erro && (
              <Texto accessibilityRole="alert" style={{ color: cores.erro }}>
                {erro}
              </Texto>
            )}
            {confirmar && (
              <View
                style={{ backgroundColor: cores.suave, padding: 14, borderRadius: 10, gap: 12 }}
              >
                <Texto style={{ color: cores.texto }}>
                  Há alterações ainda não salvas. Deseja descartá-las?
                </Texto>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Botao cores={cores} secundario onPress={() => setConfirmar(false)}>
                    Continuar editando
                  </Botao>
                  <Botao cores={cores} onPress={onClose}>
                    Descartar
                  </Botao>
                </View>
              </View>
            )}
          </ScrollView>
          <View
            style={{
              padding: 20,
              borderTopWidth: 1,
              borderColor: cores.borda,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Texto style={{ fontSize: 11, color: cores.secundario, flex: 1 }}>
              Salvamento ao tocar em Guardar
            </Texto>
            <Botao cores={cores} disabled={salvando} onPress={() => void salvar()}>
              {salvando ? 'Guardando…' : 'Guardar'}
            </Botao>
          </View>
        </View>
      </View>
    </Modal>
  );
}
