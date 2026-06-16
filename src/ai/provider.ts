import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";
import { env } from "../config/env.ts";

// A single configured provider instance. `baseURL` is left undefined to target
// the default Google Generative AI endpoint, or set to point at a proxy/gateway.
const provider = createGoogleGenerativeAI({
  apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
  baseURL: env.BASE_URL,
});

/**
 * Returns the language model the agent should use, resolved from configuration.
 * Centralizing this keeps model selection out of the agent and tool layers, so
 * swapping models or providers is a one-line change here.
 */
export function getModel(): LanguageModel {
  return provider(env.GOOGLE_MODEL);
}
