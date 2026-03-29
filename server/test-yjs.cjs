const Y = require('yjs');
const { WebsocketProvider } = require('y-websocket');
const WebSocket = require('ws');

// Polyfill WebSocket for y-websocket in Node
global.WebSocket = WebSocket;

const ydoc1 = new Y.Doc();
const provider1 = new WebsocketProvider('ws://bc3a0794d6d350.lhr.life', 'u87s6vew', ydoc1);

provider1.on('status', event => {
    console.log('provider1 status:', event.status);
});

provider1.on('sync', isSynced => {
    console.log('provider1 sync:', isSynced);
});

provider1.on('connection-error', (event) => {
    console.log('provider1 connection-error', event);
});

// Hack into the internal websocket to see what happens
setTimeout(() => {
    if (provider1.ws) {
        console.log('Internal WS readyState after 3s:', provider1.ws.readyState);
        provider1.ws.addEventListener('close', (e) => console.log('WS Close:', e.code, e.reason));
        provider1.ws.addEventListener('error', (e) => console.log('WS Error:', e));
    } else {
        console.log('No internal WS created yet');
    }
}, 3000);

setTimeout(() => {
    provider1.disconnect();
    process.exit(0);
}, 5000);
