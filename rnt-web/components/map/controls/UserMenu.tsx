"use client";

import { useEffect, useRef, useState } from "react";
import type { UserMenuProps } from "./types";

export function UserMenu({ initial, email, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div ref={menuRef} className="relative z-[2200]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white shadow-lg ring-2 ring-white transition hover:scale-[1.02] active:scale-95"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-black/10">
          <div className="rounded-xl px-3 py-2">
            <p className="text-sm font-semibold text-neutral-900">Profile</p>
            <p className="truncate text-xs text-neutral-500">
              {email ?? "Signed in"}
            </p>
          </div>

          <button
            type="button"
            className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-neutral-700 transition hover:bg-neutral-100"
            onClick={() => setOpen(false)}
          >
            Profile
          </button>

          <button
            type="button"
            className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
            onClick={() => {
              setOpen(false);
              void onLogout();
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
