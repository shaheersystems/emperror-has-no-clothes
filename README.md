# emperror-has-no-clothes

A lightweight, modular AI coding agent built with **TypeScript** and **Bun**. It
lets an LLM interact with the local filesystem through native, structured tool
calling powered by the [Vercel AI SDK](https://ai-sdk.dev) and Google Gemini.

## Features

- **AI SDK core**: All model and tool-calling operations run through the Vercel
  AI SDK (`streamText`, `tool`, `stepCountIs`), so tool calls are structured and
  validated rather than parsed from free text.
- **Streaming responses**: Assistant text and tool activity stream to the
  terminal as they happen.
- **Agentic loop**: Autonomous multi-step execution with a safety cap
  (`MAX_STEPS`) to prevent runaway tool loops.
- **Filesystem tools**: Built-in reading, listing, and editing of files.
- **Sandboxed by design**: Every tool path is confined to the repo root via a
  shared sandbox.
- **Typed config**: Environment variables are validated with Zod at startup, so
  misconfiguration fails fast with a clear message.

## Project Structure

```text
├── src/
│   ├── config/        # Zod-validated environment configuration (env.ts)
│   ├── ai/            # AI SDK integration
│   │   ├── provider.ts  # Configured Google provider + model factory
│   │   ├── prompts.ts   # System prompt
│   │   └── agent.ts     # CodingAgent: streamText + tools + history
│   ├── tools/         # AI SDK tools + shared sandbox
│   │   ├── index.ts     # Tool registry exposed to the model
│   │   ├── read-file.ts
│   │   ├── list-files.ts
│   │   ├── edit-file.ts
│   │   └── sandbox.ts
│   ├── cli/           # Interactive REPL + rendering (repl.ts)
│   └── app.ts         # Composition root
├── index.ts           # Entry point
└── .env               # Configuration (API keys, settings)
```

The layers depend inward: `cli` → `ai` → `tools`/`config`. The interface layer
never talks to the model directly; it only drives `CodingAgent` and renders the
events it emits.

## Prerequisites

- [Bun](https://bun.sh) installed (v1.2.5 or later).
- A Google Generative AI (Google AI Studio) API key.

## Getting Started

1.  **Install**:
    ```bash
    bun install
    ```

2.  **Configure**: copy `.env.example` to `.env` and fill it in:
    ```bash
    GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
    GOOGLE_MODEL=gemini-2.5-flash   # optional, this is the default
    BASE_URL=                       # optional, for a proxy/gateway
    ```

3.  **Run**:
    ```bash
    bun run dev
    ```

## Adding New Tools

1.  Create a file in `src/tools/` and define the tool with the AI SDK's `tool()`
    helper, using a Zod `inputSchema` and an `execute` function. Use
    `resolveRepoPath` from `sandbox.ts` for any filesystem access.
2.  Register it under a name in the `tools` object in `src/tools/index.ts`.

The model automatically receives the new tool's name, description, and schema on
the next run.
