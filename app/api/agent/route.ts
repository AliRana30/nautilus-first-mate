import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runReasoningAgent } from "@/agent/reasoning";

const requestBodySchema = z.object({
  query: z.string().min(1, "Command query must not be empty"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body using Zod
    const validationResult = requestBodySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: validationResult.error.format()
        },
        { status: 400 }
      );
    }

    const { query } = validationResult.data;

    // Execute the Coral-powered agent reasoning loop
    const result = await runReasoningAgent(query);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Agent API route error:", error);
    return NextResponse.json(
      {
        error: "Internal server crash on the bridge",
        message: error.message
      },
      { status: 500 }
    );
  }
}
