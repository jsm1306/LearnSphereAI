import type { NextRequest } from "next/server";
import { generateAIResponse } from "@/lib/ai";

export const runtime = "nodejs";

export interface SummaryRequest {
  documentText: string;
}

export interface SummaryResponse {
  summary: string;
}

export async function POST(request: NextRequest) {
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

    const prompt = `${systemPrompt}\n\n${userPrompt}`;

    const result = await generateAIResponse(prompt);

    if (!result.text) {
      return Response.json(
        { error: "Failed to generate summary" },
        { status: 500 }
      );
    }

    const response: SummaryResponse = {
      summary: result.text,
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

