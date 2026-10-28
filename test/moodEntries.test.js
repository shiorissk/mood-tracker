import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { useServer, get, post, patch, del } from "./helpers.js";

let moodId;

useServer();

before(async () => {
    // create mood (test files run in its own process with its own empty in-memory database)
    const response = await post("/moods", { name: "calm" });
    moodId = (await response.json()).id;
});


describe("POST /mood-entries", () => {
    it("creates a mood entry and returns 201", async () => {
        const response = await post("/mood-entries", { moodId: moodId });

        assert.equal(response.status, 201); // check: is the status 201
        const entry = await response.json();
        assert.ok(Number.isInteger(entry.id));
        assert.equal(entry.moodId, moodId);
        assert.equal(entry.moodName, "calm");
        assert.equal(entry.feelingScore, null);
        assert.equal(entry.trigger, null);
    });

    it("saves score and trims trigger", async () => {
        const response = await post("/mood-entries", { moodId, feelingScore: 4, trigger: " walk outside "  });

        assert.equal(response.status, 201); 
        const entry = await response.json();
        assert.ok(Number.isInteger(entry.id));
        assert.equal(entry.moodId, moodId);
        assert.equal(entry.moodName, "calm");
        assert.equal(entry.feelingScore, 4);
        assert.equal(entry.trigger, "walk outside");
    });

    it("rejects a string moodId", async () => {
        const response = await post("/mood-entries", { moodId: "1" });
        assert.equal(response.status, 400); 
    });

    it("rejects a moodId that doesn't exist", async () => {
        const response = await post("/mood-entries", { moodId: 999 });
        assert.equal(response.status, 400); 
    });

    it("rejects a missing moodId", async () => {
        const response = await post("/mood-entries", { });
        assert.equal(response.status, 400); 
    });

    it("rejects feelingScore outside 1–5", async () => {
        const response = await post("/mood-entries", { moodId, feelingScore: 7 });
        assert.equal(response.status, 400); 
    });

    it("rejects a non-integer feelingScore", async () => {
        const response = await post("/mood-entries", { moodId, feelingScore: 3.5 });
        assert.equal(response.status, 400); 
    });

    it("rejects a non-string trigger", async () => {
        const response = await post("/mood-entries", { moodId, trigger: 5 });
        assert.equal(response.status, 400); 
    });
});

describe("GET /mood-entries", () => {
    it("returns the entry with its mood name", async () => {
        // create entry 
        const response = await post("/mood-entries", { moodId });
        const entry = await response.json();

        const getResponse = await get(`/mood-entries/${entry.id}`);

        assert.equal(getResponse.status, 200); // check if entry exists with the id
        const getEntry = await getResponse.json();
        assert.equal(getEntry.id, entry.id);
        assert.equal(getEntry.moodName, "calm");
    });

    it("returns 404 for an unknown entry", async () => {
        const getResponse = await get(`/mood-entries/999`);
        assert.equal(getResponse.status, 404);
        
    });
});

describe("PATCH /mood-entries", () => {
    it("changes only the sent field", async () => {
        // create entry 
        const response = await post("/mood-entries", { moodId, feelingScore: 2, trigger: "work" });
        const entry = await response.json();

        const patchResponse = await patch(`/mood-entries/${entry.id}`, { feelingScore: 4 });
        assert.equal(patchResponse.status, 200);

        const patchData = await patchResponse.json();
        assert.equal(patchData.feelingScore, 4);
        assert.equal(patchData.trigger, "work");
    });

    it("clears trigger with null", async () => {
        // create entry 
        const response = await post("/mood-entries", { moodId, feelingScore: 2, trigger: "work" });
        const entry = await response.json();

        const patchResponse = await patch(`/mood-entries/${entry.id}`, { trigger: null });
        assert.equal(patchResponse.status, 200);

        const patchData = await patchResponse.json();
        assert.equal(patchData.trigger, null);
        assert.equal(patchData.feelingScore, 2);
    });

    it("empty object changes nothing", async () => {
        // create entry 
        const response = await post("/mood-entries", { moodId, feelingScore: 2, trigger: "work" });
        const entry = await response.json();

        const patchResponse = await patch(`/mood-entries/${entry.id}`, {});
        assert.equal(patchResponse.status, 200);

        const patchData = await patchResponse.json();
        assert.equal(patchData.moodId, moodId);
        assert.equal(patchData.trigger, "work");
        assert.equal(patchData.feelingScore, 2);
    });

    it("rejects removing moodId with null", async () => {
        // create entry 
        const response = await post("/mood-entries", { moodId, feelingScore: 2, trigger: "work" });
        const entry = await response.json();

        const patchResponse = await patch(`/mood-entries/${entry.id}`, { moodId: null });
        assert.equal(patchResponse.status, 400);
    });

    it("rejects the whole update if one field is invalid", async () => {
        // create entry 
        const response = await post("/mood-entries", { moodId, feelingScore: 2, trigger: "work" });
        const entry = await response.json();

        const patchResponse = await patch(`/mood-entries/${entry.id}`, { moodId: 999, feelingScore: 4 });
        assert.equal(patchResponse.status, 400);

        const getResponse = await get(`/mood-entries/${entry.id}`);
        const afterPatch = await getResponse.json();
        assert.deepEqual(entry, afterPatch);
    });

    it("returns 404 for an unknown entry", async () => {
        const patchResponse = await patch(`/mood-entries/999`, { feelingScore: 4 });
        assert.equal(patchResponse.status, 404);
    });
});

describe("DELETE /mood-entries", () => {
    it("deletes the entry; deleting again returns 404", async () => {
        // create entry 
        const response = await post("/mood-entries", { moodId, feelingScore: 2, trigger: "work" });
        const entry = await response.json();

        const deleteResponse = await del(`/mood-entries/${entry.id}`);
        assert.equal(deleteResponse.status, 204);

        const getResponse = await get(`/mood-entries/${entry.id}`);
        assert.equal(getResponse.status, 404);

        const anotherDelete = await del(`/mood-entries/${entry.id}`);
        assert.equal(anotherDelete.status, 404);
    });
});