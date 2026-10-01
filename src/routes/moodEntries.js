import express from "express";
import { moodEntries, moods } from "../data.js";
let nextMoodEntryId = 1;

const router = express.Router();

// -- GET /mood-entries
router.get('/', (request, response) => {
    response.json({
        moodEntries: moodEntries
    });
});

// -- POST /mood-entries
router.post("/", (request, response) => {
    const body = request.body ?? {};

    // Return if moodId does not exist in moods array
    if (!moods.some(mood => mood.id === body.moodId)) {
        return response.status(400).json({
            error: 'moodId must be the id of an existing mood'
        })
    }

    // feelingScore should be Int, if it exists
    if (body.feelingScore != null && (!Number.isInteger(body.feelingScore) || body.feelingScore > 5 || body.feelingScore < 1)) {
         return response.status(400).json({
            error: 'feelingScore must be an integer between 1-5'
        })
    }

    // trigger should be text, if it exists
    if (body.trigger != null && typeof body.trigger !== 'string') {
         return response.status(400).json({
            error: 'trigger must be a string'
        })
    }

    // Otherwise push new entry to moodEntry
    const newMoodEntry = {
        id: nextMoodEntryId++,
        moodId: body.moodId,
        createdAt: new Date().toISOString(),
        feelingScore: body.feelingScore ?? null,
        trigger: body.trigger?.trim() || null

    };

    moodEntries.push(newMoodEntry);

    response.status(201).json(newMoodEntry);
});


export default router;