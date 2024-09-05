const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;
let statusDisplay = document.getElementById('status-display'); 
let playerId = null;
let players = {};
let bombs = [];

const socket = new WebSocket('ws://localhost:8080');

socket.onopen = function() {
    socket.send(JSON.stringify({ type: 'screenSize', width: screenWidth, height: screenHeight }));
    updateStatus('Connecting to the server...');
};

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    switch (data.type) {
        case 'setBoardSize':
            adjustBoardSize(data.width, data.height);
            break;
        case 'connection':
            playerId = data.playerId;
            updateStatus(`You are connected as Player ${playerId}. Waiting for other players...`);
            break;
        case 'state-update':
            updateGameState(data.state);
            break;
        case 'ready':
            updateStatus('Both players are connected. Game starts now!');
            break;
        case 'error':
            alert(data.message);
            updateStatus(data.message);
            break;
    }
};

socket.onclose = function() {
    updateStatus('Disconnected from the server.');
};

socket.onerror = function(error) {
    updateStatus('Error connecting to the server.');
};

function adjustBoardSize(width, height) {
    const gameBoard = document.getElementById('game-board');
    gameBoard.style.width = `${width}px`;
    gameBoard.style.height = `${height}px`;
}

function updateGameState(state) {
    players = state.players;
    bombs = state.bombs;
    renderGame();
}

function renderGame() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = ''; // Limpar o tabuleiro

    // Renderizar jogadores
    Object.values(players).forEach(player => {
        const playerElement = document.createElement('div');
        playerElement.className = `player player${player.id}`;
        playerElement.style.top = `${player.y * 40}px`;
        playerElement.style.left = `${player.x * 40}px`;
        gameBoard.appendChild(playerElement);
    });

    // Renderizar bombas
    bombs.forEach(bomb => {
        const bombElement = document.createElement('div');
        bombElement.className = bomb.owner === 0 ? 'bomb-player1' : 'bomb-player2';  // Classes baseadas no dono da bomba
        bombElement.style.top = `${bomb.y * 40}px`;
        bombElement.style.left = `${bomb.x * 40}px`;
        gameBoard.appendChild(bombElement);
    });
}

function updateStatus(message) {
    if (statusDisplay) {
        statusDisplay.textContent = message;
    }
}

function sendMessageToServer(message){
    if(socket.readyState === WebSocket.OPEN){
        socket.send(JSON.stringify({type:'logMessage', content: message}));
    }else{
        console.log("WebSocket is not open. Message not sent.")
    }
}

document.addEventListener('keydown', function(event) {
    if (!playerId) return;
    let dx = 0, dy = 0;
    switch (event.key) {
        case 'w': // W para mover para cima
        case 'W':
            dy = -1;
            break;
        case 's': // S para mover para baixo
        case 'S':
            dy = 1;
            break;
        case 'a': // A para mover para a esquerda
        case 'A':
            dx = -1;
            break;
        case 'd': // D para mover para a direita
        case 'D':
            dx = 1;
            break;
        case ' ':  // Barra de espaço para colocar uma bomba
            event.preventDefault(); // Evita comportamento padrão da barra de espaço
            socket.send(JSON.stringify({ type: 'bomb', playerId }));
            return;
    }

    if (dx !== 0 || dy !== 0) {
        socket.send(JSON.stringify({ type: 'move', playerId, dx, dy }));
    }
});
