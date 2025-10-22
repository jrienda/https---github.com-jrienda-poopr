import { NextRequest, NextResponse } from "next/server";
import { openai } from "../../../lib/openai";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body as { messages: Array<{ role: "system" | "user" | "assistant"; content: string }>; };

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages ?? [{ role: "user", content: "Hello" }],
      temperature: 0.7,
    });

    return NextResponse.json(completion);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}


