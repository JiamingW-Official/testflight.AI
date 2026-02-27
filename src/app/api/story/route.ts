import { NextRequest, NextResponse } from "next/server";
import { AI_CONFIG } from "@/lib/ai";
import {
  getStorySystemPrompt,
  buildStoryUserPrompt,
  parseStoryResponse,
  getMockStory,
} from "@/lib/ai/storyPrompts";

interface StoryRequest {
  fromCity: string;
  toCity: string;
  planeNickname: string;
  planeId: string;
  routeId: string;
  dayPhase: string;
  flightNumber: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: StoryRequest = await req.json();
    const { fromCity, toCity, planeNickname, planeId, routeId, dayPhase, flightNumber } = body;

    if (!fromCity || !toCity || !planeNickname) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    let passengerName: string;
    let content: string;
    let choices: Array<{ id: string; text: string; consequence: string }>;

    if (apiKey && apiKey !== "sk-ant-your-key-here") {
      // ── Real Claude API ──
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey });

      const message = await client.messages.create({
        model: AI_CONFIG.model,
        max_tokens: AI_CONFIG.story.maxTokens,
        temperature: AI_CONFIG.story.temperature,
        system: getStorySystemPrompt(),
        messages: [
          {
            role: "user",
            content: buildStoryUserPrompt({
              fromCity,
              toCity,
              planeNickname,
              dayPhase,
              flightNumber,
            }),
          },
        ],
      });

      const textBlock = message.content.find((b) => b.type === "text");
      const rawText = textBlock?.text ?? "";
      const parsed = parseStoryResponse(rawText);

      if (parsed) {
        passengerName = parsed.passengerName;
        content = parsed.content;
        choices = parsed.choices;
      } else {
        // Fallback to mock if parsing fails
        const mock = getMockStory();
        passengerName = mock.passengerName;
        content = mock.content;
        choices = mock.choices;
      }
    } else {
      // ── Mock mode ──
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 600));
      const mock = getMockStory();
      passengerName = mock.passengerName;
      content = mock.content;
      choices = mock.choices;
    }

    const story = {
      id: `story-${planeId}-${Date.now()}`,
      routeId,
      planeId,
      passengerName,
      content,
      choices,
      chosenId: null,
      outcome: null,
      butterflyEffects: [],
      createdAt: Date.now(),
    };

    return NextResponse.json({ story });
  } catch (err) {
    console.error("[SKYLOG] Story generation error:", err);

    const mock = getMockStory();
    const story = {
      id: `story-fallback-${Date.now()}`,
      routeId: "unknown",
      planeId: "unknown",
      passengerName: mock.passengerName,
      content: mock.content,
      choices: mock.choices,
      chosenId: null,
      outcome: null,
      butterflyEffects: [],
      createdAt: Date.now(),
    };

    return NextResponse.json({ story });
  }
}
