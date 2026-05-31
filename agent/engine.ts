import Groq from "groq-sdk";
import { env } from "@/lib/env";
import { coralQuery, buildCrossSourceQuery } from "@/lib/coralQuery";
import { getDynamicSchema } from "@/coral/schemaExplorer";
import { generateStandupReport } from "./features/standup";
import { generateTriageReport } from "./features/triage";
import { generateInsightsReport } from "./features/insights";

// Initialize Groq client
const isMockKey = (key?: string) => !key || key.startsWith("your_") || key === "mock_key";

let groq: Groq | null = null;
if (typeof window === "undefined" && !isMockKey(env.GROQ_API_KEY)) {
  try {
    groq = new Groq({ apiKey: env.GROQ_API_KEY });
  } catch (err) {
    console.error("Failed to initialize Groq SDK on engine:", err);
  }
}


export interface AgentStep {
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

export interface AgentResponse {
  thoughts: string;
  sqlExecuted: string;
  queryResults: any[];
  isMockDb: boolean;
  finalAnswer: string;
  executionTimeMs: number;
  steps: AgentStep[];
}

/**
 * Standard rule-based fallback summary when no data is returned.
 * Bypasses LLM request entirely to save token budget and latency.
 */
function compileFallbackEmptySummary(sql: string): string {
  return `Sir! I queried the ship logs using [ ${sql} ], but the sonar returned empty. No cargo, tickets, or messages matched your criteria. I advise adjusting the query filters or expanding our sweep coordinates.`;
}

/**
 * Pirate-themed fallback summary when LLM final synthesis is offline.
 */
function compileRuleBasedSummary(userQuery: string, sql: string, data: any[]): string {
  if (!data || data.length === 0) {
    return compileFallbackEmptySummary(sql);
  }

  // Detect table type to format a specialized summary
  if ("repo" in data[0] || "priority" in data[0]) {
    const openCount = data.filter(i => i.status === "open").length;
    const highCount = data.filter(i => i.priority === "high").length;
    
    let report = `Captain! The GitHub ledger reveals ${data.length} issues matching our current bearing.\n`;
    report += `- Total matching: ${data.length} issues (${openCount} active, ${data.length - openCount} resolved).\n`;
    report += `- Urgent repairs: ${highCount} high-priority tasks.\n\n`;
    report += `Specific highlights:\n`;
    
    data.slice(0, 3).forEach((issue, idx) => {
      const statusSymbol = issue.status === "open" ? "⚓ [ACTIVE]" : "✅ [SOLVED]";
      report += `  * ${statusSymbol} #${issue.id || idx} in repo [${issue.repo}] - ${issue.title} (Assigned: ${issue.assignee || "Unassigned"})\n`;
    });
    
    if (data.length > 3) report += `  * ... and ${data.length - 3} other tasks recorded in the log.\n`;
    return report;
  }

  if ("channel" in data[0] && "message" in data[0]) {
    let report = `Avast! The Slack shortwave transceivers picked up ${data.length} transmissions.\n\n`;
    
    data.slice(0, 4).forEach(msg => {
      const date = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : "N/A";
      report += `[${msg.channel}] ${msg.sender} (${date}): "${msg.message}"\n`;
    });
    
    if (data.length > 4) report += `\n*Sonars indicate ${data.length - 4} older messages are cached in our database buffers.*`;
    return report;
  }

  // Default fallback summary
  return `Captain! I successfully retrieved ${data.length} rows from the ship's logs. The data metrics are loaded below in your command deck console.`;
}

/**
 * Mechanical NLP fallback compiler when Groq client is not available.
 * Fulfills rule-based joins.
 */
function compileQueryRuleBased(query: string): { thoughts: string; sql: string } {
  const q = query.toLowerCase();
  
  if (
    q.includes("join") ||
    (q.includes("slack") && (q.includes("github") || q.includes("issue") || q.includes("pull") || q.includes("repairs"))) ||
    ((q.includes("notion") || q.includes("secret")) && q.includes("github")) ||
    ((q.includes("calendar") || q.includes("meeting") || q.includes("tomorrow")) && q.includes("slack"))
  ) {
    const sql = buildCrossSourceQuery(query);
    return {
      thoughts: "Avast! Direct relational join request detected. Formulating a high-value cross-source SQL join to unify GitHub issues, Notion files, and Slack shortwave logs in a single scan.",
      sql
    };
  }

  // Default table paths
  if (q.includes("issue") || q.includes("bug") || q.includes("github")) {
    return {
      thoughts: "Searching GitHub logs for active navigation or keel issues.",
      sql: "SELECT * FROM github_issues WHERE status = 'open' ORDER BY priority DESC"
    };
  }
  if (q.includes("slack") || q.includes("message") || q.includes("chat")) {
    return {
      thoughts: "Tuning Slack shortwaves to eavesdrop on ship communications.",
      sql: "SELECT * FROM slack_messages ORDER BY timestamp DESC LIMIT 10"
    };
  }
  if (q.includes("notion") || q.includes("document") || q.includes("page")) {
    return {
      thoughts: "Inspecting ship documents in our Notion ledger cabinets.",
      sql: "SELECT * FROM notion_pages ORDER BY last_edited DESC"
    };
  }
  if (q.includes("calendar") || q.includes("event") || q.includes("schedule") || q.includes("tomorrow")) {
    return {
      thoughts: "Consulting the ship chronometer calendar schedule.",
      sql: "SELECT * FROM calendar_events ORDER BY start_time ASC"
    };
  }

  // General fallback
  return {
    thoughts: "General search bearing. Scanning slack messages for command logs.",
    sql: "SELECT * FROM slack_messages LIMIT 5"
  };
}

/**
 * Core SQL-First Agent Engine. Executes the 3-step forward pipeline:
 * 1. Build SQL query (LLM: llama-3.3-70b-versatile)
 * 2. Execute SQL query (Coral CLI via execSync / Mock DB)
 * 3. Synthesize & Summarize results (LLM: llama-3.3-70b-versatile)
 * 
 * Strict Constraint: If no rows are returned, it bypasses Step 3 (LLM) 
 * and returns a fast, robust static summary fallback.
 */
export async function runAgentEngine(userQuery: string): Promise<AgentResponse> {
  const startTime = Date.now();
  const steps: AgentStep[] = [];
  
  const q = userQuery.toLowerCase();
  
  // High-level feature module routing
  if (q.includes("standup") || q.includes("daily report") || q.includes("daily standup")) {
    const res = await generateStandupReport();
    const duration = Date.now() - startTime;
    return {
      thoughts: res.thoughts,
      sqlExecuted: res.sql,
      queryResults: res.data,
      isMockDb: true,
      finalAnswer: res.content,
      executionTimeMs: duration,
      steps: [
        { title: "Introspection Sweep", type: "thought", content: "Engaging Coral Schema Explorer to inspect active tables..." },
        { title: "SQL Charts Formulated", type: "thought", content: res.thoughts },
        { title: "Firing Sonar SQL", type: "sql", content: res.sql },
        { title: "Echo Returns Parsed", type: "result", content: `Sonar returned ${res.data.length} row(s) in 15ms.`, meta: { data: res.data, isMock: true, executionTimeMs: 15 } },
        { title: "Logbook Confirmed", type: "final", content: res.content }
      ]
    };
  }
  
  if (q.includes("triage") || q.includes("backlog") || q.includes("keel triage")) {
    const res = await generateTriageReport();
    const duration = Date.now() - startTime;
    return {
      thoughts: res.thoughts,
      sqlExecuted: res.sql,
      queryResults: res.data,
      isMockDb: true,
      finalAnswer: res.content,
      executionTimeMs: duration,
      steps: [
        { title: "Introspection Sweep", type: "thought", content: "Engaging Coral Schema Explorer to inspect active tables..." },
        { title: "SQL Charts Formulated", type: "thought", content: res.thoughts },
        { title: "Firing Sonar SQL", type: "sql", content: res.sql },
        { title: "Echo Returns Parsed", type: "result", content: `Sonar returned ${res.data.length} row(s) in 18ms.`, meta: { data: res.data, isMock: true, executionTimeMs: 18 } },
        { title: "Logbook Confirmed", type: "final", content: res.content }
      ]
    };
  }
  
  if (q.includes("insight") || q.includes("trend") || q.includes("ship alert")) {
    const res = await generateInsightsReport();
    const duration = Date.now() - startTime;
    return {
      thoughts: res.thoughts,
      sqlExecuted: res.sql,
      queryResults: res.data,
      isMockDb: true,
      finalAnswer: res.content,
      executionTimeMs: duration,
      steps: [
        { title: "Introspection Sweep", type: "thought", content: "Engaging Coral Schema Explorer to inspect active tables..." },
        { title: "SQL Charts Formulated", type: "thought", content: res.thoughts },
        { title: "Firing Sonar SQL", type: "sql", content: res.sql },
        { title: "Echo Returns Parsed", type: "result", content: `Sonar returned ${res.data.length} row(s) in 22ms.`, meta: { data: res.data, isMock: true, executionTimeMs: 22 } },
        { title: "Logbook Confirmed", type: "final", content: res.content }
      ]
    };
  }

  let thoughts = "";
  let sql = "";
  let isMockedReasoning = false;


  // STEP 1: Build SQL query using Groq or Mechanical rule-based compiler
  if (groq) {
    try {
      steps.push({
        title: "Introspection Sweep",
        type: "thought",
        content: "Engaging Coral Schema Explorer to scan catalog registries..."
      });

      const schema = await getDynamicSchema();
      const schemaStr = JSON.stringify(schema, null, 2);

      const systemPrompt = `You are the "Nautilus First Mate" — a data-focused AI officer on the submarine Nautilus. 
Your primary intelligence tool is Coral SQL, which executes queries against the ship's database integrations.
Available tables and columns in Coral:
${schemaStr}

Translate the user's natural language request into a single clean, valid, standard SQL query.
DO NOT make updates or inserts. Only output SELECT queries.

*** IMPORTANT RULES ***
- Prefer a SINGLE SQL query using JOINs (e.g. github_issues JOIN slack_messages, github_issues JOIN notion_pages, calendar_events JOIN slack_messages) over multiple requests when user query spans systems.
- Match columns strictly: Use 'assignee' or 'sender' to JOIN Github and Slack.
- Standard standard SQLite compatible dialect. No backticks.

You MUST respond strictly with a JSON object containing exactly:
{
  "thoughts": "Naval theme description explaining the join or filters formulated.",
  "sql": "SELECT statement"
}`;

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userQuery }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      const responseText = chatCompletion.choices[0]?.message?.content || "{}";
      const parsedJson = JSON.parse(responseText);
      
      thoughts = parsedJson.thoughts || "Formulating sonar SQL charts.";
      sql = parsedJson.sql || "SELECT * FROM slack_messages LIMIT 5";
      
    } catch (err: any) {
      console.warn("Groq SQL compilation failed, engaging backup gears:", err.message);
      isMockedReasoning = true;
      const fallback = compileQueryRuleBased(userQuery);
      thoughts = fallback.thoughts + ` (Gears Engaged: ${err.message})`;
      sql = fallback.sql;
    }
  } else {
    isMockedReasoning = true;
    const fallback = compileQueryRuleBased(userQuery);
    thoughts = fallback.thoughts + " (Backup Mechanical Core)";
    sql = fallback.sql;
  }

  steps.push({
    title: "SQL Charts Formulated",
    type: "thought",
    content: thoughts
  });

  steps.push({
    title: "Firing Sonar SQL",
    type: "sql",
    content: sql
  });

  // STEP 2: Execute SQL query via Coral CLI
  steps.push({
    title: "Sub-sea Echo Processing",
    type: "thought",
    content: "Sending SQL instructions to the Coral database transceivers..."
  });

  const queryStartTime = Date.now();
  const rows = coralQuery(sql);
  const queryDuration = Date.now() - queryStartTime;

  steps.push({
    title: "Echo Returns Parsed",
    type: "result",
    content: `Sonar returned ${rows.length} row(s) in ${queryDuration}ms.`,
    meta: {
      data: rows,
      isMock: true,
      executionTimeMs: queryDuration
    }
  });

  // STEP 3: Summarize results
  let finalAnswer = "";

  // RULE: If no data returned, bypass LLM call and return fallback instantly
  if (!rows || rows.length === 0) {
    steps.push({
      title: "Silence on the Line",
      type: "thought",
      content: "No records found in database tables. Bypassing summarization LLM to save token latency."
    });
    finalAnswer = compileFallbackEmptySummary(sql);
  } else if (groq && !isMockedReasoning) {
    try {
      steps.push({
        title: "Synthesizing Ledger",
        type: "thought",
        content: "Transmitting returned logs to Llama-3.3-70b-versatile for telemetry synthesis..."
      });

      const summaryPrompt = `You are the Nautilus First Mate. You have just run a Coral SQL query on the ship's database.
User Query: "${userQuery}"
SQL Executed: "${sql}"
Rows Returned: ${JSON.stringify(rows, null, 2)}

Write a professional, pirate-themed, data-first summary explaining exactly what coordinates, counts, authors, status or messages were retrieved. Keep it factual and concise.`;

      const summaryCompletion = await groq.chat.completions.create({
        messages: [
          { role: "user", content: summaryPrompt }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.2
      });

      finalAnswer = summaryCompletion.choices[0]?.message?.content || "Telemetry record finalized.";
    } catch (err: any) {
      console.warn("LLM summary generation failed, utilizing rules:", err.message);
      finalAnswer = compileRuleBasedSummary(userQuery, sql, rows);
    }
  } else {
    finalAnswer = compileRuleBasedSummary(userQuery, sql, rows);
  }

  steps.push({
    title: "Logbook Confirmed",
    type: "final",
    content: finalAnswer
  });

  const totalDuration = Date.now() - startTime;

  return {
    thoughts,
    sqlExecuted: sql,
    queryResults: rows,
    isMockDb: true,
    finalAnswer,
    executionTimeMs: totalDuration,
    steps
  };
}
