import { NextRequest, NextResponse } from "next/server";
import { AI_CONFIG } from "@/lib/ai";
import {
  buildDiarySystemPrompt,
  buildDiaryUserPrompt,
  getMockDiary,
  randomWeather,
  deriveDiaryMood,
} from "@/lib/ai/prompts";
import type { PlanePersonality, Diary } from "@/types";

interface DiaryRequest {
  planeId: string;
  nickname: string;
  personality: PlanePersonality;
  mood: number;
  bond: number;
  level: number;
  totalFlights: number;
  routeFrom?: string;
  routeTo?: string;
  dayPhase: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: DiaryRequest = await req.json();
    const {
      planeId, nickname, personality, mood, bond,
      level, totalFlights, routeFrom, routeTo, dayPhase,
    } = body;

    if (!planeId || !nickname || !personality) {
      return NextResponse.json(
        { error: "Missing required fields: planeId, nickname, personality" },
        { status: 400 },
      );
    }

    const weather = randomWeather();
    let content: string;

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey && apiKey !== "sk-ant-your-key-here") {
      // ── Real Claude API ──
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey });

      const message = await client.messages.create({
        model: AI_CONFIG.diary.maxTokens > 300 ? AI_CONFIG.model : AI_CONFIG.model,
        max_tokens: AI_CONFIG.diary.maxTokens,
        temperature: AI_CONFIG.diary.temperature,
        system: buildDiarySystemPrompt(personality),
        messages: [
          {
            role: "user",
            content: buildDiaryUserPrompt({
              nickname,
              personality,
              mood,
              bond,
              routeFrom,
              routeTo,
              totalFlights,
              weather,
              dayPhase,
              level,
            }),
          },
        ],
      });

      const textBlock = message.content.find((b) => b.type === "text");
      content = textBlock ? textBlock.text : getMockDiary(personality);
    } else {
      // ── Mock mode (no API key) ──
      // Add slight delay to simulate API call
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
      content = getMockDiary(personality);
    }

    const diary: Diary = {
      id: `diary-${planeId}-${Date.now()}`,
      planeId,
      content,
      mood: deriveDiaryMood(mood),
      weather,
      routeId: routeFrom && routeTo ? `${routeFrom}-${routeTo}` : null,
      createdAt: Date.now(),
    };

    return NextResponse.json({ diary });
  } catch (err) {
    console.error("[SKYLOG] Diary generation error:", err);

    // Fallback to mock on any error
    const body = await req.json().catch(() => ({}));
    const personality: PlanePersonality = body.personality ?? "dreamer";
    const diary: Diary = {
      id: `diary-fallback-${Date.now()}`,
      planeId: body.planeId ?? "unknown",
      content: getMockDiary(personality),
      mood: "peaceful",
      weather: randomWeather(),
      routeId: null,
      createdAt: Date.now(),
    };

    return NextResponse.json({ diary });
  }
}
