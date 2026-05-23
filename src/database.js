// src/database.js
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "../db/velora.db");
const db = new Database(dbPath);

// Enable WAL for better read performance
db.pragma("journal_mode = WAL");

module.exports = db;
