import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const COLORS = [
    '#ff6b6b', '#51cf66', '#339af0', '#fcc419', '#cc5de8',
    '#ff922b', '#22b8cf', '#20c997', '#f06595', '#7950f2',
];

function getRandomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export function createCollaboration(roomId, userName, isAI = false) {
    const ydoc = new Y.Doc();

    // Dynamic URL: works for localhost, LAN, and tunneled connections
    const isDev = import.meta.env.DEV;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = isDev ? 'ws://localhost:3001' : `${protocol}//${window.location.host}`;
    const provider = new WebsocketProvider(wsUrl, roomId, ydoc);

    const color = getRandomColor();

    provider.awareness.setLocalStateField('user', {
        name: userName,
        color: isAI ? '#a78bfa' : color,
    });

    const filesystem = ydoc.getMap('filesystem');
    const terminal = ydoc.getMap('terminal');

    return { ydoc, provider, filesystem, terminal, awareness: provider.awareness, color };
}

export function getConnectedUsers(awareness) {
    const users = [];
    awareness.getStates().forEach((state, clientId) => {
        if (state.user) {
            users.push({
                clientId,
                name: state.user.name,
                color: state.user.color,
                isLocal: clientId === awareness.clientID,
            });
        }
    });
    return users;
}
