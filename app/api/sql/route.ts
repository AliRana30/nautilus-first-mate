import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { coralQuery } from "@/lib/coralQuery";

const requestBodySchema = z.object({
  sql: z.string().min(5, "SQL statement must be at least 5 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate direct SQL payload
    const validationResult = requestBodySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid SQL payload", 
          details: validationResult.error.format() 
        },
        { status: 400 }
      );
    }

    const { sql } = validationResult.data;
    
    // Execute query via Coral Query Library
    const startTimeQuery = Date.now();
    const queryRows = coralQuery(sql);
    const duration = Date.now() - startTimeQuery;
    
    const result = {
      data: queryRows,
      isMock: true,
      sqlExecuted: sql,
      executionTimeMs: duration
    };
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("SQL direct console API error:", error);
    return NextResponse.json(
      { 
        error: "Bridge ordnance failure running raw SQL", 
        message: error.message 
      },
      { status: 500 }
    );
  }
}
