import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;

// pg is not available in the edge runtime; pin this handler to Node.
export const runtime = "nodejs";
