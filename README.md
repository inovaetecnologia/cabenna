# Cabenna

Aplicativo de organização pessoal e pequenas equipes da Inovae. Primeiro incremento funcional para avaliação interna: Meu dia, notas de texto, tarefas, listas, favoritos, busca, arquivo e lixeira. Os demais módulos do dossiê estão no backlog, descrito em docs/ESTADO.md.

## Executar

Requisitos: Node.js 24 e npm. Na pasta do projeto:

```powershell
npm ci
npm run web
```

Para avaliar o build de produção:

```powershell
npm run build:web
npm run preview
```

Abra http://localhost:8081. A avaliação local fica explicitamente identificada na tela. Os exemplos podem ser editados e apagados. Os dados desse modo ficam neste navegador, não têm backup remoto e não são importados automaticamente para contas reais.

## Supabase

Projeto informado: `lgejykmmfybfwzqjgpqq`. Nenhuma migração foi aplicada remotamente nesta entrega.

1. No SQL Editor do projeto Cabenna, aplicar `supabase/migrations/0001_itens_pessoais.sql`.
2. Copiar `.env.example` para `.env` e preencher a URL pública e a chave **publicável**, obtida em Settings > API Keys. Nunca usar chave secreta ou service_role.
3. Ativar confirmação de e-mail e configurar Site URL/Redirect URLs para o endereço real da Vercel e `http://localhost:8081`. Manter somente e-mail e senha habilitados para a aplicação.
4. Configurar SMTP transacional e políticas de senha/limitação de tentativas antes de avaliação com contas externas.
5. Reiniciar Expo ou gerar outro build após alterar variáveis.

O botão Conectar conta oferece cadastro, login, recuperação e troca de senha após link de recuperação. A conta usa armazenamento remoto; as operações deste incremento requerem rede. Falhas não fecham o editor. Conflitos de versão são rejeitados no servidor e o texto permanece no editor para conciliação. A conta conectada não carrega exemplos locais como dados pessoais.

## Validar

```powershell
npm run typecheck
npm test
npm run build:web
```

Testes usam PostgreSQL embarcado PGlite para executar a migração e conferir RLS, privilégios, escrita por RPC, concorrência e restauração, além das regras de busca, prazo e validação. O GitHub Actions executa essas verificações em pushes e PRs.

## Git e Vercel

Remote: https://github.com/inovaetecnologia/cabenna

Abra esta pasta em File > Add local repository no GitHub Desktop. O histórico de origem foi preservado. Revise as alterações, crie o commit e faça o push pelo fluxo da Inovae.

Vercel: https://vercel.com/cat-team3/cabenna

Configuração já em `vercel.json`: build `npm run build:web`, saída `dist`, framework Other. Cadastrar as duas variáveis EXPO_PUBLIC do `.env.example` separadamente nos ambientes Preview e Production. Aplicar o banco antes de publicar versão dependente. Conferir os logs e testar duas contas depois da publicação. Push na branch vinculada poderá acionar publicação automática conforme a configuração da Vercel.

Reversão do app: promover o deploy anterior na Vercel. Banco: não apagar tabelas com dados; preparar migração corretiva. Backups e restauração do ambiente real ainda precisam ser configurados e verificados.

## Limites deste incremento

Não é a entrega comercial completa. Agenda, documentos ricos, anexos, equipes, compartilhamento, cofre, recorrência, offline de conta, cobranças, administração, exportação e backup operacional permanecem pendentes. A PWA possui manifesto e instalação, mas não mantém shell offline nesta etapa. Não há expurgo automático da lixeira ou aplicação comercial de retenção.

Auditoria de dependências do SDK 57 tem alertas transitivos descritos em docs/ESTADO.md. Não aplicar `npm audit fix --force`, que sugere rebaixamentos incompatíveis do Expo. Nenhum segredo é necessário para rodar a avaliação local.
