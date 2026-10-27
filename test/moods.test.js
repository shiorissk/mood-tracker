import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";

let server;
let baseUrl;

before(() => {
    server = app.listen(0);                 // 0 = any free port
    baseUrl = `http://localhost:${server.address().port}`;
});

after(() => server.close());

function post(path, body) {
    return fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

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
        const getResponse = await fetch(`${baseUrl}/moods`);
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