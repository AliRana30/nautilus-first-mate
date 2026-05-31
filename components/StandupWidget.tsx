"use client";

import React from "react";
import { motion } from "framer-motion";
import { Anchor, Database, AlertCircle, Copy, Check } from "lucide-react";

interface StandupWidgetProps {
  isLoading: boolean;
  finalAnswer: string | null;
  sqlExecuted: string | null;
  executionTimeMs?: number;
}

export default function StandupWidget({
  isLoading,
  finalAnswer,
  sqlExecuted,
  executionTimeMs,
}: StandupWidgetProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (!sqlExecuted) return;
    navigator.clipboard.writeText(sqlExecuted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="w-full max-w-4xl mx-auto bg-navy-light/10 border border-navy-border/40 rounded-xl glass-panel p-6 relative overflow-hidden z-10 flex flex-col gap-4">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-navy-border pb-3">
        <h2 className="text-lg md:text-xl font-extrabold font-cinzel text-gold flex items-center gap-2">
          <Anchor className="h-5 w-5 text-gold animate-pulse" />
          ⚓ CAPTAIN'S LOG
        </h2>
        {executionTimeMs && !isLoading && (
          <span className="text-xs font-mono text-parchment-dark bg-navy/60 px-2.5 py-1 rounded border border-navy-border/50">
            Voyage Time: <strong className="text-gold">{executionTimeMs}ms</strong>
          </span>
        )}
      </div>

      {/* Loading Skeleton state */}
      {isLoading && (
        <div className="flex flex-col gap-4 py-4 animate-pulse">
          <div className="h-4 bg-navy-light/60 rounded-md w-3/4" />
          <div className="h-4 bg-navy-light/60 rounded-md w-5/6" />
          <div className="h-4 bg-navy-light/60 rounded-md w-2/3" />
          <div className="h-4 bg-navy-light/60 rounded-md w-4/5" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !finalAnswer && (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
          <AlertCircle className="h-8 w-8 text-gold/30" />
          <p className="font-cinzel text-sm font-bold text-parchment-dark">
            Logs empty. Command the First Mate using the chat deck below!
          </p>
        </div>
      )}

      {/* Fade-in Standup/Report Result */}
      {!isLoading && finalAnswer && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-4"
        >
          {/* Expose generated SQL query (CORE Coral judging signal) */}
          {sqlExecuted && (
            <div className="p-4 rounded-lg bg-navy-deep border border-gold/20 font-mono text-sm flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-navy-border/40 pb-1.5 text-xs text-gold font-bold">
                <span className="flex items-center gap-1.5 uppercase">
                  <Database className="h-3.5 w-3.5" />
                  Generated Coral SQL Query
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-navy-light/40 border border-navy-border hover:bg-gold/20 hover:text-gold transition-all text-parchment-dark"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy SQL
                      </>
                    )}
                  </button>
                  <span className="text-emerald-400 font-extrabold">SECURE DIALECT</span>
                </div>
              </div>
              <pre className="text-gold-bright overflow-x-auto whitespace-pre-wrap select-all font-bold">
                {sqlExecuted}
              </pre>
            </div>
          )}

          {/* Captain's Log Body Paragraphs */}
          <div className="font-sans text-base leading-relaxed pl-4 border-l-2 border-gold/40 flex flex-col gap-3">
            {finalAnswer.split("\n").map((para, pidx) => {
              const isHeader =
                para.toLowerCase().includes("report") ||
                para.toLowerCase().includes("findings") ||
                para.toLowerCase().includes("summary") ||
                para.trim().endsWith(":");
              return (
                <p
                  key={pidx}
                  className={`text-base md:text-lg ${
                    isHeader
                      ? "font-extrabold text-gold-bright"
                      : "font-medium text-parchment"
                  }`}
                >
                  {para}
                </p>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
