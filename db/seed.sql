-- ═══════════════════════════════════════════════════════════════════════════
-- Queryline — Schema + Seed Data
-- Run this file against your Supabase project once.
-- Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor
-- Or via CLI:  psql $DATABASE_URL -f seed.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 0. Clean slate (idempotent) ─────────────────────────────────────────────
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- ── 1. Tables ────────────────────────────────────────────────────────────────

CREATE TABLE customers (
  customer_id  SERIAL PRIMARY KEY,
  name         TEXT        NOT NULL,
  email        TEXT        NOT NULL UNIQUE,
  region       TEXT        NOT NULL,
  signup_date  DATE        NOT NULL
);

CREATE TABLE products (
  product_id  SERIAL PRIMARY KEY,
  name        TEXT           NOT NULL,
  category    TEXT           NOT NULL,
  price       NUMERIC(10,2)  NOT NULL
);

CREATE TABLE orders (
  order_id     SERIAL PRIMARY KEY,
  customer_id  INT         NOT NULL REFERENCES customers(customer_id),
  order_date   DATE        NOT NULL,
  status       TEXT        NOT NULL CHECK (status IN ('pending','processing','shipped','delivered','cancelled'))
);

CREATE TABLE order_items (
  order_item_id  SERIAL PRIMARY KEY,
  order_id       INT            NOT NULL REFERENCES orders(order_id),
  product_id     INT            NOT NULL REFERENCES products(product_id),
  quantity       INT            NOT NULL CHECK (quantity > 0),
  unit_price     NUMERIC(10,2)  NOT NULL
);

-- ── Indexes for common query patterns ────────────────────────────────────────
CREATE INDEX idx_orders_customer   ON orders(customer_id);
CREATE INDEX idx_orders_date       ON orders(order_date);
CREATE INDEX idx_orders_status     ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_prod  ON order_items(product_id);

-- ── 2. Customers (50 rows) ───────────────────────────────────────────────────
INSERT INTO customers (name, email, region, signup_date) VALUES
  ('Alice Chen',        'alice.chen@example.com',        'North America', '2023-01-14'),
  ('Bob Martinez',      'bob.martinez@example.com',      'Latin America', '2023-02-03'),
  ('Chloe Dupont',      'chloe.dupont@example.com',      'Europe',        '2023-02-18'),
  ('David Kim',         'david.kim@example.com',         'Asia Pacific',  '2023-03-05'),
  ('Eva Schulz',        'eva.schulz@example.com',        'Europe',        '2023-03-22'),
  ('Felix Okonkwo',     'felix.okonkwo@example.com',     'Africa',        '2023-04-09'),
  ('Grace Liu',         'grace.liu@example.com',         'Asia Pacific',  '2023-04-27'),
  ('Hiro Tanaka',       'hiro.tanaka@example.com',       'Asia Pacific',  '2023-05-14'),
  ('Isabel Torres',     'isabel.torres@example.com',     'Latin America', '2023-05-30'),
  ('James Patel',       'james.patel@example.com',       'North America', '2023-06-15'),
  ('Karen Johansson',   'karen.johansson@example.com',   'Europe',        '2023-06-28'),
  ('Leo Nakamura',      'leo.nakamura@example.com',      'Asia Pacific',  '2023-07-11'),
  ('Mia Rossi',         'mia.rossi@example.com',         'Europe',        '2023-07-25'),
  ('Noah Williams',     'noah.williams@example.com',     'North America', '2023-08-08'),
  ('Olivia Brown',      'olivia.brown@example.com',      'North America', '2023-08-22'),
  ('Pedro Silva',       'pedro.silva@example.com',       'Latin America', '2023-09-04'),
  ('Quinn Murphy',      'quinn.murphy@example.com',      'North America', '2023-09-18'),
  ('Rita Ngozi',        'rita.ngozi@example.com',        'Africa',        '2023-10-02'),
  ('Sam Foster',        'sam.foster@example.com',        'North America', '2023-10-16'),
  ('Tina Leung',        'tina.leung@example.com',        'Asia Pacific',  '2023-10-30'),
  ('Uma Krishnan',      'uma.krishnan@example.com',      'Asia Pacific',  '2023-11-12'),
  ('Victor Petit',      'victor.petit@example.com',      'Europe',        '2023-11-26'),
  ('Wendy Clark',       'wendy.clark@example.com',       'North America', '2023-12-09'),
  ('Xander Reed',       'xander.reed@example.com',       'North America', '2023-12-22'),
  ('Yuki Sato',         'yuki.sato@example.com',         'Asia Pacific',  '2024-01-05'),
  ('Zara Ahmed',        'zara.ahmed@example.com',        'Middle East',   '2024-01-19'),
  ('Aaron Blake',       'aaron.blake@example.com',       'North America', '2024-02-02'),
  ('Bella Fontaine',    'bella.fontaine@example.com',    'Europe',        '2024-02-16'),
  ('Carlos Vega',       'carlos.vega@example.com',       'Latin America', '2024-03-01'),
  ('Diana Walsh',       'diana.walsh@example.com',       'North America', '2024-03-15'),
  ('Ethan Morris',      'ethan.morris@example.com',      'North America', '2024-03-29'),
  ('Fiona Zhang',       'fiona.zhang@example.com',       'Asia Pacific',  '2024-04-12'),
  ('George Osei',       'george.osei@example.com',       'Africa',        '2024-04-26'),
  ('Hannah Schmidt',    'hannah.schmidt@example.com',    'Europe',        '2024-05-10'),
  ('Ian Thompson',      'ian.thompson@example.com',      'North America', '2024-05-24'),
  ('Julia Santos',      'julia.santos@example.com',      'Latin America', '2024-06-07'),
  ('Kevin Park',        'kevin.park@example.com',        'Asia Pacific',  '2024-06-21'),
  ('Laura Jensen',      'laura.jensen@example.com',      'Europe',        '2024-07-05'),
  ('Marcus Green',      'marcus.green@example.com',      'North America', '2024-07-19'),
  ('Nina Popova',       'nina.popova@example.com',       'Europe',        '2024-08-02'),
  ('Omar Hassan',       'omar.hassan@example.com',       'Middle East',   '2024-08-16'),
  ('Priya Sharma',      'priya.sharma@example.com',      'Asia Pacific',  '2024-08-30'),
  ('Raj Mehta',         'raj.mehta@example.com',         'Asia Pacific',  '2024-09-13'),
  ('Sofia Costa',       'sofia.costa@example.com',       'Latin America', '2024-09-27'),
  ('Tom Eriksson',      'tom.eriksson@example.com',      'Europe',        '2024-10-11'),
  ('Ursula Wagner',     'ursula.wagner@example.com',     'Europe',        '2024-10-25'),
  ('Vincent Dubois',    'vincent.dubois@example.com',    'Europe',        '2024-11-08'),
  ('Winnie Adu',        'winnie.adu@example.com',        'Africa',        '2024-11-22'),
  ('Xavier Moreau',     'xavier.moreau@example.com',     'Europe',        '2024-12-06'),
  ('Yasmin Al-Rashid',  'yasmin.alrashid@example.com',   'Middle East',   '2024-12-20');

-- ── 3. Products (30 rows) ────────────────────────────────────────────────────
INSERT INTO products (name, category, price) VALUES
  ('Wireless Pro Headphones',     'Electronics',    149.99),
  ('USB-C Hub 7-Port',            'Electronics',     49.99),
  ('Mechanical Keyboard RGB',     'Electronics',    129.99),
  ('4K Webcam 60fps',             'Electronics',     89.99),
  ('Noise-Cancelling Earbuds',    'Electronics',     79.99),
  ('Smart LED Desk Lamp',         'Electronics',     39.99),
  ('Portable SSD 1TB',            'Electronics',    109.99),
  ('Ergonomic Mouse Vertical',    'Electronics',     44.99),
  ('Laptop Stand Adjustable',     'Accessories',     34.99),
  ('Desk Organiser Bamboo',       'Accessories',     24.99),
  ('Cable Management Kit',        'Accessories',     14.99),
  ('Monitor Privacy Filter 27"',  'Accessories',     29.99),
  ('Premium Desk Mat XL',         'Accessories',     39.99),
  ('Wireless Charging Pad 15W',   'Electronics',     29.99),
  ('Smart Plug 4-Pack',           'Smart Home',      34.99),
  ('Indoor Air Quality Monitor',  'Smart Home',      69.99),
  ('Smart Bulb Colour E27 4-Pack','Smart Home',      44.99),
  ('Mesh WiFi Router System',     'Smart Home',     199.99),
  ('Smart Doorbell Camera',       'Smart Home',     129.99),
  ('Fitness Tracker Band',        'Wearables',       59.99),
  ('Smartwatch Series X',         'Wearables',      229.99),
  ('Running Shoe Tracker Clip',   'Wearables',       24.99),
  ('Blue Light Glasses',          'Accessories',     19.99),
  ('Standing Desk Converter',     'Furniture',      179.99),
  ('Ergonomic Chair Cushion',     'Furniture',       49.99),
  ('Monitor Arm Dual',            'Accessories',     79.99),
  ('Webcam Privacy Cover 3-Pack', 'Accessories',      8.99),
  ('Screen Cleaning Kit',         'Accessories',      9.99),
  ('Reusable Cable Ties 50-Pack', 'Accessories',      7.99),
  ('USB-A to USB-C Cable 3m',     'Accessories',     11.99);

-- ── 4. Orders + Order Items (≈300 orders) ───────────────────────────────────
-- Uses a PL/pgSQL block to generate realistic orders with varied dates & items.
DO $$
DECLARE
  cust_id     INT;
  ord_id      INT;
  num_items   INT;
  prod_id     INT;
  qty         INT;
  price       NUMERIC(10,2);
  ord_date    DATE;
  statuses    TEXT[] := ARRAY['pending','processing','shipped','delivered','delivered','delivered','cancelled'];
  ord_status  TEXT;
BEGIN
  -- Seed random for reproducibility
  PERFORM setseed(0.42);

  FOR i IN 1..300 LOOP
    -- Random customer
    cust_id   := (FLOOR(random() * 50) + 1)::INT;
    -- Random date between 2024-01-01 and 2025-06-30
    ord_date  := DATE '2024-01-01' + (FLOOR(random() * 547))::INT;
    -- Weight toward delivered
    ord_status := statuses[(FLOOR(random() * array_length(statuses, 1)) + 1)::INT];

    INSERT INTO orders (customer_id, order_date, status)
    VALUES (cust_id, ord_date, ord_status)
    RETURNING order_id INTO ord_id;

    -- 1–4 items per order
    num_items := (FLOOR(random() * 4) + 1)::INT;

    FOR j IN 1..num_items LOOP
      prod_id := (FLOOR(random() * 30) + 1)::INT;
      qty     := (FLOOR(random() * 4) + 1)::INT;

      SELECT p.price INTO price FROM products p WHERE p.product_id = prod_id;

      -- Occasionally apply a small discount (±5%)
      price := ROUND(price * (0.95 + random() * 0.10), 2);

      INSERT INTO order_items (order_id, product_id, quantity, unit_price)
      VALUES (ord_id, prod_id, qty, price)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ── 5. Quick sanity checks ────────────────────────────────────────────────────
SELECT 'customers' AS tbl, COUNT(*) FROM customers
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'orders',   COUNT(*) FROM orders
UNION ALL SELECT 'order_items', COUNT(*) FROM order_items;
