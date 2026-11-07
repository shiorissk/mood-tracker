import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { useServer, get, post, patch, del, loginAs } from "./helpers.js";

useServer();

describe("Isolation between users", () => {
    it("User B cannot see user As entry", async () => {
        const bCookie = await loginAs("b@example.com");

        // user A (default cookie) creates a mood and an entry
        const moodResponse = await post("/moods", { name: "calm" });
        assert.equal(moodResponse.status, 201);
        const mood = await moodResponse.json();
        const entryResponse = await post("/mood-entries", { moodId: mood.id });
        assert.equal(entryResponse.status, 201);
        const entry = await entryResponse.json();

        // user B tries to read it
        const response = await get(`/mood-entries/${entry.id}`, bCookie);
        assert.equal(response.status, 404);
    });

    it("User B cannot edit user As entry", async () => {
        const bCookie = await loginAs("b@example.com");

        // user A (default cookie) creates a mood and an entry
        const moodResponse = await post("/moods", { name: "happy" });
        assert.equal(moodResponse.status, 201);
        const mood = await moodResponse.json();
        const entryResponse = await (await post("/mood-entries", { moodId: mood.id }));
        assert.equal(entryResponse.status, 201);
        const entry = await entryResponse.json();

        // user B tries to modify it
        const response = await patch(`/mood-entries/${entry.id}`,  { feelingScore: 1 }, bCookie);
        assert.equal(response.status, 404);
    });

    it("User B cannot cannot remove user As entry", async () => {
        const bCookie = await loginAs("b@example.com");

        // user A (default cookie) creates a mood and an entry
        const moodResponse = await post("/moods", { name: "tired" });
        assert.equal(moodResponse.status, 201);
        const mood = await moodResponse.json();
        const entryResponse = await post("/mood-entries", { moodId: mood.id });
        assert.equal(entryResponse.status, 201);
        const entry = await entryResponse.json();

        // user B tries to delete it
        const response = await del(`/mood-entries/${entry.id}`, bCookie);
        assert.equal(response.status, 404);

        // user A still can access the entry
        const entryGetResponse = await get(`/mood-entries/${entry.id}`);
        assert.equal(entryGetResponse.status, 200);

    });

    it("User B's list does not contain user A's entry", async () => {
        const bCookie = await loginAs("b@example.com");

        // user A (default cookie) creates a mood and an entry
        const moodResponse = await post("/moods", { name: "excited" });
        assert.equal(moodResponse.status, 201);
        const mood = await moodResponse.json();
        const entryResponse = await post("/mood-entries", { moodId: mood.id });
        assert.equal(entryResponse.status, 201);
        const entry = await entryResponse.json();

        // user B fetches one's list 
        const entryResponseB = await get("/mood-entries", bCookie);
        assert.equal(entryResponseB.status, 200);
        const listB = (await entryResponseB.json()).moodEntries;

        assert.equal(listB.some(e => e.id === entry.id), false);
    });

    
});
