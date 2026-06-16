import type { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 500 }
    );
  }

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
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

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
        { error: "Failed to generate quiz from Gemini" },
        { status: 500 }
      );
    }

    // Log raw Gemini output before parsing
    console.log("[Gemini quiz raw output]", responseText);

    const extractJsonFromGemini = (text: string): string => {
      const trimmed = text.trim();

      // 1) Remove markdown code fences if present
      // Handles ```json ... ``` and ``` ... ```
      const withoutFences = trimmed.replace(
        /```(?:json)?\s*([\s\S]*?)\s*```/gi,
        (_match, inner) => String(inner ?? "")
      );

      // 2) Try to extract the first JSON object
      const firstBrace = withoutFences.indexOf("{");
      const lastBrace = withoutFences.lastIndexOf("}");

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return withoutFences.slice(firstBrace, lastBrace + 1).trim();
      }

      // Fallback: use the whole string
      return withoutFences.trim();
    };

    const jsonCandidate = extractJsonFromGemini(responseText);

    // 4) Parse safely
    let quizData: QuizResponse;
    try {
      const parsed = JSON.parse(jsonCandidate) as QuizResponse;
      quizData = parsed;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : String(err ?? "Unknown error");

      return Response.json(
        {
          error: "Failed to parse quiz response from Gemini",
          details: {
            errorMessage,
            // 5) Return detailed error messages if parsing fails
            jsonCandidatePreview: jsonCandidate.slice(0, 500),
          },
        },
        { status: 500 }
      );
    }

    // Basic shape validation
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
