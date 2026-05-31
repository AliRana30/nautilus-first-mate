import { z } from "zod";

const envSchema = z.object({
  GITHUB_TOKEN: z.string().optional().default(""),
  NOTION_API_KEY: z.string().optional().default(""),
  SLACK_TOKEN: z.string().optional().default(""),
  GOOGLE_CALENDAR_ACCESS_TOKEN: z.string().optional().default(""),
  GROQ_API_KEY: z.string().optional().default(""),
  ENABLE_MCP: z
    .string()
    .transform((val) => val === "true")
    .optional()
    .default("false"),
});

// Perform validation
let env: z.infer<typeof envSchema>;

if (typeof window === "undefined") {
  // Server-side validation
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.format());
    
    // Provide a descriptive message instead of throwing an uncatchable error that crashes build
    // but still enforces requirements.
    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid environment variables. Please check your .env.local file.");
    }
    
    // In development, we fall back to placeholders to prevent compile crashes, but warn the developer
    env = {
      GITHUB_TOKEN: process.env.GITHUB_TOKEN || "mock-github-token",
      NOTION_API_KEY: process.env.NOTION_API_KEY || "mock-notion-key",
      SLACK_TOKEN: process.env.SLACK_TOKEN || "mock-slack-token",
      GOOGLE_CALENDAR_ACCESS_TOKEN: process.env.GOOGLE_CALENDAR_ACCESS_TOKEN || "mock-calendar-token",
      GROQ_API_KEY: process.env.GROQ_API_KEY || "mock-groq-key-replace-me",
      ENABLE_MCP: false,
    };
  } else {
    env = parsed.data;
  }
} else {
  // Client-side dummy object to avoid client build crashes, secrets are not exposed to the browser
  env = {
    GITHUB_TOKEN: "",
    NOTION_API_KEY: "",
    SLACK_TOKEN: "",
    GOOGLE_CALENDAR_ACCESS_TOKEN: "",
    GROQ_API_KEY: "",
    ENABLE_MCP: false,
  };
}

export { env };
