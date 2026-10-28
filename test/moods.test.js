import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { useServer, post, get } from "./helpers.js";

useServer();

describe("POST /moods", () => {
    it("creates a mood and returns 201", async () => {
        const response = await post("/moods", { name: "Calm" });

        assert.equal(response.status, 201); // check: is the status 201
        const mood = await response.json();
        assert.equal(mood.name, "calm");    // check: was the name cleaned (trimmed + lowercased)
    });

    it("rejects a duplicate with 409", async () => {
        const response = await post("/moods", { name: " CALM " });

        assert.equal(response.status, 409);
        
        // check that "calm" is in moods only once
        const getResponse = await get("/moods");
        const { moods } = await getResponse.json();
        const calmMoods = moods.filter(mood => mood.name === "calm");
        assert.equal(calmMoods.length, 1);

    });

    it("rejects an empty string with 400", async () => {
        const response = await post("/moods", { name: " " });

        assert.equal(response.status, 400); 
    });

    it("rejects a non-string name with 400", async () => {
        const response = await post("/moods", { name: 123 });

        assert.equal(response.status, 400); 
    });

    it("rejects a request without body with 400", async () => {
        const response = await post("/moods", );

        assert.equal(response.status, 400); 
    });

});