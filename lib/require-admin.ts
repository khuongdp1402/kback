import { auth } from "@/lib/auth";

/**
 * Resolves the current session and asserts the user is an admin. Returns the session on
 * success, or null if the caller should treat the request as unauthorized/forbidden — callers
 * decide how to respond (redirect for pages, 403 JSON for API routes).
 */
export async function requireAdminSession() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}
