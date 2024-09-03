
# Bomberman Game

## Descrição

Este é um jogo Bomberman simples implementado em HTML, CSS, e JavaScript, com suporte para dois jogadores, tanto no modo offline quanto online usando WebSockets.

## Como Jogar

- **Offline**: 
  - Jogador 1: Usa as teclas W, A, S, D para mover e a tecla Espaço para colocar uma bomba.
  - Jogador 2: Usa as setas do teclado para mover e a tecla 5 do Numpad para colocar uma bomba.

- **Online**: 
  - Execute o servidor Node.js.
  - Conecte dois clientes ao servidor para jogar.

## Instruções para Execução

1. Execute `npm install` para instalar as dependências.
2. Execute `node server/server.js` para iniciar o servidor.
3. Abra `index.html` em dois navegadores diferentes e conecte ao servidor para jogar online.

## Estrutura do Projeto

- `index.html`: Contém a estrutura HTML do jogo.
- `css/styles.css`: Estilos para o jogo.
- `js/game.js`: Lógica do jogo em JavaScript.
- `server/server.js`: Servidor WebSocket para o modo online.

## Dependências

- Node.js
- WebSocket (`ws`): Um módulo WebSocket para Node.js. É necessário para permitir a comunicação em tempo real entre os clientes conectados ao servidor.

## Instruções Adicionais

- Para instalar o módulo WebSocket, execute `npm install ws` no diretório do projeto.
