import express from "express";
import { symptoms } from "../data.js";
let nextSymptomId = 1;

const router = express.Router();

// -- GET /symptoms -------------------------------------------
router.get("/", (request, response) => {
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
            error: 'Name is required and must be a string".'
        })
    }

    const name = body.name.trim().toLowerCase();

    // If it's already in the list, return 409. 
    if (symptoms.some(symptom => symptom.name === name)) {
        return response.status(409).json({
            error: 'symptom already exists in the list'
        });
    }
    
    // Otherwise push new symptom and return 201 with the new symptom
    const newSymptom = {
        name: name,
        id: nextSymptomId++
    };

    symptoms.push(newSymptom);

    response.status(201).json(newSymptom);
});

export default router;