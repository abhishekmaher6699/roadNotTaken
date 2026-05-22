import { useState } from "react";

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  isSubmitting: boolean;
  placeholder?: string;
}

export function CommentForm({
  onSubmit,
  isSubmitting,
  placeholder = "Share your thoughts...",
}: CommentFormProps) {
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    const contentToSubmit = content.trim();
    setContent("");

    try {
      await onSubmit(contentToSubmit);
    } catch {
      setContent(contentToSubmit);
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 transition focus-within:border-neutral-300 focus-within:bg-white focus-within:shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm leading-6 text-neutral-800 shadow-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400"
        />

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-neutral-400">
            {content.trim().length}
          </span>
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
