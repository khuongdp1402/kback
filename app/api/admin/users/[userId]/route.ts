import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

const updateSchema = z.object({
  isBlocked: z.boolean().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const { userId } = await params;

  // Prevent an admin from locking themselves out or accidentally demoting themselves.
  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "Không thể tự thay đổi trạng thái/quyền của chính mình" },
      { status: 400 },
    );
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 },
    );
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
    select: { id: true, name: true, email: true, role: true, isBlocked: true },
  });

  return NextResponse.json({ user });
}
