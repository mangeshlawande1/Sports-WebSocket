import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

// Map() --> similar to array
const matchSubscribers = new Map(); // track which socket are subscribe to which matches 
// Map() automatically prevent user from being added twice.

function subscribe(matchId, socket) {
    console.log(
        "Subscribing to match:",
        matchId
    );

    if (!matchSubscribers.has(matchId)) {
        matchSubscribers.set(matchId, new Set())
    }
    matchSubscribers.get(matchId).add(socket);

    console.log(
        "Current subscribers:",
        matchSubscribers
            .get(matchId)
            .size
    );
}

function unsubscribe(matchId, socket) {
    const subscribers = matchSubscribers.get(matchId);
    if (!subscribers) return;

    subscribers.delete(socket);

    if (subscribers.size === 0)
        matchSubscribers.delete(matchId);
}

function cleanupSubscriptions(socket) {
    for (const matchId of socket.subscriptions) {
        unsubscribe(matchId, socket);
    }
}

function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) {
        return;
    }

    socket.send(JSON.stringify(payload));
}

function broadcastToAll(wss, payload) {
    for (const client of wss.clients) {
        if (client.readyState !== WebSocket.OPEN) {
            continue;
        }

        sendJson(client, payload);
    }
}

// send data only to people intrested for specific match 
function broadcastToMatch(matchId, payload) {
    const subscribers = matchSubscribers.get(matchId)
    if (!subscribers || subscribers.size === 0) return;

    const message = JSON.stringify(payload);

    for (const client of subscribers) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
}

function handleMessage(socket, data) {
    let message;
    try {
        message = JSON.parse(data.toString());
    } catch (error) {
        sendJson(socket, { type: 'error', message: "Invalid JSON" });
        return;
    }
    const matchId = Number(message.matchId);

    if (message?.type === 'subscribe' && Number.isInteger(matchId)) {
        subscribe(message.matchId, socket);
        socket.subscriptions.add(matchId);
        sendJson(socket, { type: 'subscribed', matchId: matchId });
        return;
    }

    if (message?.type === 'unsubscribe' && Number.isInteger(matchId)) {
        unsubscribe(matchId, socket)
        socket.subscriptions.delete(matchId);
        sendJson(socket, { type: 'unsubscribed', matchId: matchId });
    }
}

export function attachWebSocketServer(server) {

    const wss = new WebSocketServer({
        noServer: true,
        maxPayload: 1024 * 1024,
    });

    server.on("upgrade", async (req, socket, head) => {

        const { pathname } = new URL(
            req.url,
            `http://${req.headers.host}`
        );

        if (pathname !== "/ws") {
            socket.destroy();
            return;
        }

        try {

            if (wsArcjet) {
                const decision = await wsArcjet.protect(req);

                if (decision.isDenied()) {

                    const isRateLimited =
                        decision.reason?.isRateLimit?.() ?? false;

                    if (isRateLimited) {
                        socket.write(
                            "HTTP/1.1 429 Too Many Requests\r\n\r\n"
                        );
                    } else {
                        socket.write(
                            "HTTP/1.1 403 Forbidden\r\n\r\n"
                        );
                    }

                    socket.destroy();
                    return;
                }
            }

            wss.handleUpgrade(
                req,
                socket,
                head,
                (ws) => {
                    wss.emit("connection", ws, req);
                }
            );

        } catch (error) {

            console.error(
                "WS upgrade protection error",
                error
            );

            socket.write(
                "HTTP/1.1 500 Internal Server Error\r\n\r\n"
            );

            socket.destroy();
        }
    });

    const heartbeat = setInterval(() => {

        wss.clients.forEach((ws) => {

            if (ws.isAlive === false) {
                console.log(
                    "Terminating stale connection"
                );

                return ws.terminate();
            }

            ws.isAlive = false;
            ws.ping();
        });

    }, 30000);

    wss.on("close", () => {
        clearInterval(heartbeat);
    });

    wss.on("connection", (socket) => {

        socket.isAlive = true;

        socket.on("pong", () => {
            socket.isAlive = true;
        });

        socket.subscriptions = new Set();

        sendJson(socket, {
            type: "welcome",
            message: "Connected to Sports WebSocket Server",
        });

        socket.on('message', (data) => {  
            handleMessage(socket, data)
        })
        console.log("Client connected");

        socket.on("close", () => {
            cleanupSubscriptions(socket);
            console.log("Client disconnected");
        });

        socket.on("error", (error) => {
            socket.terminate();
            console.error(
                "WebSocket error:",
                error
            );
        });
    });

    function broadcastMatchCreated(match) {
        broadcastToAll(wss, {
            type: "match_created",
            payload: match,
        });
    }

    function broadcastCommentary(matchId, comment) {
        broadcastToMatch(matchId, { type: "commentary", data: comment });

    }

    return {
        broadcastMatchCreated, broadcastCommentary
    };
}