import express from "express";
import db from "../db/db.js";

const router = express.Router();

const SELECT_ENTRY = `
    SELECT e.id, e.symptomId, s.name as symptomName, e.createdAt, e.intensity, trigger
    FROM SymptomEntry AS e
    LEFT JOIN Symptom AS s
    ON e.symptomId = s.id
`

// -- GET /symptom-entries
router.get('/', (request, response) => {
    const symptomEntries = db.prepare(`
        ${SELECT_ENTRY}
        ORDER BY e.id
    `).all();
    response.json({
        symptomEntries: symptomEntries
    });
});

// -- GET /symptom-entries/:id
router.get("/:id", (request, response) => {
    const entryId = Number(request.params.id);
    const symptomEntry = db.prepare(`${SELECT_ENTRY} WHERE e.id = ?`).get(entryId);

    // return 404, if symptom with the id is not found
    if (!symptomEntry) {
        return response.status(404).json({
            error: "Not found"
        })
    }

    response.json(symptomEntry);
});

// -- POST /symptom-entries
router.post("/", (request, response) => {
    const body = request.body ?? {};

    // Return if symptomId does not exist in symptoms array
    if (!Number.isInteger(body.symptomId) || !db.prepare("SELECT * FROM Symptom WHERE id = ?").get(body.symptomId)) {
        return response.status(400).json({
            error: 'symptomId must be the id of an existing symptom'
        })
    }

    // intensity should be Int, if it exists
    if (body.intensity != null && (!Number.isInteger(body.intensity) || body.intensity > 5 || body.intensity < 1)) {
         return response.status(400).json({
            error: 'intensity must be an integer between 1-5'
        })
    }

    // trigger should be text, if it exists
    if (body.trigger != null && typeof body.trigger !== 'string') {
         return response.status(400).json({
            error: 'trigger must be a string'
        })
    }

     // Otherwise insert new entry to symptomEntry
    const newSymptomEntry = db.prepare(`
        INSERT INTO SymptomEntry (symptomId, intensity, trigger)
        VALUES (?, ?, ?)
        RETURNING *
    `).get(
        body.symptomId,
        body.intensity ?? null,
        body.trigger?.trim() || null
    );

    const newEntryWithSymptomName = db.prepare(`
        ${SELECT_ENTRY}
        WHERE e.id = ?
    `).get(newSymptomEntry.id);

    response.status(201).json(newEntryWithSymptomName);
});

// -- DELETE /symptom-entries/:id
router.delete("/:id", (request, response) => {
    const entryId = Number(request.params.id);
    const entry = db.prepare("SELECT * FROM SymptomEntry WHERE id = ?").get(entryId);

    if (!entry) {
        return response.status(404).json({
            error: 'Entry not found'
        })
    }

    db.prepare("DELETE FROM SymptomEntry WHERE id = ?").run(entryId);
    response.status(204).end();
});

// -- PATCH /symptom-entries/:id
router.patch("/:id", (request, response) => {
    const entryId = Number(request.params.id);
    const entry = db.prepare("SELECT * FROM SymptomEntry WHERE id = ?").get(entryId);
    const body = request.body ?? {};

    if (!entry) {
        return response.status(404).json({
            error: 'Entry not found'
        })
    }

    // Return if symptomId does not exist in symptoms array
    if (body.symptomId !== undefined && (!Number.isInteger(body.symptomId) || !db.prepare("SELECT * FROM Symptom WHERE id = ?").get(body.symptomId))) {
        return response.status(400).json({
            error: 'symptomId must be the id of an existing symptom'
        })
    }

    // intensity should be Int, if it exists
    if (body.intensity != null && (!Number.isInteger(body.intensity) || body.intensity > 5 || body.intensity < 1)) {
         return response.status(400).json({
            error: 'intensity must be an integer between 1-5'
        })
    }

    // trigger should be text, if it exists
    if (body.trigger != null && typeof body.trigger !== 'string') {
         return response.status(400).json({
            error: 'trigger must be a string'
        })
    }

    const updatedEntry = db.prepare("UPDATE SymptomEntry SET symptomId = ?, intensity = ?, trigger = ? WHERE id = ? RETURNING *").get(
        body.symptomId !== undefined ? body.symptomId : entry.symptomId,
        body.intensity !== undefined ? body.intensity : entry.intensity,
        body.trigger !== undefined ? body.trigger?.trim() || null : entry.trigger,
        entryId
    );

    const updatedEntryWithSymptomName = db.prepare(`
        ${SELECT_ENTRY}
        WHERE e.id = ?
    `).get(updatedEntry.id);


    return response.json(updatedEntryWithSymptomName)
});

export default router;