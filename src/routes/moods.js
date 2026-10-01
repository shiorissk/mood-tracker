import express from "express";
import { moods } from "../data.js";
let nextMoodId = 1;

const router = express.Router();

// -- GET /moods
router.get("/", (request, response) => {
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
            error: 'Name is required and must be a string".'
        })
    }

    const name = body.name.trim().toLowerCase();

    // If it's already in the list, return 409. 
    if (moods.some(mood => mood.name === name)) {
        return response.status(409).json({
            error: 'mood already exists in the list'
        });
    }
    
    // Otherwise push new mood and return 201 with the new mood
    const newMood = {
        name: name,
        id: nextMoodId++
    };

    moods.push(newMood);

    response.status(201).json(newMood);
});


export default router;