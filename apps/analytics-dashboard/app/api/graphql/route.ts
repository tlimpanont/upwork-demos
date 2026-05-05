import { createYoga } from "graphql-yoga";
import { schema } from "@/lib/graphql/schema";
import { createContext } from "@/lib/graphql/context";

const { handleRequest } = createYoga({
  schema,
  context: createContext,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Response },
});

// Thin wrappers so the exported signatures match Next's RouteHandlerConfig
// (request, { params }). Yoga ignores the second arg here because resolver
// context is wired via the `context` option above.
export async function GET(request: Request) {
  return handleRequest(request, {});
}

export async function POST(request: Request) {
  return handleRequest(request, {});
}

export async function OPTIONS(request: Request) {
  return handleRequest(request, {});
}
