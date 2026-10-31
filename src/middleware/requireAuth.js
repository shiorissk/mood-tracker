import db from "../db/db.js";

export default function requireAuth(request, response, next) {
    // check whether the cookie is a valid session
    if (!request.cookies.sessionId) {
         return response.status(401).json({
            error: 'Not logged in'
        });
    }
  
    // SELECT the session by that id. If there's no row → 401.
    // Check whether it has expired.
    const session = db.prepare("SELECT * FROM Session WHERE id = ? AND expiresAt > ?").get(request.cookies.sessionId, new Date().toISOString());
    if (!session) {
        return response.status(401).json({
            error: 'Not logged in'
        });
    }

    request.user = { id: session.userId };
    next(); // continue to the route
}