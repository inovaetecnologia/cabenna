import React from 'react';
import { Text, TextProps, Pressable, View } from 'react-native';
import { Cores } from '../theme/cores';
export function Texto(props: TextProps & { titulo?: boolean }) {
  const { titulo, style, ...rest } = props;
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: titulo ? 'Manrope_700Bold' : 'Inter_400Regular',
          fontSize: 14,
          lineHeight: 22,
        },
        style,
      ]}
    />
  );
}
export function Botao({
  children,
  onPress,
  cores,
  secundario = false,
  disabled = false,
  icone,
  rotulo,
}: {
  children: React.ReactNode;
  onPress: () => void;
  cores: Cores;
  secundario?: boolean;
  disabled?: boolean;
  icone?: React.ReactNode;
  rotulo?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed, hovered }: any) => [
        {
          minHeight: 44,
          paddingHorizontal: 18,
          paddingVertical: 11,
          borderRadius: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: secundario ? cores.suave : cores.destaque,
          opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
        },
        hovered && { opacity: 0.85 },
      ]}
    >
      {icone}
      <Texto
        style={{
          fontFamily: 'Inter_600SemiBold',
          color: secundario ? cores.texto : cores.destaqueTexto,
        }}
      >
        {children}
      </Texto>
    </Pressable>
  );
}
export function IconeBotao({
  onPress,
  label,
  children,
  cores,
}: {
  onPress: () => void;
  label: string;
  children: React.ReactNode;
  cores: Cores;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ hovered }: any) => ({
        width: 44,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: hovered ? cores.suave : 'transparent',
      })}
    >
      {children}
    </Pressable>
  );
}
export function Selo({ texto, cores }: { texto: string; cores: Cores }) {
  return (
    <View
      style={{
        backgroundColor: cores.suave,
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 6,
      }}
    >
      <Texto style={{ fontSize: 11, color: cores.secundario, lineHeight: 18 }}>{texto}</Texto>
    </View>
  );
}
