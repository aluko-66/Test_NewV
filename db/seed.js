// db/seed.js — run once: node db/seed.js
const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "velora.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    product TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price REAL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Seed users
const insertUser = db.prepare("INSERT OR IGNORE INTO users (name, email) VALUES (?, ?)");
insertUser.run("Alice Johnson", "alice@example.com");
insertUser.run("Bob Smith", "bob@example.com");
insertUser.run("Carol White", "carol@example.com");

// Seed orders
const insertOrder = db.prepare(
  "INSERT INTO orders (customer_id, product, quantity, total_price, status) VALUES (?, ?, ?, ?, ?)"
);
insertOrder.run(1, "Wireless Headphones", 2, 159.98, "completed");
insertOrder.run(1, "USB-C Hub", 1, 49.99, "pending");
insertOrder.run(2, "Mechanical Keyboard", 1, 129.99, "completed");
insertOrder.run(3, "Monitor Stand", 3, 89.97, "shipped");
insertOrder.run(2, "Webcam HD", 1, 79.99, "pending");

console.log("✅ Database seeded successfully.");
db.close();
