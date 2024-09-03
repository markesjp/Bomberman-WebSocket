
const board = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

let players = {
    1: { x: 1, y: 1, element: null, alive: true },
    2: { x: 11, y: 7, element: null, alive: true }
};

let playerId = null;
let gameStarted = false;

const gameBoard = document.getElementById('game-board');
const startButton = document.createElement('button');
startButton.innerText = "Start Game";
startButton.disabled = true;
document.body.appendChild(startButton);

startButton.addEventListener('click', startGame);

const socket = new WebSocket('ws://localhost:8080');

socket.addEventListener('message', function(event) {
    const data = JSON.parse(event.data);

    if (data.type === 'connection') {
        playerId = data.playerId;
        console.log(`Connected as Player ${playerId}`);
    } else if (data.type === 'ready') {
        console.log(data.message);
        startButton.disabled = false;
    } else if (data.type === 'start-game') {
        gameStarted = true;
        startButton.disabled = true;
        renderBoard();
        initializePlayers();
        console.log("Game started!");
    } else if (data.type === 'move' || data.type === 'bomb') {
        handleRemoteAction(data);
    }
});

function startGame() {
    socket.send(JSON.stringify({ type: 'start', playerId }));
    console.log("Waiting for the other player to start...");
}

function renderBoard() {
    gameBoard.innerHTML = '';
    for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            if (board[y][x] === 1) {
                cell.classList.add('wall');
            }
            gameBoard.appendChild(cell);
        }
    }
}

function initializePlayers() {
    Object.keys(players).forEach(playerId => {
        const playerData = players[playerId];
        const playerElement = document.createElement('div');
        playerElement.classList.add('player', `player${playerId}`);
        playerElement.style.gridRowStart = playerData.y + 1;
        playerElement.style.gridColumnStart = playerData.x + 1;
        gameBoard.appendChild(playerElement);
        players[playerId].element = playerElement;
    });
}

function movePlayer(player, dx, dy) {
    const playerData = players[player];
    const newX = playerData.x + dx;
    const newY = playerData.y + dy;
    if (board[newY][newX] === 0) {
        positionPlayer(player, newX, newY);
        socket.send(JSON.stringify({ type: 'move', playerId: player, dx, dy }));
    }
}

function positionPlayer(player, x, y) {
    const playerData = players[player];
    playerData.x = x;
    playerData.y = y;
    const index = y * 13 + x;
    const cell = gameBoard.children[index];
    cell.innerHTML = '';
    cell.appendChild(playerData.element);
    console.log(`Player ${player} moved to (${x}, ${y})`);
}

function placeBomb(player) {
    const playerData = players[player];
    const bomb = document.createElement('div');
    bomb.classList.add('bomb');
    const index = playerData.y * 13 + playerData.x;
    const cell = gameBoard.children[index];
    cell.appendChild(bomb);
    socket.send(JSON.stringify({ type: 'bomb', playerId: player, x: playerData.x, y: playerData.y }));
    setTimeout(() => {
        detonateBomb(playerData.x, playerData.y);
        bomb.remove();
    }, 3000);
}

function detonateBomb(x, y) {
    const explosionCells = getExplosionCells(x, y);
    explosionCells.forEach(cell => {
        if (cell) {
            cell.classList.add('explosion');
            setTimeout(() => cell.classList.remove('explosion'), 500);
        }
    });
}

function getExplosionCells(x, y) {
    const cells = [];
    cells.push(gameBoard.children[y * 13 + x]); // Central
    for (let i = 1; i <= 4; i++) {
        if (x - i >= 0) cells.push(gameBoard.children[y * 13 + (x - i)]); // Esquerda
        if (x + i < 13) cells.push(gameBoard.children[y * 13 + (x + i)]); // Direita
        if (y - i >= 0) cells.push(gameBoard.children[(y - i) * 13 + x]); // Cima
        if (y + i < 9) cells.push(gameBoard.children[(y + i) * 13 + x]); // Baixo
    }
    return cells;
}

function handleRemoteAction(data) {
    if (data.type === 'move') {
        const { playerId, dx, dy } = data;
        movePlayer(playerId, dx, dy);
    } else if (data.type === 'bomb') {
        placeBomb(data.playerId);
    }
}

document.addEventListener('keydown', function(event) {
    if (!gameStarted) return;

    if (playerId === 1) {
        switch (event.key) {
            case 'w':
                movePlayer(1, 0, -1);
                break;
            case 'a':
                movePlayer(1, -1, 0);
                break;
            case 's':
                movePlayer(1, 0, 1);
                break;
            case 'd':
                movePlayer(1, 1, 0);
                break;
            case ' ':
                placeBomb(1);
                break;
        }
    } else if (playerId === 2) {
        switch (event.key) {
            case 'ArrowUp':
                movePlayer(2, 0, -1);
                break;
            case 'ArrowLeft':
                movePlayer(2, -1, 0);
                break;
            case 'ArrowDown':
                movePlayer(2, 0, 1);
                break;
            case 'ArrowRight':
                movePlayer(2, 1, 0);
                break;
            case ' ':
                placeBomb(2);
                break;
        }
    }
});
