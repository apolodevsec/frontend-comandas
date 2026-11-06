# O total de uma Comanda é dado do servidor, nunca calculado em componente

Decidimos que nenhum componente React soma o consumo de uma Comanda: o total, os
subtotais e a Taxa de Serviço vêm da API como valores prontos, e o front apenas os
exibe. No mock, quem calcula é o handler do MSW, exercendo o papel do servidor.

Se o front e o backend calcularem o mesmo total de forma independente, eles divergirão
— por arredondamento, por regra de taxa de serviço, por item cancelado contado
diferente — e o cliente verá um valor na tela do Caixa e outro na nota. Em dinheiro,
divergência não é bug cosmético.

## Consequences

Dinheiro é representado como centavos em inteiro (`1990`), nunca como `number` em
reais, e a formatação acontece só na exibição. A consequência incômoda é que mudanças
de quantidade exigem ida ao servidor em vez de recálculo otimista local; aceitamos a
latência em troca de um único lugar com autoridade sobre valores.
