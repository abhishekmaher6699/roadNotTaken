"use client";

export default function MapError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f3ea] px-6 text-[#20201d]">
      <div className="w-full max-w-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8b5e34]">
          Map Error
        </p>
        <h1 className="mt-2 text-2xl font-bold">The map failed to load</h1>
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-md bg-[#20201d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3a3934]"
        >
          Reload map
        </button>
      </div>
    </main>
  );
}
