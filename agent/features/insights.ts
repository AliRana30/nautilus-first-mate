import { coralQuery } from "@/lib/coralQuery";
import { getDynamicSchema } from "@/coral/schemaExplorer";
import Groq from "groq-sdk";
import { env } from "@/lib/env";

const isMockKey = (key?: string) => !key || key.startsWith("your_") || key === "mock_key";

let groq: Groq | null = null;
if (typeof window === "undefined" && !isMockKey(env.GROQ_API_KEY)) {
  try {
    groq = new Groq({ apiKey: env.GROQ_API_KEY });
  } catch (err) {}
}

export async function generateInsightsReport(): Promise<{ thoughts: string; sql: string; content: string; data: any[] }> {
  // 1. Schema-aware Query Builder
  const schema = await getDynamicSchema();
  const schemaStr = JSON.stringify(schema);
  
  const githubTable = schemaStr.includes("github_issues") ? "github_issues" : "github.issues";
  const slackTable = schemaStr.includes("slack_messages") ? "slack_messages" : "slack.messages";

  // Build schema-aware SQL JOIN linking Slack chatter directly to GitHub repository events
  const sql = `
    SELECT 
      s.sender as officer,
      s.channel as slack_channel,
      s.message as slack_chat,
      s.timestamp as chat_time,
      g.repo as github_repo,
      g.title as issue_title,
      g.status as issue_status
    FROM ${slackTable} s
    JOIN ${githubTable} g ON s.sender = g.assignee OR s.message LIKE '%' || g.repo || '%'
    ORDER BY s.timestamp DESC
    LIMIT 6
  `.trim();

  // 2. Execute query
  let rows = [];
  try {
    rows = coralQuery(sql);
  } catch (e) {
    console.error("Insights feature query failed:", e);
  }

  // 3. Fallback check: if no data -> return static message instantly with NO LLM Call
  if (!rows || rows.length === 0) {
    return {
      thoughts: "Activity insight scan completed. Slack channels and GitHub activity report quiet water.",
      sql,
      content: "⚓ Captain's Insights Deck: All quiet on the shortwave bridge. No developer conversations or repository tickets have triggered alerts or vibration trends today.",
      data: []
    };
  }

  // 4. Summarize via LLM (llama-3.3-70b-versatile)
  let content = "";
  const thoughts = "Compiled activity insight logs, correlating crew chat frequencies (Slack) with live repository events (GitHub) to detect escalation alerts.";

  if (groq) {
    try {
      const prompt = `You are the Nautilus First Mate. Generate a professional and pirate-themed CRITICAL SHIP INSIGHTS Report based on this joint telemetry:
SQL Executed: "${sql}"
Returned Telemetry Rows:
${JSON.stringify(rows, null, 2)}

Provide actionable insights regarding communication trends, alert frequencies, and active bottlenecks. Focus entirely on the facts.`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.2
      });
      content = completion.choices[0]?.message?.content || "Insights report finalized.";
    } catch (e) {
      content = generateStaticInsightsSummary(rows);
    }
  } else {
    content = generateStaticInsightsSummary(rows);
  }

  return { thoughts, sql, content, data: rows };
}

function generateStaticInsightsSummary(rows: any[]): string {
  let r = "⚓ **Ship Communications & Alert Insights**\n\n";
  r += "📊 **Key Crew Activity Trends:**\n";
  rows.forEach((row, i) => {
    r += `${i + 1}. **Officer ${row.officer || "Unknown"}** chatted in [${row.slack_channel}]: "${row.slack_chat}"\n`;
    r += `   * *Related Repository Action:* "${row.issue_title}" in [${row.github_repo}] (Status: ${row.issue_status})\n`;
  });
  return r;
}
