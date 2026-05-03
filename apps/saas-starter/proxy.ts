import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  // Run only on routes we care about. Everything else passes through unchanged.
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
