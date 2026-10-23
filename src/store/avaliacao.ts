import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Item, novoItem, dataLocal } from '../lib/itens';
export function exemplos(): Item[] {
  const base = {
    texto: '',
    prazo: null,
    estado: 'A fazer' as const,
    checklist: [],
    favorito: false,
  };
  return [
    novoItem('demo-nota', {
      ...base,
      tipo: 'nota',
      titulo: 'Um lugar para tirar as ideias da cabeça',
      texto:
        'Esta é uma nota de demonstração. Capture uma ideia, planeje seu dia e dê espaço ao que importa. Você pode editar ou remover todos os exemplos.',
      favorito: true,
    }),
    novoItem('demo-tarefa-1', {
      ...base,
      tipo: 'tarefa',
      titulo: 'Escolher meu foco de hoje',
      prazo: dataLocal(),
      favorito: true,
    }),
    novoItem('demo-tarefa-2', {
      ...base,
      tipo: 'tarefa',
      titulo: 'Organizar as ideias da semana',
      estado: 'Em andamento',
    }),
    novoItem('demo-lista', {
      ...base,
      tipo: 'lista',
      titulo: 'Pequenos passos para começar',
      checklist: [
        { id: '1', texto: 'Explorar o Meu dia', feita: true },
        { id: '2', texto: 'Guardar minha primeira ideia', feita: false },
        { id: '3', texto: 'Criar uma tarefa com prazo', feita: false },
      ],
    }),
  ];
}
type Store = {
  itens: Item[];
  iniciado: boolean;
  tema: 'claro' | 'escuro';
  iniciar: () => void;
  gravar: (item: Item) => Promise<void>;
  limpar: () => void;
  alternarTema: () => void;
};
export const useAvaliacao = create<Store>()(
  persist(
    (set, get) => ({
      itens: [],
      iniciado: false,
      tema: 'claro',
      iniciar: () => {
        if (!get().iniciado) set({ itens: exemplos(), iniciado: true });
      },
      gravar: async (item) => {
        const anteriores = get().itens;
        try {
          await set({ itens: [item, ...anteriores.filter((i) => i.id !== item.id)] });
        } catch {
          try {
            await set({ itens: anteriores });
          } catch {}
          throw new Error(
            'O navegador não conseguiu guardar. Confira o armazenamento disponível ou as permissões do navegador.',
          );
        }
      },
      limpar: () => set({ itens: [], iniciado: true }),
      alternarTema: () => set({ tema: get().tema === 'claro' ? 'escuro' : 'claro' }),
    }),
    {
      name: 'cabenna-avaliacao-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ itens, iniciado, tema }) => ({ itens, iniciado, tema }),
    },
  ),
);
