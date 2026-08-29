/**
 * services/promptBuilder.js
 *
 * Builds the system prompt and user message sent to the LLM.
 * Includes: role, live schema, hard rules, 5 few-shot NL→SQL examples.
 *
 * The LLM is expected to return a JSON object:
 *   { "sql": "SELECT ...", "explanation": "..." }
 */

/**
 * Few-shot examples covering the most common BI question patterns.
 * These ground the model on exact table/column names and LIMIT usage.
 */
const FEW_SHOT_EXAMPLES = [
  {
    question: "Top 5 products by total revenue",
    sql: `SELECT p.name, SUM(oi.quantity * oi.unit_price) AS revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.status = 'delivered'
GROUP BY p.name
ORDER BY revenue DESC
LIMIT 5`,
  },
  {
    question: "How many orders were placed each month in 2024?",
    sql: `SELECT TO_CHAR(order_date, 'YYYY-MM') AS month, COUNT(*) AS order_count
FROM orders
WHERE order_date >= '2024-01-01' AND order_date < '2025-01-01'
GROUP BY month
ORDER BY month
LIMIT 12`,
  },
  {
    question: "Which regions have the most customers?",
    sql: `SELECT region, COUNT(*) AS customer_count
FROM customers
GROUP BY region
ORDER BY customer_count DESC
LIMIT 10`,
  },
  {
    question: "What is the average order value by product category?",
    sql: `SELECT p.category, ROUND(AVG(oi.quantity * oi.unit_price), 2) AS avg_order_value
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
GROUP BY p.category
ORDER BY avg_order_value DESC
LIMIT 10`,
  },
  {
    question: "Show me the top 10 customers by total spend",
    sql: `SELECT c.name, c.email, SUM(oi.quantity * oi.unit_price) AS total_spend
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
JOIN order_items oi ON o.order_id = oi.order_id
WHERE o.status != 'cancelled'
GROUP BY c.customer_id, c.name, c.email
ORDER BY total_spend DESC
LIMIT 10`,
  },
];

/**
 * Build the system prompt that is sent to the LLM as the "system" role.
 * @param {string} formattedSchema — output of schemaService.formatSchemaForPrompt()
 * @returns {string}
 */
function buildSystemPrompt(formattedSchema) {
  const examples = FEW_SHOT_EXAMPLES.map(
    (ex, i) =>
      `Example ${i + 1}:\nQuestion: "${ex.question}"\nSQL:\n\`\`\`sql\n${ex.sql}\n\`\`\``
  ).join("\n\n");

  return `You are a SQL expert assistant for a business intelligence dashboard called Queryline.
Your only job is to convert a plain-English business question into a valid, safe PostgreSQL SELECT query.

## Database Schema
The database contains ONLY these tables and columns:
\`\`\`
${formattedSchema}
\`\`\`

## Hard Rules — You MUST follow all of these
1. Generate ONLY a single SELECT statement. Never use INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, TRUNCATE, GRANT, REVOKE, or any DDL/DML.
2. Use ONLY the tables and columns listed in the schema above. Do not hallucinate columns or tables.
3. Every query MUST include a LIMIT clause (max 100). If the user asks for "all", still use LIMIT 100.
4. Do NOT use semicolons. Return exactly one statement.
5. Do NOT use subqueries that reference tables outside the allow-list.
6. Use table aliases when joining. Use explicit column references (e.g., p.name not just name) when joining.
7. For date filtering, use ISO format strings ('YYYY-MM-DD'). Use date_trunc() or TO_CHAR() for grouping.
8. When the question is ambiguous about which orders to include, default to status != 'cancelled'.

## Response Format — CRITICAL
Respond with ONLY a valid JSON object in this exact shape, with no markdown, no code fences, no explanation outside the JSON:
{"sql":"<your single-line SQL here>","explanation":"<one sentence explaining what this query returns>"}

## Few-Shot Examples
${examples}

Now generate SQL for the user's question. Remember: JSON only, no markdown.`;
}

/**
 * Build the user message sent as the "user" role.
 * @param {string} question — the raw natural language question
 * @returns {string}
 */
function buildUserMessage(question) {
  return `Question: "${question}"`;
}

module.exports = { buildSystemPrompt, buildUserMessage, FEW_SHOT_EXAMPLES };
