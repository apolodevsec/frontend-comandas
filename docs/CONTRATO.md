# Contrato da API

Este documento descreve o que o front-end espera do backend. Ele foi definido pelo
front na ausencia de um backend, e tem duas formas executaveis que valem mais que esta
prosa:

- **`src/domain/tipos.ts`** — os tipos TypeScript de todo payload.
- **`src/mocks/handlers.ts`** + **`src/mocks/*.test.ts`** — a implementacao de
  referencia e os testes que ela precisa passar. Rodar `npm test` verifica o contrato.

Base: `VITE_API_URL` (padrao `/api`).

## Convencoes

**Dinheiro** sempre em centavos, inteiro: `1990` e R$ 19,90. Nunca ponto flutuante.

**Totais** sao calculados pelo servidor e enviados prontos no campo `totais` da Comanda.
O front nao soma conta (`docs/adr/0002-servidor-e-fonte-de-verdade-do-total.md`).

**Papel do usuario**: no mock vai no header `x-papel`. No backend real deve sair do
token em `Authorization: Bearer`, e o header pode ser ignorado.

**Erros** tem sempre este corpo:

```json
{ "erro": { "codigo": "COMANDA_NAO_ABERTA", "mensagem": "Somente uma Comanda aberta aceita lancamento." } }
```

| Status | Quando                                                       |
| ------ | ------------------------------------------------------------ |
| 401    | credenciais invalidas                                        |
| 403    | papel sem permissao para a operacao                          |
| 404    | recurso inexistente                                          |
| 409    | conflito de estado (a operacao nao cabe no estado atual)     |
| 422    | payload invalido (campo obrigatorio, valor fora de faixa)    |

Codigos de erro em uso: `CREDENCIAIS_INVALIDAS`, `COMANDA_NAO_ENCONTRADA`,
`COMANDA_NAO_ABERTA`, `COMANDA_NAO_FECHADA`, `COMANDA_COM_CONSUMO`,
`COMANDA_ENCERRADA`, `MESA_NAO_ENCONTRADA`, `MESA_OCUPADA`, `ITEM_NAO_ENCONTRADO`,
`ITEM_INDISPONIVEL`, `PEDIDO_NAO_ENCONTRADO`, `PEDIDO_NAO_PRONTO`, `PEDIDO_JA_PRONTO`,
`PEDIDO_CANCELADO`, `PREPARO_JA_CONCLUIDO`, `DESTINO_AUSENTE`, `PAPEL_SEM_PERMISSAO`,
`MOTIVO_OBRIGATORIO`, `VALOR_INVALIDO`, `PAYLOAD_INVALIDO`.

## Endpoints

### Sessao

| Metodo | Caminho       | Corpo                   | Resposta                      |
| ------ | ------------- | ----------------------- | ----------------------------- |
| POST   | `/sessao`     | `{ usuario, senha }`    | `{ token, usuario }` ou 401   |

`usuario` nunca traz a senha de volta.

### Catalogo

| Metodo | Caminho      | Resposta                                        |
| ------ | ------------ | ----------------------------------------------- |
| GET    | `/cardapio`  | `ItemDoCardapio[]`                              |
| GET    | `/mesas`     | `MesaNaVisao[]` (Mesa + `status` + `comandaId`) |

`status` da Mesa e **derivado** da Comanda vinculada: `livre` sem Comanda ativa,
`ocupada` com Comanda `aberta`, `conta_pedida` com Comanda `fechada`. A Mesa nao guarda
estado proprio.

### Comandas

| Metodo | Caminho                            | Corpo                        | Resposta      |
| ------ | ---------------------------------- | ---------------------------- | ------------- |
| GET    | `/comandas?status=`                | —                            | `Comanda[]`   |
| POST   | `/comandas`                        | `{ mesaId, garcomId }`       | 201 `Comanda` |
| GET    | `/comandas/:id`                    | —                            | `Comanda`     |
| POST   | `/comandas/:id/pedidos`            | `{ itens: [...] }`           | 201 `Comanda` |
| POST   | `/comandas/:id/fechar`             | —                            | `Comanda`     |
| POST   | `/comandas/:id/reabrir`            | `{ motivo }`                 | `Comanda`     |
| POST   | `/comandas/:id/cancelar`           | —                            | `Comanda`     |
| PATCH  | `/comandas/:id/taxa-de-servico`    | `{ aplicada: boolean }`      | `Comanda`     |
| POST   | `/comandas/:id/pagamentos`         | `{ forma, valorEmCentavos }` | `Comanda`     |

Toda mutacao devolve a **Comanda inteira e atualizada**, com `totais` recalculados.

`mesaId: null` abre uma **Comanda Avulsa** (balcao). Mesa com Comanda ativa responde
409 `MESA_OCUPADA`: existe no maximo uma Comanda aberta por Mesa.

Item de `/comandas/:id/pedidos`: `{ itemDoCardapioId, quantidade, observacao }`.
`quantidade` e inteiro >= 1. O servidor **congela** nome, preco e destino do Cardapio no
Item do Pedido, e abre o preparo como `pendente` em cada Destino presente na rodada.

Maquina de estados da Comanda: `aberta -> fechada -> paga`, mais `cancelada`.
`fechada -> aberta` e permitido com `motivo` nao vazio. `paga` e `cancelada` sao
terminais. Cancelar exige Comanda sem consumo. A Comanda vira `paga` sozinha quando a
soma dos pagamentos cobre o total; saldo negativo e troco.

### Preparo e entrega

| Metodo | Caminho                     | Corpo         | Resposta             |
| ------ | --------------------------- | ------------- | -------------------- |
| GET    | `/preparo?destino=`         | —             | `TicketDePreparo[]`  |
| GET    | `/entregas`                 | —             | `EntregaPendente[]`  |
| POST   | `/pedidos/:id/avancar`      | `{ destino }` | `Comanda`            |
| POST   | `/pedidos/:id/entregar`     | —             | `Comanda`            |
| POST   | `/pedidos/:id/cancelar`     | —             | `Comanda`            |

`destino` e obrigatorio em `/preparo` (422 sem ele) e vale `cozinha` ou `bar`. Cada
ticket traz **apenas os itens daquele Destino**.

`avancar` move `pendente -> em_preparo -> pronto` e exige que o papel responda pelo
Destino (403 caso contrario). Um Pedido so esta `pronto` quando **todos** os seus
Destinos estao prontos, e so entao aparece em `/entregas`.

`entregar` e exclusivo do papel `garcom` e exige Pedido `pronto`.
`cancelar` recusa Pedido `pronto` ou `entregue`, e cancela todos os Itens do Pedido.

## O que o mock faz e o backend nao precisa fazer

- Guardar estado em `localStorage` e avisar outras abas por `BroadcastChannel`.
- Ler o papel do header `x-papel`.
- Numerar ids como `comanda-1`, `pedido-comanda-1-1`: o backend usa os seus proprios.

## O que falta para a fase 2

Admin (cardapio, mesas, usuarios, relatorios), transferencia e juncao de mesas,
couvert, desconto, impressao e WebSocket no lugar do polling.
