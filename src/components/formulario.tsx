import React from 'react';
import { View, TextInput, Pressable, Modal, ScrollView, useWindowDimensions } from 'react-native';
import { X } from 'lucide-react-native';
import { Texto, IconeBotao } from './ui';
import { Cores } from '../theme/cores';
export function Campo({
  label,
  valor,
  mudar,
  cores,
  multiline = false,
  placeholder = '',
  maxLength = 200,
}: {
  label: string;
  valor: string;
  mudar: (v: string) => void;
  cores: Cores;
  multiline?: boolean;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <View style={{ gap: 7 }}>
      <Texto style={{ color: cores.texto, fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
        {label}
      </Texto>
      <TextInput
        accessibilityLabel={label}
        value={valor}
        onChangeText={mudar}
        placeholder={placeholder}
        placeholderTextColor={cores.secundario}
        maxLength={maxLength}
        multiline={multiline}
        style={{
          backgroundColor: cores.fundo,
          color: cores.texto,
          borderColor: cores.borda,
          borderWidth: 1,
          borderRadius: 9,
          minHeight: multiline ? 100 : 48,
          padding: 13,
          fontSize: 14,
          fontFamily: 'Inter_400Regular',
          textAlignVertical: 'top',
          lineHeight: 23,
        }}
      />
    </View>
  );
}
export function Escolha<T extends string>({
  label,
  opcoes,
  valor,
  mudar,
  cores,
}: {
  label: string;
  opcoes: { valor: T; nome: string }[];
  valor: T;
  mudar: (v: T) => void;
  cores: Cores;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Texto style={{ color: cores.secundario, fontSize: 11 }}>{label}</Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
        {opcoes.map((o) => (
          <Pressable
            key={o.valor}
            accessibilityRole="button"
            accessibilityLabel={label + ': ' + o.nome}
            accessibilityState={{ selected: valor === o.valor }}
            onPress={() => mudar(o.valor)}
            style={{
              minHeight: 44,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 8,
              justifyContent: 'center',
              backgroundColor: valor === o.valor ? cores.destaque : cores.suave,
            }}
          >
            <Texto
              style={{ color: valor === o.valor ? cores.destaqueTexto : cores.texto, fontSize: 12 }}
            >
              {o.nome}
            </Texto>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
export function Janela({
  titulo,
  subtitulo,
  cores,
  fechar,
  children,
  rodape,
  larga = false,
}: {
  titulo: string;
  subtitulo?: string;
  cores: Cores;
  fechar: () => void;
  children: React.ReactNode;
  rodape?: React.ReactNode;
  larga?: boolean;
}) {
  const { width } = useWindowDimensions();
  return (
    <Modal transparent animationType="fade" onRequestClose={fechar}>
      <View
        style={{
          flex: 1,
          backgroundColor: '#041C18AA',
          padding: width < 600 ? 10 : 28,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          accessibilityViewIsModal
          style={{
            width: '100%',
            maxWidth: larga ? 950 : 650,
            maxHeight: '95%',
            backgroundColor: cores.painel,
            borderRadius: 18,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              padding: 22,
              borderBottomWidth: 1,
              borderColor: cores.borda,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View style={{ flex: 1, gap: 3 }}>
              {subtitulo && (
                <Texto style={{ fontSize: 10, letterSpacing: 1, color: cores.secundario }}>
                  {subtitulo}
                </Texto>
              )}
              <Texto titulo style={{ fontSize: 22, lineHeight: 32, color: cores.texto }}>
                {titulo}
              </Texto>
            </View>
            <IconeBotao cores={cores} label="Fechar janela" onPress={fechar}>
              <X size={20} color={cores.secundario} />
            </IconeBotao>
          </View>
          <ScrollView
            contentContainerStyle={{ padding: 22, gap: 18 }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
          {rodape && (
            <View style={{ padding: 18, borderTopWidth: 1, borderColor: cores.borda }}>
              {rodape}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
