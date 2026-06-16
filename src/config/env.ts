import { config as loadDotenv } from "dotenv";
import { z } from "zod";

// Load variables from a local .env file before validating. This is a no-op in
// environments where the variables are already present in process.env.
loadDotenv();

const EnvSchema = z.object({
  GOOGLE_GENERATIVE_AI_API_KEY: z
    .string()
    .min(1, "GOOGLE_GENERATIVE_AI_API_KEY is required"),
  GOOGLE_MODEL: z.string().min(1).default("gemini-2.5-flash"),
  // Optional override for the API endpoint (e.g. a proxy or gateway).
  BASE_URL: z
    .string()
    .url()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

// Validated once at startup and reused everywhere.
export const env: Env = loadEnv();
