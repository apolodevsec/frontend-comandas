# Comandas

Front-end de um sistema de comandas para restaurante: 12 telas para os papéis de
garçom, cozinha, bar e caixa.

Não existe backend. O app faz requisições HTTP de verdade contra um mock que roda
dentro do navegador, então ele funciona sozinho e já está pronto para ser ligado a uma
API real sem mudar nenhum componente.

## Como rodar

Requisito: Node 20 ou superior.

```
npm install
npm run dev
```

Abra http://localhost:5173 e entre com um dos usuários de demonstração. A senha de
todos é `123456`.

- `u-1` — garçom, abre no mapa de mesas
- `u-2` — cozinha, abre no painel de preparo
- `u-3` — bar, abre no painel de preparo
- `u-4` — caixa, abre na fila de comandas

O estado fica no navegador. Para começar de zero, limpe o `localStorage` do site ou
abra uma janela anônima.

## Como ver o fluxo entre os papéis

Abra duas abas do mesmo navegador. Entre como `u-1` em uma e `u-2` na outra. O que o
garçom lança aparece no painel da cozinha em até 3 segundos.

Entre dispositivos diferentes isso não funciona, porque o mock vive no navegador e não
há servidor para sincronizar. O motivo está em `docs/adr/0001-mock-como-http-real-via-msw.md`.

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção em `dist/`
- `npm run preview` — serve o build localmente
- `npm run typecheck` — TypeScript
- `npm run lint` — ESLint, sem tolerar avisos
- `npm run test` — 93 testes de domínio, precificação, contrato e telas
- `npm run test:e2e` — 3 fluxos ponta a ponta no Playwright
- `npm run verify` — typecheck, lint, test e build, nessa ordem
- `npm run hooks:install` — ativa o hook que roda `verify` antes de cada push

Em máquinas com o Smart App Control do Windows ligado, `test:e2e` não roda: a política
bloqueia o navegador do Playwright. Esses testes rodam no CI, em Linux.

## Como acoplar ao backend

1. Crie um `.env.local` com `VITE_API_URL=https://sua-api` e `VITE_USAR_MOCK=false`.
2. Pronto. O `src/main.tsx` deixa de registrar o mock e o app passa a falar com a API.
3. Entregue ao time de backend o `docs/CONTRATO.md`, o `src/domain/tipos.ts` e a pasta
   `src/mocks/`: os handlers são a implementação de referência e os testes em
   `src/mocks/*.test.ts` são o que a API precisa passar.

Quando a API expuser WebSocket, troque o `INTERVALO_DE_POLLING` em `src/api/cliente.ts`.
É o único ponto que precisa mudar.

O header `x-papel` existe só porque o mock não lê JWT. Com autenticação real, o backend
tira o papel do token e ignora o header.

## Deploy

O workflow em `.github/workflows/ci.yml` roda `verify`, depois `e2e`, e só então
publica no GitHub Pages. O job de deploy declara `needs: [verify, e2e]` e só age na
branch `main`: nada sobe sem os dois verdes.

Para o Pages funcionar é preciso habilitá-lo uma vez em Settings, Pages, Source:
GitHub Actions.

## Estrutura

- `src/domain` — tipos do contrato, máquinas de estado e precificação
- `src/api` — cliente HTTP e hooks de query e mutation
- `src/mocks` — handlers do mock, cardápio e mesas de exemplo
- `src/app` — rotas, providers e layouts
- `src/features` — uma pasta por papel: `auth`, `salao`, `preparo`, `caixa`
- `src/components` — primitivos de UI e componentes de domínio
- `src/lib` — formatação de dinheiro e hora
- `e2e` — fluxos do Playwright

`src/domain` e `src/api` juntos são o pacote que o time de backend lê.

## Stack

React 19, TypeScript, Vite, React Router, TanStack Query, Zustand, Tailwind CSS,
shadcn/ui, MSW, Vitest com Testing Library e Playwright.

Tailwind está na versão 3 e o Rollup roda em WebAssembly por uma restrição da máquina
de desenvolvimento, explicada em
`docs/adr/0004-tailwind-v3-por-politica-de-integridade-de-codigo.md`.

## Documentação

- `GLOSSARY.md` — a linguagem do domínio: o que é Comanda, Pedido, Destino, Fechamento
- `docs/CONTRATO.md` — todos os endpoints, payloads e códigos de erro
- `docs/adr/` — as decisões de arquitetura e por que foram tomadas

## Fora do escopo desta fase

Administração de cardápio, mesas e usuários, relatórios, transferência e junção de
mesas, reserva, delivery, impressão de conta, couvert e desconto.
