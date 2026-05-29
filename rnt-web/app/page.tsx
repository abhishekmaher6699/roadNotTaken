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
    : "/login";
  const secondaryLabel = user
    ? (profileComplete ? "Go to map" : "Create profile")
    : "Sign in to account";

  return (
    <main className="min-h-screen bg-[#faf6ee] text-[#432e18] relative overflow-hidden selection:bg-[#dda15e]/30 selection:text-[#432e18]">
      {/* Decorative Scrapbook Elements (Background Doodles) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Subtle grid lines like drafting paper */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(#432e18_1px,transparent_1px),linear-gradient(90deg,#432e18_1px,transparent_1px)] [background-size:40px_40px]" />
        
        {/* Sketched leaves floating around */}
        <div className="absolute top-[12%] left-[6%] animate-sway opacity-30 text-[#606c38]">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 12m0-9c4.97 0 9 4.03 9 9 0 2.12-.74 4.07-1.97 5.61L12 12" />
          </svg>
        </div>
        <div className="absolute bottom-[20%] right-[8%] animate-sway-delayed opacity-30 text-[#dda15e]">
          <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12a6 6 0 0111.7-1.8A7 7 0 0021 12M3 12a9 9 0 0117.4-2.7" />
          </svg>
        </div>
      </div>

      {/* Cozy Header */}
      <header className="sticky top-0 z-50 bg-[#faf6ee]/90 backdrop-blur-sm border-b-2 border-[#432e18] transition-all">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 group font-display font-extrabold text-xl tracking-tight text-[#432e18]">
            {/* Custom sketched map icon */}
            <svg className="w-6 h-6 text-[#606c38] transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="font-black">Road Not Taken</span>
          </Link>
          
          <nav className="flex items-center gap-4">
            {!user && (
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm font-bold text-[#432e18]/80 hover:text-[#432e18] transition-colors"
              >
                Login
              </Link>
            )}
            <Link
              href={primaryHref}
              className="relative inline-flex items-center justify-center rounded-full bg-[#606c38] text-white px-5 py-2 text-sm font-bold sketch-border sketch-shadow-sm sketch-btn-transition"
            >
              {primaryLabel}
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-24 lg:pt-20 lg:pb-32">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          
          {/* Left Content */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            {/* Cottagecore organic badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-dashed border-[#dda15e] bg-[#dda15e]/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#9d6c2d] w-fit mb-6 animate-sway">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              Hand-illustrated explorer logs
            </div>
            
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-[#432e18] sm:text-6xl lg:text-7xl font-display">
              Discover cozy spots, off the{" "}
              <span className="text-[#606c38] relative inline-block">
                beaten path.
                {/* Hand drawn scribble line under title */}
                <svg className="absolute left-0 bottom-[-8px] w-full h-3 text-[#dda15e]" viewBox="0 0 200 10" fill="none" preserveAspectRatio="none">
                  <path d="M2 8 C 50 2, 100 2, 198 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            
            <p className="mt-8 text-base sm:text-lg leading-relaxed text-[#432e18]/80 max-w-xl font-medium">
              We swap glowing grids and digital interfaces for coordinates with stories. Keep record of hidden groves, abandoned mills, quiet campfires, and old libraries you find along the way.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href={primaryHref}
                className="group relative flex items-center justify-center gap-2 rounded-full bg-[#d97d64] px-6 py-3.5 text-sm font-bold text-[#faf6ee] sketch-border sketch-shadow sketch-btn-transition hover:bg-[#c96c53]"
              >
                {primaryLabel}
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link
                href={secondaryHref}
                className="flex items-center justify-center rounded-full border-2 border-[#432e18] border-dashed bg-transparent px-6 py-3.5 text-sm font-bold text-[#432e18] hover:bg-[#432e18]/5 transition-colors"
              >
                {secondaryLabel}
              </Link>
            </div>
          </div>

          {/* Right Visual: Illustrative 2D Map Journal Mockup */}
          <div className="lg:col-span-6 relative flex justify-center">
            {/* The Journal Container */}
            <div className="relative w-full max-w-lg aspect-square sm:aspect-[4/3] lg:aspect-square bg-[#fcf9f2] sketch-border sketch-shadow-lg rounded-3xl p-5 overflow-hidden animate-sway-delayed">
              
              {/* Journal Grid & Map Compass */}
              <div className="absolute inset-0 bg-[radial-gradient(#432e18_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
              
              {/* Compass Rose Doodle */}
              <div className="absolute top-6 right-6 text-[#dda15e] w-12 h-12 opacity-60">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2v20M2 12h20M7 7l10 10M7 17L17 7" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="5" strokeDasharray="3 3" />
                </svg>
              </div>

              {/* Hand-drawn Map Roads/Paths */}
              <svg className="absolute inset-0 w-full h-full text-[#432e18]/30 pointer-events-none" fill="none">
                {/* Main Path */}
                <path d="M-10 150 Q 120 70, 240 220 T 480 180" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="8 6" />
                <path d="M150 -10 Q 110 180, 310 290 T 520 400" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 8" />
              </svg>

              {/* Doodle SVGs on map */}
              
              {/* Sketched Pine Tree */}
              <div className="absolute left-[20%] top-[45%] text-[#606c38] w-8 h-10">
                <svg viewBox="0 0 24 32" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2 L3 16 H21 L12 2 Z" fill="#606c38" fillOpacity="0.2" />
                  <path d="M12 12 L5 24 H19 L12 12 Z" fill="#606c38" fillOpacity="0.2" />
                  <path d="M12 24v6" />
                </svg>
              </div>

              {/* Sketched Little Cabin/Cottage */}
              <div className="absolute left-[65%] top-[25%] text-[#432e18] w-12 h-12">
                <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2">
                  {/* Roof */}
                  <path d="M4 16 L16 4 L28 16 Z" fill="#d97d64" fillOpacity="0.2" strokeLinecap="round" />
                  {/* Cabin Body */}
                  <path d="M6 16v12h20V16" fill="#faf6ee" fillOpacity="0.6" />
                  {/* Door */}
                  <path d="M13 28v-7h6v7" fill="#606c38" fillOpacity="0.3" />
                  {/* Chimney */}
                  <path d="M22 10V6h3v7" />
                  {/* Little Smoke clouds */}
                  <path d="M23.5 3 C22.5 2, 24.5 1, 24 0" strokeWidth="1.5" />
                </svg>
              </div>

              {/* Cute sketched flower pin */}
              <div className="absolute left-[45%] top-[35%] animate-doodle-bounce">
                <div className="flex flex-col items-center">
                  <svg className="w-8 h-8 text-[#d97d64]" viewBox="0 0 24 24" fill="currentColor" stroke="#432e18" strokeWidth="2">
                    {/* Flower Petals */}
                    <circle cx="12" cy="7" r="4" fill="#d97d64" />
                    <circle cx="7" cy="12" r="4" fill="#d97d64" />
                    <circle cx="17" cy="12" r="4" fill="#d97d64" />
                    <circle cx="12" cy="17" r="4" fill="#d97d64" />
                    <circle cx="12" cy="12" r="3" fill="#e9c46a" />
                    {/* Stem */}
                    <path d="M12 17v5" strokeWidth="2.5" />
                  </svg>
                </div>
              </div>

              {/* Floating Polaroids card component */}
              <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-80 bg-white sketch-border p-3.5 shadow-md rounded-xl flex flex-col gap-2 relative">
                {/* Polaroid scotch tape */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5.5 bg-[#e9c46a]/65 -rotate-2 sketch-border border-dashed flex items-center justify-center text-[8px] font-bold text-[#432e18]/80 select-none">
                  PIN #124
                </div>
                
                {/* Title & Coordinates */}
                <div className="flex items-start justify-between mt-1">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#606c38] bg-[#606c38]/10 px-2 py-0.5 rounded-full">
                      Grove
                    </span>
                    <h3 className="text-sm font-extrabold text-[#432e18] mt-1 font-display">Old Hollow Oak</h3>
                  </div>
                  <span className="text-[10px] text-[#432e18]/60 font-mono">N 45.32, W 122.8</span>
                </div>
                
                {/* Image Box */}
                <div className="aspect-video bg-[#faf6ee] rounded-lg sketch-border overflow-hidden flex items-center justify-center p-2">
                  <svg className="w-12 h-12 text-[#606c38]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 12m0-9c4.97 0 9 4.03 9 9 0 2.12-.74 4.07-1.97 5.61L12 12" />
                  </svg>
                </div>

                <p className="text-[11px] leading-relaxed text-[#432e18]/90 font-medium">
                  "A giant hollow oak tree hidden behind the old farm fence. Perfect place to sit and sketch."
                </p>
                
                {/* Author */}
                <div className="flex items-center justify-between border-t border-[#432e18]/10 pt-2.5 mt-1 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#dda15e]/30 text-[#432e18] font-bold flex items-center justify-center text-[9px] border border-[#432e18]/20">
                      AM
                    </div>
                    <span className="text-[#432e18]/70 font-bold">Arthur M.</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-rose-600 font-bold">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    18
                  </div>
                </div>
              </div>

              {/* Sketched mock search bar */}
              <div className="absolute top-4 left-4 right-4 bg-[#faf6ee] sketch-border rounded-xl p-2.5 flex items-center gap-2 shadow-sm text-xs font-semibold text-[#432e18]/60">
                <svg className="w-4 h-4 text-[#432e18]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search secret valleys, cabins, pathfinders...</span>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* Cozy Features Section */}
      <section className="relative z-10 bg-[#fcf9f2] border-t-2 border-[#432e18] px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-black tracking-tight text-[#432e18] sm:text-4xl font-display">
              Field guides for travel diaries
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#432e18]/80 font-medium">
              We build tools designed to match the warmth of classic paper notebooks. Organize and log your coordinates beautifully.
            </p>
          </div>

          <div className="grid max-w-none grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              [
                "Pins & Chronicles",
                "Log spots with photos, specific directions, and comments. Think of it as a shared scrapbook of the wilderness.",
                <svg className="w-6 h-6 text-[#d97d64]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              ],
              [
                "Explorer Handles",
                "Construct a public logbook of your travels. Follow paths laid out by other explorers and read their logs.",
                <svg className="w-6 h-6 text-[#606c38]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11.5V9M12 11c1.744 0 3.44.204 5.08.599M12 11V9m0 0V7m0 2h3m-3-2V5m0 2H9" />
                </svg>
              ],
              [
                "Rustic Filters",
                "Filter logs by forests, bridges, lookouts, and ancient trails. Explore exactly what suits your day hike.",
                <svg className="w-6 h-6 text-[#dda15e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c1.34 0 2.61.17 3.82.48A9.97 9.97 0 0118.5 12c0 2.45-1.03 4.67-2.68 6.52A9.97 9.97 0 0112 21c-1.34 0-2.61-.17-3.82-.48A9.97 9.97 0 015.5 12c0-2.45 1.03-4.67 2.68-6.52A9.97 9.97 0 0112 3z" />
                </svg>
              ],
            ].map(([title, copy, icon]) => (
              <div
                key={title as string}
                className="group relative bg-[#faf6ee] sketch-border sketch-shadow p-8 rounded-2xl transition-all duration-200 hover:-translate-y-1 hover:sketch-shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-[#faf6ee] sketch-border flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  {icon}
                </div>
                <h3 className="text-lg font-extrabold text-[#432e18] mb-3 font-display">{title as string}</h3>
                <p className="text-sm leading-relaxed text-[#432e18]/80 font-medium">{copy as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cozy Campfire Call to Action */}
      <section className="relative z-10 border-t-2 border-[#432e18] bg-[#faf6ee] px-6 py-20 text-center overflow-hidden">
        <div className="max-w-2xl mx-auto relative z-10">
          {/* Cute campfire SVG */}
          <div className="flex justify-center mb-6 text-[#d97d64] animate-doodle-bounce">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.018 7.377 16.2 9c.18 1.623.514 3.242 1.457 4.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              <path d="M5 21h14" strokeWidth="2.5" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-extrabold tracking-tight text-[#432e18] sm:text-5xl font-display">
            Pull up a log by the fire.
          </h2>
          <p className="mt-4 text-base text-[#432e18]/80 max-w-md mx-auto font-medium">
            Register your notebook handle, pick your avatar handle, and begin charting paths less traveled.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href={primaryHref}
              className="rounded-full bg-[#606c38] text-white px-8 py-3.5 text-sm font-bold sketch-border sketch-shadow sketch-btn-transition hover:bg-[#505a2e]"
            >
              {primaryLabel}
            </Link>
          </div>
          <p className="text-xs text-[#432e18]/50 font-medium mt-12">
            © {new Date().getFullYear()} Road Not Taken. Made for coordinates with a history.
          </p>
        </div>
      </section>
    </main>
  );
}
