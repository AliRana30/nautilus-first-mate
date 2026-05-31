"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Anchor,
  Terminal as TerminalIcon,
  Database,
  Compass,
  Cpu,
  Play,
  Search,
  Sparkles,
  CheckCircle2,
  XCircle,
  Download,
  Clock,
  Layers,
  Copy,
  ChevronRight,
  Shield,
  HelpCircle
} from "lucide-react";
import CompassLoader from "@/components/CompassLoader";
import SourceBadges from "@/components/SourceBadges";
import StandupWidget from "@/components/StandupWidget";
import ChatInterface from "@/components/ChatInterface";

interface AgentStep {
  title: string;
  type: "thought" | "sql" | "result" | "final";
  content: string;
  meta?: {
    data?: any[];
    isMock?: boolean;
    executionTimeMs?: number;
    error?: string;
  };
}

interface AgentResponse {
  thoughts: string;
  sqlExecuted?: string;
  queryResults?: any[];
  isMockDb: boolean;
  finalAnswer: string;
  executionTimeMs: number;
  steps: AgentStep[];
}

interface StatusResponse {
  status: string;
  engine: string;
  integrations: {
    [key: string]: { configured: boolean; name: string };
  };
  mcp: { enabled: boolean };
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"command" | "sql" | "schema" | "integrations">("command");
  const [query, setQuery] = useState("");
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM github_issues WHERE status = 'open'");
  const [isLoading, setIsLoading] = useState(false);
  const [isSqlLoading, setIsSqlLoading] = useState(false);

  // Agent response state
  const [agentResponse, setAgentResponse] = useState<AgentResponse | null>(null);
  const [agentError, setAgentError] = useState<string | null>(null);

  // Raw SQL response state
  const [sqlResponse, setSqlResponse] = useState<any[] | null>(null);
  const [sqlMeta, setSqlMeta] = useState<{ isMock: boolean; time: number; sql: string; error?: string } | null>(null);

  // Environment configuration status state
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ sender: "user" | "first_mate"; text: string; sql?: string }>>([]);

  // Fetch status on load
  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch((err) => console.error("Error fetching bridge status:", err));
  }, []);

  // Quick suggestions for Command Deck
  const suggestions = [
    { text: "Find open navigation issues", query: "Show me all open issues in the nautilus-navigation repository" },
    { text: "Read Tortuga trade secrets", query: "Search Notion documents for trade routes or Tortuga details" },
    { text: "Check Slack reports on repairs", query: "Search Slack for messages sent by Gibbs or regarding cannon repairs" },
    { text: "Show calendar events tomorrow", query: "What events do we have scheduled on the calendar?" },
  ];

  // Quick SQL templates
  const sqlTemplates = [
    { label: "High Priority Bugs", sql: "SELECT * FROM github_issues WHERE priority = 'high' AND status = 'open'" },
    { label: "#command-bridge Slack", sql: "SELECT * FROM slack_messages WHERE channel = '#command-bridge' ORDER BY timestamp DESC LIMIT 5" },
    { label: "Emergency Protocols", sql: "SELECT * FROM notion_pages WHERE title LIKE '%Emergency%' OR content LIKE '%Protocol%'" },
    { label: "Nautilus Resupply Dates", sql: "SELECT * FROM calendar_events WHERE title LIKE '%Tortuga%'" },
  ];

  // Execute Agent query
  const handleAgentSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const finalQuery = customQuery || query;
    if (!finalQuery.trim()) return;

    setIsLoading(true);
    setAgentError(null);
    setAgentResponse(null);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: finalQuery }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to query Nautilus First Mate.");
      }

      const data = await res.json();
      if (data) {
        if (data.finalAnswer) {
          data.finalAnswer = data.finalAnswer
            .replace(/###\s*/g, "")
            .replace(/##\s*/g, "")
            .replace(/\*\*/g, "")
            .replace(/\*/g, "")
            .trim();
        }
        if (data.steps) {
          data.steps = data.steps.map((step: any) => {
            if (step.content) {
              step.content = step.content
                .replace(/###\s*/g, "")
                .replace(/##\s*/g, "")
                .replace(/\*\*/g, "")
                .replace(/\*/g, "")
                .trim();
            }
            return step;
          });
        }
      }
      setAgentResponse(data);
      if (e) setQuery(""); // Clear input on manual submission
    } catch (err: any) {
      setAgentError(err.message || "Unknown error occurred on the bridge.");
    } finally {
      setIsLoading(false);
    }
  };

  // Execute Agent query from Chat Interface
  const handleChatSendMessage = async (userQuery: string) => {
    if (isLoading) return;

    // Add user message to history
    setMessages((prev) => [...prev, { sender: "user" as const, text: userQuery }]);

    setIsLoading(true);
    setAgentError(null);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userQuery }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to query Nautilus First Mate.");
      }

      const data = await res.json();
      if (data) {
        if (data.finalAnswer) {
          data.finalAnswer = data.finalAnswer
            .replace(/###\s*/g, "")
            .replace(/##\s*/g, "")
            .replace(/\*\*/g, "")
            .replace(/\*/g, "")
            .trim();
        }
      }

      setAgentResponse(data);

      // Add first mate response to history
      setMessages((prev) => [...prev, {
        sender: "first_mate" as const,
        text: data.finalAnswer || "Ordnance executed silently.",
        sql: data.sqlExecuted,
      }]);
    } catch (err: any) {
      setAgentError(err.message || "Unknown error occurred on the bridge.");
      setMessages((prev) => [...prev, {
        sender: "first_mate" as const,
        text: `CRITICAL ORDNANCE FAILURE: ${err.message || "Unknown error."}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute Raw SQL query
  const handleSqlSubmit = async (e?: React.FormEvent, customSql?: string) => {
    if (e) e.preventDefault();
    const finalSql = customSql || sqlQuery;
    if (!finalSql.trim()) return;

    // Clean query to strip terminal wrappers like: coral sql "SELECT..."
    let cleanedSql = finalSql.trim();
    if (cleanedSql.toLowerCase().startsWith("coral sql ")) {
      cleanedSql = cleanedSql.substring(10).trim();
      if (cleanedSql.startsWith('"') && cleanedSql.endsWith('"')) {
        cleanedSql = cleanedSql.substring(1, cleanedSql.length - 1).trim();
      } else if (cleanedSql.startsWith("'") && cleanedSql.endsWith("'")) {
        cleanedSql = cleanedSql.substring(1, cleanedSql.length - 1).trim();
      }
    }

    setIsSqlLoading(true);
    setSqlResponse(null);
    setSqlMeta(null);

    try {
      const res = await fetch("/api/sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: cleanedSql }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to execute artillery query.");
      }

      const data = await res.json();
      // Handle both data.rows or data.data (the backend returns data.data)
      setSqlResponse(data.rows || data.data);
      setSqlMeta({
        isMock: data.isMock,
        time: data.executionTimeMs,
        sql: cleanedSql
      });
    } catch (err: any) {
      setSqlMeta({
        isMock: true,
        time: 0,
        sql: cleanedSql,
        error: err.message || "Unknown execution error."
      });
    } finally {
      setIsSqlLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  // Convert array of objects to standard CSV download with correct file extension
  const exportToCSV = (data: any[], filename = "coral_export.csv") => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.map(h => h.toUpperCase()).join(","),
      ...data.map(row =>
        headers.map(fieldName => {
          const val = row[fieldName];
          if (val === null || val === undefined) return '""';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  // Helper to render dynamic table from any json data
  const renderDynamicTable = (data: any[]) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-6 text-parchment-dark/60 font-mono text-xs border border-dashed border-navy-border rounded bg-navy-deep">
          ⚓ No rows returned. Clear sailing ahead!
        </div>
      );
    }

    const headers = Object.keys(data[0]);

    return (
      <div className="overflow-x-auto border border-navy-border rounded-lg bg-navy-deep">
        <table className="w-full text-left font-mono text-sm font-bold select-text text-white">
          <thead>
            <tr className="bg-navy-light text-gold border-b border-navy-border font-cinzel">
              {headers.map((header) => (
                <th key={header} className="p-3.5 uppercase tracking-wider font-extrabold text-sm text-gold-bright">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-border/50">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-navy-light/40 transition-colors">
                {headers.map((header) => {
                  const val = row[header];
                  let displayVal = "";

                  if (val === null || val === undefined) {
                    displayVal = "NULL";
                  } else if (typeof val === "object") {
                    displayVal = JSON.stringify(val);
                  } else {
                    displayVal = String(val);
                  }

                  // Format status or priority badges for high density visual checks
                  const isStatusCol = header === "status";
                  const isPriorityCol = header === "priority";

                  return (
                    <td key={header} className="p-3.5 text-white align-top font-bold text-sm bg-navy-deep/80">
                      {isStatusCol && displayVal === "open" && (
                        <span className="px-1.5 py-0.5 rounded bg-gold/15 text-gold border border-gold/30 font-extrabold">open</span>
                      )}
                      {isStatusCol && displayVal === "closed" && (
                        <span className="px-1.5 py-0.5 rounded bg-rust/15 text-rust-bright border border-rust/30 font-extrabold">closed</span>
                      )}
                      {isPriorityCol && displayVal === "high" && (
                        <span className="px-1.5 py-0.5 rounded bg-rust text-white font-extrabold">HIGH</span>
                      )}
                      {!((isStatusCol && (displayVal === "open" || displayVal === "closed")) || (isPriorityCol && displayVal === "high")) && (
                        <span className="whitespace-pre-wrap font-bold text-white">{displayVal}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-transparent select-none">

      {/* 1. VESSEL COMMAND HEADER */}
      <header className="border-b border-navy-border bg-navy-deep px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gold/10 border border-gold flex items-center justify-center text-gold shadow-gold-glow animate-pulse">
            <Anchor className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-cinzel text-gold tracking-wide flex items-center gap-2">
              Nautilus First Mate
            </h1>
          </div>
        </div>
      </header>


      {/* 2. TABS SELECTOR PANEL */}
      <div className="flex border-b border-navy-border bg-navy-light/40 px-6 z-20">
        <button
          onClick={() => setActiveTab("command")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-semibold border-b-2 transition-all font-cinzel ${activeTab === "command"
              ? "border-gold text-gold bg-navy-deep/60"
              : "border-transparent text-parchment-dark hover:text-parchment hover:bg-navy-light/20"
            }`}
        >
          <TerminalIcon className="h-3.5 w-3.5" />
          COMMAND DECK
        </button>
        <button
          onClick={() => setActiveTab("sql")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-semibold border-b-2 transition-all font-cinzel ${activeTab === "sql"
              ? "border-gold text-gold bg-navy-deep/60"
              : "border-transparent text-parchment-dark hover:text-parchment hover:bg-navy-light/20"
            }`}
        >
          <Database className="h-3.5 w-3.5" />
          INTERACTIVE SQL CONSOLE
        </button>
        <button
          onClick={() => setActiveTab("schema")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-semibold border-b-2 transition-all font-cinzel ${activeTab === "schema"
              ? "border-gold text-gold bg-navy-deep/60"
              : "border-transparent text-parchment-dark hover:text-parchment hover:bg-navy-light/20"
            }`}
        >
          <Compass className="h-3.5 w-3.5" />
          SHIP'S LOGBOOK SCHEMA
        </button>
        <button
          onClick={() => setActiveTab("integrations")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-mono font-semibold border-b-2 transition-all font-cinzel ${activeTab === "integrations"
              ? "border-gold text-gold bg-navy-deep/60"
              : "border-transparent text-parchment-dark hover:text-parchment hover:bg-navy-light/20"
            }`}
        >
          <Cpu className="h-3.5 w-3.5" />
          CREW REGISTRY GEAR
        </button>
      </div>

      {/* 3. MAIN WORKSPACE */}
      <main className="flex-1 overflow-y-auto p-6 z-10">
        <AnimatePresence mode="wait">

          {/* TAB 1: COMMAND DECK */}
          {activeTab === "command" && (
            <motion.div
              key="command"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-6 max-w-6xl mx-auto w-full flex-1"
            >
              {/* Top → SourceBadges */}
              <SourceBadges integrations={status?.integrations} />

              {/* Middle → StandupWidget */}
              <StandupWidget
                isLoading={isLoading}
                finalAnswer={agentResponse?.finalAnswer || null}
                sqlExecuted={agentResponse?.sqlExecuted || null}
                executionTimeMs={agentResponse?.executionTimeMs}
              />

              {/* Bottom → ChatInterface */}
              <ChatInterface
                isLoading={isLoading}
                messages={messages}
                onSendMessage={handleChatSendMessage}
              />
            </motion.div>
          )}

          {/* TAB 2: INTERACTIVE SQL CONSOLE */}
          {activeTab === "sql" && (
            <motion.div
              key="sql"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-6 max-w-5xl mx-auto"
            >
              <div className="glass-panel rounded-xl p-5 border-l-4 border-l-rust">
                <h2 className="text-xl md:text-2xl font-black font-cinzel text-rust-bright mb-1.5 flex items-center gap-2">
                  <Database className="h-5 w-5 text-rust-bright animate-pulse" />
                  Primary Coral SQL Artillery Console
                </h2>
                <p className="text-sm md:text-base font-semibold text-parchment leading-relaxed">
                  Fire raw SQL SELECT queries directly into the Nautilus database layers. This operates synchronously via the Coral CLI shell commands. Standard SQLite dialect rules apply. Use the quick ammunition tags below to fast-load standard tactical queries.
                </p>

                {/* SQL Quick Ammunition Templates */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {sqlTemplates.map((t, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSqlQuery(t.sql);
                        handleSqlSubmit(undefined, t.sql);
                      }}
                      className="text-xs md:text-sm font-extrabold px-3.5 py-2 rounded border border-navy-border bg-navy/40 hover:bg-rust-glow hover:border-rust text-parchment-dark hover:text-rust-bright transition-all"
                    >
                      💣 {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SQL Shell Command Box */}
              <form onSubmit={handleSqlSubmit} className="flex flex-col gap-3">
                <div className="relative border border-navy-border rounded-lg overflow-hidden bg-navy-deep">
                  <div className="bg-navy-light/40 border-b border-navy-border px-4 py-2 flex items-center justify-between text-xs md:text-sm font-bold font-mono text-parchment-dark">
                    <span>SHELL COMMAND: coral sql &quot;...&quot;</span>
                    <button
                      type="button"
                      onClick={() => setSqlQuery("")}
                      className="hover:text-rust-bright transition-colors"
                    >
                      CLEAR
                    </button>
                  </div>

                  <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    rows={4}
                    placeholder="SELECT * FROM table WHERE condition LIMIT 5"
                    className="w-full p-4 font-mono text-base md:text-lg text-gold font-extrabold border-none bg-transparent focus:ring-0 focus:outline-none placeholder-parchment-dark/30 resize-y"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSqlLoading || !sqlQuery.trim()}
                    className="px-8 py-3 rounded-lg font-cinzel text-base font-black bg-rust hover:bg-rust-bright text-white transition-all duration-150 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-rust-glow"
                  >
                    {isSqlLoading ? (
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    FIRE CANNON
                  </button>
                </div>
              </form>

              {/* SQL Result Trace Details */}
              {sqlMeta && (
                <div className="flex flex-col gap-4 animate-fadeIn">

                  {/* Performance stats banner */}
                  <div className={`p-3 rounded-lg border text-sm md:text-base font-semibold font-mono flex flex-col md:flex-row items-start md:items-center justify-between gap-2 ${sqlMeta.error
                      ? "bg-rust/10 border-rust text-rust-bright"
                      : "bg-navy-light/40 border-navy-border text-parchment-dark"
                    }`}>
                    <div className="flex flex-wrap items-center gap-3">
                      <span>Query Latency: <strong className="text-gold">{sqlMeta.time}ms</strong></span>
                      {sqlResponse && (
                        <>
                          <span>•</span>
                          <span>Rows extracted: <strong className="text-gold">{sqlResponse.length}</strong></span>
                        </>
                      )}
                    </div>

                    {sqlResponse && sqlResponse.length > 0 && (
                      <button
                        type="button"
                        onClick={() => exportToCSV(sqlResponse)}
                        className="text-xs md:text-sm font-extrabold border border-navy-border px-3 py-1 rounded bg-navy/40 hover:bg-navy-light text-parchment hover:text-gold flex items-center gap-1.5 transition-all"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download CSV
                      </button>
                    )}
                  </div>

                  {/* SQL Error Panel */}
                  {sqlMeta.error && (
                    <div className="p-4 rounded-lg bg-rust/5 border border-rust/35 text-rust-bright font-mono text-xs whitespace-pre-wrap">
                      <span className="font-bold block mb-1">❌ SQL EXECUTION ERROR:</span>
                      {sqlMeta.error}
                    </div>
                  )}

                  {/* SQL Live Database Tables Output */}
                  {sqlResponse && (
                    <div className="mt-1">
                      {renderDynamicTable(sqlResponse)}
                    </div>
                  )}

                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: SHIP'S LOGBOOK SCHEMA */}
          {activeTab === "schema" && (
            <motion.div
              key="schema"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-6 max-w-5xl mx-auto"
            >
              <div className="glass-panel rounded-xl p-5 border-l-4 border-l-gold">
                <h2 className="text-xl md:text-2xl font-black font-cinzel text-gold mb-1.5 flex items-center gap-2">
                  <Compass className="h-5 w-5 text-gold animate-spin-slow" />
                  Coral SQL Navigation Schema Map
                </h2>
                <p className="text-sm md:text-base font-semibold text-parchment leading-relaxed">
                  Coral represents structural data integrations as relational SQL tables. Below is the active dictionary cataloging schemas available for natural-language scans or direct artillery queries. Click a table block to quick-generate an inspection SQL statement.
                </p>
              </div>

              {/* Schema Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => {
                    setSqlQuery("SELECT * FROM github_issues ORDER BY priority DESC");
                    setActiveTab("sql");
                  }}
                  className="glass-panel rounded-xl p-5 border border-navy-border hover:border-gold/50 cursor-pointer transition-all hover:scale-[1.01] flex flex-col gap-3 group"
                >
                  <div className="flex items-center justify-between border-b border-navy-border/50 pb-2">
                    <h3 className="font-cinzel text-gold-bright font-extrabold text-base md:text-lg flex items-center gap-2 group-hover:text-gold-bright">
                      <span>🐙 github_issues</span>
                    </h3>
                    <span className="text-xs md:text-sm font-bold text-parchment bg-navy px-3 py-1 rounded border border-navy-border/70">5 rows cached</span>
                  </div>
                  <p className="text-xs md:text-sm text-parchment font-semibold leading-relaxed">
                    Tracks software tasks, sonar mechanical failures, and UI visual fixes across ship repositories (`nautilus-navigation`, `kraken-defense`, `nautilus-ui`).
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-xs md:text-sm font-bold font-mono text-parchment-dark bg-navy/60 p-3 rounded border border-navy-border/40">
                    <div>id <span className="text-gold">int</span></div>
                    <div>repo <span className="text-gold">text</span></div>
                    <div>title <span className="text-gold">text</span></div>
                    <div>status <span className="text-gold">text</span></div>
                    <div>priority <span className="text-gold">text</span></div>
                    <div>assignee <span className="text-gold">text</span></div>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setSqlQuery("SELECT * FROM slack_messages WHERE channel = '#command-bridge'");
                    setActiveTab("sql");
                  }}
                  className="glass-panel rounded-xl p-5 border border-navy-border hover:border-gold/50 cursor-pointer transition-all hover:scale-[1.01] flex flex-col gap-3 group"
                >
                  <div className="flex items-center justify-between border-b border-navy-border/50 pb-2">
                    <h3 className="font-cinzel text-gold-bright font-extrabold text-base md:text-lg flex items-center gap-2 group-hover:text-gold-bright">
                      <span>💬 slack_messages</span>
                    </h3>
                    <span className="text-xs md:text-sm font-bold text-parchment bg-navy px-3 py-1 rounded border border-navy-border/70">7 rows cached</span>
                  </div>
                  <p className="text-xs md:text-sm text-parchment font-semibold leading-relaxed">
                    Monitors direct Slack streams from shortwave crew channels (`#command-bridge`, `#crew-quarters`, `#kraken-alerts`) for internal communications.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-xs md:text-sm font-bold font-mono text-parchment-dark bg-navy/60 p-3 rounded border border-navy-border/40">
                    <div>id <span className="text-gold">int</span></div>
                    <div>channel <span className="text-gold">text</span></div>
                    <div>sender <span className="text-gold">text</span></div>
                    <div>message <span className="text-gold">text</span></div>
                    <div>timestamp <span className="text-gold">timestamp</span></div>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setSqlQuery("SELECT * FROM notion_pages WHERE status = 'published'");
                    setActiveTab("sql");
                  }}
                  className="glass-panel rounded-xl p-5 border border-navy-border hover:border-gold/50 cursor-pointer transition-all hover:scale-[1.01] flex flex-col gap-3 group"
                >
                  <div className="flex items-center justify-between border-b border-navy-border/50 pb-2">
                    <h3 className="font-cinzel text-gold-bright font-extrabold text-base md:text-lg flex items-center gap-2 group-hover:text-gold-bright">
                      <span>📖 notion_pages</span>
                    </h3>
                    <span className="text-xs md:text-sm font-bold text-parchment bg-navy px-3 py-1 rounded border border-navy-border/70">4 pages cached</span>
                  </div>
                  <p className="text-xs md:text-sm text-parchment font-semibold leading-relaxed">
                    Stores ancient charts, kraken behavioral research archives, emergency diving codes, and general log documentation pages.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-xs md:text-sm font-bold font-mono text-parchment-dark bg-navy/60 p-3 rounded border border-navy-border/40">
                    <div>id <span className="text-gold">int</span></div>
                    <div>title <span className="text-gold">text</span></div>
                    <div>content <span className="text-gold">text</span></div>
                    <div>status <span className="text-gold">text</span></div>
                    <div>last_edited <span className="text-gold">timestamp</span></div>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setSqlQuery("SELECT * FROM calendar_events ORDER BY start_time ASC");
                    setActiveTab("sql");
                  }}
                  className="glass-panel rounded-xl p-5 border border-navy-border hover:border-gold/50 cursor-pointer transition-all hover:scale-[1.01] flex flex-col gap-3 group"
                >
                  <div className="flex items-center justify-between border-b border-navy-border/50 pb-2">
                    <h3 className="font-cinzel text-gold-bright font-extrabold text-base md:text-lg flex items-center gap-2 group-hover:text-gold-bright">
                      <span>⏳ calendar_events</span>
                    </h3>
                    <span className="text-xs md:text-sm font-bold text-parchment bg-navy px-3 py-1 rounded border border-navy-border/70">3 events cached</span>
                  </div>
                  <p className="text-xs md:text-sm text-parchment font-semibold leading-relaxed">
                    Dockets captain log inspections, Tortuga resupply intervals, crew shifts, and general clock milestones.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-xs md:text-sm font-bold font-mono text-parchment-dark bg-navy/60 p-3 rounded border border-navy-border/40">
                    <div>id <span className="text-gold">int</span></div>
                    <div>title <span className="text-gold">text</span></div>
                    <div>start_time <span className="text-gold">timestamp</span></div>
                    <div>end_time <span className="text-gold">timestamp</span></div>
                    <div>attendees <span className="text-gold">text</span></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: CREW REGISTRY / INTEGRATIONS GEAR */}
          {activeTab === "integrations" && (
            <motion.div
              key="integrations"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-6 max-w-5xl mx-auto"
            >
              <div className="glass-panel rounded-xl p-5 border-l-4 border-l-gold">
                <h2 className="text-xl md:text-2xl font-black font-cinzel text-gold mb-1.5 flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-gold animate-pulse" />
                  Shipboard Communication Gear Registry
                </h2>
                <p className="text-sm md:text-base font-semibold text-parchment leading-relaxed">
                  First Mate uses API relays linked in our `.env.local` locker.
                  Below is the current verification status for each shortwave transceiver module.
                </p>
              </div>

              {/* Status List */}
              <div className="flex flex-col gap-3 font-mono text-sm md:text-base">

                {status ? (
                  Object.entries(status.integrations).map(([key, val]) => (
                    <div
                      key={key}
                      className="glass-panel rounded-xl p-4 flex items-center justify-between border border-navy-border hover:border-gold/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${val.configured
                            ? "bg-gold-glow border-gold/45 text-gold"
                            : "bg-rust-glow border-rust/45 text-rust-bright"
                          }`}>
                          <Anchor className="h-5 w-5 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="font-cinzel font-black text-base md:text-lg text-gold tracking-wide">{val.name}</h4>
                          <span className="text-xs md:text-sm font-bold text-parchment-dark/70 uppercase">ENV LINK KEY: {key.toUpperCase()}_TOKEN</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {val.configured ? (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-gold/15 text-gold border border-gold/40 font-black uppercase text-xs md:text-sm shadow-gold-glow">
                            <CheckCircle2 className="h-4 w-4 text-gold" />
                            Active Signal
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-rust/15 text-rust-bright border border-rust/40 font-black uppercase text-xs md:text-sm shadow-rust-glow">
                            <XCircle className="h-4 w-4 text-rust-bright" />
                            Mock Simulated
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-parchment-dark/50 animate-pulse text-sm font-bold">
                    Scanning ship cables... Reading signal registers
                  </div>
                )}

              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 4. FOOTER LEDGER */}
      <footer className="border-t border-navy-border bg-navy-deep px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-parchment-dark/70 z-20">
        <span>© 1870-2026 Nautilus Crew. All coordinates encrypted.</span>
        <span>PRIMED REASONING ENGINE // SECURE DIALECT MODE</span>
      </footer>

    </div>
  );
}
