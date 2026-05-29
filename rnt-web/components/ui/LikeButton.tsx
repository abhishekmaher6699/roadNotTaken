"use client";

interface LikeButtonProps {
  liked: boolean;
  count: number;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  label?: string;
  className?: string;
  showLabel?: boolean;
}

export function LikeButton({
  liked,
  count,
  onClick,
  disabled = false,
  label = "Like",
  className = "",
  showLabel = true,
}: LikeButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={`${liked ? "Unlike" : "Like"} this ${label.toLowerCase()}`}
      disabled={disabled}
      onClick={() => {
        void onClick();
      }}
      className={[
        "inline-flex min-h-11 items-center gap-2.5 rounded-full border px-3.5 py-2 text-sm font-medium shadow-sm transition",
        liked
          ? "border-rose-200 bg-linear-to-r from-rose-50 to-pink-50 text-rose-700"
          : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50",
        disabled ? "cursor-not-allowed opacity-60" : "hover:-translate-y-px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500",
        className,
      ].join(" ")}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M12 20.5 4.8 13.8a4.9 4.9 0 0 1 0-7 4.8 4.8 0 0 1 6.8 0L12 7.2l.4-.4a4.8 4.8 0 0 1 6.8 0 4.9 4.9 0 0 1 0 7Z" />
      </svg>
      {showLabel && <span>{liked ? "Liked" : label}</span>}
      <span className="rounded-full bg-neutral-900/8 px-2 py-0.5 text-xs font-semibold text-current">
        {count}
      </span>
    </button>
  );
}
