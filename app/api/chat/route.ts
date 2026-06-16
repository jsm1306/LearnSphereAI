import type { NextRequest } from "next/server";
import { generateAIResponse } from "@/lib/ai";
import { retrieveRelevantPages } from "@/lib/retrieval";

export const runtime = "nodejs";

export interface PdfPage {
  pageNumber: number;
  text: string;
}

export interface StudentLearningProfile {
  weakTopics: string[];
  averageScore: number;
  quizHistory: Array<{
    score: number;
    totalQuestions: number;
    percentage: number;
    timestamp: number;
    documentName: string;
  }>;
  questionsAsked: number;
}

export interface ChatRequest {
  pages: PdfPage[];
  question: string;
  studentProfile?: StudentLearningProfile | null;
}

export interface Citation {
  pageNumber: number;
}

export interface ChatMetrics {
  retrievalTime: number;
  generationTime: number;
  totalTime: number;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  metrics: ChatMetrics;
}

export async function POST(request: NextRequest) {
  const totalStart = Date.now();
  let body: ChatRequest;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const { pages, question, studentProfile } = body;

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
    .filter((p) => {
      if (!p) return false;
      const pageNumber = (p as any).pageNumber;
      const text = (p as any).text;
      return (
        typeof pageNumber === "number" &&
        Number.isFinite(pageNumber) &&
        typeof text === "string"
      );
    })
    .map((p) => {
      const pageNumber = (p as any).pageNumber as number;
      const text = (p as any).text as string;
      return { pageNumber, text };
    });


  if (sanitizedPages.length === 0) {
    return Response.json(
      { error: "pages must contain at least one page with text" },
      { status: 400 }
    );
  }

  try {
    // 1. Retrieve the top 3 most relevant pages and measure speed
    const retrievalStart = Date.now();
    const selected = retrieveRelevantPages(question, sanitizedPages);
    const retrievalTime = Date.now() - retrievalStart;

    // 2. Build citations list
    const citations: Citation[] = selected.map((p) => ({ pageNumber: p.pageNumber }));

    // 3. Build context containing only the retrieved pages
    const documentText = selected
      .map((p) => `Page ${p.pageNumber}:\n${p.text}`)
      .join("\n\n");

    const safeAverage =
      typeof studentProfile?.averageScore === "number" &&
      Number.isFinite(studentProfile.averageScore)
        ? studentProfile.averageScore
        : null;

    const learningLevel: "Beginner" | "Intermediate" | "Advanced" =
      safeAverage === null
        ? "Intermediate"
        : safeAverage < 60
          ? "Beginner"
          : safeAverage <= 80
            ? "Intermediate"
            : "Advanced";

    const weakTopics = Array.isArray(studentProfile?.weakTopics)
      ? studentProfile!.weakTopics
          .filter((x) => typeof x === "string")
          .slice(0, 10)
      : [];

    const adaptationRules =
      safeAverage === null
        ? `Adaptation Mode: NEUTRAL\n- Use a neutral, helpful learning style.`
        : safeAverage < 60
          ? `Adaptation Mode: LOW PERFORMANCE\n- Explain concepts in simpler beginner-friendly language.\n- Use analogies and very short examples.\n- Prefer step-by-step reasoning and avoid advanced terminology.\n- If relevant, suggest a quick mini-practice question.`
          : safeAverage <= 80
            ? `Adaptation Mode: MID PERFORMANCE\n- Provide standard educational explanations.\n- Use clear examples but avoid excessive detail.\n- Briefly connect the explanation to the student's likely weak concepts.`
            : `Adaptation Mode: HIGH PERFORMANCE\n- Provide more technical explanations and deeper insights.\n- Include deeper intuition and edge-case notes if they appear in the study material.\n- Avoid oversimplification.`;

    const studentProfileBlock = `Student Profile:\nWeak Topics:\n${
      weakTopics.length > 0
        ? weakTopics.map((t) => `* ${t}`).join("\n")
        : "(none identified yet)"
    }\nAverage Quiz Score: ${safeAverage === null ? "N/A" : `${safeAverage.toFixed(0)}%`}\nLearning Level: ${learningLevel}\nQuestions Asked: ${
      typeof studentProfile?.questionsAsked === "number" ? studentProfile!.questionsAsked : 0
    }\n`;

    const systemPrompt = `You are a study assistant.\n\n${studentProfileBlock}\n${adaptationRules}\n\nUse only the provided study material to answer the student's question.\n\nIf the answer is not present in the provided study material, you must reply with exactly: "I could not find this information in the uploaded document."\n\nDo not use external knowledge or make assumptions outside the provided study material. Provide clear, concise, and educational answers.`;

    const userPrompt = `Study Material:\n${documentText}\n\nStudent Question:\n${question}\n\nPlease provide a clear educational answer based only on the study material provided above.`;

    const prompt = `${systemPrompt}\n\n${userPrompt}`;

    // 4. Call LLM generation and measure speed
    const generationStart = Date.now();
    const result = await generateAIResponse(prompt);
    const generationTime = Date.now() - generationStart;

    if (!result.text) {
      return Response.json(
        { error: "Failed to generate response" },
        { status: 500 }
      );
    }

    const totalTime = Date.now() - totalStart;

    const response: ChatResponse = {
      answer: result.text,
      citations,
      metrics: {
        retrievalTime,
        generationTime,
        totalTime,
      },
    };

    return Response.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error ?? "Unknown error");

    return Response.json(
      { error: `Failed to process chat request: ${message}` },
      { status: 500 }
    );
  }
}

