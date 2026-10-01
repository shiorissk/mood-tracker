import "dotenv/config"
import express from "express";
import moodsRouter from './routes/moods.js';
import symptomsRouter from './routes/symptoms.js';
import moodEntriesRouter from './routes/moodEntries.js';

const app = express(); // create app object

const PORT = process.env.PORT || 3000;

// -- Middleware to accept JSON bodies
app.use(express.json());

// -- GET /health -------------------------------------------
app.get("/health", (request, response) => {
    response.json({
        status: "ok"
    });
});

// -- Routes
app.use("/moods", moodsRouter);
app.use("/symptoms", symptomsRouter);
app.use("/mood-entries", moodEntriesRouter);

// Start listening
app.listen(PORT, () => {
    console.log("Server is running");
    console.log(`http://localhost:${PORT}/health`);
});
