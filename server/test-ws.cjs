const { WebSocket } = require('ws');

const ws = new WebSocket('ws://bc3a0794d6d350.lhr.life/u87s6vew');

ws.on('open', () => {
    console.log('Connected to WebSocket!');
    ws.close();
});

ws.on('error', (err) => {
    console.error('WebSocket Error:', err.message);
});

ws.on('close', (code, reason) => {
    console.log(`WebSocket closed: ${code} ${reason}`);
});
