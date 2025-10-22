import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  // Keep server from crashing locally; route can still handle missing key.
  console.warn("OPENAI_API_KEY is not set. OpenAI features will be disabled.");
}

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


