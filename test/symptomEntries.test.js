import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { useServer, get, post, patch, del } from "./helpers.js";

let symptomId;

useServer();

before(async () => {
    // create symptom (test files run in its own process with its own empty in-memory database)
    const response = await post("/symptoms", { name: "headache" });
    symptomId = (await response.json()).id;
});


describe("POST /symptom-entries", () => {
    it("creates a symptom entry and returns 201", async () => {
        const response = await post("/symptom-entries", { symptomId: symptomId });

        assert.equal(response.status, 201); // check: is the status 201
        const entry = await response.json();
        assert.ok(Number.isInteger(entry.id));
        assert.equal(entry.symptomId, symptomId);
        assert.equal(entry.symptomName, "headache");
        assert.equal(entry.intensity, null);
        assert.equal(entry.trigger, null);
    });

    it("saves intensity and trims trigger", async () => {
        const response = await post("/symptom-entries", { symptomId, intensity: 4, trigger: " walk outside "  });

        assert.equal(response.status, 201); 
        const entry = await response.json();
        assert.ok(Number.isInteger(entry.id));
        assert.equal(entry.symptomId, symptomId);
        assert.equal(entry.symptomName, "headache");
        assert.equal(entry.intensity, 4);
        assert.equal(entry.trigger, "walk outside");
    });

    it("rejects a string symptomId", async () => {
        const response = await post("/symptom-entries", { symptomId: "1" });
        assert.equal(response.status, 400); 
    });

    it("rejects a symptomId that doesn't exist", async () => {
        const response = await post("/symptom-entries", { symptomId: 999 });
        assert.equal(response.status, 400); 
    });

    it("rejects a missing symptomId", async () => {
        const response = await post("/symptom-entries", { });
        assert.equal(response.status, 400); 
    });

    it("rejects intensity outside 1–5", async () => {
        const response = await post("/symptom-entries", { symptomId, intensity: 7 });
        assert.equal(response.status, 400); 
    });

    it("rejects a non-integer intensity", async () => {
        const response = await post("/symptom-entries", { symptomId, intensity: 3.5 });
        assert.equal(response.status, 400); 
    });

    it("rejects a non-string trigger", async () => {
        const response = await post("/symptom-entries", { symptomId, trigger: 5 });
        assert.equal(response.status, 400); 
    });
});

describe("GET /symptom-entries", () => {
    it("returns the entry with its symptom name", async () => {
        // create entry 
        const response = await post("/symptom-entries", { symptomId });
        const entry = await response.json();

        const getResponse = await get(`/symptom-entries/${entry.id}`);

        assert.equal(getResponse.status, 200); // check if entry exists with the id
        const getEntry = await getResponse.json();
        assert.equal(getEntry.id, entry.id);
        assert.equal(getEntry.symptomName, "headache");
    });

    it("returns 404 for an unknown entry", async () => {
        const getResponse = await get(`/symptom-entries/999`);
        assert.equal(getResponse.status, 404);
        
    });
});

describe("PATCH /symptom-entries", () => {
    it("changes only the sent field", async () => {
        // create entry 
        const response = await post("/symptom-entries", { symptomId, intensity: 2, trigger: "work" });
        const entry = await response.json();

        const patchResponse = await patch(`/symptom-entries/${entry.id}`, { intensity: 4 });
        assert.equal(patchResponse.status, 200);

        const patchData = await patchResponse.json();
        assert.equal(patchData.intensity, 4);
        assert.equal(patchData.trigger, "work");
    });

    it("clears trigger with null", async () => {
        // create entry 
        const response = await post("/symptom-entries", { symptomId, intensity: 2, trigger: "work" });
        const entry = await response.json();

        const patchResponse = await patch(`/symptom-entries/${entry.id}`, { trigger: null });
        assert.equal(patchResponse.status, 200);

        const patchData = await patchResponse.json();
        assert.equal(patchData.trigger, null);
        assert.equal(patchData.intensity, 2);
    });

    it("empty object changes nothing", async () => {
        // create entry 
        const response = await post("/symptom-entries", { symptomId, intensity: 2, trigger: "work" });
        const entry = await response.json();

        const patchResponse = await patch(`/symptom-entries/${entry.id}`, {});
        assert.equal(patchResponse.status, 200);

        const patchData = await patchResponse.json();
        assert.equal(patchData.symptomId, symptomId);
        assert.equal(patchData.trigger, "work");
        assert.equal(patchData.intensity, 2);
    });

    it("rejects removing symptomId with null", async () => {
        // create entry 
        const response = await post("/symptom-entries", { symptomId, intensity: 2, trigger: "work" });
        const entry = await response.json();

        const patchResponse = await patch(`/symptom-entries/${entry.id}`, { symptomId: null });
        assert.equal(patchResponse.status, 400);
    });

    it("rejects the whole update if one field is invalid", async () => {
        // create entry 
        const response = await post("/symptom-entries", { symptomId, intensity: 2, trigger: "work" });
        const entry = await response.json();

        const patchResponse = await patch(`/symptom-entries/${entry.id}`, { symptomId: 999, intensity: 4 });
        assert.equal(patchResponse.status, 400);

        const getResponse = await get(`/symptom-entries/${entry.id}`);
        const afterPatch = await getResponse.json();
        assert.deepEqual(entry, afterPatch);
    });

    it("returns 404 for an unknown entry", async () => {
        const patchResponse = await patch(`/symptom-entries/999`, { intensity: 4 });
        assert.equal(patchResponse.status, 404);
    });
});

describe("DELETE /symptom-entries", () => {
    it("deletes the entry; deleting again returns 404", async () => {
        // create entry 
        const response = await post("/symptom-entries", { symptomId, intensity: 2, trigger: "work" });
        const entry = await response.json();

        const deleteResponse = await del(`/symptom-entries/${entry.id}`);
        assert.equal(deleteResponse.status, 204);

        const getResponse = await get(`/symptom-entries/${entry.id}`);
        assert.equal(getResponse.status, 404);

        const anotherDelete = await del(`/symptom-entries/${entry.id}`);
        assert.equal(anotherDelete.status, 404);
    });
});