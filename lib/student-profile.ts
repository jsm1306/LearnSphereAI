"use client";

import { getTrackerStats, getLatestRecommendations } from "@/lib/tracker";

export type LearningProfile = {
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
};

function clampNumber(n: number) {
  if (!Number.isFinite(n)) return 0;
  return n;
}

function calculateLearningLevel(averageScore: number):
  | "Beginner"
  | "Intermediate"
  | "Advanced" {
  if (averageScore < 60) return "Beginner";
  if (averageScore <= 80) return "Intermediate";
  return "Advanced";
}

export function getStudentLearningProfile(): LearningProfile {
  const stats = getTrackerStats();
  const recs = getLatestRecommendations();

  const averageScore =
    stats.totalQuizQuestions > 0
      ? (stats.totalCorrectQuizAnswers / stats.totalQuizQuestions) * 100
      : 0;

  const quizHistory = Array.isArray(stats.quizHistory) ? stats.quizHistory : [];

  const weakFromRecs: string[] = Array.isArray(recs?.weakAreas)
    ? (recs!.weakAreas as unknown[]).filter((x) => typeof x === "string") as string[]
    : [];



  // Lightweight merge: prioritize recs, but if performance is low and we have history,
  // keep the profile focused on weak topics.
  const shouldUseWeakFocus = averageScore > 0 && averageScore < 80;

  const weakTopics = shouldUseWeakFocus
    ? Array.from(new Set(weakFromRecs)).slice(0, 8)
    : Array.from(new Set(weakFromRecs)).slice(0, 8);

  return {
    weakTopics,
    averageScore: clampNumber(averageScore),
    quizHistory,
    questionsAsked: stats.questionsAsked ?? 0,
  };
}

export function getLearningLevelFromProfile(profile: LearningProfile):
  | "Beginner"
  | "Intermediate"
  | "Advanced" {
  return calculateLearningLevel(profile.averageScore);
}

