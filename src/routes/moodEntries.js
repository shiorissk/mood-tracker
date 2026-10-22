import express from "express";
import db from "../db/db.js";

const router = express.Router();

// -- GET /mood-entries
router.get('/', (request, response) => {
    const moodEntries = db.prepare("SELECT * FROM MoodEntry ORDER BY id").all();
    response.json({
        moodEntries: moodEntries
    });
});

// -- GET /mood-entries/:id
router.get("/:id", (request, response) => {
    const entryId = Number(request.params.id);
    const moodEntry = db.prepare("SELECT * FROM MoodEntry WHERE id = ?").get(entryId);

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

    // Return if moodId does not exist in Mood table
    if (!Number.isInteger(body.moodId) || !db.prepare("SELECT * FROM Mood WHERE id = ?").get(body.moodId)) {
        return response.status(400).json({
            error: 'moodId must be the id of an existing mood'
        })
    }

    // feelingScore should be Int, if it exists
    if (body.feelingScore !== null && (!Number.isInteger(body.feelingScore) || body.feelingScore > 5 || body.feelingScore < 1)) {
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

    // Otherwise insert new entry to moodEntry
    const newMoodEntry = db.prepare(`
        INSERT INTO MoodEntry (moodId, feelingScore, trigger)
        VALUES (?, ?, ?)
        RETURNING *
    `).get(
        body.moodId,
        body.feelingScore ?? null,
        body.trigger?.trim() || null
    );

    response.status(201).json(newMoodEntry);
});

// -- DELETE /mood-entries/:id
router.delete("/:id", (request, response) => {
    const entryId = Number(request.params.id);
    const entry = db.prepare("SELECT * FROM MoodEntry WHERE id = ?").get(entryId);

    if (!entry) {
        return response.status(404).json({
            error: 'Entry not found'
        })
    }

    db.prepare("DELETE FROM MoodEntry WHERE id = ?").run(entryId);
    response.status(204).end();
});

// -- PATCH /mood-entries/:id
router.patch("/:id", (request, response) => {
    const entryId = Number(request.params.id);
    const entry = db.prepare("SELECT * FROM MoodEntry WHERE id = ?").get(entryId);
    const body = request.body ?? {};

    if (!entry) {
        return response.status(404).json({
            error: 'Entry not found'
        })
    }

    // Return if moodId does not exist in moods array
    if (body.moodId !== undefined && (!Number.isInteger(body.moodId) || !db.prepare("SELECT * FROM Mood WHERE id = ?").get(body.moodId))) {
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

    const updatedEntry = db.prepare("UPDATE MoodEntry SET moodId = ?, feelingScore = ?, trigger = ? WHERE id = ? RETURNING *").get(
        body.moodId !== undefined ? body.moodId : entry.moodId,
        body.feelingScore !== undefined ? body.feelingScore : entry.feelingScore,
        body.trigger !== undefined ? body.trigger?.trim() || null : entry.trigger,
        entryId
    );

    return response.json(updatedEntry)
});

export default router;