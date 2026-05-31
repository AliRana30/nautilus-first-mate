"use client";

import React from "react";
import { Github, Slack, FileText, Calendar } from "lucide-react";

interface IntegrationState {
  configured: boolean;
  name: string;
}

interface SourceBadgesProps {
  integrations?: {
    [key: string]: IntegrationState;
  };
}

export default function SourceBadges({ integrations }: SourceBadgesProps) {
  // Map standard keys to friendly pirate terms
  const sources = [
    {
      key: "github",
      label: "GitHub Logbook",
      icon: Github,
      configured: integrations?.github?.configured ?? false,
    },
    {
      key: "slack",
      label: "Slack Shortwave",
      icon: Slack,
      configured: integrations?.slack?.configured ?? false,
    },
    {
      key: "notion",
      label: "Notion Ledger",
      icon: FileText,
      configured: integrations?.notion?.configured ?? false,
    },
    {
      key: "google_calendar",
      label: "Calendar Chronometer",
      icon: Calendar,
      // Handle either google_calendar or calendar key
      configured: (integrations?.google_calendar?.configured || integrations?.calendar?.configured) ?? false,
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-navy-light/10 border border-navy-border/40 rounded-xl glass-panel flex flex-wrap items-center justify-center gap-4 md:gap-6 z-10">
      <div className="text-xs font-cinzel font-bold text-gold uppercase tracking-wider flex items-center gap-1.5 mr-2">
        ⚓ Vessel Signals:
      </div>
      
      {sources.map((src) => {
        const Icon = src.icon;
        const active = src.configured;
        return (
          <div
            key={src.key}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
              active
                ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
                : "bg-rose-950/20 border-rose-500/30 text-rose-400"
            }`}
          >
            <div className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  active ? "bg-emerald-400" : "bg-rose-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  active ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
            </div>
            <Icon className="h-3.5 w-3.5" />
            <span className="uppercase tracking-wide">{src.label}</span>
          </div>
        );
      })}
    </div>
  );
}
