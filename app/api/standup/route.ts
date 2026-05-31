import { NextRequest, NextResponse } from "next/server";
import { generateStandupReport } from "@/agent/features/standup";

export async function GET(req: NextRequest) {
  try {
    const report = await generateStandupReport();
    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Standup API route crash:", error);
    return NextResponse.json(
      {
        error: "Bridge ordnance failure generating daily standup report",
        message: error.message
      },
      { status: 500 }
    );
  }
}
