/**
 * services/llmService.js
 *
 * LLM integration with Groq (primary) and Google Gemini (automatic fallback).
 *
 * Flow:
 *  1. Try Groq with the configured model (default: llama-3.3-70b-versatile).
 *  2. If Groq throws a rate-limit (429) or is unavailable, fall back to Gemini Flash.
 *  3. Parse the JSON response { sql, explanation } from either provider.
 *  4. If JSON parsing fails, throw a descriptive error — never pass raw text downstream.
 *
 * The caller (routes/query.js) decides what to do with the parsed SQL;
 * this service only handles LLM communication and response parsing.
 */

const Groq = require("groq-sdk");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ── Clients (lazy-initialized to avoid crashing on missing env vars at import) ──

let _groqClient = null;
let _geminiClient = null;

function getGroqClient() {
  if (!_groqClient) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not set in environment");
    }
    _groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groqClient;
}

function getGeminiClient() {
  if (!_geminiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment");
    }
    _geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return _geminiClient;
}

// ── JSON parser ───────────────────────────────────────────────────────────────

/**
 * Parse the LLM's text response into { sql, explanation }.
 * Handles cases where the model wraps the JSON in markdown code fences.
 * @param {string} text
 * @returns {{ sql: string, explanation: string }}
 */
function parseResponse(text) {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  // Remove ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  // Extract first JSON object (handles any leading/trailing text)
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error(`LLM response is not valid JSON. Raw: ${text.slice(0, 200)}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    throw new Error(`Failed to parse LLM JSON: ${match[0].slice(0, 200)}`);
  }

  if (!parsed.sql || typeof parsed.sql !== "string") {
    throw new Error(`LLM JSON missing 'sql' field. Got: ${JSON.stringify(parsed).slice(0, 200)}`);
  }

  return {
    sql: parsed.sql.trim(),
    explanation: parsed.explanation?.trim() ?? "",
  };
}

// ── Groq call ─────────────────────────────────────────────────────────────────

/**
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @returns {Promise<{ sql: string, explanation: string, provider: string }>}
 */
async function callGroq(systemPrompt, userMessage) {
  const client = getGroqClient();
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  console.log(`[llm] Calling Groq (${model})...`);

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.1,       // Low temp for deterministic SQL
    max_tokens: 1024,
    response_format: { type: "json_object" }, // Groq supports this
  });

  const text = completion.choices[0]?.message?.content ?? "";
  console.log(`[llm] Groq raw response: ${text.slice(0, 300)}`);

  const result = parseResponse(text);
  return { ...result, provider: "groq" };
}

// ── Gemini call ───────────────────────────────────────────────────────────────

/**
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @returns {Promise<{ sql: string, explanation: string, provider: string }>}
 */
async function callGemini(systemPrompt, userMessage) {
  const genAI = getGeminiClient();
  const primaryModel = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const candidateModels = [primaryModel, "gemini-3.6-flash", "gemini-3.7-flash"];
  // Deduplicate candidate models
  const modelsToTry = [...new Set(candidateModels)];

  let lastErr = null;
  for (const modelName of modelsToTry) {
    try {
      console.log(`[llm] Calling Gemini (${modelName})...`);

      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
        },
      });

      const result = await model.generateContent(userMessage);
      const text = result.response.text();
      console.log(`[llm] Gemini raw response: ${text.slice(0, 300)}`);

      const parsed = parseResponse(text);
      return { ...parsed, provider: `gemini (${modelName})` };
    } catch (err) {
      lastErr = err;
      console.warn(`[llm] Gemini (${modelName}) error: ${err.message}. Trying next candidate if available.`);
    }
  }

  throw lastErr;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate SQL from a natural-language question.
 * Tries Groq first; falls back to Gemini on rate-limit (429) or any Groq error.
 *
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @returns {Promise<{ sql: string, explanation: string, provider: string }>}
 */
async function generateSQL(systemPrompt, userMessage) {
  // Try Groq
  try {
    return await callGroq(systemPrompt, userMessage);
  } catch (groqErr) {
    const isRateLimit =
      groqErr?.status === 429 ||
      groqErr?.message?.includes("rate") ||
      groqErr?.message?.includes("429");

    console.warn(
      `[llm] Groq ${isRateLimit ? "rate-limited" : "failed"}: ${groqErr.message}. Falling back to Gemini.`
    );
  }

  // Fallback: Gemini
  return await callGemini(systemPrompt, userMessage);
}

module.exports = { generateSQL };
