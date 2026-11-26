import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPayoutProvider } from "@/lib/payout";
import { checkRateLimit } from "@/lib/rate-limit";

export const MIN_PAYOUT_AMOUNT = Number(process.env.MIN_PAYOUT_AMOUNT ?? "10000") || 10000;

export const payoutSchema = z.object({
  amount: z
    .number()
    .finite()
    .min(MIN_PAYOUT_AMOUNT, `Số tiền rút tối thiểu là ${MIN_PAYOUT_AMOUNT.toLocaleString("vi-VN")}₫`),
  bankName: z.string().trim().min(1, "Vui lòng chọn ngân hàng").max(80),
  bankAccountNumber: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{4,32}$/, "Số tài khoản không hợp lệ"),
  bankAccountName: z.string().trim().min(2, "Tên chủ tài khoản không hợp lệ").max(100),
});

class InsufficientBalanceError extends Error {
  constructor() {
    super("Số dư khả dụng không đủ");
    this.name = "InsufficientBalanceError";
  }
}

export type RequestPayoutResult =
  | { ok: true; payoutRequest: Awaited<ReturnType<typeof prisma.payoutRequest.create>> }
  | { ok: false; status: number; error: string; retryAfterSec?: number };

/**
 * Shared payout flow for every client (web wallet, Zalo Mini App): rate limit, validate, lock
 * the user row and check the derived balance atomically, then hand off to the payout provider.
 */
export async function requestPayout(userId: string, rawBody: unknown): Promise<RequestPayoutResult> {
  const limit = checkRateLimit(`payout:${userId}`, 5, 5 * 60 * 1000);
  if (!limit.allowed) {
    return {
      ok: false,
      status: 429,
      error: "Bạn gửi quá nhiều yêu cầu rút tiền. Vui lòng thử lại sau ít phút.",
      retryAfterSec: limit.retryAfterSec,
    };
  }

  const parsed = payoutSchema.safeParse(rawBody);
  if (!parsed.success) {
    return { ok: false, status: 400, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const { amount, bankName, bankAccountNumber, bankAccountName } = parsed.data;

  let payoutRequest;
  try {
    // Lock the user row inside a single DB transaction so concurrent payout requests cannot
    // race past the balance check and double-spend the same cashback balance.
    payoutRequest = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;

      const [confirmed, payouts] = await Promise.all([
        tx.transaction.aggregate({
          where: { userId, status: "CONFIRMED" },
          _sum: { cashbackAmount: true },
        }),
        tx.payoutRequest.aggregate({
          where: { userId, status: { in: ["PENDING", "APPROVED", "PAID"] } },
          _sum: { amount: true },
        }),
      ]);

      const availableBalance = Math.max(
        0,
        (confirmed._sum.cashbackAmount ?? 0) - (payouts._sum.amount ?? 0),
      );

      if (amount > availableBalance) {
        throw new InsufficientBalanceError();
      }

      return tx.payoutRequest.create({
        data: {
          userId,
          amount,
          bankName,
          bankAccountNumber,
          bankAccountName,
          status: "PENDING",
        },
      });
    });
  } catch (error) {
    if (error instanceof InsufficientBalanceError) {
      return { ok: false, status: 400, error: error.message };
    }
    throw error;
  }

  const provider = getPayoutProvider();
  try {
    const result = await provider.createPayout({
      payoutRequestId: payoutRequest.id,
      amount,
      bankInfo: { bankName, accountNumber: bankAccountNumber, accountName: bankAccountName },
    });

    payoutRequest = await prisma.payoutRequest.update({
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

  return { ok: true, payoutRequest };
}
