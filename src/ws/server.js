import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) {
        return;
    }

    socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload) {
    for (const client of wss.clients) {
        if (client.readyState !== WebSocket.OPEN) {
            continue;
        }

        sendJson(client, payload);
    }
}

export function attachWebSocketServer(server) {

    const wss = new WebSocketServer({
        noServer: true,
        maxPayload: 1024 * 1024,
    });

    server.on("upgrade", async(req, socket, head) => {

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

        sendJson(socket, {
            type: "welcome",
            message: "Connected to Sports WebSocket Server",
        });

        console.log("Client connected");

        socket.on("close", () => {
            console.log("Client disconnected");
        });

        socket.on("error", (error) => {
            console.error(
                "WebSocket error:",
                error
            );
        });
    });

    function broadcastMatchCreated(match) {
        broadcast(wss, {
            type: "match_created",
            payload: match,
        });
    }

    return {
        broadcastMatchCreated,
    };
}