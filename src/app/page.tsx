// Landing page — the public marketing page visitors see before signing up
import Link from 'next/link'
import {
  BookOpen,
  Brain,
  Headphones,
  ArrowRight,
  Check,
  GraduationCap,
  Repeat,
  Unlock,
} from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-bg">
      {/* ========== NAV BAR ========== */}
      <nav className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <span className="text-lg font-bold text-gold">GermanWithCaro</span>

          {/* Nav buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-text2 transition hover:text-text"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-white transition hover:bg-gold-light"
            >
              Start Learning
            </Link>
          </div>
        </div>
      </nav>

      {/* ========== HERO ========== */}
      <section className="px-4 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold leading-tight text-text sm:text-5xl">
            Learn German the right way — with a{' '}
            <span className="text-gold">native speaker</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-text2">
            Structured lessons + spaced repetition flashcards. No fluff, no filler.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-base font-semibold text-white transition hover:bg-gold-light"
          >
            Start for free
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="border-t border-border bg-surface px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-text">How it works</h2>
          <p className="mt-2 text-center text-sm text-text3">
            Three simple steps, every day.
          </p>

          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-bg">
                <BookOpen size={22} className="text-gold" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-text">1. Read the lesson</h3>
              <p className="mt-1 text-xs text-text3">
                Short, focused lessons with real German sentences and native audio.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-bg">
                <Repeat size={22} className="text-gold" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-text">2. Review your flashcards</h3>
              <p className="mt-1 text-xs text-text3">
                Spaced repetition ensures you remember what you learn — for good.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-bg">
                <Unlock size={22} className="text-gold" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-text">3. Unlock the next lesson</h3>
              <p className="mt-1 text-xs text-text3">
                Finish your reviews to progress. No skipping ahead, no piling up.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className="border-t border-border px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-text">
            Everything you need to learn German
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {/* Native audio */}
            <div className="rounded-xl border border-border bg-white p-5">
              <Headphones size={22} className="text-gold" />
              <h3 className="mt-3 text-sm font-semibold text-text">Native audio recordings</h3>
              <p className="mt-1 text-xs text-text3">
                Every sentence recorded by a native German speaker — hear how it really sounds.
              </p>
            </div>

            {/* SRS */}
            <div className="rounded-xl border border-border bg-white p-5">
              <Brain size={22} className="text-gold" />
              <h3 className="mt-3 text-sm font-semibold text-text">Spaced repetition system</h3>
              <p className="mt-1 text-xs text-text3">
                Science-backed review scheduling that shows cards right when you&apos;re about to forget.
              </p>
            </div>

            {/* Structured curriculum */}
            <div className="rounded-xl border border-border bg-white p-5">
              <GraduationCap size={22} className="text-gold" />
              <h3 className="mt-3 text-sm font-semibold text-text">Structured A1 curriculum</h3>
              <p className="mt-1 text-xs text-text3">
                Carefully ordered lessons that build on each other — no jumping around aimlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PRICING ========== */}
      <section className="border-t border-border bg-surface px-4 py-16">
        <div className="mx-auto max-w-sm text-center">
          <h2 className="text-2xl font-bold text-text">Simple pricing</h2>
          <p className="mt-2 text-sm text-text3">One plan. Everything included.</p>

          {/* Pricing card */}
          <div className="mt-8 rounded-xl border-2 border-gold bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold text-gold">GermanWithCaro Premium</p>
            <div className="mt-3">
              <span className="text-4xl font-bold text-text">&euro;9</span>
              <span className="text-text3">/month</span>
            </div>

            <ul className="mt-6 space-y-2.5 text-left">
              {[
                'All structured A1 lessons',
                'Native audio recordings',
                'Spaced repetition flashcards',
                'Progress tracking & streaks',
                'New lessons added regularly',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-text2">
                  <Check size={14} className="shrink-0 text-success" />
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-gold py-3 text-sm font-semibold text-white transition hover:bg-gold-light"
            >
              Subscribe now
            </Link>

            <p className="mt-3 text-xs text-text3">Cancel anytime.</p>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center">
          <span className="text-sm font-semibold text-gold">GermanWithCaro</span>
          <div className="flex gap-4 text-xs text-text3">
            <Link href="/privacy" className="transition hover:text-text2">Privacy Policy</Link>
            <Link href="/terms" className="transition hover:text-text2">Terms of Service</Link>
          </div>
          <p className="text-xs text-text3">
            &copy; {new Date().getFullYear()} GermanWithCaro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
