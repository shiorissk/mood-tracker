import express from "express";
import { symptomEntries, symptoms } from "../data.js";
let nextSymptomEntryId = 1;

const router = express.Router();

// -- GET /symptom-entries
router.get('/', (request, response) => {
    response.json({
        symptomEntries: symptomEntries
    });
});

// -- GET /symptom-entries/:id
router.get("/:id", (request, response) => {
    const entryId = Number(request.params.id);
    const symptomEntry = symptomEntries.find(entry => entry.id === entryId);

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
    if (!symptoms.some(symptom => symptom.id === body.symptomId)) {
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

    // Otherwise push new entry to symptomEntry
    const newSymptomEntry = {
        id: nextSymptomEntryId++,
        symptomId: body.symptomId,
        createdAt: new Date().toISOString(),
        intensity: body.intensity ?? null,
        trigger: body.trigger?.trim() || null

    };

    symptomEntries.push(newSymptomEntry);

    response.status(201).json(newSymptomEntry);
});

// -- DELETE /symptom-entries/:id
router.delete("/:id", (request, response) => {
    const entryId = Number(request.params.id);
    const entryIndex = symptomEntries.findIndex(entry => entry.id === entryId);

    if (entryIndex === -1) {
        return response.status(404).json({
            error: 'Entry not found'
        })
    }

    symptomEntries.splice(entryIndex, 1);
    response.status(204).end();
});

// -- PATCH /symptom-entries/:id
router.patch("/:id", (request, response) => {
    const entryId = Number(request.params.id);
    const entry = symptomEntries.find(entry => entry.id === entryId);
    const body = request.body ?? {};

    if (!entry) {
        return response.status(404).json({
            error: 'Entry not found'
        })
    }

    // Return if symptomId does not exist in symptoms array
    if (body.symptomId !== undefined && !symptoms.some(symptom => symptom.id === body.symptomId)) {
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

    if (body.symptomId !== undefined) entry.symptomId = body.symptomId;
    if (body.intensity !== undefined) entry.intensity = body.intensity;
    if (body.trigger !== undefined)  entry.trigger = body.trigger?.trim() || null;


    return response.json(entry)
});

export default router;