import { GoogleGenerativeAI } from "@google/generative-ai";

export type ProviderName = "gemini" | "groq";

export type AIResult = {
  provider: ProviderName;
  text: string;
};

const GEMINI_MODEL = "gemini-2.5-flash";

// Note: This is a minimal Groq fallback implementation using Groq's OpenAI-compatible API.
// If the repo already uses a different Groq SDK, this file can be adjusted.
async function callGroq(prompt: string): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const maybeText = await res.text().catch(() => "");
    throw new Error(`Groq request failed (${res.status}): ${maybeText}`);
  }

  const data: unknown = await res.json();

  const text =
    (data as any)?.choices?.[0]?.message?.content ??
    (data as any)?.choices?.[0]?.text ??
    "";

  if (!text || typeof text !== "string") {
    throw new Error("Groq returned empty response");
  }

  return text;
}

function shouldFallbackToGroq(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  const lower = msg.toLowerCase();

  // Common patterns: rate limit / overloaded / timeouts / 429/500/503
  return (
    lower.includes("429") ||
    lower.includes("rate limit") ||
    lower.includes("rate-limit") ||
    lower.includes("503") ||
    lower.includes("500") ||
    lower.includes("overloaded") ||
    lower.includes("timeout") ||
    lower.includes("timed out")
  );
}

async function callGemini(prompt: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = client.getGenerativeModel({ model: GEMINI_MODEL });

  // Gemini expects an instruction + prompt; for simplicity we just pass prompt as text.
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const text =
    result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!text || typeof text !== "string") {
    throw new Error("Gemini returned empty response");
  }

  return text;
}

export async function generateAIResponse(prompt: string): Promise<AIResult> {
  try {
    console.log("Using Gemini");
    const text = await callGemini(prompt);
    return { provider: "gemini", text };
  } catch (err) {
    if (!shouldFallbackToGroq(err)) {
      throw err;
    }

    console.log("Gemini failed, switching to Groq");
    const text = await callGroq(prompt);
    return { provider: "groq", text };
  }
}

