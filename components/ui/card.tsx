import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface shadow-[0_1px_3px_rgba(30,20,10,0.04)] ${className}`}
      {...props}
    />
  );
}

/**
 * A premium "vault card" surface for money figures — gold foil gradient with a subtle sheen,
 * used for the wallet balance and other high-emphasis monetary stats. Text on it should be
 * white/cream, never the default foreground token (the gradient overrides both themes).
 */
export function GoldCard({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[#8a611c]/40 shadow-[0_8px_24px_-8px_rgba(138,97,28,0.45)] ${className}`}
      style={{ background: "var(--gold-gradient)" }}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(120% 80% at 15% 0%, rgba(255,255,255,0.35), transparent 55%)",
        }}
      />
      <div className="relative">{props.children}</div>
    </div>
  );
}

export function Badge({
  className = "",
  tone = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClasses = {
    default: "bg-surface-muted text-muted-foreground",
    success: "bg-accent-light text-accent-dark",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    danger: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${toneClasses} ${className}`}
      {...props}
    />
  );
}
