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
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-2 transition focus-within:border-neutral-300 focus-within:bg-white">
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={2}
          maxLength={1000}
          className="max-h-32 min-h-14 w-full resize-y rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm leading-6 text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-neutral-200 focus:bg-white"
        />

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-neutral-400">
            {content.trim().length}/1000
          </span>
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="rounded-full bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
