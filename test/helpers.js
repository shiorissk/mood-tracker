// test/helpers.js
import { before, after } from "node:test";
import app from "../src/app.js";

let server;
let baseUrl;
let cookie;

export async function loginAs(email) {
    await post("/auth/register", { email, password: "secret123" });
    const loginResponse = await post("/auth/login", { email, password: "secret123" });
    return loginResponse.headers.getSetCookie()[0].split(";")[0];
}

/** Call once at the top of a test file: starts the app before the tests, stops it after */
export function useServer(setup) {
    before(async() => {
        server = app.listen(0);
        baseUrl = `http://localhost:${server.address().port}`;
        
        // register a test user and get loginResponse
        cookie = await loginAs("a@example.com");
        
        if(setup) await setup();
    });
    after(() => server.close());
}

export function get(path, asCookie = cookie) { 
    return fetch(`${baseUrl}${path}`, {
        method: "GET",
        headers: { 
            "Content-Type": "application/json",
            "Cookie": asCookie
        },
    });
}

export function post(path, body, asCookie = cookie) {
    return fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Cookie": asCookie
        },
        body: JSON.stringify(body),
    });
}

export function getWithoutCookie(path) {
    return fetch(`${baseUrl}${path}`);
}

export function patch(path, body, asCookie = cookie) { 
    return fetch(`${baseUrl}${path}`, { 
        method: "PATCH",
         headers: { 
            "Content-Type": "application/json",
            "Cookie": asCookie
        },
        body: JSON.stringify(body),
    })
}

export function del(path, asCookie = cookie) { 
    return fetch(`${baseUrl}${path}`, {
        method: "DELETE",
        headers: { 
            "Content-Type": "application/json",
            "Cookie": asCookie
        },
    });
}
