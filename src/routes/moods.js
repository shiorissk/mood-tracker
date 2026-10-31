import express from "express";
import db from "../db/db.js";

const router = express.Router();

// -- GET /moods
router.get("/", (request, response) => {
    const moods = db.prepare("SELECT * FROM Mood WHERE userId = ? ORDER BY id").all(request.user.id);
    response.json({
        moods: moods
    });
});

// -- POST /moods -------------------------------------------
router.post("/", (request, response) => {
    const body = request.body ?? {};
    
    // Read name from the body. If it's missing, return 400. 
    if (typeof body.name !== "string" || body.name.trim() === "") {
        return response.status(400).json({
            error: 'Name is required and must be a string.'
        })
    }
    
    const name = body.name.trim().toLowerCase();
    const row = db.prepare("SELECT * FROM Mood WHERE name = ? AND userId = ?").get(name, request.user.id); // check if the row exists

    // If it's already in the list, return 409. 
    if (row) {
        return response.status(409).json({
            error: 'mood already exists in the list'
        });
    }

    db.prepare("INSERT INTO Mood (name, userId) VALUES (?, ?)").run(name, request.user.id);
    const newMood = db.prepare("SELECT * FROM Mood WHERE name = ? AND userId = ?").get(name, request.user.id);

    response.status(201).json(newMood);
});


export default router;