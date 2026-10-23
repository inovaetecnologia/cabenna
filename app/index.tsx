import { Redirect } from 'expo-router';

// A página institucional é estática no build. No servidor Expo, abre o app.
export default function Inicio() {
  return <Redirect href="/app" />;
}
