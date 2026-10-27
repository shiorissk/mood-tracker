import "./db/db.js";
import path from "node:path";
import express from "express";
import moodsRouter from './routes/moods.js';
import symptomsRouter from './routes/symptoms.js';
import moodEntriesRouter from './routes/moodEntries.js';
import symptomEntriesRouter from './routes/symptomEntries.js';

const app = express(); // create app object

// -- Middleware to accept JSON bodies
app.use(express.json());

// -- Serve frontend files
app.use(express.static(path.join(import.meta.dirname, "..", "public")));

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
app.use("/symptom-entries", symptomEntriesRouter);
app.use((request, response) => {
    response.status(404).json({
        error: `cannot ${request.method} ${request.originalUrl}`
    });
});

// -- Error handler
app.use((err, request, response, next) => {
    console.error(err);
    const status = err.status ?? 500;

    response.status(status).json({
        error: status < 500 ? err.message : "Internal server error"
    })
});

export default app;