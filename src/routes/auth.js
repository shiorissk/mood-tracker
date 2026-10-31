import express from "express";
import db from "../db/db.js";
import crypto from "node:crypto";

const router = express.Router();

// -- POST /auth/register -------------------------------------------
router.post("/register", (request, response) => {
    const body = request.body ?? {};

    // validate email
    if (typeof body.email !== "string" || !body.email.includes("@")) {
        return response.status(400).json({
            error: 'Email is not valid'
        })
    }

    const email = body.email.trim();

    // validate password
    if (typeof body.password !== "string" || body.password.length < 8) {
        return response.status(400).json({
            error: 'Password should be a string of at least 8 characters'
        })
    }

    // Hash the password with node:crypto
    const salt = crypto.randomBytes(16);                 // Buffer, 16 random bytes
    const hash = crypto.scryptSync(body.password, salt, 64);  // Buffer, 64 bytes
    const passwordHash = `${salt.toString("hex")}:${hash.toString("hex")}`;

    // check if the email is already taken
    const row = db.prepare("SELECT * FROM User WHERE email = ?").get(email); // check if the row exists

    if (row) {
        return response.status(409).json({
            error: 'The email is already taken'
        });
    }

    // INSERT into User
    db.prepare("INSERT INTO User (email, passwordHash) VALUES (?, ?)").run(email, passwordHash);
    const user = db.prepare("SELECT id, email FROM User WHERE email = ?").get(email);

    // Respond 201 with { id, email }.
    response.status(201).json({ id: user.id, email: user.email  });
});


// -- POST /auth/login -------------------------------------------
router.post("/login", (request, response) => {
    const body = request.body ?? {};

    // validate email
    if (typeof body.email !== "string" || typeof body.password !== "string") {
        return response.status(400).json({
            error: 'Email and password should be strings.'
        })
    }

    const email = body.email.trim();

    // SELECT the user by email. If there's no user → 401 "Invalid email or password".
    const user = db.prepare("SELECT * FROM User WHERE email = ?").get(email);
    
    if (!user) {
        return response.status(401).json({
            error: 'Invalid email or password'
        })
    }

    const storedHash = user.passwordHash;
    const [ saltHex, hashHex ] = storedHash.split(":"); // hex strings
    const salt = Buffer.from(saltHex, "hex");
    const hash = Buffer.from(hashHex, "hex");
    const inputHash = crypto.scryptSync(body.password, salt, 64);

    if (!crypto.timingSafeEqual(hash, inputHash)) {
        return response.status(401).json({
            error: 'Invalid email or password'
        })
    }

    // create session
    const sessionId = crypto.randomBytes(32).toString("hex");
    const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
    const expiresAt =  new Date(Date.now() + SESSION_MAX_AGE).toISOString();
    db.prepare("INSERT INTO Session (id, userId, expiresAt) VALUES (?, ?, ?)").run(sessionId, user.id, expiresAt);

    response.cookie("sessionId", sessionId, {
        httpOnly: true,       // JavaScript in the page can't read it (XSS protection)
        sameSite: "lax",      // the browser doesn't send it on requests started by other sites (CSRF protection)
        maxAge: SESSION_MAX_AGE,  // in milliseconds, same as the expiry
    });
    
    return response.status(200).json({
        id: user.id,
        email: user.email
    });
});

export default router;