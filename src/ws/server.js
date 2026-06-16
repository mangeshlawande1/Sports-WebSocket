// src/ws/server.js

import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

/**
 * Send JSON payload to a specific socket
 */
function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) {
        return;
    }

    socket.send(JSON.stringify(payload));
}

/**
 * Broadcast JSON payload to all connected clients
 */
function broadcast(wss, payload) {
    for (const client of wss.clients) {
        if (client.readyState !== WebSocket.OPEN) {
            continue;
        }

        sendJson(client, payload);
    }
}

/**
 * Attach WebSocket server to existing HTTP server
 */
export function attachWebSocketServer(server) {

    const wss = new WebSocketServer({
        server,
        path: "/ws",
        maxPayload: 1024 * 1024, // 1 MB
    });

    /**
     * Global heartbeat
     * One timer for the entire WebSocket server
     */
    const heartbeat = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                console.log("Terminating stale connection");
                return ws.terminate();
            }

            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    wss.on("close", () => {
        clearInterval(heartbeat);
    });

    /**
     * New client connection
     */
    wss.on("connection", async(socket, req) => {
        try {
            /**
             * Arcjet protection
             */
            if (wsArcjet) {
                const decision = await wsArcjet.protect(req);

                if (decision.isDenied()) {
                    const isRateLimited =
                        decision.reason.isRateLimit?.() ?? false;

                    const code = isRateLimited ? 1013 : 1008;

                    const reason = isRateLimited ?
                        "Rate Limit Exceeded" :
                        "Access Denied";

                    socket.close(code, reason);
                    return;
                }
            }

            /**
             * Mark socket alive
             */
            socket.isAlive = true;

            /**
             * Client responded to ping
             */
            socket.on("pong", () => {
                socket.isAlive = true;
            });

            /**
             * Welcome message
             */
            sendJson(socket, {
                type: "welcome",
                message: "Connected to Sports WebSocket Server",
            });

            console.log("Client connected");

            socket.on("close", () => {
                console.log("Client disconnected");
            });

            socket.on("error", (error) => {
                console.error("WebSocket error:", error);
            });

        } catch (error) {
            console.error("WebSocket connection error:", error);

            socket.close(1011, "Connection Error");
        }
    });

    /**
     * Broadcast match created event
     */
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