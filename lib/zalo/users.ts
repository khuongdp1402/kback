import { prisma } from "@/lib/prisma";
import type { ZaloProfile } from "./verify-access-token";

/**
 * Finds or creates the KBack account for a verified Zalo profile. Zalo-only accounts have no
 * password (passwordHash null → web credentials login is impossible) and a placeholder email on
 * the reserved `.invalid` TLD, because User.email is required and unique. It is never emailed.
 *
 * TODO (next step): let an existing web user link their Zalo account (like /telegram does) so
 * one person doesn't end up with two wallets.
 */
export async function findOrCreateZaloUser(profile: ZaloProfile) {
  const existing = await prisma.user.findUnique({ where: { zaloUserId: profile.id } });
  if (existing) {
    if (profile.avatarUrl && existing.avatarUrl !== profile.avatarUrl) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { avatarUrl: profile.avatarUrl },
      });
    }
    return existing;
  }

  return prisma.user.create({
    data: {
      email: zaloPlaceholderEmail(profile.id),
      name: profile.name,
      zaloUserId: profile.id,
      avatarUrl: profile.avatarUrl,
    },
  });
}

export function zaloPlaceholderEmail(zaloUserId: string) {
  return `zalo-${zaloUserId}@zalo.kback.invalid`;
}

export function isZaloPlaceholderEmail(email: string) {
  return email.endsWith("@zalo.kback.invalid");
}
