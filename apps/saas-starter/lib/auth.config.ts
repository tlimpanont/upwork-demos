import type { NextAuthConfig } from "next-auth";

// Edge-safe NextAuth config: no Node-only modules (pg, bcrypt) so it can run
// inside `middleware.ts`. The full credentials provider is added in lib/auth.ts.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    authorized: ({ auth, request: { nextUrl } }) => {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnAuthPage =
        nextUrl.pathname === "/login" || nextUrl.pathname === "/signup";

      if (isOnDashboard) return isLoggedIn;
      if (isOnAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    jwt: ({ token, user, trigger, session }) => {
      if (user) token.id = (user as { id?: string }).id;
      // Allow server actions to refresh the displayed name via unstable_update
      if (trigger === "update" && session && typeof session === "object") {
        const next = session as { user?: { name?: string | null } };
        if (typeof next.user?.name === "string") token.name = next.user.name;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
