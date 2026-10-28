// test/helpers.js
import { before, after } from "node:test";
import app from "../src/app.js";

let server;
let baseUrl;

/** Call once at the top of a test file: starts the app before the tests, stops it after */
export function useServer() {
    before(() => {
        server = app.listen(0);
        baseUrl = `http://localhost:${server.address().port}`;
    });
    after(() => server.close());
}

export function get(path) { 
    return fetch(`${baseUrl}${path}`);
}

export function post(path, body) {
    return fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

export function patch(path, body) { 
    return fetch(`${baseUrl}${path}`, { 
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })
}

export function del(path) { 
    return fetch(`${baseUrl}${path}`, {
        method: "DELETE"
    });
}
