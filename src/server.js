// src/server.js
const express = require("express");
const path = require("path");
const db = require("./database");
const logger = require("./logger");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// ─── ROUTES ────────────────────────────────────────────────────────────────

// GET /api/orders — list all orders
app.get("/api/orders", (req, res) => {
  try {
    const orders = db.prepare("SELECT * FROM orders").all();
    logger.info(`Fetched ${orders.length} orders`);
    res.json(orders);
  } catch (err) {
    logger.error("Failed to fetch orders: " + err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/orders/:id — get single order with user info
// BUG 1: Column name mismatch — DB has `customer_id`, query joins on wrong key
app.get("/api/orders/:id", (req, res) => {
  try {
    const order = db
      .prepare(
        `SELECT orders.*, users.name AS customer_name, users.email
         FROM orders
         JOIN users ON orders.customer_id = users.id   -- ❌ should be orders.customer_id
         WHERE orders.id = ?`
      )
      .get(req.params.id);

    if (!order) {
      logger.warn(`Order ${req.params.id} not found`);
      return res.status(404).json({ error: "Order not found" });
    }

    logger.info(`Fetched order ${req.params.id}`);
    res.json(order);
  } catch (err) {
    logger.error("Order lookup failed: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders — create a new order
// BUG 2: total_price is never saved — missing from INSERT statement
app.post("/api/orders", (req, res) => {
  const { customer_id, product, quantity, total_price } = req.body;

  if (!customer_id || !product || !quantity) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // ❌ total_price is accepted from body but never inserted
    const result = db
      .prepare(
        "INSERT INTO orders (customer_id, product, quantity, total_price, status) VALUES (?, ?, ?, ?, ?)"
      )
      .run(customer_id, product, quantity, total_price, "pending"); 

    logger.info(`Created order ${result.lastInsertRowid} for customer ${customer_id}`);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    logger.error("Order creation failed: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats — return summary stats
// BUG 3: Off-by-one / wrong aggregation — AVG is computed on quantity not total_price
app.get("/api/stats", (req, res) => {
  try {
    const stats = db
      .prepare(
        `SELECT
          COUNT(*) AS total_orders,
          SUM(total_price) AS revenue,
          AVG(total_price) AS avg_order_value   -- ❌ should be AVG(total_price)
         FROM orders`
      )
      .get();

    logger.info("Stats fetched");
    res.json(stats);
  } catch (err) {
    logger.error("Stats fetch failed: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── START ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`);
  console.log(`\n🚀 App running at http://localhost:${PORT}\n`);
});
