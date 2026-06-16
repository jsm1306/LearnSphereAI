import type { NextRequest } from "next/server";
import { generateAIResponse } from "@/lib/ai";

export const runtime = "nodejs";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface QuizRequest {
  documentText: string;
}

export interface QuizResponse {
  questions: QuizQuestion[];
}

export async function POST(request: NextRequest) {
  let body: QuizRequest;

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
    const systemPrompt = `You are an expert educator creating multiple-choice quiz questions from study materials.

Return ONLY valid JSON.
Do not include markdown.
Do not include code fences.
Do not include explanations, introductory text, or surrounding commentary.

Return exactly this JSON object and nothing else:
{
  "questions": [
    {
      "question": "...",
      "options": ["A","B","C","D"],
      "correctAnswer": "..."
    }
  ]
}

The outer object must be exactly the key "questions" with an array of 10 items.`;

    const userPrompt = `From the following study material, generate exactly 10 multiple-choice questions.

Return the response as a JSON object with this exact structure (and nothing else):
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A"
    }
  ]
}

Study Material:
${documentText}

Remember: Return ONLY the JSON object, no other text.`;

    const prompt = `${systemPrompt}\n\n${userPrompt}`;

    const result = await generateAIResponse(prompt);

    const responseText = result.text;

    if (!responseText) {
      return Response.json(
        { error: "Failed to generate quiz" },
        { status: 500 }
      );
    }

    console.log("[AI quiz raw output]", responseText);

    const extractJsonFromAI = (text: string): string => {
      const trimmed = text.trim();

      const withoutFences = trimmed.replace(
        /```(?:json)?\s*([\s\S]*?)\s*```/gi,
        (_match, inner) => String(inner ?? "")
      );

      const firstBrace = withoutFences.indexOf("{");
      const lastBrace = withoutFences.lastIndexOf("}");

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return withoutFences.slice(firstBrace, lastBrace + 1).trim();
      }

      return withoutFences.trim();
    };

    const jsonCandidate = extractJsonFromAI(responseText);

    let quizData: QuizResponse;
    try {
      const parsed = JSON.parse(jsonCandidate) as QuizResponse;
      quizData = parsed;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : String(err ?? "Unknown error");

      return Response.json(
        {
          error: "Failed to parse quiz response",
          details: {
            errorMessage,
            jsonCandidatePreview: jsonCandidate.slice(0, 500),
          },
        },
        { status: 500 }
      );
    }

    if (!quizData?.questions || !Array.isArray(quizData.questions)) {
      return Response.json(
        {
          error: "Invalid quiz format received",
          details: {
            receivedShape: Object.keys(quizData ?? {}),
          },
        },
        { status: 500 }
      );
    }

    return Response.json(quizData);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown error");

    return Response.json(
      { error: `Failed to generate quiz: ${message}` },
      { status: 500 }
    );
  }
}

