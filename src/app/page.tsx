// Landing page — public marketing page
import Link from 'next/link'
import { BookOpen, Brain, MessageCircle, Check } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-page">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border-light bg-bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[900px] items-center justify-between px-6 py-4">
          <span className="bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] bg-clip-text text-[16px] font-bold text-transparent">
            GermanWithCaro
          </span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[14px] font-semibold text-text-2 hover:text-text-1">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-[14px] bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] px-5 py-2.5 text-[14px] font-bold text-white shadow-[0_4px_14px_rgba(99,102,241,0.30)]"
            >
              Start free →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pb-16 pt-20 text-center">
        <div className="mx-auto max-w-[600px]">
          <h1 className="text-[36px] font-extrabold leading-[1.15] text-text-1 sm:text-[42px]">
            German that actually{' '}
            <span className="bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent">
              clicks
            </span>
            .
          </h1>
          <p className="mx-auto mt-4 max-w-[420px] text-[16px] leading-relaxed text-text-2">
            Structured A1 lessons, smart flashcards, and real conversations — taught by a native speaker.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-[14px] bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_4px_14px_rgba(99,102,241,0.30)]"
            >
              Start for free
            </Link>
            <Link
              href="#pricing"
              className="rounded-[14px] bg-bg-page px-6 py-3.5 text-[15px] font-bold text-text-2"
            >
              View plans
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-[900px] gap-6 sm:grid-cols-3">
          {[
            { icon: BookOpen, title: '63 A1 Lessons', desc: 'Structured from zero to A1. Real German sentences with audio, word breakdowns, and grammar notes.' },
            { icon: Brain, title: 'Smart Spaced Repetition', desc: 'Every sentence becomes a flashcard. The SM-2 algorithm shows you cards right when you\'re about to forget.' },
            { icon: MessageCircle, title: 'Real Conversations', desc: 'Mini-dialogues at the end of every lesson. Practice understanding German in real situations.' },
          ].map((f) => (
            <div key={f.title} className="rounded-[20px] bg-bg-card p-10 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-bg">
                <f.icon size={22} className="text-primary" />
              </div>
              <h3 className="mt-4 text-[16px] font-bold text-text-1">{f.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-text-2">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-16">
        <div className="mx-auto max-w-[900px] text-center">
          <h2 className="text-[28px] font-extrabold text-text-1">Simple pricing</h2>
          <p className="mt-2 text-[15px] text-text-2">Start free. Upgrade when you&apos;re ready.</p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {/* Free */}
            <div className="rounded-[20px] bg-bg-card p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
              <p className="text-[14px] font-bold text-text-2">Free</p>
              <p className="mt-1 text-[36px] font-extrabold text-text-1">€0</p>
              <p className="text-[14px] text-text-3">forever</p>
              <ul className="mt-6 space-y-3 text-left">
                {['Unit 0 + Unit 1 (8 lessons)', 'Full flashcard access', 'Conversations included', 'Spaced repetition'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[14px] text-text-2">
                    <Check size={16} className="shrink-0 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-[14px] bg-bg-page py-3.5 text-center text-[15px] font-bold text-text-2"
              >
                Get started
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-[20px] border-2 border-primary bg-bg-card p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
              <p className="text-[14px] font-bold text-primary">Pro</p>
              <p className="mt-1 text-[36px] font-extrabold text-text-1">€9.99</p>
              <p className="text-[14px] text-text-3">/month</p>
              <ul className="mt-6 space-y-3 text-left">
                {['All 63 lessons (8 units)', 'Full flashcard access', 'All conversations', 'Priority support', 'New lessons as they launch'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[14px] text-text-2">
                    <Check size={16} className="shrink-0 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-[14px] bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] py-3.5 text-center text-[15px] font-bold text-white shadow-[0_4px_14px_rgba(99,102,241,0.30)]"
              >
                Start Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-light px-6 py-8 text-center">
        <span className="bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] bg-clip-text text-[14px] font-bold text-transparent">
          GermanWithCaro
        </span>
        <div className="mt-3 flex justify-center gap-4 text-[13px] text-text-3">
          <Link href="/privacy" className="hover:text-text-2">Privacy</Link>
          <Link href="/terms" className="hover:text-text-2">Terms</Link>
        </div>
        <p className="mt-2 text-[12px] text-text-4">
          © {new Date().getFullYear()} GermanWithCaro. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
