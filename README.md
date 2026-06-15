# emperror-has-no-clothes

A lightweight, modular AI agent framework built with **TypeScript** and **Bun**. It enables an LLM (specifically OpenAI models) to interact with the local filesystem through a secure, extensible tool-calling protocol.

## Features

- **Agentic Loop**: Autonomous iterative execution with a safety cap (`MAX_TOOL_STEPS`) to prevent infinite recursion.
- **Strict Tool Protocol**: Uses a custom `tool: NAME({...args})` text-based format for reliable parsing without relying on proprietary tool-calling features if preferred.
- **Filesystem Tools**: Built-in support for reading, listing, and editing files.
- **Sandboxed by Design**: Organized to support path restriction (via `path_sandbox.ts`).
- **Optimized for Bun**: Fast startup and efficient execution using the Bun runtime.

## Project Structure

```text
├── src/
│   ├── agent/         # Main execution loop (run_loop.ts)
│   ├── llm/           # OpenAI client integration
│   ├── protocol/      # Tool invocation parsing logic
│   ├── tools/         # Individual tool implementations & registry
│   └── index.ts       # Main entry point
├── index.ts           # Root entry point
└── .env               # Configuration (API keys, settings)
```

## Prerequisites

- [Bun](https://bun.sh) installed (v1.2.5 or later).
- An OpenAI API Key.

## Getting Started

1.  **Clone and Install**:
    ```bash
    bun install
    ```

2.  **Environment Setup**:  
    Create a `.env` file in the root:
    ```bash
    OPENAI_API_KEY=your_key_here
    OPENAI_MODEL=gpt-4.1-mini # Optional: Default is gpt-4.1-mini
    BASE_URL=                 # Optional: For proxying or alternative endpoints
    ```

3.  **Run the Agent**:
    ```bash
    bun run index.ts
    ```

## Tooling Protocol

The assistant uses a unique line-based format to trigger actions:

`tool: read_file({"filename":"example.ts"})`

The loop automatically catches these lines, executes the respective tool in `src/tools/`, and feeds the `tool_result(...)` back into the conversation for the next iteration.

## Development

### Adding New Tools
1.  Create a new file in `src/tools/` defining your tool logic (`ToolDefinition`).
2.  Export it and add it to `TOOL_REGISTRY` in `src/tools/registry.ts`.
3.  The next agent run will automatically include its description in the system prompt.
