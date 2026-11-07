let onUnauthorized = () => {};

/** Called when a data route answers 401, e.g. because the session expired */
export function setUnauthorizedHandler(handler) {
    onUnauthorized = handler;
}

/**
 * Send a request to the mood-tracker API.
 * - body (optional) is sent as JSON
 * - returns the parsed JSON, or null for 204 No Content
 * - throws an Error with the API's { error } message on 4xx/5xx
 * The session cookie is sent by the browser automatically (same origin).
 */
export async function request(path, { method = "GET", body } = {}) {
    const options = { method, headers: {} };

    if (body !== undefined) {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
    }

    const response = await fetch(path, options);

    // DELETE returns 204 with no body — nothing to parse
    if (response.status === 204) {
        return null;
    }

    const data = await response.json().catch(() => null);

    // /auth/* answers 401 for a wrong password or "not logged in yet"; the caller handles those
    if (response.status === 401 && !path.startsWith("/auth/")) {
        onUnauthorized();
    }

    if (!response.ok) {
        throw new Error(data?.error ?? `Request failed with status ${response.status}`);
    }

    return data;
}