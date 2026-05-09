import type { NextAuthConfig } from "next-auth";

// Edge-safe NextAuth config: no Node-only modules (mongodb, bcrypt) so it can
// run inside the proxy (middleware). The full credentials provider lives in
// lib/auth.ts.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    authorized: ({ auth, request: { nextUrl } }) => {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;
      const isProtected =
        path.startsWith("/dashboard") || path.startsWith("/projects");
      const isOnAuthPage =
        path === "/login" || path === "/register";
      if (isProtected) return isLoggedIn;
      if (isOnAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    jwt: ({ token, user }) => {
      if (user) token.id = (user as { id?: string }).id;
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
