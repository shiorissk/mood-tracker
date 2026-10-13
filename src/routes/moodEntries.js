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

// -- GET /mood-entries/:id
router.get("/:id", (request, response) => {
    const entryId = Number(request.params.id);
    const moodEntry = moodEntries.find(entry => entry.id === entryId);

    // return 404, if mood with the id is not found
    if (!moodEntry) {
        return response.status(404).json({
            error: "Not found"
        })
    }

    response.json(moodEntry);
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

// -- DELETE /mood-entries/:id
router.delete("/:id", (request, response) => {
    const entryId = Number(request.params.id);
    const entryIndex = moodEntries.findIndex(entry => entry.id === entryId);

    if (entryIndex === -1) {
        return response.status(404).json({
            error: 'Entry not found'
        })
    }

    moodEntries.splice(entryIndex, 1);
    response.status(204).end();
});

// -- PATCH /mood-entries/:id
router.patch("/:id", (request, response) => {
    const entryId = Number(request.params.id);
    const entry = moodEntries.find(entry => entry.id === entryId);
    const body = request.body ?? {};

    if (!entry) {
        return response.status(404).json({
            error: 'Entry not found'
        })
    }

    // Return if moodId does not exist in moods array
    if (body.moodId !== undefined && !moods.some(mood => mood.id === body.moodId)) {
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

    if (body.moodId !== undefined) entry.moodId = body.moodId;
    if (body.feelingScore !== undefined) entry.feelingScore = body.feelingScore;
    if (body.trigger !== undefined)  entry.trigger = body.trigger?.trim() || null;


    return response.json(entry)
});

export default router;