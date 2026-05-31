import Groq from "groq-sdk";
import { env } from "@/lib/env";
import { executeCoralQuery, QueryResult } from "@/coral/cli";
import { DATABASE_SCHEMA } from "@/coral/mockDb";
import { getDynamicSchema } from "@/coral/schemaExplorer";
import { coralQuery, buildCrossSourceQuery } from "@/lib/coralQuery";
import { runAgentEngine } from "@/agent/engine";
import fs from "fs";
import path from "path";

/**
 * Dynamically loads schema definitions from our generated JSON files under /coral/schemas/.
 * Fulfills the Coral requirement for real-time, dynamic schema-awareness.
 */
export function loadDynamicSchemas(): any {
  try {
    const schemasDir = path.join(process.cwd(), "coral", "schemas");
    const files = ["github.json", "slack.json", "notion.json", "calendar.json"];
    const schemas: any = {};

    for (const file of files) {
      const filepath = path.join(schemasDir, file);
      if (fs.existsSync(filepath)) {
        const content = fs.readFileSync(filepath, "utf-8");
        const parsed = JSON.parse(content);
        if (parsed.tables && Array.isArray(parsed.tables)) {
          for (const table of parsed.tables) {
            schemas[table.name] = {
              description: table.description,
              columns: table.columns.map((c: any) => ({
                name: c.name,
                type: c.type.toLowerCase(),
                desc: c.description
              }))
            };
          }
        }
      }
    }
    
    if (Object.keys(schemas).length === 0) {
      return DATABASE_SCHEMA;
    }
    return schemas;
  } catch (error) {
    console.warn("Failed to load dynamic schemas, falling back to database layout:", error);
    return DATABASE_SCHEMA;
  }
}

export interface AgentResponse {
  thoughts: string;
  sqlExecuted?: string;
  queryResults?: any[];
  isMockDb: boolean;
  finalAnswer: string;
  executionTimeMs: number;
  steps: {
    title: string;
    type: "thought" | "sql" | "result" | "final";
    content: string;
    meta?: any;
  }[];
}

// Check if Groq API key is mock
const isMockKey = (key: string) => {
  return !key || key.startsWith("gsk_mock_") || key.includes("replace_with_your");
};

// Initialize Groq client conditionally
let groq: Groq | null = null;
if (typeof window === "undefined" && !isMockKey(env.GROQ_API_KEY)) {
  try {
    groq = new Groq({ apiKey: env.GROQ_API_KEY });
  } catch (err) {
    console.error("Failed to initialize Groq SDK:", err);
  }
}

/**
 * High-quality rule-based NLP-to-SQL compiler to act as a fallback reasoning engine.
 * Ensures the Nautilus First Mate functions beautifully even without Groq API keys.
 */
function compileQueryRuleBased(query: string): { thoughts: string; sql: string } {
  const q = query.toLowerCase();
  
  // Prefer CROSS-SOURCE JOINS if the query targets multiple entities, discussions, or meeting contexts
  if (
    q.includes("join") ||
    (q.includes("slack") && (q.includes("github") || q.includes("issue") || q.includes("pull") || q.includes("repairs") || q.includes("gibbs"))) ||
    ((q.includes("notion") || q.includes("secret") || q.includes("tortuga")) && (q.includes("github") || q.includes("issue"))) ||
    ((q.includes("calendar") || q.includes("meeting") || q.includes("schedule") || q.includes("event") || q.includes("tomorrow")) && q.includes("slack"))
  ) {
    const sql = buildCrossSourceQuery(query);
    let thoughts = "Avast! Fulfilling joint intelligence directive. Formulating a high-value Cross-Source JOIN to aggregate real-time telemetry across disparate ship decks.";
    if (sql.includes("slack_messages") && sql.includes("github_issues")) {
      thoughts += " (Discussion Context Join: github_issues JOIN slack_messages)";
    } else if (sql.includes("notion_pages")) {
      thoughts += " (Task Tracking Join: github_issues JOIN notion_pages)";
    } else if (sql.includes("calendar_events")) {
      thoughts += " (Meeting Context Join: calendar_events JOIN slack_messages)";
    }
    return { thoughts, sql };
  }
  
  // 1. GITHUB_ISSUES
  if (q.includes("issue") || q.includes("bug") || q.includes("github") || q.includes("repo") || q.includes("priority")) {
    let repo = "";
    if (q.includes("navigation")) repo = "nautilus-navigation";
    if (q.includes("kraken") || q.includes("defense")) repo = "kraken-defense";
    if (q.includes("ui") || q.includes("visual")) repo = "nautilus-ui";

    let priority = "";
    if (q.includes("high")) priority = "high";
    if (q.includes("medium")) priority = "medium";
    if (q.includes("low")) priority = "low";

    let status = "";
    if (q.includes("open") || q.includes("active")) status = "open";
    if (q.includes("closed") || q.includes("fixed") || q.includes("resolved")) status = "closed";

    let assignee = "";
    if (q.includes("gibbs")) assignee = "Gibbs";
    if (q.includes("jack")) assignee = "Jack";
    if (q.includes("will") || q.includes("navigator")) assignee = "Will";

    let thoughts = "The mate seeks reports from the GitHub galleon. ";
    let conditions: string[] = [];

    if (repo) {
      conditions.push(`repo = '${repo}'`);
      thoughts += `Filtering by repository: ${repo}. `;
    }
    if (priority) {
      conditions.push(`priority = '${priority}'`);
      thoughts += `Focusing on priority: ${priority}. `;
    }
    if (status) {
      conditions.push(`status = '${status}'`);
      thoughts += `Isolating status: ${status}. `;
    }
    if (assignee) {
      conditions.push(`assignee LIKE '%${assignee}%'`);
      thoughts += `Filtering by assignee: ${assignee}. `;
    }

    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
    const sql = `SELECT * FROM github_issues${whereClause} ORDER BY priority DESC, created_at DESC`;
    thoughts += "Formulated search query to inspect GitHub issues.";
    
    return { thoughts, sql };
  }
  
  // 2. SLACK_MESSAGES
  if (q.includes("slack") || q.includes("chat") || q.includes("message") || q.includes("channel") || q.includes("crew") || q.includes("say") || q.includes("said") || q.includes("alert")) {
    let channel = "";
    if (q.includes("bridge") || q.includes("command")) channel = "#command-bridge";
    if (q.includes("quarters") || q.includes("crew") || q.includes("rum")) channel = "#crew-quarters";
    if (q.includes("alert") || q.includes("vibration") || q.includes("sensor")) channel = "#kraken-alerts";

    let keyword = "";
    if (q.includes("rum")) keyword = "rum";
    if (q.includes("scurvy")) keyword = "scurvy";
    if (q.includes("cannon")) keyword = "cannon";
    if (q.includes("kraken")) keyword = "kraken";

    let sender = "";
    if (q.includes("nemo") || q.includes("captain")) sender = "Captain Nemo";
    if (q.includes("gibbs")) sender = "Gunner Gibbs";
    if (q.includes("will")) sender = "Navigator Will";

    let thoughts = "The mate tunes the shortwave Slack transceiver to eavesdrop on the crew. ";
    let conditions: string[] = [];

    if (channel) {
      conditions.push(`channel = '${channel}'`);
      thoughts += `Tuning channel: ${channel}. `;
    }
    if (keyword) {
      conditions.push(`message LIKE '%${keyword}%'`);
      thoughts += `Searching for cargo keyword: '${keyword}'. `;
    }
    if (sender) {
      conditions.push(`sender LIKE '%${sender}%'`);
      thoughts += `Tracking transmissions from: ${sender}. `;
    }

    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
    const sql = `SELECT * FROM slack_messages${whereClause} ORDER BY timestamp DESC LIMIT 10`;
    thoughts += "Compiled SQL to query the bridge logs.";
    
    return { thoughts, sql };
  }

  // 3. NOTION_PAGES
  if (q.includes("notion") || q.includes("page") || q.includes("document") || q.includes("wiki") || q.includes("research") || q.includes("know") || q.includes("protocol") || q.includes("route") || q.includes("tortuga")) {
    let keyword = "";
    if (q.includes("tortuga")) keyword = "Tortuga";
    if (q.includes("kraken")) keyword = "Kraken";
    if (q.includes("protocol") || q.includes("code") || q.includes("emergency")) keyword = "Protocol";
    if (q.includes("siren")) keyword = "Siren";

    let thoughts = "Scanning the leatherbound ship's library and Notion archives. ";
    let conditions: string[] = [];

    if (keyword) {
      conditions.push(`(title LIKE '%${keyword}%' OR content LIKE '%${keyword}%')`);
      thoughts += `Filtering documents matching keyword: '${keyword}'. `;
    }

    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
    const sql = `SELECT * FROM notion_pages${whereClause} ORDER BY last_edited DESC`;
    thoughts += "Synthesized SQL search over ship logs and documentation.";
    
    return { thoughts, sql };
  }

  // 4. CALENDAR_EVENTS
  if (q.includes("calendar") || q.includes("event") || q.includes("meet") || q.includes("schedule") || q.includes("routine") || q.includes("tomorrow") || q.includes("next")) {
    let thoughts = "Opening the Captain's pocket calendar log. ";
    const sql = `SELECT * FROM calendar_events ORDER BY start_time ASC`;
    thoughts += "Listing all scheduled events and docking protocols.";
    
    return { thoughts, sql };
  }

  // Default Fallback: Query all tables to see what's happening or run general query
  return {
    thoughts: "The query does not specify a single deck. Broadcasting sonar sweep across active Slack chat messages.",
    sql: "SELECT * FROM slack_messages ORDER BY timestamp DESC LIMIT 5",
  };
}

/**
 * Core agent reasoning function.
 * Coordinates between LLM schema planning, CLI SQL execution, and LLM result analysis.
 */
export async function runReasoningAgent(userQuery: string): Promise<AgentResponse> {
  console.log(`[Reasoning Agent Redirect]: Delegating sweep command to modern agent engine core.`);
  return runAgentEngine(userQuery);
}

/**
 * Elite pirate-themed summary compiler when LLM final synthesis is bypassed.
 */
function generateRuleBasedSummary(userQuery: string, sql: string, data: any[]): string {
  if (data.length === 0) {
    return `Sir! I queried the ship logs using [ ${sql} ], but the sonar returned empty. No cargo, tickets, or messages matched your criteria. I advise adjusting the query filters or expanding our sweep coordinates.`;
  }

  // Detect table type to format a specialized summary
  if ("repo" in data[0] || "priority" in data[0]) {
    const openCount = data.filter(i => i.status === "open").length;
    const highCount = data.filter(i => i.priority === "high").length;
    
    let report = `Captain! The GitHub ledger reveals ${data.length} issues matching our current bearing.\n`;
    report += `- Total matching: ${data.length} issues (${openCount} active, ${data.length - openCount} resolved).\n`;
    report += `- Urgent repairs: ${highCount} high-priority tasks.\n\n`;
    report += `Specific highlights:\n`;
    
    data.slice(0, 3).forEach(issue => {
      const statusSymbol = issue.status === "open" ? "⚓ [ACTIVE]" : "✅ [SOLVED]";
      report += `  * ${statusSymbol} #${issue.id} in repo [${issue.repo}] - ${issue.title} (Assigned: ${issue.assignee || "Unassigned"})\n`;
    });
    
    if (data.length > 3) report += `  * ... and ${data.length - 3} other tasks recorded in the log.\n`;
    
    return report;
  }

  if ("channel" in data[0] && "message" in data[0]) {
    let report = `Avast! The Slack shortwave transceivers picked up ${data.length} transmissions.\n\n`;
    
    data.slice(0, 4).forEach(msg => {
      const date = new Date(msg.timestamp).toLocaleTimeString();
      report += `[${msg.channel}] ${msg.sender} (${date}): "${msg.message}"\n`;
    });
    
    if (data.length > 4) report += `\n*Sonars indicate ${data.length - 4} older messages are cached in our database buffers.*`;
    return report;
  }

  if ("content" in data[0] && "title" in data[0]) {
    let report = `Captain, I retrieved ${data.length} parchment files from our Notion cabin libraries:\n\n`;
    
    data.slice(0, 2).forEach(page => {
      report += `📖 TITLE: "${page.title}" (${page.status.toUpperCase()})\n`;
      report += `   LOG CONTENT: "${page.content}"\n`;
      report += `   LAST EDITED: ${new Date(page.last_edited).toLocaleDateString()}\n\n`;
    });
    
    if (data.length > 2) report += `*Note: ${data.length - 2} other pages remain sealed in the archives.*`;
    return report;
  }

  if ("start_time" in data[0] && "attendees" in data[0]) {
    let report = `Sir, our chronometer calendar shows ${data.length} upcoming meetings or operational shifts:\n\n`;
    
    data.forEach(evt => {
      const date = new Date(evt.start_time).toLocaleString();
      report += `⏳ EVENT: "${evt.title}"\n`;
      report += `   TIME: ${date}\n`;
      report += `   OFFICERS: ${evt.attendees}\n`;
      report += `   SUMMARY: ${evt.description}\n\n`;
    });
    
    return report;
  }

  // Ultimate fallback summary
  return `Sir, the query completed successfully. Retrieved ${data.length} rows. Detailed schema inspection is active. Raw data buffers are ready in your Command Deck table below.`;
}
