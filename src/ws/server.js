//  create a function to send object to a specific client(helper fun)
import { WebSocket, WebSocketServer } from 'ws'

function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
}

function broadCast(wss, payload) {

    for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) continue;
        client.send(JSON.stringify(payload));

        sendJson(client, payload);
    }
};

//attach websocket logic to node server
export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({
        server,
        path: '/ws',
        maxPayload: 1024 * 1024, // 1MB
    });

    wss.on('connection', (socket) => {
        socket.isAlive = true;
        socket.on('pong', () => { socket.isAlive = true; });

        sendJson(socket, { type: 'welcome', });

        socket.on('error', console.error);

        const interval = setInterval(() => {
            wss.clients.forEach((ws) => {
                if (ws.isAlive === false) return ws.terminate();
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000); //ping every 30 seconds to keep the connection alive

        socket.on('close', () => {
            clearInterval(interval);
        });
    });

    function broadcastMatchCreated(match) {
        broadCast(wss, { type: 'match_created', payload: match });
    }

    return {
        broadcastMatchCreated
    }

}