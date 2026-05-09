import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;

// mongodb and bcrypt aren't edge-compatible; pin this handler to Node.
export const runtime = "nodejs";
