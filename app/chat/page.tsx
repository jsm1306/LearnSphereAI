"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import ProtectedShell from "@/lib/protected-shell";
import { 
  getActiveDoc, 
  trackQuestionAsked, 
  ActiveDoc 
} from "@/lib/tracker";
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  AlertTriangle,
  Upload,
  ArrowRight,
  RefreshCw,
  FileText
} from "lucide-react";

interface ChatCitation {
  pageNumber: number;
}

interface ChatMessage {
  id: string;
  question: string;
  answer: string;
  citations?: ChatCitation[];
  timestamp: number;
}

export default function ChatPage() {
  const [mounted, setMounted] = useState(false);
  const [activeDoc, setActiveDoc] = useState<ActiveDoc | null>(null);
  const [question, setQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load active doc and cached chat history
  useEffect(() => {
    setMounted(true);
    const doc = getActiveDoc();
    setActiveDoc(doc);
    
    if (doc) {
      const historyKey = `learnsphere_chat_history_${doc.name}`;
      try {
        const cached = localStorage.getItem(historyKey);
        if (cached) {
          setChatMessages(JSON.parse(cached));
        }
      } catch (e) {
        console.error("Failed to load chat history:", e);
      }
    }
  }, []);

  // Save chat history when it changes
  useEffect(() => {
    if (activeDoc && chatMessages.length > 0) {
      const historyKey = `learnsphere_chat_history_${activeDoc.name}`;
      try {
        localStorage.setItem(historyKey, JSON.stringify(chatMessages));
      } catch (e) {
        console.error("Failed to cache chat history:", e);
      }
    }
  }, [chatMessages, activeDoc]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  if (!mounted) {
    return (
      <ProtectedShell>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-48 rounded bg-slate-200"></div>
          <div className="h-4 w-72 rounded bg-slate-200"></div>
          <div className="h-64 rounded-3xl bg-slate-200"></div>
        </div>
      </ProtectedShell>
    );
  }

  const handleAskQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setChatError(null);

    if (!question.trim()) {
      setChatError("Please enter a question.");
      return;
    }

    if (!activeDoc || !activeDoc.pages || activeDoc.pages.length === 0) {
      setChatError("Upload a PDF before asking questions.");
      return;
    }

    try {
      setChatLoading(true);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pages: activeDoc.pages,
          question: question.trim(),
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to get answer");
      }

      const data = await response.json();

      if (!data.answer) {
        throw new Error("No answer received from AI");
      }

      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        question: question.trim(),
        answer: data.answer,
        citations: Array.isArray(data.citations) ? data.citations : [],
        timestamp: Date.now(),
      };

      setChatMessages((prev) => [...prev, newMessage]);
      setQuestion("");
      trackQuestionAsked();
    } catch (caught) {
      setChatError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setChatLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (activeDoc) {
      const historyKey = `learnsphere_chat_history_${activeDoc.name}`;
      localStorage.removeItem(historyKey);
      setChatMessages([]);
    }
  };

  const renderSources = (citations?: ChatCitation[]) => {
    const items = Array.isArray(citations) ? citations : [];

    // Filter duplicates
    const seen = new Set<number>();
    const uniqueInOrder: number[] = [];

    for (const c of items) {
      if (!seen.has(c.pageNumber)) {
        seen.add(c.pageNumber);
        uniqueInOrder.push(c.pageNumber);
      }
    }

    return (
      <div className="mt-3.5 pt-3 border-t border-emerald-100/50 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          {/* Smart Search Active Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 uppercase tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            Smart Search Active
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs font-semibold text-slate-500">
          <span>Sources:</span>
          {uniqueInOrder.length === 0 ? (
            <span className="inline-flex items-center rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
              Document-wide answer
            </span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {uniqueInOrder.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700 transition hover:bg-blue-100/60"
                >
                  <FileText className="h-3 w-3 text-blue-500" />
                  Page {p}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <ProtectedShell>
      <div className="space-y-6 flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-120px)]">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-indigo-600" />
              AI Chat Assistant
            </h1>
            {activeDoc ? (
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate max-w-sm md:max-w-xl">
                Chatting with <span className="font-semibold text-indigo-600 truncate">{activeDoc.name}</span> ({activeDoc.pageCount} pages)
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">No active document to query</p>
            )}
          </div>
          
          {activeDoc && chatMessages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Clear Chat
            </button>
          )}
        </div>

        {/* Chat Workspace */}
        {!activeDoc ? (
          <div className="flex-1 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-600 mb-4 animate-pulse">
              <AlertTriangle className="h-10 w-10" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">No Active Study Document</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
              Before asking questions, please upload a PDF. Our AI assistant needs a document source to construct citation-based responses.
            </p>
            <Link 
              href="/upload" 
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white px-5 py-3 mt-6 shadow-sm transition hover:scale-[1.02]"
            >
              <Upload className="h-4 w-4" />
              Upload PDF
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="flex-1 flex flex-col rounded-3xl border border-slate-200/60 bg-white shadow-sm overflow-hidden min-h-0">
            {/* Messages Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="rounded-2xl bg-indigo-50 p-4 text-indigo-600 mb-3">
                    <Bot className="h-8 w-8" />
                  </div>
                  <h3 className="text-md font-bold text-slate-800">Ask Anything!</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                    Type a question below about the contents of <span className="font-semibold text-indigo-600">{activeDoc.name}</span>. The AI tutor will extract matching reference pages and reply with exact citations.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="space-y-3">
                      {/* User Message */}
                      <div className="flex items-start justify-end gap-3">
                        <div className="flex flex-col items-end max-w-[80%] space-y-1">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                            You
                          </span>
                          <div className="rounded-2xl rounded-tr-none bg-slate-900 px-4 py-3 text-sm text-white shadow-sm">
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.question}</p>
                          </div>
                        </div>
                        <div className="rounded-full bg-slate-100 p-2 text-slate-600 shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                      </div>

                      {/* AI Response */}
                      <div className="flex items-start justify-start gap-3">
                        <div className="rounded-full bg-indigo-50 p-2 text-indigo-600 shrink-0">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-start max-w-[80%] space-y-1">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                            AI Tutor
                          </span>
                          <div className="rounded-2xl rounded-tl-none bg-emerald-50/70 border border-emerald-100/50 p-5 text-sm text-emerald-950 shadow-sm w-full">
                            <div className="prose prose-emerald prose-sm max-w-none text-emerald-950 prose-headings:text-emerald-900 prose-strong:text-emerald-950 prose-headings:font-bold prose-code:text-indigo-600 leading-relaxed">
                              <ReactMarkdown>{msg.answer}</ReactMarkdown>
                            </div>
                            {renderSources(msg.citations)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* AI Generating Indicator */}
                  {chatLoading && (
                    <div className="flex items-start justify-start gap-3">
                      <div className="rounded-full bg-indigo-50 p-2 text-indigo-600 shrink-0">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col items-start space-y-1">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          AI Tutor
                        </span>
                        <div className="rounded-2xl rounded-tl-none bg-slate-50 border border-slate-200/50 px-4 py-3.5 text-xs text-slate-600 shadow-sm">
                          <div className="flex items-center gap-1.5 py-1">
                            <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
                            <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-100"></div>
                            <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-200"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="border-t border-slate-100 p-4 bg-slate-50/50 shrink-0">
              <form onSubmit={handleAskQuestion} className="flex gap-2.5">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={chatLoading}
                  placeholder="Ask a question about the document..."
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !question.trim()}
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

              {chatError && (
                <div className="mt-2 text-xs font-semibold text-red-600">
                  {chatError}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedShell>
  );
}
