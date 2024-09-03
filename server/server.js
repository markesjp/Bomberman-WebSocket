const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let players = [];
let gameState = {};

let playersReady = 0;

wss.on('connection', function connection(ws) {
    if (players.length < 2) {
        players.push(ws);
        ws.send(JSON.stringify({ type: 'connection', playerId: players.length }));
        console.log('Player ' + players.length + ' connected');
        
        if (players.length === 2) {
            players.forEach(player => {
                player.send(JSON.stringify({ type: 'ready', message: 'Both players are connected. Ready to start the game!' }));
            });
        }
    } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Server full' }));
        ws.close();
        console.log('Connection attempt when server is full');
    }

    ws.on('message', function incoming(message) {
        const data = JSON.parse(message);
        if (data.type === 'move' || data.type === 'bomb') {
            gameState[data.playerId] = data;
            broadcast(ws, message);
        } else if (data.type === 'start') {
            playersReady++;
            if (playersReady === 2) {
                players.forEach(player => {
                    player.send(JSON.stringify({ type: 'start-game' }));
                });
            }
        }
    });

    ws.on('close', function close() {
        players = players.filter(player => player !== ws);
        playersReady = 0; // Reset ready count if a player disconnects
        console.log('Player disconnected');
    });
});

function broadcast(sender, message) {
    players.forEach(player => {
        if (player !== sender && player.readyState === WebSocket.OPEN) {
            player.send(message);
        }
    });
}

console.log('Server running on port 8080');
