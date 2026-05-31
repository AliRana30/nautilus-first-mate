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

export async function generateStandupReport(): Promise<{ thoughts: string; sql: string; content: string; data: any[] }> {
  // 1. Schema-aware Query Builder
  const schema = await getDynamicSchema();
  const schemaStr = JSON.stringify(schema);
  
  // Resolve correct table names based on active schemas
  const githubTable = schemaStr.includes("github_issues") ? "github_issues" : "github.issues";
  const slackTable = schemaStr.includes("slack_messages") ? "slack_messages" : "slack.messages";
  const calendarTable = schemaStr.includes("calendar_events") ? "calendar_events" : "google_calendar.events";

  // Build high-value Cross-Source SQL JOIN
  // Connects GitHub assignees, Slack senders, and Calendar event attendees using wildcard / string mapping
  const sql = `
    SELECT 
      g.title as issue_title, 
      g.assignee as officer, 
      g.priority as issue_priority,
      s.channel as slack_channel, 
      s.message as slack_chat,
      c.title as event_title, 
      c.start_time as event_time
    FROM ${githubTable} g
    JOIN ${slackTable} s ON g.assignee = s.sender OR s.message LIKE '%' || g.assignee || '%'
    LEFT JOIN ${calendarTable} c ON c.attendees LIKE '%' || g.assignee || '%' OR c.description LIKE '%' || g.assignee || '%'
    ORDER BY g.priority DESC, s.timestamp DESC
    LIMIT 5
  `.trim();

  // 2. Execute query
  let rows = [];
  try {
    rows = coralQuery(sql);
  } catch (e) {
    console.error("Standup feature query failed:", e);
  }

  // 3. Fallback check: if no data -> return static message instantly with NO LLM Call
  if (!rows || rows.length === 0) {
    return {
      thoughts: "Standard daily standup sweep completed. Zero matching events detected across active ship logs.",
      sql,
      content: "⚓ Captain's Log Daily Standup: Clear sailing today! No active repairs, Slack escalations, or calendar meetings are recorded for the active officers. Full steam ahead!",
      data: []
    };
  }

  // 4. Summarize via LLM (llama-3.3-70b-versatile)
  let content = "";
  const thoughts = "Compiled daily standup telemetry aggregating active repairs (GitHub), crew coordination (Slack), and shift calendar (Google Calendar).";
  
  if (groq) {
    try {
      const prompt = `You are the Nautilus First Mate. Formulate a comprehensive Daily Standup Report for the Captain based on this telemetry dataset:
SQL Executed: "${sql}"
Returned Telemetry Rows:
${JSON.stringify(rows, null, 2)}

Structure your report into:
1. 🛠️ ACTIVE SHIP REPAIRS (GitHub tasks/assignees)
2. 💬 CREW DISCUSSION HIGHLIGHTS (Slack activity)
3. 📅 CALENDAR ROUTINES (Upcoming meetings)

Keep it factual, professional, naval/pirate-themed, and highly focused on the returned data.`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.2
      });
      content = completion.choices[0]?.message?.content || "Standup summary generated.";
    } catch (e) {
      content = generateStaticStandupSummary(rows);
    }
  } else {
    content = generateStaticStandupSummary(rows);
  }

  return { thoughts, sql, content, data: rows };
}

function generateStaticStandupSummary(rows: any[]): string {
  let r = "⚓ **Captain's Log Daily Standup Report**\n\n";
  r += "🛠️ **Active Ship Repairs & Coordination:**\n";
  rows.forEach((row, i) => {
    r += `${i + 1}. **Officer ${row.officer || "Unknown"}** is working on: "${row.issue_title}" [Priority: ${row.issue_priority}].\n`;
    r += `   * *Slack Sync [${row.slack_channel}]:* "${row.slack_chat}"\n`;
    if (row.event_title) {
      r += `   * *Calendar Shift:* "${row.event_title}" scheduled at ${row.event_time}\n`;
    }
  });
  return r;
}
