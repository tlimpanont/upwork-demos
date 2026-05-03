import { streamText, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";
import { buildSystemPromptWithContext } from "@/app/lib/rag";
import type { UIMessage } from "ai";

// Node runtime needed for database access (pgvector)
export const runtime = "nodejs";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const lastUserMessage = messages.findLast((m) => m.role === "user");
  const userQuery = lastUserMessage?.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("") ?? "";

  const systemPrompt = await buildSystemPromptWithContext(userQuery);

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
