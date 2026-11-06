import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}
    >
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#f5d271] via-[#d4a537] to-[#8a6a1c] shadow-sm">
        <svg
          viewBox="0 0 24 24"
          className="h-4.5 w-4.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
          aria-hidden="true"
        >
          <path
            d="M6 3v18M6 12l8-9M6 12l8 9"
            fill="none"
            stroke="#3a2a05"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {/* Sparkle accents */}
        <svg
          viewBox="0 0 8 8"
          className="absolute -right-1 -top-1 h-2.5 w-2.5 text-white"
          aria-hidden="true"
        >
          <path d="M4 0 L5 3 L8 4 L5 5 L4 8 L3 5 L0 4 L3 3 Z" fill="currentColor" opacity="0.95" />
        </svg>
        <svg
          viewBox="0 0 8 8"
          className="absolute -bottom-0.5 -left-1 h-1.5 w-1.5 text-white"
          aria-hidden="true"
        >
          <path d="M4 0 L5 3 L8 4 L5 5 L4 8 L3 5 L0 4 L3 3 Z" fill="currentColor" opacity="0.8" />
        </svg>
      </span>
      <span className="text-lg text-foreground">
        K<span className="text-brand">Back</span>
      </span>
    </Link>
  );
}
