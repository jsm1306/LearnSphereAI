"use client";

import { useState, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  Upload, 
  MessageSquare, 
  Award, 
  Lightbulb, 
  BarChart2, 
  Menu, 
  X, 
  LogOut,
  Brain,
  FileText
} from "lucide-react";
import { getActiveDoc } from "@/lib/tracker";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function ProtectedShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeDocName, setActiveDocName] = useState<string | null>(null);

  useEffect(() => {
    const updateDoc = () => {
      const doc = getActiveDoc();
      setActiveDocName(doc ? doc.name : null);
    };
    // Initial load
    updateDoc();
    
    // Listen for changes
    window.addEventListener("learnsphere_active_doc_update", updateDoc);
    return () => {
      window.removeEventListener("learnsphere_active_doc_update", updateDoc);
    };
  }, []);

  const navItems: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Upload PDF", href: "/upload", icon: Upload },
    { name: "Chat Assistant", href: "/chat", icon: MessageSquare },
    { name: "Take Quiz", href: "/quiz", icon: Award },
    { name: "AI Recommendations", href: "/recommendations", icon: Lightbulb },
    { name: "Learning Progress", href: "/progress", icon: BarChart2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Drawer Navigation overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop and Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-slate-300 transition-transform duration-300 md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:static md:flex md:h-screen`}
      >
        {/* Brand Logo & Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-lg">LearnSphere AI</span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Workspace</p>
            </div>
          </Link>
          <button 
            type="button" 
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 text-sm font-semibold rounded-2xl transition duration-150 group ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${
                  isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                }`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Active Document Indicator (If any) */}
        {activeDocName && (
          <div className="mx-4 my-2 rounded-2xl bg-slate-800/50 border border-slate-800 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-indigo-500/10 p-2 shrink-0">
                <FileText className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Active Document</p>
                <p className="mt-1 text-xs font-semibold text-slate-200 truncate">{activeDocName}</p>
              </div>
            </div>
          </div>
        )}

        {/* User Footer Account & Logout */}
        <div className="border-t border-slate-800 p-4 flex items-center justify-between gap-3 bg-slate-950/40">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">Demo Account</p>
            <p className="text-xs text-slate-500 truncate">demo@learnsphere.ai</p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-xl p-2.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition"
            title="Log Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-y-auto">
        {/* Top Mobile Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/60 bg-white/80 backdrop-blur px-6 md:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-bold text-slate-900">LearnSphere AI</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100">Hackathon Demo</span>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 p-6 md:p-10 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
