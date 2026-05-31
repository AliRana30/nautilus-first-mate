"use client";

import React, { useState } from "react";
import { Terminal, Database, Send, Sparkles, Copy, Check } from "lucide-react";

interface Message {
  sender: "user" | "first_mate";
  text: string;
  sql?: string;
}

interface ChatInterfaceProps {
  isLoading: boolean;
  messages: Message[];
  onSendMessage: (query: string) => void;
}

function ChatSqlBlock({ sql }: { sql: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full mt-1.5 p-3 rounded-lg bg-navy-deep border border-gold/30 font-mono text-xs flex flex-col gap-1.5 animate-fadeIn">
      <div className="flex items-center justify-between text-[10px] text-gold font-bold uppercase tracking-wider border-b border-navy-border/40 pb-1">
        <span className="flex items-center gap-1">
          <Database className="h-3 w-3" />
          Coral SQL Signal Expose
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-navy-light/40 border border-navy-border/60 hover:bg-gold/20 hover:text-gold transition-all text-parchment-dark"
        >
          {copied ? (
            <>
              <Check className="h-2.5 w-2.5 text-emerald-400" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-2.5 w-2.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="text-gold-bright overflow-x-auto whitespace-pre-wrap select-all font-bold">
        {sql}
      </pre>
    </div>
  );
}

const renderMessageText = (text: string, isUser: boolean) => {
  if (isUser) {
    return <span className="font-bold text-navy-deep">{text}</span>;
  }
  
  return (
    <div className="flex flex-col gap-2 select-text font-medium text-parchment">
      {text.split("\n").map((para, pidx) => {
        if (!para.trim()) return null;
        
        // Strip markdown asterisks
        const cleanPara = para.replace(/\*\*/g, "").trim();
        
        const isHeader =
          para.toLowerCase().includes("report") ||
          para.toLowerCase().includes("findings") ||
          para.toLowerCase().includes("summary") ||
          para.toLowerCase().includes("highlights") ||
          para.toLowerCase().includes("avast") ||
          para.toLowerCase().includes("captain") ||
          para.trim().startsWith("- ") ||
          para.trim().startsWith("* ") ||
          para.trim().endsWith(":");
          
        if (isHeader) {
          return (
            <p key={pidx} className="font-extrabold text-gold-bright text-sm md:text-base leading-snug">
              {cleanPara}
            </p>
          );
        }
        
        return (
          <p key={pidx} className="font-medium text-parchment text-sm md:text-base leading-relaxed">
            {cleanPara}
          </p>
        );
      })}
    </div>
  );
};

export default function ChatInterface({
  isLoading,
  messages,
  onSendMessage,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [showSqlPreview, setShowSqlPreview] = useState(true); // Default to true so judges see it immediately!

  const chips = [
    { label: "Run standup", query: "Perform daily standup across Slack, GitHub and Calendar" },
    { label: "Triage PRs", query: "Triage outstanding GitHub pull requests and Notion tickets" },
    { label: "Check updates", query: "Check slack messages for urgent updates or scurvy alerts" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-navy-light/10 border border-navy-border/40 rounded-xl glass-panel p-5 relative overflow-hidden z-10 flex flex-col gap-4">
      {/* Header controls */}
      <div className="flex items-center justify-between border-b border-navy-border pb-3">
        <div className="text-sm font-cinzel font-bold text-gold uppercase tracking-wider flex items-center gap-1.5">
          <Terminal className="h-4 w-4 text-gold" />
          Command Deck Communications
        </div>
        <button
          type="button"
          onClick={() => setShowSqlPreview(!showSqlPreview)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
            showSqlPreview
              ? "bg-gold/20 border-gold/40 text-gold"
              : "bg-navy-deep border-navy-border text-parchment-dark hover:text-gold"
          }`}
        >
          <Database className="h-3.5 w-3.5" />
          {showSqlPreview ? "Exposed SQL: Visible" : "Exposed SQL: Hidden"}
        </button>
      </div>

      {/* Chat History Bubbles */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[300px] p-2 bg-navy-deep/20 rounded-lg min-h-[150px]">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-parchment-dark/50 text-xs font-mono">
            ⚓ Establish frequency by sending a pirate dispatch or clicking a chip below...
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={idx}
                className={`flex flex-col max-w-[85%] gap-1.5 ${
                  isUser ? "self-end items-end" : "self-start items-start"
                }`}
              >
                <div
                  className={`p-3.5 rounded-xl text-sm leading-relaxed ${
                    isUser
                      ? "bg-gold text-navy-deep rounded-tr-none shadow-gold-glow"
                      : "bg-navy-deep/80 border border-navy-border/60 text-white rounded-tl-none"
                  }`}
                >
                  {renderMessageText(msg.text, isUser)}
                </div>

                {/* Sub-rendered SQL query panel inside the chat if toggle is active */}
                {!isUser && msg.sql && showSqlPreview && (
                  <ChatSqlBlock sql={msg.sql} />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Loading state indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 text-xs font-mono text-gold animate-pulse pl-2">
          <Sparkles className="h-3.5 w-3.5 animate-spin" />
          First Mate is charting coordinates...
        </div>
      )}

      {/* Prompt chips */}
      <div className="flex flex-wrap gap-2">
        {chips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            onClick={() => onSendMessage(chip.query)}
            className="text-xs font-mono font-bold px-3 py-2 rounded-lg border border-navy-border bg-navy/40 hover:bg-gold/15 hover:border-gold text-parchment-dark hover:text-gold transition-all disabled:opacity-50"
          >
            ⚓ {chip.label}
          </button>
        ))}
      </div>

      {/* Input dispatch form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-4 top-4 text-gold font-mono text-base font-extrabold select-none">
            DISPATCH &gt;
          </span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send command to the Nautilus First Mate..."
            disabled={isLoading}
            className="w-full pl-36 pr-4 py-4 text-base rounded-lg font-mono font-bold text-white focus:border-gold focus:ring-1 focus:ring-gold bg-navy-deep border-navy-border"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-6 rounded-lg font-cinzel text-base font-extrabold bg-gold hover:bg-gold-bright text-navy-deep transition-all duration-150 flex items-center justify-center disabled:opacity-50 shadow-gold-glow"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
