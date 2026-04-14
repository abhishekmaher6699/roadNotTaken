"use client";

import type { ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  tone?: "neutral" | "danger";
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isConfirming = false,
  tone = "neutral",
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  const confirmClassName =
    tone === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-neutral-900 text-white hover:bg-neutral-800";

  return (
    <div className="absolute inset-0 z-2300 flex items-center justify-center bg-neutral-950/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/10">
        <h3 className="text-lg font-semibold text-neutral-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>

        {children && <div className="mt-4">{children}</div>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isConfirming}
            onClick={onConfirm}
            className={`rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${confirmClassName}`}
          >
            {isConfirming ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
