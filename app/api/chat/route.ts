import type { NextRequest } from "next/server";
import { generateAIResponse } from "@/lib/ai";

export const runtime = "nodejs";

export interface PdfPage {
  pageNumber: number;
  text: string;
}

export interface ChatRequest {
  pages: PdfPage[];
  question: string;
}

export interface Citation {
  pageNumber: number;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function scorePage(pageText: string, question: string): number {
  const qTokens = tokenize(question);
  if (qTokens.length === 0) return 0;

  const pTokens = tokenize(pageText);
  if (pTokens.length === 0) return 0;

  const pSet = new Set(pTokens);

  let hit = 0;
  let exact = 0;

  for (const qt of qTokens) {
    if (pSet.has(qt)) hit += 1;
    if (qt.length >= 6 && pSet.has(qt)) exact += 1;
  }

  return hit + exact * 0.5;
}

function selectRelevantPages(pages: PdfPage[], question: string) {
  const scored = pages
    .map((p) => ({ page: p, score: scorePage(p.text, question) }))
    .sort((a, b) => b.score - a.score);

  const bestScore = scored[0]?.score ?? 0;
  const hasSignal = bestScore >= 2;

  if (!hasSignal) {
    return { selected: [] as PdfPage[], citations: [] as Citation[] };
  }

  const topN = Math.min(4, scored.length);
  const selected = scored
    .slice(0, topN)
    .filter((x) => x.score > 0)
    .map((x) => x.page);

  const uniq = new Map<number, PdfPage>();
  for (const p of selected) uniq.set(p.pageNumber, p);

  const finalPages = Array.from(uniq.values()).sort(
    (a, b) => a.pageNumber - b.pageNumber
  );

  const citations: Citation[] = finalPages.map((p) => ({ pageNumber: p.pageNumber }));
  return { selected: finalPages, citations };
}

export async function POST(request: NextRequest) {
  let body: ChatRequest;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const { pages, question } = body;

  if (!Array.isArray(pages)) {
    return Response.json(
      { error: "pages is required and must be an array" },
      { status: 400 }
    );
  }

  if (!question || typeof question !== "string") {
    return Response.json(
      { error: "question is required and must be a string" },
      { status: 400 }
    );
  }

  const sanitizedPages: PdfPage[] = pages
    .filter(
      (p: any) =>
        p &&
        typeof p.pageNumber === "number" &&
        Number.isFinite(p.pageNumber) &&
        typeof p.text === "string"
    )
    .map((p: any) => ({ pageNumber: p.pageNumber, text: p.text }));

  if (sanitizedPages.length === 0) {
    return Response.json(
      { error: "pages must contain at least one page with text" },
      { status: 400 }
    );
  }

  try {
    const { selected, citations } = selectRelevantPages(sanitizedPages, question);

    // If no relevant pages found, answer using the full concatenated text.
    // Requirement #6: frontend displays "Document-wide answer" when citations is empty.
    const documentText = selected.length
      ? selected.map((p) => `Page ${p.pageNumber}: ${p.text}`).join("\n\n")
      : sanitizedPages.map((p) => p.text).join("\n\n");

    const systemPrompt = `You are a study assistant.\n\nUse only the provided study material to answer the student's question.\n\nIf the answer cannot be found in the study material, clearly state that the information is not available in the provided document.\n\nProvide clear, concise, and educational answers.`;

    const userPrompt = `Study Material:\n${documentText}\n\nStudent Question:\n${question}\n\nPlease provide a clear educational answer based only on the study material provided above.`;

    const prompt = `${systemPrompt}\n\n${userPrompt}`;

    const result = await generateAIResponse(prompt);

    if (!result.text) {
      return Response.json(
        { error: "Failed to generate response" },
        { status: 500 }
      );
    }

    const response: ChatResponse = {
      answer: result.text,
      citations,
    };

    return Response.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown error");

    return Response.json(
      { error: `Failed to process chat request: ${message}` },
      { status: 500 }
    );
  }
}

