import type { NextRequest } from "next/server";
import { generateAIResponse } from "@/lib/ai";

export const runtime = "nodejs";


export interface RecommendationsRequest {
  documentText: string;
  score: number;
  totalQuestions: number;
  incorrectQuestions: string[];
}

export interface RecommendationsResponse {
  weakAreas: string[];
  revisionTopics: string[];
  studyPlan: string[];
}

export async function POST(request: NextRequest) {


  let body: RecommendationsRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }

  const { documentText, score, totalQuestions, incorrectQuestions } =
    body ?? {
      documentText: "",
      score: 0,
      totalQuestions: 0,
      incorrectQuestions: [],
    };


  if (!documentText || typeof documentText !== "string") {
    return Response.json(
      { error: "documentText is required and must be a string" },
      { status: 400 }
    );
  }

  if (typeof score !== "number" || Number.isNaN(score)) {
    return Response.json({ error: "score is required and must be a number" }, { status: 400 });
  }

  if (typeof totalQuestions !== "number" || Number.isNaN(totalQuestions)) {
    return Response.json(
      { error: "totalQuestions is required and must be a number" },
      { status: 400 }
    );
  }

  if (!Array.isArray(incorrectQuestions)) {
    return Response.json(
      { error: "incorrectQuestions is required and must be an array of strings" },
      { status: 400 }
    );
  }

  const incorrectQuestionsClean = incorrectQuestions
    .filter((x) => typeof x === "string")
    .slice(0, 50);


  try {
    const systemPrompt = `You are an expert educator generating personalized learning recommendations.


Return ONLY valid JSON.
Do not include markdown.
Do not include code fences.
Do not include explanations, introductory text, or surrounding commentary.

Return exactly this JSON object and nothing else:
{
  "weakAreas": ["..."],
  "revisionTopics": ["..."],
  "studyPlan": ["..."
  ]
}

Rules:
- All values must be arrays of strings.
- studyPlan should be a short, actionable plan (3-7 bullet-like steps as strings).
- weakAreas and revisionTopics should be concise (3-8 items each).`;

    const userPrompt = `You are given:
- Study material text
- A quiz score summary

Task:
1) Identify weak concepts the learner likely needs to revise.
2) Suggest revision topics from the material.
3) Generate a short study plan.
4) Recommend areas needing improvement.

Use only the provided study material.

Input:
Study Material:
${documentText}

Quiz Results:
Score: ${score}
Total Questions: ${totalQuestions}
Incorrect Questions (by question text):
${incorrectQuestionsClean.join("\n")}

Return ONLY the JSON object with weakAreas, revisionTopics, studyPlan.`;

    const prompt = `${systemPrompt}\n\n${userPrompt}`;

    const result = await generateAIResponse(prompt);

    const responseText = result.text || "";


    if (!responseText) {
      return Response.json(
        { error: "Failed to generate recommendations from Gemini" },
        { status: 500 }
      );
    }

    // Log raw Gemini output before parsing
    console.log("[Gemini recommendations raw output]", responseText);

    const extractJsonFromGemini = (text: string): string => {
      const trimmed = text.trim();

      // Remove markdown code fences if present
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

    const jsonCandidate = extractJsonFromGemini(responseText);

    let data: RecommendationsResponse;
    try {
      data = JSON.parse(jsonCandidate) as RecommendationsResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err ?? "Unknown error");
      return Response.json(
        {
          error: "Failed to parse recommendations response from Gemini",
          details: {
            errorMessage,
            jsonCandidatePreview: jsonCandidate.slice(0, 500),
          },
        },
        { status: 500 }
      );
    }

    if (!data) {
      return Response.json({ error: "Invalid recommendations format received" }, { status: 500 });
    }

    const safeWeakAreas = Array.isArray(data.weakAreas) ? data.weakAreas.filter((x) => typeof x === "string").slice(0, 12) : [];
    const safeRevisionTopics = Array.isArray(data.revisionTopics)
      ? data.revisionTopics.filter((x) => typeof x === "string").slice(0, 12)
      : [];
    const safeStudyPlan = Array.isArray(data.studyPlan)
      ? data.studyPlan.filter((x) => typeof x === "string").slice(0, 10)
      : [];

    return Response.json({
      weakAreas: safeWeakAreas,
      revisionTopics: safeRevisionTopics,
      studyPlan: safeStudyPlan,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error ?? "Unknown error");
    return Response.json({ error: `Failed to generate recommendations: ${message}` }, { status: 500 });
  }
}

