import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { useServer, post, get } from "./helpers.js";

useServer();

describe("POST /symptoms", () => {
    it("creates a symptom and returns 201", async () => {
        const response = await post("/symptoms", { name: "Headache" });

        assert.equal(response.status, 201); // check: is the status 201
        const symptom = await response.json();
        assert.equal(symptom.name, "headache");    // check: was the name cleaned (trimmed + lowercased)
    });

    it("rejects a duplicate with 409", async () => {
        const response = await post("/symptoms", { name: " HEADACHE " });

        assert.equal(response.status, 409);
        
        // check that "symptom" is in symptoms only once
        const getResponse = await get("/symptoms");
        const { symptoms } = await getResponse.json();
        const headacheSymptom = symptoms.filter(symptom => symptom.name === "headache");
        assert.equal(headacheSymptom.length, 1);

    });

    it("rejects an empty string with 400", async () => {
        const response = await post("/symptoms", { name: " " });

        assert.equal(response.status, 400); 
    });

    it("rejects a non-string name with 400", async () => {
        const response = await post("/symptoms", { name: 123 });

        assert.equal(response.status, 400); 
    });

    it("rejects a request without body with 400", async () => {
        const response = await post("/symptoms", );

        assert.equal(response.status, 400); 
    });

});