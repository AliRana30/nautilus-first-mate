import { execSync } from "child_process";
import { executeMockQuery } from "./mockDb";

export interface QueryResult {
  data: any[];
  isMock: boolean;
  sqlExecuted: string;
  error?: string;
  executionTimeMs: number;
}

/**
 * Executes an SQL query against the Coral CLI using child_process.execSync.
 * If the CLI is not found or fails, it falls back to the in-memory SQL mock engine.
 */
export function executeCoralQuery(sql: string): QueryResult {
  const startTime = Date.now();
  
  // Format and clean the SQL input
  const formattedSql = sql.trim();
  
  try {
    // Translate SQLite-compatible mock table names to real Coral fully-qualified names
    const realSql = formattedSql
      .replace(/\bgithub_issues\b/g, "github.issues")
      .replace(/\bslack_messages\b/g, "slack.messages")
      .replace(/\bnotion_pages\b/g, "notion.pages")
      .replace(/\bcalendar_events\b/g, "google_calendar.events");

    // 1. Core integration using child_process.execSync
    // We escape double-quotes to ensure they do not terminate the shell arguments prematurely
    const escapedSql = realSql.replace(/"/g, '\\"');
    const command = `coral sql "${escapedSql}"`;
    
    console.log(`[Coral CLI Executing]: ${command}`);
    
    // Run the shell command. If "coral" CLI is not in the system, this will throw an error
    const output = execSync(command, { 
      encoding: "utf-8", 
      timeout: 4000, 
      stdio: ["ignore", "pipe", "pipe"] 
    });
    
    const endTime = Date.now();
    
    // Attempt to parse CLI output as JSON (standard in most agent SQL layers)
    try {
      const parsedData = JSON.parse(output);
      const dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];
      
      return {
        data: dataArray,
        isMock: false,
        sqlExecuted: formattedSql,
        executionTimeMs: endTime - startTime,
      };
    } catch {
      // Fallback if output is formatted text rather than JSON
      return {
        data: [{ stdout: output.trim() }],
        isMock: false,
        sqlExecuted: formattedSql,
        executionTimeMs: endTime - startTime,
      };
    }
  } catch (error: any) {
    const endTime = Date.now();
    
    // 2. Graceful Fallback if Coral CLI is not installed or fails
    console.warn(`Coral CLI error, falling back to local reasoning DB engine. Details: ${error.message}`);
    
    try {
      const mockData = executeMockQuery(formattedSql);
      return {
        data: mockData,
        isMock: true,
        sqlExecuted: formattedSql,
        executionTimeMs: endTime - startTime,
      };
    } catch (mockError: any) {
      return {
        data: [],
        isMock: true,
        sqlExecuted: formattedSql,
        error: `Mock Query Execution Failed: ${mockError.message}. Coral CLI Err: ${error.message}`,
        executionTimeMs: endTime - startTime,
      };
    }
  }
}
