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

export async function generateTriageReport(): Promise<{ thoughts: string; sql: string; content: string; data: any[] }> {
  // 1. Schema-aware Query Builder
  const schema = await getDynamicSchema();
  const schemaStr = JSON.stringify(schema);
  
  const githubTable = schemaStr.includes("github_issues") ? "github_issues" : "github.issues";
  const notionTable = schemaStr.includes("notion_pages") ? "notion_pages" : "notion.pages";

  // Build schema-aware SQL JOIN linking GitHub issues to Notion pages on status or keyword titles
  const sql = `
    SELECT 
      g.id as issue_id,
      g.repo as github_repo,
      g.title as issue_title, 
      g.status as issue_status,
      g.priority as issue_priority,
      n.title as document_title,
      n.status as document_status,
      n.last_edited as doc_last_edited
    FROM ${githubTable} g
    JOIN ${notionTable} n ON g.status = n.status OR n.title LIKE '%' || g.repo || '%' OR g.title LIKE '%' || n.title || '%'
    ORDER BY g.priority DESC, n.last_edited DESC
    LIMIT 6
  `.trim();

  // 2. Execute query
  let rows = [];
  try {
    rows = coralQuery(sql);
  } catch (e) {
    console.error("Triage feature query failed:", e);
  }

  // 3. Fallback check: if no data -> return static message instantly with NO LLM Call
  if (!rows || rows.length === 0) {
    return {
      thoughts: "Keel repair triage search completed. No active backlogs found in registry catalogs.",
      sql,
      content: "⚓ Captain's Triage Alert: All repair documentation is synchronized perfectly with active GitHub repositories. Zero backlog conflicts or untriaged issues found in Notion logs.",
      data: []
    };
  }

  // 4. Summarize via LLM (llama-3.3-70b-versatile)
  let content = "";
  const thoughts = "Compiled keel repair triage maps, linking active software issues (GitHub) to standard repair protocols (Notion).";

  if (groq) {
    try {
      const prompt = `You are the Nautilus First Mate. Generate a Technical Triage & KEEL BACKLOG Report based on this joint telemetry:
SQL Executed: "${sql}"
Returned Telemetry Rows:
${JSON.stringify(rows, null, 2)}

Help the crew match active bug tickets to correct reference protocols and document links. Keep it naval-themed, precise, and data-first.`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.2
      });
      content = completion.choices[0]?.message?.content || "Triage summary generated.";
    } catch (e) {
      content = generateStaticTriageSummary(rows);
    }
  } else {
    content = generateStaticTriageSummary(rows);
  }

  return { thoughts, sql, content, data: rows };
}

function generateStaticTriageSummary(rows: any[]): string {
  let r = "⚓ **Keel Backlog Triage Report**\n\n";
  r += "🛠️ **Triaged Repository Backlogs:**\n";
  rows.forEach((row, i) => {
    r += `${i + 1}. **Issue #${row.issue_id || i}: "${row.issue_title}"** [Repo: ${row.github_repo}] [Priority: ${row.issue_priority}]\n`;
    r += `   * *Notion Reference Protocol:* "${row.document_title}" [Status: ${row.document_status}]\n`;
  });
  return r;
}
