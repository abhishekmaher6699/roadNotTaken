"use client";

export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#f7f3ea] px-6 py-10 text-[#20201d]">
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8b5e34]">
            Error
          </p>
          <h1 className="mt-2 text-3xl font-bold">Something went wrong</h1>
        </div>
        <button
          type="button"
          onClick={reset}
          className="w-fit rounded-md bg-[#20201d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3a3934]"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
