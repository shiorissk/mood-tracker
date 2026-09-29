import "dotenv/config"
import express from "express";

// in-memory data (will be replaced by DB later)
const moods = [];
let nextMoodId = 1;

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

// -- GET /moods -------------------------------------------
// moods routes returns the whole array
app.get("/moods", (request, response) => {
    response.json({
        moods: moods
    });
});

// -- POST /moods -------------------------------------------
app.post("/moods", (request, response) => {
    const body = request.body ?? {};
    // Read name from the body. If it's missing, return 400. If it's already in the list, return 409. Otherwise push { id: nextMoodId++, name } and return 201 with the new mood
    if (!body.name || typeof body.name !== "string") {
        return response.status(400).json({
            error: 'Somethings wrong with request body. Name is requred and should be string.'
        })
    }

    const name = body.name.trim().toLowerCase();

    if (moods.some(mood => mood.name.trim().toLowerCase() === name)) {
        return response.status(409).json({
            error: 'mood already exists in the list'
        });
    }
    
    const newMood = {
        name: name,
        id: nextMoodId++
    };

    moods.push(newMood);
    
    response.status(201).json(newMood);
});

// Start listening
app.listen(PORT, () => {
    console.log("Server is running");
    console.log(`http://localhost:${PORT}/health`);
});
