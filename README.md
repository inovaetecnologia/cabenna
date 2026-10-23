# Cabenna

Aplicativo da Inovae para conectar notas, documentos, tarefas, listas, agenda e pequenas equipes. A raiz `/` é o site institucional comercial; `/app` exige conta com e-mail confirmado. `/app?conta=criar` abre o cadastro e `/app?conta=entrar` abre a entrada. Não há mais avaliação anônima dentro do aplicativo.

Free inclui documentos com formatação e modelos, espaços, etiquetas, Meu Dia individual, tarefas recorrentes, agenda interna e histórico de sete dias. Pro tem teste pessoal de 14 dias e histórico ampliado. Equipes tem teste de 14 dias, até 15 participantes, papéis e permissões por espaço. Cobrança paga não está integrada. Veja [estado de desenvolvimento](docs/ESTADO.md), [estudo de produto](docs/ESTUDO_PRODUTO.md) e [atualização do banco](docs/ATUALIZACAO.md).

## Revisão da experiência

Hoje, Calendário e Meu espaço passam a concentrar o uso diário. A criação de planos conectados e a licença Master dependem da nova migração 0006. O responsável confirmou que 0002–0005 já foram executadas. Leia docs/ATUALIZACAO_0006.md antes de publicar. Não repita migrações já aplicadas. A pesquisa de dores e as decisões estão em docs/PESQUISA_DORES.md.

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

Abra http://localhost:8081 para o site institucional ou http://localhost:8081/app para o aplicativo. O comando `npm run web` serve apenas o app pelo servidor Expo; para visualizar o site institucional, use o build e o preview descritos acima. O app exige login mesmo no preview. O site público contém somente exemplos ilustrativos. Registros antigos do modo de avaliação não são enviados automaticamente para contas reais.

Os arquivos do site estão em `institucional/`, com HTML semântico, CSS responsivo e JavaScript limitado a menu, demonstração e FAQ. Logos oficiais e fontes são servidos pelo próprio domínio. `scripts/preparar-web.mjs` move a saída Expo para `/app/index.html` e coloca o site institucional na raiz do build. Não editar arquivos de `dist/`.

## Supabase

Projeto informado: `lgejykmmfybfwzqjgpqq`. Nenhuma migração foi aplicada remotamente nesta entrega.

1. No SQL Editor do projeto Cabenna, aplicar as migrações 0001 a 0005, em ordem, somente uma vez. Se 0001 já foi aplicada, executar apenas 0002 a 0005 conforme docs/ATUALIZACAO.md.
2. Copiar `.env.example` para `.env` e preencher a URL pública e a chave **publicável**, obtida em Settings > API Keys. Nunca usar chave secreta ou service_role.
3. Ativar confirmação de e-mail e configurar Site URL/Redirect URLs para o endereço real da Vercel **com `/app` no final** e `http://localhost:8081/app`. Manter somente e-mail e senha habilitados para a aplicação. O site preserva o encaminhamento de links de confirmação/recuperação antigos que ainda retornem à raiz com token ou código.
4. Configurar SMTP transacional e políticas de senha/limitação de tentativas antes de avaliação com contas externas.
5. Reiniciar Expo ou gerar outro build após alterar variáveis.

A tela de acesso oferece cadastro, login e recuperação. A troca de senha abre após o link de recuperação. A conta usa armazenamento remoto; as operações deste incremento requerem rede. Falhas não fecham o editor. Conflitos de versão são rejeitados no servidor e o texto permanece no editor para conciliação. A conta conectada não carrega exemplos locais como dados pessoais.

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

Reversão: as migrações desta versão trocam a arquitetura de escrita. Não promover o cliente antigo isoladamente, pois suas funções de escrita são revogadas. Preparar correção compatível do cliente e migração corretiva do banco. Backups e restauração do ambiente real ainda precisam ser configurados e verificados.

## Limites deste incremento

Contratação paga, anexos, cofre, importação, offline persistente, notificações e monitoramento operacional permanecem pendentes. As implementações e limites reais estão em docs/ESTADO.md. A PWA possui manifesto e instalação, mas requer conexão para uso com conta. Não há expurgo automático da lixeira.

Não aplicar npm audit fix --force sem analisar compatibilidade com Expo. Não são necessárias chaves secretas no cliente. Para usar o app é necessária uma conta confirmada; para atualizar o banco, use o SQL Editor administrativo do Supabase.
