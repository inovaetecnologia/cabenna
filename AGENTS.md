# Cabenna

Leia README.md e docs/ESTADO.md antes de modificar. O dossiê de produto da Inovae é a referência de escopo; a execução é incremental. Nunca apresente funcionalidade prevista como pronta.

- Expo SDK 57, React Native Web, TypeScript estrito e Zustand. Nomes de negócio em português.
- Use os arquivos oficiais em Cabenna_Artes_Identidade_Visual. Paleta em src/theme/cores.ts. Manrope para títulos e Inter para textos.
- Componentes usam Texto de src/components/ui.tsx. Regra pura em src/lib com testes.
- Variáveis Expo públicas são lidas literalmente em src/data/config.ts. Somente chave publicável no cliente. Nunca registrar credenciais ou conteúdo pessoal.
- Migrações SQL são acrescentadas. Não modificar migração aplicada a ambiente externo.
- Banco decide acesso. Toda tabela nova precisa de RLS e grants explícitos. Testar isolamento em PostgreSQL/PGlite.
- Conteúdo de cofre não pertence a itens_pessoais. Sua implementação depende de modelo de chaves e revisão específica.
- Validar com npm run typecheck, npm test e npm run build:web. Conferir telas em 390 px e desktop, temas claro e escuro.
- Não fazer push, deploy ou alterar ambiente remoto sem considerar o combinado vigente com Luís Felipe. Nesta sessão ele indicou que faz pushes pelo GitHub instalado.
