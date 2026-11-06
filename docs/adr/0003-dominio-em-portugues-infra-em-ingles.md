# Termos de domínio em português, infraestrutura em inglês

Decidimos que os identificadores que nomeiam conceitos do domínio ficam em português
(`Comanda`, `Mesa`, `Pedido`, `ItemDoPedido`, `Destino`, `/api/comandas`), enquanto
tudo que é infraestrutura permanece em inglês (`apiClient`, `useQuery`,
`formatCurrency`). A UI é pt-BR fixo, sem biblioteca de i18n.

`Comanda` não tem tradução honesta para o inglês: `Tab`, `Check` e `Ticket` significam
coisas diferentes e nenhum carrega o conceito. Traduzir o domínio criaria uma camada de
tradução entre a linguagem do restaurante, o glossário e o código — exatamente o atrito
que um modelo de domínio existe para eliminar.

## Consequences

A mistura dos dois idiomas no mesmo arquivo parece inconsistência à primeira vista, e
sem este registro alguém tentaria "padronizar" tudo para inglês, matando os termos do
`GLOSSARY.md` no processo. A regra é: se o termo está no glossário, é português; se não
está, é inglês. O i18n foi dispensado porque um restaurante não opera bilíngue, e a
ausência dele é reversível.
