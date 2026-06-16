import type { NextRequest } from "next/server";
import { generateAIResponse } from "@/lib/ai";
import { retrieveRelevantPages } from "@/lib/retrieval";

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
    // 1. Retrieve the top 3 most relevant pages
    const selected = retrieveRelevantPages(question, sanitizedPages);
    
    // 2. Build citations list
    const citations: Citation[] = selected.map((p) => ({ pageNumber: p.pageNumber }));

    // 3. Build context containing only the retrieved pages
    const documentText = selected
      .map((p) => `Page ${p.pageNumber}:\n${p.text}`)
      .join("\n\n");

    const systemPrompt = `You are a study assistant.

Use only the provided study material to answer the student's question.

If the answer is not present in the provided study material, you must reply with exactly: "I could not find this information in the uploaded document."

Do not use external knowledge or make assumptions outside the provided study material. Provide clear, concise, and educational answers.`;

    const userPrompt = `Study Material:
${documentText}

Student Question:
${question}

Please provide a clear educational answer based only on the study material provided above.`;

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
