import { formatVnd } from "@/lib/format";
import type { getMembershipStatus } from "@/lib/membership";

const tierStyles: Record<string, string> = {
  MEMBER: "bg-white/10 text-white/80",
  SILVER: "bg-slate-300/25 text-slate-100",
  GOLD: "bg-[#e7b74e]/25 text-[#f5d271]",
};

export function MembershipCard({
  membership,
}: {
  membership: Awaited<ReturnType<typeof getMembershipStatus>>;
}) {
  const progress = membership.next
    ? Math.min(100, Math.round((membership.totalSpend / membership.next.minSpend) * 100))
    : 100;

  return (
    <div
      className="rounded-2xl border border-white/10 p-6 text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)]"
      style={{ background: "var(--dark-gradient)" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">Hạng thành viên</p>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tierStyles[membership.tier]}`}
        >
          {membership.label}
        </span>
      </div>
      <p className="font-display tabular-nums mt-2 text-3xl font-semibold">
        {Math.round(membership.shareRate * 100)}%
        <span className="ml-1.5 font-sans text-sm font-normal text-white/50">
          hoa hồng sàn trả được chuyển cho bạn
        </span>
      </p>

      {membership.next ? (
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-white/50">
            Chi tiêu thêm {formatVnd(membership.amountToNextTier)} để lên hạng{" "}
            {membership.next.label}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-xs text-white/50">Bạn đang ở hạng cao nhất 🎉</p>
      )}
    </div>
  );
}
