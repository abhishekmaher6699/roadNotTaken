import Link from "next/link";
import { getServerAuthUser } from "@/lib/server-auth";
import { isProfileComplete } from "@/lib/profile-completion";
import { getServerProfile } from "@/lib/server-profile";

export default async function Home() {
  const user = await getServerAuthUser();
  const profile = user ? await getServerProfile() : null;
  const profileComplete = isProfileComplete(profile);
  const primaryHref = user ? (profileComplete ? "/map" : "/profile/setup") : "/signup";
  const primaryLabel = user ? "Open map" : "Start mapping";
  const secondaryHref = user
    ? (profileComplete ? "/map" : "/profile/setup")
    : "/signup";
  const secondaryLabel = user
    ? (profileComplete ? "Go to map" : "Create profile")
    : "Create profile";

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[#101411]">
          <div className="absolute inset-0 opacity-75 [background-image:linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
          <div className="absolute left-[8%] top-[18%] h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_0_10px_rgba(251,113,133,0.18)]" />
          <div className="absolute left-[28%] top-[62%] h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_0_12px_rgba(252,211,77,0.16)]" />
          <div className="absolute right-[18%] top-[31%] h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_0_10px_rgba(125,211,252,0.16)]" />
          <div className="absolute right-[34%] bottom-[18%] h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_0_12px_rgba(110,231,183,0.16)]" />
          <div className="absolute left-[-10%] top-[52%] h-px w-[130%] rotate-[-12deg] bg-white/18" />
          <div className="absolute left-[-18%] top-[36%] h-px w-[140%] rotate-[18deg] bg-white/12" />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-neutral-950" />
        </div>

        <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="text-base font-semibold tracking-wide">
            Road Not Taken
          </Link>
          <nav className="flex items-center gap-2">
            {!user && (
              <Link
                href="/login"
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
              >
                Login
              </Link>
            )}
            <Link
              href={primaryHref}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
            >
              {primaryLabel}
            </Link>
          </nav>
        </header>

        <div className="relative z-10 flex min-h-[calc(100vh-84px)] items-center px-5 pb-20 pt-8 sm:px-8">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-200">
              Community map for places with a story
            </p>
            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.02] tracking-normal text-white sm:text-7xl">
              Road Not Taken
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/72">
              Find unusual places, save pins with context, and follow the people
              uncovering the corners most maps ignore.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={primaryHref}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
              >
                {primaryLabel}
              </Link>
              <Link
                href={secondaryHref}
                className="rounded-full border border-white/24 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/50"
              >
                {secondaryLabel}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-neutral-950 px-5 pb-16 sm:px-8">
        <div className="grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ["Pins", "Save hidden locations with photos, status, and notes."],
            ["Profiles", "Build a public identity around what you discover."],
            ["Search", "Find places and people from one map-first search."],
          ].map(([title, copy]) => (
            <div key={title} className="border-t border-white/14 pt-5">
              <h2 className="text-base font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">{copy}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
