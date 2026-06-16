import type { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface ChatRequest {
  documentText: string;
  question: string;
}

export interface ChatResponse {
  answer: string;
}

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let body: ChatRequest;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const { documentText, question } = body;

  if (!documentText || typeof documentText !== "string") {
    return Response.json(
      { error: "documentText is required and must be a string" },
      { status: 400 }
    );
  }

  if (!question || typeof question !== "string") {
    return Response.json(
      { error: "question is required and must be a string" },
      { status: 400 }
    );
  }

  try {
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `You are a study assistant.

Use only the provided study material to answer the student's question.

If the answer cannot be found in the study material, clearly state that the information is not available in the provided document.

Provide clear, concise, and educational answers.`;

    const userPrompt = `Study Material:
${documentText}

Student Question:
${question}

Please provide a clear educational answer based only on the study material provided above.`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      systemInstruction: systemPrompt,
    });

    const responseText =
      result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!responseText) {
      return Response.json(
        { error: "Failed to generate response from Gemini" },
        { status: 500 }
      );
    }

    const response: ChatResponse = {
      answer: responseText,
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
