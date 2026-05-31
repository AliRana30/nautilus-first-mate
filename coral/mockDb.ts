// Nautilus First Mate - Mock Coral Database & SQL Runner
// Provides high-fidelity mock data and a pure JS query runner to simulate Coral SQL when the CLI is not running.

export interface GitHubIssue {
  id: number;
  repo: string;
  title: string;
  status: "open" | "closed";
  assignee: string;
  created_at: string;
  closed_at: string | null;
  priority: "high" | "medium" | "low";
}

export interface SlackMessage {
  id: number;
  channel: string;
  sender: string;
  message: string;
  timestamp: string;
}

export interface NotionPage {
  id: number;
  title: string;
  content: string;
  status: "draft" | "published" | "archived";
  last_edited: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  attendees: string;
  description: string;
}

// 1. High-Density pirate/naval themed data representing our integrations
export const GITHUB_ISSUES: GitHubIssue[] = [
  { id: 1, repo: "nautilus-navigation", title: "Fix leak in magnetic compass alignment matrix", status: "open", assignee: "Quartermaster Jack", created_at: "2026-05-28T08:00:00Z", closed_at: null, priority: "high" },
  { id: 2, repo: "nautilus-navigation", title: "Calibrate depth sounder sonar sonar array", status: "closed", assignee: "Navigator Will", created_at: "2026-05-25T10:00:00Z", closed_at: "2026-05-27T16:30:00Z", priority: "medium" },
  { id: 3, repo: "kraken-defense", title: "Automate starboard cannon ammunition loaders", status: "open", assignee: "Gunner Gibbs", created_at: "2026-05-29T02:15:00Z", closed_at: null, priority: "high" },
  { id: 4, repo: "nautilus-ui", title: "Gold trim hover states flickering in main cabin display", status: "open", assignee: "Scribe Thomas", created_at: "2026-05-29T11:00:00Z", closed_at: null, priority: "low" },
  { id: 5, repo: "kraken-defense", title: "Harpoon recoil hydraulic seal pressure drops", status: "closed", assignee: "Gunner Gibbs", created_at: "2026-05-20T09:00:00Z", closed_at: "2026-05-24T14:00:00Z", priority: "high" }
];

export const SLACK_MESSAGES: SlackMessage[] = [
  { id: 1, channel: "#command-bridge", sender: "Captain Nemo", message: "Keep her steady at 12 knots. Storm brewing from the northeast.", timestamp: "2026-05-29T18:45:00Z" },
  { id: 2, channel: "#command-bridge", sender: "Navigator Will", message: "Aye captain, adjusting rudder. Charting safe passage past the Tortuga shallows.", timestamp: "2026-05-29T18:48:00Z" },
  { id: 3, channel: "#crew-quarters", sender: "Quartermaster Jack", message: "Rations check complete. Rum supply is down to 3 barrels! Requesting immediate port call.", timestamp: "2026-05-29T15:30:00Z" },
  { id: 4, channel: "#crew-quarters", sender: "Cook Sally", message: "We have plenty of salted cod but need fresh citrus to prevent scurvy.", timestamp: "2026-05-29T16:10:00Z" },
  { id: 5, channel: "#kraken-alerts", sender: "Sensors Daemon", message: "WARNING: High-frequency seismic vibrations detected at coordinates 12°N, 64°W. Possible giant cephalopod activity.", timestamp: "2026-05-29T20:05:00Z" },
  { id: 6, channel: "#command-bridge", sender: "Captain Nemo", message: "Did Gibbs repair the starboard cannons? We might need them.", timestamp: "2026-05-29T20:10:00Z" },
  { id: 7, channel: "#command-bridge", sender: "Gunner Gibbs", message: "Working on it captain! Starboard loaders are functional, hydraulic seals on harpoon are fully replaced.", timestamp: "2026-05-29T20:15:00Z" }
];

export const NOTION_PAGES: NotionPage[] = [
  { id: 1, title: "Tortuga Safe Harbors & Trade Routes", content: "Tortuga remains a neutral port. Avoid the eastern inlet due to Spanish garrison patrols. Fuel and fresh water available at Dock 4. Trade rate for spice is 12 doubloons per barrel.", status: "published", last_edited: "2026-05-20T12:00:00Z" },
  { id: 2, title: "Kraken Behavioral Research Logs", content: "The beast reacts violently to electrical discharges. Depth patterns suggest it rests in trenches deeper than 400 fathoms. Employs acoustic mimicry to lure passing frigates.", status: "published", last_edited: "2026-05-28T14:22:00Z" },
  { id: 3, title: "Emergency Ship Protocols & Alarm Codes", content: "Code Gold: Keel damage or hull breach. Sound steam whistle 3 times. Code Rust: Boarding action. Arm all hands. Code Navy: Standard dive protocol.", status: "published", last_edited: "2026-05-10T08:00:00Z" },
  { id: 4, title: "Draft: Sirens Lagoon Coordinate Mapping", content: "Unconfirmed sightings at 18.4°N, 66.8°W. Echoes sound like music but may just be resonant wind tunnels in the volcanic rock.", status: "draft", last_edited: "2026-05-29T09:15:00Z" }
];

export const CALENDAR_EVENTS: CalendarEvent[] = [
  { id: 1, title: "Captain's Log Inspection", start_time: "2026-05-30T09:00:00Z", end_time: "2026-05-30T10:00:00Z", attendees: "Captain Nemo, Scribe Thomas", description: "Reviewing paper logs against digital SQL archives." },
  { id: 2, title: "Tortuga Resupply & Docking", start_time: "2026-06-01T12:00:00Z", end_time: "2026-06-02T18:00:00Z", attendees: "All Hands", description: "Loading rum, oranges, fresh water, and securing the compass replacement parts." },
  { id: 3, title: "Kraken Seismic Analysis Review", start_time: "2026-05-29T22:00:00Z", end_time: "2026-05-29T23:00:00Z", attendees: "Captain Nemo, Navigator Will, Sensors Daemon", description: "Reviewing the vibrations in trench coordinates 12°N, 64°W." }
];

// Helper to query mock data using basic SQL emulation
export function executeMockQuery(sql: string): any[] {
  console.log(`[Mock DB SQL]: ${sql}`);
  
  const cleanSql = sql.trim().replace(/\s+/g, " ");
  
  // Check if it's a cross-source JOIN query
  const isJoin = /join/i.test(cleanSql);
  if (isJoin) {
    // 1. github_issues JOIN slack_messages
    if (/github_issues/i.test(cleanSql) && /slack_messages/i.test(cleanSql)) {
      const joined: any[] = [];
      for (const issue of GITHUB_ISSUES) {
        for (const msg of SLACK_MESSAGES) {
          if (issue.assignee && msg.sender && issue.assignee.toLowerCase() === msg.sender.toLowerCase()) {
            joined.push({
              id: issue.id,
              repo: issue.repo,
              title: issue.title,
              assignee: issue.assignee,
              channel: msg.channel,
              message: msg.message,
              timestamp: msg.timestamp,
              priority: issue.priority,
              status: issue.status
            });
          }
        }
      }
      return joined;
    }
    
    // 2. github_issues JOIN notion_pages
    if (/github_issues/i.test(cleanSql) && /notion_pages/i.test(cleanSql)) {
      const joined: any[] = [];
      for (const issue of GITHUB_ISSUES) {
        for (const page of NOTION_PAGES) {
          if (issue.status.toLowerCase() === page.status.toLowerCase() || page.title.toLowerCase().includes(issue.repo.toLowerCase().replace("nautilus-", ""))) {
            joined.push({
              id: issue.id,
              title: issue.title,
              github_status: issue.status,
              notion_status: page.status,
              content: page.content,
              last_edited: page.last_edited,
              repo: issue.repo,
              assignee: issue.assignee
            });
          }
        }
      }
      return joined;
    }

    // 3. calendar_events JOIN slack_messages
    if (/calendar_events/i.test(cleanSql) && /slack_messages/i.test(cleanSql)) {
      const joined: any[] = [];
      for (const event of CALENDAR_EVENTS) {
        for (const msg of SLACK_MESSAGES) {
          if (event.attendees && msg.sender && (event.attendees.toLowerCase().includes(msg.sender.toLowerCase()) || msg.sender.toLowerCase().includes(event.attendees.toLowerCase()))) {
            joined.push({
              id: event.id,
              event_title: event.title,
              start_time: event.start_time,
              end_time: event.end_time,
              sender: msg.sender,
              message: msg.message,
              channel: msg.channel,
              attendees: event.attendees
            });
          }
        }
      }
      return joined;
    }
  }

  // Table routing
  let data: any[] = [];
  let tableName = "";
  
  if (/from\s+github_issues/i.test(cleanSql)) {
    data = [...GITHUB_ISSUES];
    tableName = "github_issues";
  } else if (/from\s+slack_messages/i.test(cleanSql)) {
    data = [...SLACK_MESSAGES];
    tableName = "slack_messages";
  } else if (/from\s+notion_pages/i.test(cleanSql)) {
    data = [...NOTION_PAGES];
    tableName = "notion_pages";
  } else if (/from\s+calendar_events/i.test(cleanSql)) {
    data = [...CALENDAR_EVENTS];
    tableName = "calendar_events";
  } else if (/from\s+coral\.tables/i.test(cleanSql) || /from\s+coral_tables/i.test(cleanSql)) {
    data = [
      { table_name: "github_issues", source_name: "github", description: "GitHub Issues tracking ship mechanics and UI fixes", row_count: 5 },
      { table_name: "slack_messages", source_name: "slack", description: "Slack chats between crew members and automatic sensors", row_count: 7 },
      { table_name: "notion_pages", source_name: "notion", description: "Notion wiki documents and navigational research", row_count: 4 },
      { table_name: "calendar_events", source_name: "calendar", description: "Google Calendar scheduled meetings and ship routines", row_count: 3 }
    ];
    tableName = "coral.tables";
  } else if (/from\s+coral\.columns/i.test(cleanSql) || /from\s+coral_columns/i.test(cleanSql)) {
    data = [
      // github_issues
      { table_name: "github_issues", column_name: "id", data_type: "INTEGER", is_primary_key: 1 },
      { table_name: "github_issues", column_name: "repo", data_type: "TEXT", is_primary_key: 0 },
      { table_name: "github_issues", column_name: "title", data_type: "TEXT", is_primary_key: 0 },
      { table_name: "github_issues", column_name: "status", data_type: "TEXT", is_primary_key: 0 },
      { table_name: "github_issues", column_name: "assignee", data_type: "TEXT", is_primary_key: 0 },
      { table_name: "github_issues", column_name: "created_at", data_type: "TIMESTAMP", is_primary_key: 0 },
      { table_name: "github_issues", column_name: "closed_at", data_type: "TIMESTAMP", is_primary_key: 0 },
      { table_name: "github_issues", column_name: "priority", data_type: "TEXT", is_primary_key: 0 },
      // slack_messages
      { table_name: "slack_messages", column_name: "id", data_type: "INTEGER", is_primary_key: 1 },
      { table_name: "slack_messages", column_name: "channel", data_type: "TEXT", is_primary_key: 0 },
      { table_name: "slack_messages", column_name: "sender", data_type: "TEXT", is_primary_key: 0 },
      { table_name: "slack_messages", column_name: "message", data_type: "TEXT", is_primary_key: 0 },
      { table_name: "slack_messages", column_name: "timestamp", data_type: "TIMESTAMP", is_primary_key: 0 },
      // notion_pages
      { table_name: "notion_pages", column_name: "id", data_type: "INTEGER", is_primary_key: 1 },
      { table_name: "notion_pages", column_name: "title", data_type: "TEXT", is_primary_key: 0 },
      { table_name: "notion_pages", column_name: "content", data_type: "TEXT", is_primary_key: 0 },
      { table_name: "notion_pages", column_name: "status", data_type: "TEXT", is_primary_key: 0 },
      { table_name: "notion_pages", column_name: "last_edited", data_type: "TIMESTAMP", is_primary_key: 0 },
      // calendar_events
      { table_name: "calendar_events", column_name: "id", data_type: "INTEGER", is_primary_key: 1 },
      { table_name: "calendar_events", column_name: "title", data_type: "TEXT", is_primary_key: 0 },
      { table_name: "calendar_events", column_name: "start_time", data_type: "TIMESTAMP", is_primary_key: 0 },
      { table_name: "calendar_events", column_name: "end_time", data_type: "TIMESTAMP", is_primary_key: 0 },
      { table_name: "calendar_events", column_name: "attendees", data_type: "TEXT", is_primary_key: 0 },
      { table_name: "calendar_events", column_name: "description", data_type: "TEXT", is_primary_key: 0 }
    ];
    tableName = "coral.columns";
  } else {
    // If not found, return empty array
    return [{ error: "Table not found in Nautilus Database schema" }];
  }
  
  // Basic WHERE filtering
  const whereMatch = cleanSql.match(/where\s+(.+?)(?:order\s+by|limit|$)/i);
  if (whereMatch) {
    const condition = whereMatch[1].trim();
    
    // Parse single conditions like: status = 'open' or channel = '#command-bridge'
    // or priority = 'high' or status = 'closed'
    data = data.filter(item => {
      // 1. Equal String check (e.g. status = 'open')
      const eqMatch = condition.match(/(\w+)\s*=\s*'([^']+)'/i);
      if (eqMatch) {
        const [, col, val] = eqMatch;
        const key = col.toLowerCase();
        return String(item[key as keyof typeof item]).toLowerCase() === val.toLowerCase();
      }
      
      // 2. Not Equal String check (e.g. status != 'closed')
      const neMatch = condition.match(/(\w+)\s*(?:!=|<>)\s*'([^']+)'/i);
      if (neMatch) {
        const [, col, val] = neMatch;
        const key = col.toLowerCase();
        return String(item[key as keyof typeof item]).toLowerCase() !== val.toLowerCase();
      }
      
      // 3. LIKE check (e.g. message LIKE '%rum%')
      const likeMatch = condition.match(/(\w+)\s+like\s+'%([^%']+)%'/i);
      if (likeMatch) {
        const [, col, val] = likeMatch;
        const key = col.toLowerCase();
        const itemVal = String(item[key as keyof typeof item] || "").toLowerCase();
        return itemVal.includes(val.toLowerCase());
      }
      
      // 4. Greater/less than checks for id or date
      const gtMatch = condition.match(/(\w+)\s*>\s*'([^']+)'/i);
      if (gtMatch) {
        const [, col, val] = gtMatch;
        const key = col.toLowerCase();
        return String(item[key as keyof typeof item]) > val;
      }
      
      const ltMatch = condition.match(/(\w+)\s*<\s*'([^']+)'/i);
      if (ltMatch) {
        const [, col, val] = ltMatch;
        const key = col.toLowerCase();
        return String(item[key as keyof typeof item]) < val;
      }

      // Default fallback: return true (don't filter out)
      return true;
    });
  }
  
  // Basic ORDER BY sorting
  const orderMatch = cleanSql.match(/order\s+by\s+(\w+)(?:\s+(asc|desc))?/i);
  if (orderMatch) {
    const [, col, dir = "asc"] = orderMatch;
    const key = col.toLowerCase();
    data.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (valA === undefined || valB === undefined) return 0;
      if (valA < valB) return dir.toLowerCase() === "asc" ? -1 : 1;
      if (valA > valB) return dir.toLowerCase() === "asc" ? 1 : -1;
      return 0;
    });
  }
  
  // Basic LIMIT slicing
  const limitMatch = cleanSql.match(/limit\s+(\d+)/i);
  if (limitMatch) {
    const limit = parseInt(limitMatch[1], 10);
    data = data.slice(0, limit);
  }
  
  // Basic Column Selection (SELECT * vs SELECT title, status...)
  const selectMatch = cleanSql.match(/select\s+(.+?)\s+from/i);
  if (selectMatch) {
    const columnsText = selectMatch[1].trim();
    if (columnsText !== "*") {
      const cols = columnsText.split(",").map(c => c.trim().toLowerCase());
      data = data.map(item => {
        const projected: any = {};
        cols.forEach(col => {
          if (col in item) {
            projected[col] = item[col];
          }
        });
        return projected;
      });
    }
  }
  
  return data;
}

// Full database schema layout to display to users
export const DATABASE_SCHEMA = {
  github_issues: {
    description: "GitHub Issues tracking ship mechanics and UI fixes",
    columns: [
      { name: "id", type: "integer", desc: "Unique issue ID" },
      { name: "repo", type: "text", desc: "Repository ('nautilus-navigation', 'kraken-defense', 'nautilus-ui')" },
      { name: "title", type: "text", desc: "Short summary of the bug or task" },
      { name: "status", type: "text", desc: "Issue status ('open' or 'closed')" },
      { name: "assignee", type: "text", desc: "Assigned officer" },
      { name: "created_at", type: "timestamp", desc: "Timestamp when logged" },
      { name: "closed_at", type: "timestamp", desc: "Timestamp when resolved, or null" },
      { name: "priority", type: "text", desc: "Urgency ('high', 'medium', 'low')" }
    ]
  },
  slack_messages: {
    description: "Slack chats between crew members and automatic sensors",
    columns: [
      { name: "id", type: "integer", desc: "Message ID" },
      { name: "channel", type: "text", desc: "Slack channel ('#command-bridge', '#crew-quarters', '#kraken-alerts')" },
      { name: "sender", type: "text", desc: "Name of the sender (e.g. Captain Nemo, Sensors Daemon)" },
      { name: "message", type: "text", desc: "Text contents of the message" },
      { name: "timestamp", type: "timestamp", desc: "When the message was sent" }
    ]
  },
  notion_pages: {
    description: "Notion wiki documents and navigational research",
    columns: [
      { name: "id", type: "integer", desc: "Document ID" },
      { name: "title", type: "text", desc: "Document Title" },
      { name: "content", type: "text", desc: "Full markdown text body" },
      { name: "status", type: "text", desc: "Document status ('draft', 'published', 'archived')" },
      { name: "last_edited", type: "timestamp", desc: "When last updated" }
    ]
  },
  calendar_events: {
    description: "Google Calendar scheduled meetings and ship routines",
    columns: [
      { name: "id", type: "integer", desc: "Event ID" },
      { name: "title", type: "text", desc: "Event title" },
      { name: "start_time", type: "timestamp", desc: "Start date/time ISO string" },
      { name: "end_time", type: "timestamp", desc: "End date/time ISO string" },
      { name: "attendees", type: "text", desc: "Comma separated list of officers attending" },
      { name: "description", type: "text", desc: "Full description of activities" }
    ]
  }
};
