# Tailwind CSS v3 em vez de v4, e Rollup em WebAssembly

A maquina de desenvolvimento deste projeto roda com o **Smart App Control** do Windows
ligado em modo de bloqueio (`VerifiedAndReputablePolicyState = 1`), que impede o
carregamento de modulos nativos `.node` nao assinados. Isso derruba tres dependencias
da cadeia de build moderna: `@rollup/rollup-win32-x64-msvc`, `@tailwindcss/oxide` e
`lightningcss`.

Decidimos usar **Tailwind CSS v3 com PostCSS** (100% JavaScript, sem binario nativo) e
substituir o Rollup nativo pelo pacote **`@rollup/wasm-node`** via `overrides` no
`package.json`. Com isso o projeto tem zero modulos `.node` e roda sob a politica.

## Considered Options

A alternativa era desligar o Smart App Control. Foi recusada porque a politica **nao
pode ser religada** sem reinstalar o Windows: trocar uma protecao permanente do sistema
operacional pela conveniencia de uma versao de biblioteca e um mau negocio. Tailwind v4
traria sintaxe CSS-first (`@theme`), e nada mais que o projeto use.

## Consequences

O tema vive em `tailwind.config.js` e em variaveis CSS no `index.css`, no formato v3, e
`shadcn/ui` e escrito no dialeto v3. O build fica alguns segundos mais lento por causa
do Rollup em WebAssembly.

Nada disso vale para o CI, que roda em Ubuntu sem a politica: se o projeto migrar para
outra maquina de desenvolvimento, a decisao pode ser revertida removendo o `overrides` e
voltando a `tailwindcss@4` + `@tailwindcss/vite`. O motivo esta registrado aqui para que
essa reversao seja uma escolha consciente, e nao uma surpresa.
