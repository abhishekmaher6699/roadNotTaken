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
    <div className="rounded-2xl border border-neutral-200/70 bg-neutral-50/60 backdrop-blur-sm p-4 focus-within:ring-2 focus-within:ring-blue-500/30 transition">
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full resize-none rounded-xl border border-transparent bg-white px-4 py-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-sm"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-blue-600 active:scale-[0.98] disabled:bg-neutral-300 transition-all"
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
          </button>
        </div>
      </form>
    </div>
  );
}