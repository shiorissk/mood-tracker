// test/helpers.js
import { before, after } from "node:test";
import app from "../src/app.js";

let server;
let baseUrl;
let cookie;

/** Call once at the top of a test file: starts the app before the tests, stops it after */
export function useServer(setup) {
    before(async() => {
        server = app.listen(0);
        baseUrl = `http://localhost:${server.address().port}`;
        
        // register a test user and get loginResponse
        await post("/auth/register", { email: "a@example.com", password: "secret123" });
        const loginResponse = await post("/auth/login", { email: "a@example.com", password: "secret123" });
        cookie = loginResponse.headers.getSetCookie()[0].split(";")[0];
        
        if(setup) await setup();
    });
    after(() => server.close());
}

export function get(path) { 
    return fetch(`${baseUrl}${path}`, {
        method: "GET",
        headers: { 
            "Content-Type": "application/json",
            "Cookie": cookie
        },
    });
}

export function post(path, body) {
    return fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Cookie": cookie
        },
        body: JSON.stringify(body),
    });
}

export function patch(path, body) { 
    return fetch(`${baseUrl}${path}`, { 
        method: "PATCH",
         headers: { 
            "Content-Type": "application/json",
            "Cookie": cookie
        },
        body: JSON.stringify(body),
    })
}

export function del(path) { 
    return fetch(`${baseUrl}${path}`, {
        method: "DELETE",
        headers: { 
            "Content-Type": "application/json",
            "Cookie": cookie
        },
    });
}
