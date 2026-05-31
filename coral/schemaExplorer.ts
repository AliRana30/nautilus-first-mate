import fs from "fs";
import path from "path";
import { executeCoralQuery } from "./cli";
import { executeMockQuery } from "./mockDb";

export interface ColumnMetadata {
  name: string;
  type: string;
  isPrimaryKey: boolean;
}

export interface TableMetadata {
  name: string;
  description: string;
  columns: ColumnMetadata[];
}

export interface SchemaCache {
  version: string;
  timestamp: string;
  tables: Record<string, TableMetadata>;
  relationships: {
    fromTable: string;
    fromColumn: string;
    toTable: string;
    toColumn: string;
    type: string;
  }[];
}

const CACHE_PATH = path.join(process.cwd(), "coral", "schemas", "schema_cache.json");

export function loadSchemaCache(): SchemaCache | null {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const cacheContent = fs.readFileSync(CACHE_PATH, "utf-8");
      const parsed = JSON.parse(cacheContent);
      
      // Self-healing: If cache exists but has no tables configured, treat as cache miss
      if (!parsed.tables || Object.keys(parsed.tables).length === 0) {
        console.log("[Schema Explorer]: Cached schema is empty or stale. Forcing rebuild...");
        return null;
      }
      
      console.log("[Schema Explorer]: Loaded active schema catalog from local cache file.");
      return parsed as SchemaCache;
    }
  } catch (error) {
    console.warn("[Schema Explorer]: Failed to load schema cache:", error);
  }
  return null;
}

/**
 * Saves a compiled schema to the local cache file.
 */
export function cacheSchema(schema: SchemaCache): void {
  try {
    const dir = path.dirname(CACHE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CACHE_PATH, JSON.stringify(schema, null, 2));
    console.log(`[Schema Explorer]: Saved updated schema catalog to cache path: ${CACHE_PATH}`);
  } catch (error) {
    console.error("[Schema Explorer]: Failed to cache schema:", error);
  }
}

/**
 * Runs a live database introspection query to fetch tables and column catalogs,
 * compiles metadata, and discovers table relationships.
 */
export async function introspectSchema(): Promise<SchemaCache> {
  console.log("[Schema Explorer]: Running live schema introspection queries...");
  
  let tablesRaw: any[] = [];
  let columnsRaw: any[] = [];

  // Query tables catalog
  try {
    const res = await executeCoralQuery("SELECT * FROM coral.tables");
    tablesRaw = res.data || [];
  } catch (err) {
    console.warn("[Schema Explorer]: CLI tables query failed, falling back to mock catalog.");
    tablesRaw = executeMockQuery("SELECT * FROM coral.tables");
  }

  // Query columns catalog
  try {
    const res = await executeCoralQuery("SELECT * FROM coral.columns");
    columnsRaw = res.data || [];
  } catch (err) {
    console.warn("[Schema Explorer]: CLI columns query failed, falling back to mock catalog.");
    columnsRaw = executeMockQuery("SELECT * FROM coral.columns");
  }

  // Compile metadata structure
  const tables: Record<string, TableMetadata> = {};
  
  for (const t of tablesRaw) {
    if (t.table_name) {
      tables[t.table_name] = {
        name: t.table_name,
        description: t.description || "",
        columns: []
      };
    }
  }

  // Bind columns to tables
  for (const col of columnsRaw) {
    const tbl = tables[col.table_name];
    if (tbl) {
      tbl.columns.push({
        name: col.column_name,
        type: col.data_type || "TEXT",
        isPrimaryKey: col.is_primary_key === 1 || col.is_primary_key === true
      });
    }
  }

  // Discover potential database relationships
  const relationships: SchemaCache["relationships"] = [];
  const tableNames = Object.keys(tables);

  for (let i = 0; i < tableNames.length; i++) {
    for (let j = i + 1; j < tableNames.length; j++) {
      const t1 = tables[tableNames[i]];
      const t2 = tables[tableNames[j]];

      for (const col1 of t1.columns) {
        for (const col2 of t2.columns) {
          // Relationship check 1: Actor references (e.g., assignee and sender)
          if (
            (col1.name === "assignee" && col2.name === "sender") ||
            (col1.name === "sender" && col2.name === "assignee")
          ) {
            relationships.push({
              fromTable: t1.name,
              fromColumn: col1.name,
              toTable: t2.name,
              toColumn: col2.name,
              type: "actor-link"
            });
          }
          // Relationship check 2: Shared telemetry columns (e.g., status, repo, start_time)
          if (col1.name !== "id" && col1.name === col2.name) {
            relationships.push({
              fromTable: t1.name,
              fromColumn: col1.name,
              toTable: t2.name,
              toColumn: col2.name,
              type: "shared-key"
            });
          }
        }
      }
    }
  }

  const compiledSchema: SchemaCache = {
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    tables,
    relationships
  };

  return compiledSchema;
}

/**
 * Combined high-level getter: Reads local cache first; if missing or stale,
 * executes live introspection and caches the resulting schema automatically.
 */
export async function getDynamicSchema(): Promise<SchemaCache> {
  const cached = loadSchemaCache();
  if (cached) {
    return cached;
  }
  
  // Cache miss: Introspect, save to disk, and return
  const introspected = await introspectSchema();
  cacheSchema(introspected);
  return introspected;
}
