import { DatabaseSync } from "node:sqlite"; // opens database
import { readFileSync } from "node:fs"; // read schema.sql

// create database file, if it doesn't exist yet
const db = new DatabaseSync(process.env.DB_PATH || "mood.db"); 

// change database settings: enforce foreign key rules
db.exec("PRAGMA foreign_keys = ON;");

// read schema.sql as a string
const schema = readFileSync(new URL("./schema.sql", import.meta.url), "utf8");

// SQLite runs the CREATE TABLE statement
db.exec(schema);

export default db;