import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWalletSummary } from "@/lib/wallet";
import { getPayoutProvider } from "@/lib/payout";

const payoutSchema = z.object({
  amount: z.number().positive("Số tiền phải lớn hơn 0"),
  bankName: z.string().min(1, "Vui lòng chọn ngân hàng"),
  bankAccountNumber: z.string().min(4, "Số tài khoản không hợp lệ"),
  bankAccountName: z.string().min(2, "Tên chủ tài khoản không hợp lệ"),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = payoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 },
    );
  }

  const { amount, bankName, bankAccountNumber, bankAccountName } = parsed.data;
  const wallet = await getWalletSummary(session.user.id);

  if (amount > wallet.availableBalance) {
    return NextResponse.json({ error: "Số dư khả dụng không đủ" }, { status: 400 });
  }

  const payoutRequest = await prisma.payoutRequest.create({
    data: {
      userId: session.user.id,
      amount,
      bankName,
      bankAccountNumber,
      bankAccountName,
      status: "PENDING",
    },
  });

  const provider = getPayoutProvider();
  try {
    const result = await provider.createPayout({
      payoutRequestId: payoutRequest.id,
      amount,
      bankInfo: { bankName, accountNumber: bankAccountNumber, accountName: bankAccountName },
    });

    await prisma.payoutRequest.update({
      where: { id: payoutRequest.id },
      data: {
        providerRef: result.providerRef,
        status: result.state === "PAID" ? "PAID" : "APPROVED",
      },
    });
  } catch (error) {
    console.error("Payout provider error", error);
    // Leave the request as PENDING for manual review if the provider call fails.
  }

  return NextResponse.json({ payoutRequest }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const payoutRequests = await prisma.payoutRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ payoutRequests });
}
