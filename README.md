# Velora TSE — Practical Debugging Exercise

A small production-style Node.js + SQLite web application with **3 real bugs** to find and fix.

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Seed the database (run once)
node db/seed.js

# 3. Start the server
npm start
# → http://localhost:3000
```

---

## The Scenario

> **Support ticket from a customer:**
>
> *"We're getting 500 errors when we look up individual orders. Also, when I place a new order the price is never saved. And the revenue stats on the dashboard look completely wrong — the average order value seems way too low."*

Your job:
1. Reproduce each issue
2. Identify the root cause
3. Explain how you'd fix it (a code snippet or description is fine)

---

## What's Available

| Path | Description |
|------|-------------|
| `src/server.js` | Express API (main application logic) |
| `src/database.js` | SQLite connection |
| `src/logger.js` | File-based logger |
| `db/seed.js` | Seeds the database with test data |
| `db/velora.db` | SQLite database (created after seeding) |
| `logs/app.log` | Application logs |
| `public/index.html` | Simple browser UI to call the API |

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/orders` | List all orders |
| GET | `/api/orders/:id` | Get single order with customer info |
| POST | `/api/orders` | Create a new order |
| GET | `/api/stats` | Get summary stats |

---

## Bugs Hidden in This App

<details>
<summary>🔍 Spoilers — only open after you've investigated!</summary>

### Bug 1 — Wrong JOIN column (`GET /api/orders/:id` → 500 error)
**File:** `src/server.js` line ~27  
**Root cause:** The JOIN uses `orders.user_id` but the column in the DB is `orders.customer_id`.  
**Fix:**
```sql
-- Change:
JOIN users ON orders.user_id = users.id
-- To:
JOIN users ON orders.customer_id = users.id
```

---

### Bug 2 — Missing column in INSERT (`POST /api/orders` → total_price not saved)
**File:** `src/server.js` line ~51  
**Root cause:** `total_price` is received in the request body but never written to the DB.  
**Fix:**
```js
// Change:
"INSERT INTO orders (customer_id, product, quantity, status) VALUES (?, ?, ?, ?)"
// To:
"INSERT INTO orders (customer_id, product, quantity, total_price, status) VALUES (?, ?, ?, ?, ?)"
// And add total_price to .run():
.run(customer_id, product, quantity, total_price, "pending");
```

---

### Bug 3 — Wrong aggregate in stats (`GET /api/stats` → wrong avg_order_value)
**File:** `src/server.js` line ~67  
**Root cause:** `AVG(quantity)` is used instead of `AVG(total_price)` for average order value.  
**Fix:**
```sql
-- Change:
AVG(quantity) AS avg_order_value
-- To:
AVG(total_price) AS avg_order_value
```

</details>
