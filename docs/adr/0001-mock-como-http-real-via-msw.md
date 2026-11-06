# O backend ausente é mockado como HTTP real, via MSW

Este front-end foi construído sem nenhum backend disponível, e o código precisa ser
acoplado a um backend real depois sem reescrita. Decidimos que o app fala HTTP de
verdade (`fetch` contra `VITE_API_URL`) e que a ausência de servidor é resolvida por
um Mock Service Worker que intercepta as requisições no navegador, e não por uma
camada de serviços com implementação falsa trocável.

## Considered Options

Uma camada de abstração (`services/*.ts` com implementação fake) seria mais simples de
escrever, mas o código de produção nunca exercitaria serialização, códigos de erro
HTTP, latência nem estados de carregamento reais: todos esses problemas apareceriam de
uma só vez no dia do acoplamento. Com MSW, acoplar significa apontar a `baseURL` e
parar de registrar o worker.

## Consequences

O store do mock vive em `localStorage` com sincronização por `BroadcastChannel`, para
que o fluxo cruzado entre papéis (Garçom lança, Painel de Preparo recebe) funcione
entre abas do mesmo navegador. Entre dispositivos diferentes ele não funciona, e isso
é aceito: é a fronteira do que um mock sem servidor alcança. A atualização do Painel de
Preparo é polling de 3s, isolado num único ponto de troca para WebSocket.

Os handlers do MSW e as fixtures são versionados e entregues junto com o código: eles
são a especificação executável que o time de backend implementa.
