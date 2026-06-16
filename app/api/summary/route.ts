import type { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface SummaryRequest {
  documentText: string;
}

export interface SummaryResponse {
  summary: string;
}

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let body: SummaryRequest;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const { documentText } = body;

  if (!documentText || typeof documentText !== "string") {
    return Response.json(
      { error: "documentText is required and must be a string" },
      { status: 400 }
    );
  }

  try {
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `You are an expert study assistant that creates structured summaries for learning.

Create comprehensive study summaries that are well-organized and easy to understand.

Use clear formatting with sections and bullet points.

Focus on helping students understand and retain key information.`;

    const userPrompt = `Please create a structured study summary of the following material:

${documentText}

Organize the summary with these sections:

1. Key Concepts - The main ideas and theories covered
2. Important Definitions - Terms and concepts that are essential to understand
3. Exam Revision Notes - Critical points students should remember for exams
4. Quick Takeaways - A brief summary of the most important takeaways

Use bullet points and numbered lists for clarity. Make it concise but comprehensive.`;

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
        { error: "Failed to generate summary from Gemini" },
        { status: 500 }
      );
    }

    const response: SummaryResponse = {
      summary: responseText,
    };

    return Response.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown error");

    return Response.json(
      { error: `Failed to generate summary: ${message}` },
      { status: 500 }
    );
  }
}
