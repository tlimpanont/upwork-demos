import { execute, parse, type DocumentNode } from "graphql";
import { schema } from "./schema";
import { createContext } from "./context";

// Server-only direct executor: skips the HTTP round-trip that
// /api/graphql uses, so dashboard renders pull data straight from the
// schema with the same resolvers and context the wire API uses.
export async function executeGraphQL<T = unknown>(
  source: string | DocumentNode,
  variableValues?: Record<string, unknown>,
): Promise<T> {
  const document = typeof source === "string" ? parse(source) : source;
  const result = await execute({
    schema,
    document,
    contextValue: createContext(),
    variableValues,
  });
  if (result.errors?.length) {
    throw new Error(result.errors.map((e) => e.message).join("; "));
  }
  return result.data as T;
}
