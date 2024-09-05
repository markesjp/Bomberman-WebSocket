const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let players = [];
let gameState = {
    players: {},
    bombs: []
};

const availableSlots = [0, 1]; // Dois slots disponíveis
const walls = [
    { x: 2, y: 2 },
    { x: 4, y: 4 },
    // Adicione outras coordenadas de paredes aqui
];

// Conexão de um novo cliente
wss.on('connection', function connection(ws) {
    if (availableSlots.length === 0) {
        ws.send(JSON.stringify({ type: 'error', message: 'Server full' }));
        ws.close();
        return;
    }

    const playerId = availableSlots.shift(); // Pega um slot disponível
    players[playerId] = ws;
    gameState.players[playerId] = {
        x: playerId === 0 ? 0 : 18,  // Player 1 (0) começa na coluna 0, Player 2 (1) na coluna 18
        y: playerId === 0 ? 0 : 14,  // Player 1 (0) começa na linha 0, Player 2 (1) na linha 14
        color: playerId === 0 ? 'blue' : 'red'
    };
    ws.send(JSON.stringify({ type: 'connection', playerId: playerId + 1 }));
    ws.send(JSON.stringify({ type: 'state-update', state: gameState }));

    if (Object.keys(gameState.players).length === 2) {
        broadcast({ type: 'ready', message: 'Both players are connected. Ready to start the game!' });
    }

    ws.on('message', function incoming(message) {
        let data;
        try {
            data = JSON.parse(message);
        } catch (e) {
            console.error('Invalid JSON received:', message);
            return;
        }

        switch (data.type) {
            case 'move':
                if (typeof data.playerId-1 !== 'undefined' && typeof data.dx === 'number' && typeof data.dy === 'number') {
                    handleMove(data.playerId-1, data.dx, data.dy);
                } else {
                    console.error('Invalid move data:', data);
                }
                break;
            case 'bomb':
                if (typeof data.playerId-1 !== 'undefined') {
                    handleBomb(data.playerId-1);
                } else {
                    console.error('Invalid bomb data:', data);
                }
                break;
            case 'logMessage':
                console.log("Message from client:", data.content);
                break;
            default:
                console.error('Unknown message type:', data);
                break;
        }
    });

    ws.on('close', function () {
        console.log('Player disconnected');
        availableSlots.push(playerId); // Libera o slot
        delete gameState.players[playerId];
        if (Object.keys(gameState.players).length < 2) {
            gameState.bombs = []; // Limpa as bombas se menos de dois jogadores estão conectados
        }
    });
});

function broadcast(message) {
    players.forEach(player => {
        if (player && player.readyState === WebSocket.OPEN) {
            player.send(JSON.stringify(message));
        }
    });
}

function handleMove(playerId, dx, dy) {
    if (typeof playerId === 'undefined' || !gameState.players[playerId]) {
        console.error(`Invalid playerId or player does not exist: ${playerId}`);
        return;
    }

    let player = gameState.players[playerId];
    if (!player) {
        console.error(`Player not found: ${playerId}`);
        return;
    }

    let newX = player.x + dx;
    let newY = player.y + dy;

    const isWall = walls.some(wall => wall.x === newX && wall.y === newY);
    const boardWidth = 19; // Colunas do tabuleiro
    const boardHeight = 15; // Linhas do tabuleiro

    // Verificar se a nova posição é válida e não é uma parede
    if (newX >= 0 && newX < boardWidth && newY >= 0 && newY < boardHeight && !isWall) {
        player.x = newX;
        player.y = newY;
        broadcast({ type: 'state-update', state: gameState });
    } else {
        console.log(`Move invalid for player ${playerId}: (${newX}, ${newY})`);
    }
}

function handleBomb(playerId) {
    const player = gameState.players[playerId];
    if (!player) {
        console.error(`Invalid playerId or player does not exist: ${playerId}`);
        return;
    }

    const bomb = {
        x: player.x,
        y: player.y,
        timer: 3000,  // 3 segundos até explodir
        owner: playerId
    };
    gameState.bombs.push(bomb);
    broadcast({ type: 'state-update', state: gameState });

    setTimeout(() => {
        explodeBomb(bomb);
    }, bomb.timer);
}

function explodeBomb(bomb) {
    console.log(`Bomb at (${bomb.x}, ${bomb.y}) exploded!`);
    gameState.bombs = gameState.bombs.filter(b => b !== bomb);
    const explosionRadius = 4;
    const explosionArea = [];
    for (let i = 1; i <= explosionRadius; i++) {
        explosionArea.push({ x: bomb.x + i, y: bomb.y });
        explosionArea.push({ x: bomb.x - i, y: bomb.y });
        explosionArea.push({ x: bomb.x, y: bomb.y + i });
        explosionArea.push({ x: bomb.x, y: bomb.y - i });
    }

    let winner = null;
    Object.values(gameState.players).forEach(player => {
        const hit = explosionArea.some(pos => pos.x === player.x && pos.y === player.y);
        if (hit) {
            console.log(`Player ${player.color} hit by bomb!`);
            winner = player.color;
        }
    });

    if (winner) {
        broadcast({ type: 'win', winner });
    } else {
        broadcast({ type: 'state-update', state: gameState });
    }
}

console.log('Server running on port 8080');
