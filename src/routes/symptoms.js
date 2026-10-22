import express from "express";
import db from "../db/db.js";

const router = express.Router();

// -- GET /symptoms -------------------------------------------
router.get("/", (request, response) => {
    const symptoms = db.prepare("SELECT * FROM Symptom ORDER BY id").all();
    response.json({
        symptoms: symptoms
    });
});


// -- POST /symptoms -------------------------------------------
router.post("/", (request, response) => {
    const body = request.body ?? {};

    // Read name from the body. If it's missing, return 400. 
    if (typeof body.name !== "string" || body.name.trim() === "") {
        return response.status(400).json({
            error: 'Name is required and must be a string.'
        })
    }

    const name = body.name.trim().toLowerCase();
    // get corresponding symptom from db 
    const symptom = db.prepare("SELECT * FROM Symptom WHERE name = ?").get(name);

    // If it's already in the list, return 409. 
    if (symptom) {
        return response.status(409).json({
            error: 'symptom already exists in the list'
        });
    }

    // Otherwise insert new symptom and return 201 with the new symptom
    const newSymptom = db.prepare("INSERT INTO Symptom (name) VALUES (?) RETURNING *").get(name);

    response.status(201).json(newSymptom);
});

export default router;