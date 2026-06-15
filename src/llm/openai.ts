import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

// The client is stateless across calls, so build it once and reuse it.
let cachedClient: OpenAI | undefined;

function getClient(): OpenAI {
  if (!cachedClient) {
    const apiKey = requireEnv("OPENAI_API_KEY");
    // BASE_URL is optional: omit it to target the default OpenAI endpoint.
    const baseURL = process.env.BASE_URL || undefined;
    cachedClient = new OpenAI({ apiKey, baseURL });
  }
  return cachedClient;
}

export async function callOpenAI(conversation: ChatMessage[]): Promise<string> {
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  const messages: ChatCompletionMessageParam[] = conversation.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const resp = await getClient().chat.completions.create({ model, messages });

  return resp.choices[0]?.message?.content ?? "";
}

