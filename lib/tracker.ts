"use client";

export interface QuizAttempt {
  score: number;
  totalQuestions: number;
  percentage: number;
  timestamp: number;
  documentName: string;
}

export interface TrackerStats {
  documentsUploaded: number;
  quizzesAttempted: number;
  totalQuizQuestions: number;
  totalCorrectQuizAnswers: number;
  questionsAsked: number;
  quizHistory: QuizAttempt[];
  activeDates: string[];
  highestScorePercentage: number;
}

export interface PdfPage {
  pageNumber: number;
  text: string;
}

export interface ActiveDoc {
  name: string;
  text: string;
  pages: PdfPage[];
  pageCount: number | null;
  uploadedAt: number;
  summary?: string;
}

const STATS_KEY = "learnsphere_stats_v2";
const ACTIVE_DOC_KEY = "learnsphere_active_doc_v2";
const LATEST_QUIZ_KEY = "learnsphere_latest_quiz_v2";
const LATEST_RECOMMENDATIONS_KEY = "learnsphere_latest_recs_v2";

const defaultStats: TrackerStats = {
  documentsUploaded: 0,
  quizzesAttempted: 0,
  totalQuizQuestions: 0,
  totalCorrectQuizAnswers: 0,
  questionsAsked: 0,
  quizHistory: [],
  activeDates: [],
  highestScorePercentage: 0,
};

const isClient = typeof window !== "undefined";

export function getTrackerStats(): TrackerStats {
  if (!isClient) return defaultStats;
  try {
    const data = localStorage.getItem(STATS_KEY);
    if (!data) return defaultStats;
    const parsed = JSON.parse(data);
    return { ...defaultStats, ...parsed };
  } catch {
    return defaultStats;
  }
}

export function saveTrackerStats(stats: TrackerStats) {
  if (!isClient) return;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    window.dispatchEvent(new Event("learnsphere_tracker_update"));
  } catch (e) {
    console.error("Failed to save stats:", e);
  }
}

export function trackUpload(docName: string) {
  const stats = getTrackerStats();
  stats.documentsUploaded += 1;
  
  const todayStr = new Date().toISOString().split("T")[0];
  if (!stats.activeDates.includes(todayStr)) {
    stats.activeDates.push(todayStr);
  }
  
  saveTrackerStats(stats);
}

export function trackQuestionAsked() {
  const stats = getTrackerStats();
  stats.questionsAsked += 1;
  
  const todayStr = new Date().toISOString().split("T")[0];
  if (!stats.activeDates.includes(todayStr)) {
    stats.activeDates.push(todayStr);
  }
  
  saveTrackerStats(stats);
}

export function trackQuizSubmission(score: number, totalQuestions: number, documentName: string) {
  const stats = getTrackerStats();
  stats.quizzesAttempted += 1;
  stats.totalQuizQuestions += totalQuestions;
  stats.totalCorrectQuizAnswers += score;
  
  const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
  stats.highestScorePercentage = Math.max(stats.highestScorePercentage, percentage);
  
  const attempt: QuizAttempt = {
    score,
    totalQuestions,
    percentage,
    timestamp: Date.now(),
    documentName,
  };
  
  stats.quizHistory.unshift(attempt);
  
  const todayStr = new Date().toISOString().split("T")[0];
  if (!stats.activeDates.includes(todayStr)) {
    stats.activeDates.push(todayStr);
  }
  
  saveTrackerStats(stats);
}

export function getActiveDoc(): ActiveDoc | null {
  if (!isClient) return null;
  try {
    const data = localStorage.getItem(ACTIVE_DOC_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setActiveDoc(doc: ActiveDoc | null) {
  if (!isClient) return;
  try {
    if (doc === null) {
      localStorage.removeItem(ACTIVE_DOC_KEY);
      localStorage.removeItem(LATEST_QUIZ_KEY);
      localStorage.removeItem(LATEST_RECOMMENDATIONS_KEY);
    } else {
      localStorage.setItem(ACTIVE_DOC_KEY, JSON.stringify(doc));
    }
    window.dispatchEvent(new Event("learnsphere_active_doc_update"));
  } catch (e) {
    console.error("Failed to set active doc:", e);
  }
}

export function saveActiveDocSummary(summary: string) {
  const doc = getActiveDoc();
  if (doc) {
    doc.summary = summary;
    setActiveDoc(doc);
  }
}

export function getLatestRecommendations(): any | null {
  if (!isClient) return null;
  try {
    const data = localStorage.getItem(LATEST_RECOMMENDATIONS_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveLatestRecommendations(recs: any) {
  if (!isClient) return;
  try {
    localStorage.setItem(LATEST_RECOMMENDATIONS_KEY, JSON.stringify(recs));
    window.dispatchEvent(new Event("learnsphere_recs_update"));
  } catch (e) {
    console.error("Failed to save recommendations:", e);
  }
}

export function calculateStreak(activeDates: string[]): number {
  if (!activeDates || activeDates.length === 0) return 0;
  
  const uniqueDates = Array.from(new Set(activeDates)).sort();
  const todayStr = new Date().toISOString().split("T")[0];
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  
  if (!uniqueDates.includes(todayStr) && !uniqueDates.includes(yesterdayStr)) {
    return 0;
  }
  
  let streak = 0;
  let checkDate = uniqueDates.includes(todayStr) ? new Date() : yesterday;
  
  while (true) {
    const checkStr = checkDate.toISOString().split("T")[0];
    if (uniqueDates.includes(checkStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}
