# Comandas — Operação de Salão

Linguagem do sistema de comandas de restaurante: o consumo que acontece no salão,
desde a chegada do cliente até o pagamento. Cobre os papéis de salão, cozinha e caixa.

## Language

**Comanda**:
O registro do consumo de uma mesa ou de um cliente de balcão, aberto na chegada e
encerrado no pagamento. Existe no máximo uma Comanda aberta por Mesa.
_Avoid_: ficha, conta, tab, pedido

**Comanda Avulsa**:
Uma Comanda que não está vinculada a nenhuma Mesa, usada em consumo de balcão.
_Avoid_: comanda solta, comanda de balcão, comanda sem mesa

**Mesa**:
Um lugar físico do salão identificado por número, ao qual uma Comanda pode estar
vinculada. Uma Mesa existe independentemente de ter Comanda aberta.
_Avoid_: table, local, posição

**Pedido**:
Um conjunto de Itens do Pedido lançado de uma vez numa Comanda, correspondendo a uma
rodada de consumo. É a unidade que a Cozinha recebe e a unidade de cancelamento.
_Avoid_: ticket, rodada, lancamento, comanda

**Item do Pedido**:
Uma unidade de consumo dentro de um Pedido: o que foi pedido, em que quantidade e a
que preco.
_Avoid_: produto, linha, item de comanda

**Fechamento**:
O encerramento de uma Comanda: o consumo é totalizado e deixa de aceitar novos
lançamentos.
_Avoid_: finalização, baixa, encerrar conta

**Divisão de Conta**:
Uma operação feita no Caixa durante o Fechamento, que reparte o total de uma única
Comanda entre vários pagantes. Não gera Comandas novas.
_Avoid_: split, rateio, dividir comanda, subcomanda

**Garçom**:
O papel que abre Comandas e lança consumo nelas a partir do salão.
_Avoid_: atendente, waiter, salão

**Cozinha**:
O Destino de preparo dos Itens do Pedido que exigem produção de comida, e o papel que
acompanha e sinaliza o preparo desses itens.
_Avoid_: KDS, produção, chapa

**Bar**:
O Destino de preparo dos Itens do Pedido servidos sem produção de cozinha, e o papel
que os prepara e sinaliza.
_Avoid_: copa, chopeira, bebidas

**Destino**:
O lugar responsável por preparar um Item do Pedido: Cozinha ou Bar. Um Pedido está
pronto quando todos os seus Destinos sinalizaram pronto.
_Avoid_: setor, local de preparo, estação

**Caixa**:
O papel que executa o Fechamento de Comandas e registra o pagamento.
_Avoid_: PDV, frente de caixa, cashier

**Cardápio**:
O conjunto de Itens do Cardápio que o restaurante oferece, organizado em categorias.
_Avoid_: menu, carta, catálogo

**Item do Cardápio**:
Algo que o restaurante oferece à venda, com preço, Destino de preparo e indicação de
disponibilidade. Dá origem a um Item do Pedido quando é lançado.
_Avoid_: produto, prato, SKU

**Observação**:
Um texto livre que o Garçom anexa a um Item do Pedido para instruir o preparo.
_Avoid_: modificador, adicional, complemento, nota

**Taxa de Serviço**:
Um acréscimo percentual sobre o consumo de uma Comanda, aplicado no Fechamento e
recusável pelo cliente.
_Avoid_: gorjeta, 10%, service charge
