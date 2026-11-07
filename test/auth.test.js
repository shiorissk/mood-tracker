import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { useServer, get, post, patch, del, getWithoutCookie, loginAs } from "./helpers.js";

useServer();

describe("POST /auth/register", () => {
    it("creates a user without returning the password hash", async () => {
        const response = await post("/auth/register", { email: "new@example.com", password: "secret123" });

        assert.equal(response.status, 201); // check: is the status 201
        const user = await response.json();
        assert.ok(Number.isInteger(user.id)); 
        assert.equal(user.email, "new@example.com");
        assert.equal(user.passwordHash, undefined); // make sure the response DOES NOT send hashed password
    });

    it("rejects a duplicate email regardless of case", async () => {
        // create a user
        await post("/auth/register", { email: "dup@example.com", password: "secret123" });

        // same email, different case
        const response = await post("/auth/register", { email: "DUP@example.com", password: "secret123" });
        assert.equal(response.status, 409);
    });

    it("rejects a invalid email", async () => {
        const response = await post("/auth/register", { email: "notanemail", password: "secret123" });
        assert.equal(response.status, 400);
    });

    it("rejects a short password", async () => {
        const response = await post("/auth/register", { email: "x@example.com", password: "short" });
        assert.equal(response.status, 400);
    });
});

describe("POST /auth/login", () => {
    it("login succeed with the right password", async () => {
        const response = await post("/auth/login", { email: "a@example.com", password: "secret123" });

        assert.equal(response.status, 200);
    });

    it("rejects a wrong password", async () => {
        const response = await post("/auth/login", { email: "a@example.com", password: "secret122" });

        assert.equal(response.status, 401);
    });

    it("gives the same error for an unknown email and a wrong password", async () => {
        // unknown email
        const unknownEmailResponse = await post("/auth/login", { email: "abc@example.com", password: "secret123" });
        // wrong password
        const wrongPasswordResponse = await post("/auth/login", { email: "a@example.com", password: "secret122" });
        
        const unknownEmailResponseJSON = await unknownEmailResponse.json();
        const wrongPasswordResponseJSON = await wrongPasswordResponse.json();

        assert.equal(unknownEmailResponse.status, 401);
        // check if error messages are same for unknown email and wrong password
        assert.equal(unknownEmailResponseJSON.error, wrongPasswordResponseJSON.error);
    });
});

describe("protected routes", () => {
    it("rejects /moods without a cookie", async () => {
        const response = await getWithoutCookie("/moods");
        assert.equal(response.status, 401);
    });

    it("rejects /symptoms without a cookie", async () => {
        const response = await getWithoutCookie("/symptoms");
        assert.equal(response.status, 401);
    });

    it("rejects /symptom-entries without a cookie", async () => {
        const response = await getWithoutCookie("/symptom-entries");
        assert.equal(response.status, 401);
    });

    it("rejects /mood-entries without a cookie", async () => {
        const response = await getWithoutCookie("/mood-entries");
        assert.equal(response.status, 401);
    });
});

describe("POST /auth/logout", () => {
    it("returns the logged-in user", async () => {
        const response = await get("/auth/me");
        const user = await response.json();

        assert.equal(response.status, 200);
        assert.equal(user.email, 'a@example.com');
        assert.equal(user.passwordHash, undefined); // make sure password has is not sent back
    });

    it("log out user", async () => {
        const response = await post("/auth/logout");

        assert.equal(response.status, 204);
        const meResponse = await get("/auth/me");
        assert.equal(meResponse.status, 401);   // the session is gone
    });
});
