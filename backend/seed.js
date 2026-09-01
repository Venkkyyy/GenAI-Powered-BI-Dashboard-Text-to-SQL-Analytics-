/**
 * seed.js — Seeds realistic e-commerce demo data into Supabase Postgres.
 * Run once with: node seed.js
 */
require("dotenv").config();
const { query } = require("./src/db");

async function seed() {
  console.log("🌱 Starting Supabase database seed...");

  try {
    // 1. Create tables
    await query(`
      CREATE TABLE IF NOT EXISTS customers (
        customer_id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        region TEXT NOT NULL,
        loyalty_tier TEXT NOT NULL,
        signup_date DATE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS products (
        product_id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        stock_quantity INT NOT NULL DEFAULT 50
      );

      CREATE TABLE IF NOT EXISTS orders (
        order_id SERIAL PRIMARY KEY,
        customer_id INT REFERENCES customers(customer_id) ON DELETE CASCADE,
        order_date DATE NOT NULL,
        status TEXT NOT NULL,
        shipping_country TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS order_items (
        order_item_id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
        product_id INT REFERENCES products(product_id) ON DELETE CASCADE,
        quantity INT NOT NULL,
        unit_price NUMERIC(10, 2) NOT NULL
      );
    `);
    console.log("✅ Tables created or verified.");

    // Check if data already exists
    const existing = await query("SELECT COUNT(*) FROM products");
    if (parseInt(existing.rows[0].count, 10) > 0) {
      console.log("ℹ️ Database already contains data. Skipping seed insert.");
      process.exit(0);
    }

    // 2. Seed Customers
    const regions = ["North America", "Europe", "Asia-Pacific", "Latin America"];
    const tiers = ["Bronze", "Silver", "Gold", "Platinum"];
    const names = [
      "Alex Chen", "Sarah Jenkins", "Michael Scott", "Elena Rostova", "David Kim",
      "Priya Sharma", "Lucas Silva", "Emma Watson", "James Miller", "Amina Al-Mansoor",
      "Oliver Queen", "Maya Lin", "Carlos Gomez", "Chloe Martin", "Ethan Hunt"
    ];

    for (let i = 0; i < names.length; i++) {
      await query(
        `INSERT INTO customers (name, email, region, loyalty_tier, signup_date)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          names[i],
          `${names[i].toLowerCase().replace(" ", ".")}@example.com`,
          regions[i % regions.length],
          tiers[i % tiers.length],
          new Date(2023, i % 12, (i * 2 + 1) % 28 + 1).toISOString().slice(0, 10),
        ]
      );
    }
    console.log(`✅ Seeded ${names.length} customers.`);

    // 3. Seed Products
    const products = [
      { name: "Apex Pro Laptop 16", category: "Electronics", price: 1899.99, stock: 45 },
      { name: "Nova Wireless ANC Headphones", category: "Audio", price: 299.99, stock: 120 },
      { name: "UltraWide 4K Gaming Monitor 34\"", category: "Electronics", price: 799.50, stock: 30 },
      { name: "Ergonomic Mesh Chair Pro", category: "Furniture", price: 449.00, stock: 15 },
      { name: "Smart Fitness Watch Gen 4", category: "Wearables", price: 249.99, stock: 85 },
      { name: "Mechanical RGB Keyboard", category: "Accessories", price: 149.99, stock: 200 },
      { name: "Studio USB-C Microphone", category: "Audio", price: 179.00, stock: 60 },
      { name: "Standing Motorized Desk 60\"", category: "Furniture", price: 620.00, stock: 8 },
      { name: "Noise-Cancelling Earbuds", category: "Audio", price: 199.99, stock: 95 },
      { name: "Portable SSD 2TB Rugged", category: "Storage", price: 189.50, stock: 110 }
    ];

    for (const p of products) {
      await query(
        `INSERT INTO products (name, category, price, stock_quantity)
         VALUES ($1, $2, $3, $4)`,
        [p.name, p.category, p.price, p.stock]
      );
    }
    console.log(`✅ Seeded ${products.length} products.`);

    // 4. Seed Orders & Order Items
    const statuses = ["delivered", "delivered", "delivered", "shipped", "processing"];
    const countries = ["USA", "Germany", "Japan", "UK", "Canada", "India", "Brazil", "France"];

    for (let o = 1; o <= 40; o++) {
      const custId = (o % names.length) + 1;
      const orderDate = new Date(2024, (o % 12), (o * 3) % 28 + 1).toISOString().slice(0, 10);
      const status = statuses[o % statuses.length];
      const country = countries[o % countries.length];

      const ordRes = await query(
        `INSERT INTO orders (customer_id, order_date, status, shipping_country)
         VALUES ($1, $2, $3, $4) RETURNING order_id`,
        [custId, orderDate, status, country]
      );
      const orderId = ordRes.rows[0].order_id;

      // Add 1-3 items per order
      const itemCount = (o % 3) + 1;
      for (let j = 0; j < itemCount; j++) {
        const prodIndex = (o + j) % products.length;
        const prod = products[prodIndex];
        const qty = (j % 2) + 1;
        await query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [orderId, prodIndex + 1, qty, prod.price]
        );
      }
    }
    console.log("✅ Seeded 40 orders with order_items.");
    console.log("🎉 Database seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seed();
