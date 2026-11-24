import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const GOOGLE_CLIENT_ID = (
  process.env.AUTH_GOOGLE_ID ||
  process.env.GOOGLE_CLIENT_ID ||
  ""
).trim();
const GOOGLE_CLIENT_SECRET = (
  process.env.AUTH_GOOGLE_SECRET ||
  process.env.GOOGLE_CLIENT_SECRET ||
  ""
).trim();

export function isGoogleAuthConfigured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

const TOKEN_REVALIDATE_INTERVAL_MS = 5 * 60 * 1000;

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    ...(isGoogleAuthConfigured()
      ? [
          Google({
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const rawEmail = credentials?.email;
        const password = credentials?.password;
        if (typeof rawEmail !== "string" || typeof password !== "string") return null;

        const email = rawEmail.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;
        if (user.isBlocked) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email?.trim().toLowerCase();
        if (!email) return false;
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          if (existing.isBlocked) return false;
          if (!existing.name && user.name) {
            await prisma.user.update({
              where: { id: existing.id },
              data: { name: user.name },
            });
          }
        } else {
          await prisma.user.create({
            data: {
              email,
              name: user.name || "Người dùng Google",
              role: "USER",
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      const now = Date.now();
      if (user?.email) {
        const email = user.email.trim().toLowerCase();
        const dbUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true, role: true, isBlocked: true },
        });
        if (!dbUser || dbUser.isBlocked) return null;
        token.id = dbUser.id;
        token.role = dbUser.role;
        token.checkedAt = now;
        return token;
      }

      const lastChecked = typeof token.checkedAt === "number" ? token.checkedAt : 0;
      if (token.id && now - lastChecked > TOKEN_REVALIDATE_INTERVAL_MS) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: String(token.id) },
            select: { role: true, isBlocked: true },
          });
          if (!dbUser || dbUser.isBlocked) return null;
          token.role = dbUser.role;
          token.checkedAt = now;
        } catch {
          // Keep existing token if DB is transiently unreachable during background recheck.
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.id) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "USER" | "ADMIN") ?? "USER";
      }
      return session;
    },
  },
});
