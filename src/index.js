import 'dotenv/config';
import express from 'express';
import { matchRouter } from "./routes/matches.js";
import http from 'http';
import { attachWebSocketServer } from './ws/server.js';

const PORT = Number(process.env.PORT) || 8000;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
const server = http.createServer(app);


// JSON middleware to parse incoming JSON payloads
app.use(express.json());

// Root GET route returning a short message
app.get('/', (req, res) => {
    res.json({ message: "Welcome! The server is running smoothly." });
});

app.use('/matches', matchRouter);
const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

// Start server and log the dynamic URL
server.listen(PORT, HOST, () => {
    const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
    console.log(`Server Listening on: ${baseUrl}`);
    console.log(`WebSocket Server Listening on: ${baseUrl.replace('http','ws')}/ws`);
});