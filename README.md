# Comandas — front-end

Front-end de um sistema de comandas para restaurante: **12 telas** para os papeis de
Garcom, Cozinha/Bar e Caixa. Nao existe backend; o app fala HTTP de verdade contra um
mock que roda no navegador, e o contrato dessa API e parte da entrega.

Linguagem do dominio em `GLOSSARY.md`. Decisoes em `docs/adr/`. Contrato da API em
`docs/CONTRATO.md`.

## Rodar

```bash
npm install
npm run dev          # http://localhost:5173
npm run hooks:install  # ativa o pre-push que roda a verificacao completa
```

Usuarios de demonstracao (senha `123456` para todos):

| Usuario | Papel   | Vai para   |
| ------- | ------- | ---------- |
| `u-1`   | garcom  | `/salao`   |
| `u-2`   | cozinha | `/preparo` |
| `u-3`   | bar     | `/preparo` |
| `u-4`   | caixa   | `/caixa`   |

### Ver o fluxo entre papeis

O mock guarda o estado em `localStorage` e avisa as outras abas por `BroadcastChannel`.
Abra **duas abas do mesmo navegador**, entre como `u-1` numa e `u-2` na outra: o que o
Garcom lanca aparece no painel da Cozinha em ate 3 segundos.

Entre **dispositivos diferentes** isso nao funciona, e e esperado: sem servidor, nao ha
como. Esta registrado em `docs/adr/0001-mock-como-http-real-via-msw.md`.

## Verificar

```bash
npm run typecheck   # tsc nos dois projetos (app e ferramentas)
npm run lint        # eslint, zero avisos tolerados
npm run test        # Vitest: dominio, precificacao, contrato e telas
npm run test:e2e    # Playwright: 3 fluxos ponta a ponta
npm run verify      # typecheck + lint + test + build  (o que o pre-push roda)
npm run verify:full # verify + e2e
```

93 testes cobrem, em ordem de valor: as transicoes de estado do dominio, a
totalizacao em centavos, **o contrato HTTP** (que e a especificacao do backend) e
quatro comportamentos de tela. Layout e responsividade nao tem teste: isso se confere
com o olho, no prototipo publicado.

## Protocolo de deploy

Duas barreiras, nenhuma opcional:

1. **Local** — `.githooks/pre-push` roda `npm run verify`. Push falha se algo falhar.
2. **CI** (`.github/workflows/ci.yml`) — `verify` -> `e2e` -> `deploy`. O job de deploy
   declara `needs: [verify, e2e]` e `if: github.ref == 'refs/heads/main'`: nada chega ao
   GitHub Pages sem os dois verdes.

Para o Pages funcionar, ligue-o uma vez em **Settings -> Pages -> Source: GitHub
Actions**. O build do Pages usa `VITE_BASE_PATH=/frontend-comandas/`, e o `build` gera
um `404.html` identico ao `index.html` para que rotas profundas funcionem.

## Acoplar ao backend real

Tres passos, nenhum deles mexe em componente:

1. `VITE_API_URL=https://api.seu-dominio.com` no `.env.local`.
2. `VITE_USAR_MOCK=false` — `src/main.tsx` deixa de registrar o service worker.
3. Entregue `docs/CONTRATO.md`, `src/domain/tipos.ts` e `src/mocks/` ao time de backend:
   os handlers do MSW sao a implementacao de referencia e `src/mocks/*.test.ts` sao os
   testes que a API precisa passar.

Quando o backend expuser WebSocket, troque o polling em
`INTERVALO_DE_POLLING` (`src/api/cliente.ts`) — e o unico ponto que precisa mudar.

O header `x-papel` existe porque o mock nao le JWT; com autenticacao real, o backend
tira o papel do token e ignora o header.

## Estrutura

```
src/
├── domain/        O CONTRATO: tipos, maquinas de estado, precificacao
├── api/           O CONTRATO: cliente HTTP e hooks de query/mutation
├── mocks/         handlers do MSW, fixtures, store (localStorage + BroadcastChannel)
├── app/           router, providers, layouts por papel
├── features/
│   ├── auth/      login, sessao, guarda de rota por papel
│   ├── salao/     Garcom: mesas, comanda, lancamento, entregas, balcao
│   ├── preparo/   Cozinha e Bar: painel filtrado por Destino
│   └── caixa/     fila, fechamento, pagamento, conferencia
├── components/
│   ├── ui/        primitivos (shadcn escrito no repo, nao em dependencia)
│   └── dominio    consumo, totais e etiquetas de status
└── lib/           formatacao de dinheiro e hora
```

Pastas por papel, nao por tipo de arquivo: `domain/` e `api/` juntos sao o pacote que o
time de backend le.

## Stack

React 19 · TypeScript strict · Vite · React Router 7 · TanStack Query (estado de
servidor) · Zustand (estado de UI) · Tailwind CSS 3 + shadcn/ui · MSW 2 · Vitest +
Testing Library · Playwright.

Tailwind e v3, nao v4, e o Rollup roda em WebAssembly: a maquina de desenvolvimento tem
Smart App Control ligado, que bloqueia modulos nativos. Motivo em
`docs/adr/0004-tailwind-v3-por-politica-de-integridade-de-codigo.md`.

## Fora de escopo nesta fase

Admin (cardapio, mesas, usuarios, relatorios), transferir e juntar mesas, reserva,
delivery, impressao de conta, couvert e desconto. O que foi decidido e por que esta em
`docs/adr/`.
