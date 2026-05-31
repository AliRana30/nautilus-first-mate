import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
  try {
    // Check if the environment variables are loaded and differ from dummy mock keys
    const isMock = (key: string) => {
      return !key || key.startsWith("gsk_mock_") || key.includes("mock-");
    };

    return NextResponse.json({
      status: "online",
      engine: "Coral SQL reasoning engine",
      integrations: {
        groq: {
          configured: !!env.GROQ_API_KEY && !isMock(env.GROQ_API_KEY),
          name: "Groq Reasoning Engine Llama-3",
        },
        github: {
          configured: !!env.GITHUB_TOKEN && env.GITHUB_TOKEN !== "ghp_mock_github_token_for_nautilus",
          name: "GitHub Octocat API",
        },
        notion: {
          configured: !!env.NOTION_API_KEY && env.NOTION_API_KEY !== "secret_mock_notion_api_key_for_nautilus",
          name: "Notion Wiki Ledger",
        },
        slack: {
          configured: !!env.SLACK_TOKEN && env.SLACK_TOKEN !== "xoxb-mock-slack-token-for-nautilus",
          name: "Slack Crew Shortwave",
        },
        calendar: {
          configured: !!env.GOOGLE_CALENDAR_ACCESS_TOKEN && env.GOOGLE_CALENDAR_ACCESS_TOKEN !== "ya29.mock-google-calendar-access-token",
          name: "Google Calendar Chronometer",
        },
      },
      mcp: {
        enabled: env.ENABLE_MCP,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}
