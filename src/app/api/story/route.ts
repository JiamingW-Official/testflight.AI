import { NextResponse } from "next/server";

// Step 5: Passenger story generation endpoint
// Will use Claude API with prompts from docs/05-AI-PROMPTS.md

export async function POST() {
  return NextResponse.json(
    { message: "Story API — not yet implemented" },
    { status: 501 }
  );
}
