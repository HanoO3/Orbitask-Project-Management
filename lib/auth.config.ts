import type { NextAuthConfig } from "next-auth";

export default {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.approvalStatus = (user as { approvalStatus?: string }).approvalStatus;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { approvalStatus?: string }).approvalStatus = token.approvalStatus as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;