import { useState } from "react";
import type { PublicProfileResponse } from "@/features/profiles";
import { formatDay } from "./utils";

type ProfileTab = "pins" | "comments";

interface ProfileContentProps {
  content: PublicProfileResponse["content"];
  onOpenPin?: (pinId: string) => void;
}

export function ProfileContent({ content, onOpenPin }: ProfileContentProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("pins");

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white">
      <div className="grid grid-cols-2 border-b border-neutral-100 p-1">
        {(["pins", "comments"] as ProfileTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold capitalize transition ${
              activeTab === tab
                ? "bg-neutral-950 text-white"
                : "text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="divide-y divide-neutral-100">
        {activeTab === "pins" &&
          (content.pins.length > 0 ? (
            content.pins.map((pin) => (
              <button
                key={pin.id}
                type="button"
                onClick={() => onOpenPin?.(pin.id)}
                className="block w-full px-4 py-3 text-left transition hover:bg-neutral-50"
              >
                <p className="line-clamp-1 text-sm font-semibold text-neutral-950">
                  {pin.title}
                </p>
                <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">
                  {pin.address || "Unknown place"}
                </p>
                <p className="mt-1 text-[11px] font-medium text-neutral-400">
                  {pin.likes_count.toLocaleString()} likes &mdash;{" "}
                  {formatDay(pin.created_at)}
                </p>
              </button>
            ))
          ) : (
            <p className="p-4 text-sm text-neutral-500">No pins yet.</p>
          ))}

        {activeTab === "comments" &&
          (content.comments.length > 0 ? (
            content.comments.map((comment) => (
              <button
                key={comment.id}
                type="button"
                onClick={() => onOpenPin?.(String(comment.pin_id))}
                className="block w-full px-4 py-3 text-left transition hover:bg-neutral-50"
              >
                <p className="line-clamp-2 text-sm leading-6 text-neutral-800">
                  {comment.content}
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-neutral-500">
                  On {comment.pin_title || "a pin"}
                </p>
                <p className="mt-1 text-[11px] font-medium text-neutral-400">
                  {comment.likes_count.toLocaleString()} likes &mdash;{" "}
                  {formatDay(comment.created_at)}
                </p>
              </button>
            ))
          ) : (
            <p className="p-4 text-sm text-neutral-500">No comments yet.</p>
          ))}
      </div>
    </section>
  );
}
