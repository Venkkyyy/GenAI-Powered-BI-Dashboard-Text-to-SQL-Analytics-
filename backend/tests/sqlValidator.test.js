/**
 * tests/sqlValidator.test.js
 *
 * Unit tests for the SQL Validation Layer (Step 3).
 * Run with: npm test
 */

const { validateSQL, DEFAULT_LIMIT } = require("../src/services/sqlValidator");

// ── Allow-list fixture ────────────────────────────────────────────────────────
const ALLOW_LIST = {
  tables: ["orders", "order_items", "products", "customers"],
  columns: new Map([
    [
      "orders",
      new Set([
        "order_id", "customer_id", "status", "total_amount",
        "created_at", "updated_at", "shipping_country",
      ]),
    ],
    [
      "order_items",
      new Set(["item_id", "order_id", "product_id", "quantity", "unit_price"]),
    ],
    [
      "products",
      new Set([
        "product_id", "name", "category", "price",
        "stock_quantity", "created_at",
      ]),
    ],
    [
      "customers",
      new Set([
        "customer_id", "name", "email", "country",
        "created_at", "loyalty_tier",
      ]),
    ],
  ]),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function expectPass(sql) {
  return expect(() => validateSQL(sql, ALLOW_LIST)).not.toThrow();
}

function expectFail(sql, pattern) {
  expect(() => validateSQL(sql, ALLOW_LIST)).toThrow(pattern);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("sqlValidator — happy paths", () => {
  test("simple SELECT passes", () => {
    expectPass("SELECT * FROM orders LIMIT 10");
  });

  test("JOIN query passes", () => {
    expectPass(`
      SELECT p.name, SUM(oi.quantity * oi.unit_price) AS revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.status = 'delivered'
      GROUP BY p.name
      ORDER BY revenue DESC
      LIMIT 5
    `);
  });

  test("trailing semicolon is stripped and passes", () => {
    const { sql } = validateSQL("SELECT * FROM orders LIMIT 10;", ALLOW_LIST);
    expect(sql).not.toContain(";");
  });

  test("auto-injects LIMIT when missing", () => {
    const { sql, warnings } = validateSQL("SELECT * FROM orders", ALLOW_LIST);
    expect(sql).toMatch(/LIMIT \d+/i);
    expect(warnings.some((w) => w.includes("LIMIT"))).toBe(true);
  });

  test("auto-injected LIMIT equals DEFAULT_LIMIT", () => {
    const { sql } = validateSQL("SELECT * FROM orders", ALLOW_LIST);
    expect(sql).toContain(`LIMIT ${DEFAULT_LIMIT}`);
  });

  test("GROUP BY + ORDER BY + LIMIT passes", () => {
    expectPass(`
      SELECT status, COUNT(*) as cnt
      FROM orders
      GROUP BY status
      ORDER BY cnt DESC
      LIMIT 20
    `);
  });

  test("aggregates pass", () => {
    expectPass(`
      SELECT DATE_TRUNC('month', created_at) AS month, SUM(total_amount) AS revenue
      FROM orders
      GROUP BY month
      ORDER BY month
      LIMIT 12
    `);
  });
});

describe("sqlValidator — blocked statement types", () => {
  test("blocks INSERT", () => {
    expectFail(
      "INSERT INTO orders (status) VALUES ('hacked')",
      /disallowed keyword|Only SELECT/i
    );
  });

  test("blocks UPDATE", () => {
    expectFail(
      "UPDATE orders SET status = 'hacked' WHERE 1=1",
      /disallowed keyword|Only SELECT/i
    );
  });

  test("blocks DELETE", () => {
    expectFail(
      "DELETE FROM orders WHERE 1=1",
      /disallowed keyword|Only SELECT/i
    );
  });

  test("blocks DROP", () => {
    expectFail(
      "DROP TABLE orders",
      /disallowed keyword|Only SELECT/i
    );
  });

  test("blocks TRUNCATE", () => {
    expectFail(
      "TRUNCATE orders",
      /disallowed keyword|Only SELECT/i
    );
  });

  test("blocks CREATE", () => {
    expectFail(
      "CREATE TABLE evil (x text)",
      /disallowed keyword|Only SELECT/i
    );
  });
});

describe("sqlValidator — stacked statements / injection", () => {
  test("blocks semicolon-separated second statement", () => {
    expectFail(
      "SELECT * FROM orders LIMIT 1; DROP TABLE orders",
      /single statement|disallowed keyword/i
    );
  });

  test("blocks two SELECT statements", () => {
    expectFail(
      "SELECT 1; SELECT * FROM orders LIMIT 1",
      /single statement/i
    );
  });
});

describe("sqlValidator — table allow-list", () => {
  test("blocks access to disallowed table", () => {
    expectFail(
      "SELECT * FROM users LIMIT 10",
      /not in the allowed list/i
    );
  });

  test("blocks information_schema access", () => {
    expectFail(
      "SELECT table_name FROM information_schema.tables LIMIT 10",
      /not allowed|information_schema/i
    );
  });

  test("blocks pg_catalog access", () => {
    expectFail(
      "SELECT * FROM pg_catalog.pg_tables LIMIT 5",
      /not allowed|pg_catalog/i
    );
  });
});

describe("sqlValidator — return shape", () => {
  test("returns { sql, warnings } object", () => {
    const result = validateSQL("SELECT * FROM orders LIMIT 5", ALLOW_LIST);
    expect(result).toHaveProperty("sql");
    expect(result).toHaveProperty("warnings");
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  test("sql field is a non-empty string", () => {
    const { sql } = validateSQL("SELECT * FROM orders LIMIT 5", ALLOW_LIST);
    expect(typeof sql).toBe("string");
    expect(sql.length).toBeGreaterThan(0);
  });
});
