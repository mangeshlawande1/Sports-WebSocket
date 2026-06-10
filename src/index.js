import express from 'express';
import {matchRouter} from "./routes/matches.js";

const app = express();
const PORT = 8080;

// JSON middleware to parse incoming JSON payloads
app.use(express.json());

// Root GET route returning a short message
app.get('/', (req, res) => {
    res.json({ message: "Welcome! The server is running smoothly." });
});

app.use('/matches',matchRouter);

// Start server and log the dynamic URL
app.listen(PORT, () => {
    console.log(`Server started successfully!`);
    console.log(`Listening on: http://localhost:${PORT}`);
});
