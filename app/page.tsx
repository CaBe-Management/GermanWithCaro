'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

// ─── Scroll fade-in hook ──────────────────────────────────────────────────────

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('is-visible') },
      { threshold: 0.08 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

// ─── Phone Mockup ─────────────────────────────────────────────────────────────

function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto" style={{ width: '290px' }}>
      <div className="absolute -inset-8 bg-accent-purple/20 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
      <div
        className="relative rounded-[44px] border-[3px] border-white/20 shadow-2xl shadow-black/70 overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #2a2848 0%, #1a1830 60%, #13112a 100%)',
          height: '580px',
        }}
      >
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-[18px] bg-black rounded-full z-20" />
        <div className="absolute left-[-5px] top-28 w-[4px] h-9 bg-white/20 rounded-l-sm" />
        <div className="absolute left-[-5px] top-40 w-[4px] h-9 bg-white/20 rounded-l-sm" />
        <div className="absolute right-[-5px] top-32 w-[4px] h-14 bg-white/20 rounded-r-sm" />
        <div className="absolute inset-0 rounded-[42px] ring-1 ring-white/5 pointer-events-none" />
        <div className="h-full overflow-y-auto scrollbar-hide pt-9 pb-6">
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── ClozePreview ─────────────────────────────────────────────────────────────

function ClozePreview() {
  const [answered, setAnswered] = useState(false)
  const [input, setInput] = useState('')
  const correct = 'Familie'
  const isCorrect = input.toLowerCase() === correct.toLowerCase()

  return (
    <div className="bg-[#0f0e17] p-5 min-h-full">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full w-2/5 bg-accent-purple rounded-full" />
        </div>
        <span className="text-xs text-text-muted">Card 2 / 5</span>
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1.5">
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">NOMEN</span>
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-accent-purple/20 text-accent-violet border border-accent-purple/30">A1</span>
        </div>
        <span className="text-xs text-yellow-400 font-bold">⚡ +10 XP</span>
      </div>
      <p className="text-xs text-text-muted mb-4">die Familie · Familien</p>
      <div className="bg-[#252340] rounded-xl p-4 mb-4 border border-white/5">
        <p className="text-text-primary text-base leading-relaxed mb-4">
          Meine{' '}
          <span className="inline-block min-w-[70px] border-b-2 border-accent-purple text-center text-accent-violet font-bold px-1">
            {answered ? correct : '______'}
          </span>{' '}
          ist sehr groß.
        </p>
        {!answered ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && input && setAnswered(true)}
              placeholder="Type your answer..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-purple"
            />
            <button
              onClick={() => input && setAnswered(true)}
              className="px-3 py-2 rounded-lg bg-accent-purple text-white text-sm font-bold hover:bg-accent-violet transition-colors"
            >✓</button>
          </div>
        ) : (
          <div className={`rounded-lg p-3 text-sm font-medium ${isCorrect ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
            {isCorrect ? '✓ Richtig! My family is very big.' : `✗ "${correct}" — My family is very big.`}
            <button onClick={() => { setAnswered(false); setInput('') }} className="ml-2 underline opacity-70 hover:opacity-100 text-xs">↺ Try again</button>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>Stage: <span className="text-accent-violet font-semibold">Beginner</span></span>
        <span>Type · Press Enter</span>
      </div>
    </div>
  )
}

// ─── GrammarPreview ───────────────────────────────────────────────────────────

function GrammarPreview() {
  const [answered, setAnswered] = useState(false)
  const [input, setInput] = useState('')
  const correct = 'bin'
  const isCorrect = input.toLowerCase() === correct.toLowerCase()

  return (
    <div className="bg-[#0f0e17] p-5 min-h-full">
      <div className="flex items-center gap-1.5 mb-4">
        <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">GRAMMAR</span>
        <span className="px-2 py-0.5 rounded text-xs font-bold bg-accent-purple/20 text-accent-violet border border-accent-purple/30">A1</span>
        <span className="text-xs text-text-muted">Präsens: sein</span>
      </div>
      <div className="bg-[#252340] rounded-xl p-4 mb-4 border border-emerald-500/20">
        <p className="text-emerald-300 text-xs font-bold mb-3 uppercase tracking-wide">sein (to be) — Present tense</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {[['ich','bin'],['du','bist'],['er/sie/es','ist'],['wir','sind'],['ihr','seid'],['sie/Sie','sind']].map(([p,c]) => (
            <div key={p} className="flex gap-2">
              <span className="text-text-muted w-16 shrink-0">{p}</span>
              <span className="text-text-primary font-bold">{c}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#252340] rounded-xl p-4 mb-4 border border-white/5">
        <p className="text-xs text-text-muted font-semibold mb-3 uppercase tracking-wide">Now use it:</p>
        <p className="text-text-primary text-base leading-relaxed mb-4">
          Ich{' '}
          <span className="inline-block min-w-[50px] border-b-2 border-emerald-400 text-center text-emerald-300 font-bold px-1">
            {answered ? correct : '_____'}
          </span>{' '}
          sehr müde.
        </p>
        {!answered ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && input && setAnswered(true)}
              placeholder="Conjugate sein..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => input && setAnswered(true)}
              className="px-3 py-2 rounded-lg bg-emerald-700 text-white text-sm font-bold hover:bg-emerald-600 transition-colors"
            >✓</button>
          </div>
        ) : (
          <div className={`rounded-lg p-3 text-sm font-medium ${isCorrect ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
            {isCorrect ? '✓ Richtig! I am very tired.' : `✗ "${correct}" — I am very tired.`}
            <button onClick={() => { setAnswered(false); setInput('') }} className="ml-2 underline opacity-70 hover:opacity-100 text-xs">↺ Try again</button>
          </div>
        )}
      </div>
      <p className="text-xs text-text-muted text-center">Grammar · SRS · 50 A1 topics</p>
    </div>
  )
}

// ─── Floating background words ────────────────────────────────────────────────

const BG_WORDS = [
  { word: 'Familie',   size: 14, x: 8,  y: 15, delay: 0   },
  { word: 'lernen',    size: 18, x: 82, y: 10, delay: 1   },
  { word: 'ich bin',   size: 12, x: 5,  y: 60, delay: 2   },
  { word: 'danke',     size: 22, x: 75, y: 70, delay: 0.5 },
  { word: 'Haus',      size: 16, x: 55, y: 20, delay: 1.5 },
  { word: 'sprechen',  size: 13, x: 20, y: 75, delay: 3   },
  { word: 'bitte',     size: 20, x: 88, y: 42, delay: 2.5 },
  { word: 'schön',     size: 15, x: 40, y: 82, delay: 0.8 },
  { word: 'heute',     size: 12, x: 65, y: 55, delay: 3.5 },
  { word: 'gehen',     size: 17, x: 30, y: 30, delay: 1.2 },
]

function FloatingWords() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      {BG_WORDS.map(({ word, size, x, y, delay }) => (
        <span
          key={word}
          className="absolute font-bold text-accent-purple/10 animate-float-word"
          style={{ left: `${x}%`, top: `${y}%`, fontSize: `${size}px`, animationDelay: `${delay}s`, animationDuration: `${6 + delay}s` }}
        >
          {word}
        </span>
      ))}
    </div>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'Wait — is this actually free?',
    a: "Yes. The app is in beta right now, which means you can sign up and use everything for free. When the A1 grammar section is complete, it'll switch to a paid subscription (€4.99/month). If you're in now, enjoy it while it lasts.",
  },
  {
    q: "I tried Duolingo. How is this different?",
    a: "Duolingo is great for building a habit. But at some point you stop learning and just start completing streaks. Here you actually have to produce the language — type answers, conjugate verbs, build sentences. It's harder. That's the point.",
  },
  {
    q: "I follow you on TikTok — do I need this?",
    a: "The videos are great for understanding concepts. This is where you practice them until they stick. Think of the videos as the explanation, and this as the homework — but the fun kind.",
  },
  {
    q: 'I need to pass the Goethe A1 exam. Will this help?',
    a: "Yes, directly. The vocabulary is cross-referenced with the official Goethe-Institut A1 word list, and the grammar covers all 50 A1 topics the exam tests. If you know what's in this app, you're ready.",
  },
  {
    q: 'Why do I have to type answers instead of clicking?',
    a: "Because clicking is guessing. When you type a word from memory, your brain actually has to retrieve it — and that retrieval is what makes it stick. Multiple choice is easier, but it doesn't actually build language.",
  },
  {
    q: 'What level is the content?',
    a: "Currently A1 — complete beginner to elementary. The A1 grammar section is being built right now. Vocabulary content is already in, grammar is coming topic by topic. A2 is next once A1 is complete.",
  },
  {
    q: 'How much time do I need per day?',
    a: "10–15 minutes is plenty. The app tells you exactly what to review each day — you just show up and do it. The spaced repetition system handles all the scheduling.",
  },
]

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {FAQS.map((faq, i) => (
        <div
          key={i}
          className="bg-[#252340]/60 backdrop-blur-sm rounded-xl border border-white/5 overflow-hidden hover:border-white/10 transition-colors"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
          >
            <span className="text-text-primary font-medium text-sm">{faq.q}</span>
            <span className={`text-accent-purple text-xl shrink-0 transition-transform duration-200 ${open === i ? 'rotate-45' : ''}`}>+</span>
          </button>
          {open === i && (
            <div className="px-5 pb-4 text-text-muted text-sm leading-relaxed border-t border-white/5 pt-3">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

function LandingContent() {
  const [activeDemo, setActiveDemo] = useState<'vocab' | 'grammar'>('vocab')

  const howRef     = useFadeIn()
  const demoRef    = useFadeIn()
  const forWhoRef  = useFadeIn()
  const betaRef    = useFadeIn()
  const faqRef     = useFadeIn()

  return (
    <div className="min-h-screen bg-[#0f0e17] text-text-primary" style={{ scrollBehavior: 'smooth' }}>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f0e17]/85 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-base shrink-0">
            <span>🇩🇪</span>
            <span className="text-text-primary hidden sm:inline">German With Caro</span>
            <span className="text-text-primary sm:hidden">GWC</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-text-muted">
            <a href="#how" className="hover:text-text-primary transition-colors">How it works</a>
            <a href="#for-who" className="hover:text-text-primary transition-colors">Who it's for</a>
            <a href="#beta" className="hover:text-text-primary transition-colors">Beta</a>
            <a href="#faq" className="hover:text-text-primary transition-colors">FAQ</a>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl bg-accent-purple text-white text-sm font-bold hover:bg-accent-violet transition-colors shadow-lg shadow-accent-purple/25"
          >
            Start free →
          </Link>
        </div>
      </nav>

      {/* ── Beta Banner ────────────────────────────────────────────────────── */}
      <div className="fixed top-[57px] left-0 right-0 z-40 bg-[#7c6df2]/15 border-b border-accent-purple/20 text-center py-2 px-4">
        <p className="text-xs text-accent-violet font-medium">
          🚧 <span className="font-bold">Beta</span> — everything is free while the A1 grammar content is being built.
          <a href="#beta" className="ml-2 underline hover:text-text-primary transition-colors">Learn more</a>
        </p>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-20 px-5 overflow-hidden">
        <FloatingWords />

        {/* Radial background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-purple/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-purple/12 border border-accent-purple/25 text-accent-violet text-xs font-bold mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-violet animate-pulse" />
                A1 Grammar · Free Beta
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-text-primary leading-[1.1] mb-5">
                Drill German grammar<br />
                <span className="bg-gradient-to-r from-accent-purple to-accent-pink bg-clip-text text-transparent">
                  until it actually sticks.
                </span>
              </h1>

              <p className="text-lg text-text-muted leading-relaxed mb-3">
                Hi, I'm Caro — a native German speaker who teaches German.
                This app is built for people who want to consolidate their knowledge and build real, lasting fluency — not just get through a lesson streak.
              </p>
              <p className="text-base text-text-muted leading-relaxed mb-8">
                You type answers from memory. The app drills what you struggle with, spaces out what you know, and keeps pushing you forward.
                Sustainable learning, not quick fixes.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-accent-purple text-white font-bold text-base hover:bg-accent-violet transition-all shadow-xl shadow-accent-purple/30 hover:-translate-y-0.5"
                >
                  Start learning free →
                </Link>
                <a
                  href="#how"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 text-text-muted font-semibold hover:bg-white/5 hover:text-text-primary transition-all"
                >
                  See how it works ↓
                </a>
              </div>

              <p className="text-xs text-text-muted mt-4 opacity-70">
                Free during beta · No credit card · No nonsense
              </p>
            </div>

            {/* Right: phone demo */}
            <div className="flex flex-col items-center gap-4">
              {/* Tab switcher */}
              <div className="flex gap-1 p-1 bg-[#1a1830] rounded-xl border border-white/5">
                <button
                  onClick={() => setActiveDemo('vocab')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeDemo === 'vocab' ? 'bg-accent-purple text-white shadow-lg shadow-accent-purple/25' : 'text-text-muted hover:text-text-primary'}`}
                >
                  Vocabulary
                </button>
                <button
                  onClick={() => setActiveDemo('grammar')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeDemo === 'grammar' ? 'bg-accent-purple text-white shadow-lg shadow-accent-purple/25' : 'text-text-muted hover:text-text-primary'}`}
                >
                  Grammar
                </button>
              </div>

              <div className="animate-float-bob">
                <PhoneMockup>
                  {activeDemo === 'vocab' ? <ClozePreview /> : <GrammarPreview />}
                </PhoneMockup>
              </div>
              <p className="text-xs text-text-muted opacity-60">↑ Live demo — try typing an answer</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section id="how" className="py-20 px-5" ref={howRef}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-primary mb-3">How it works</h2>
            <p className="text-text-muted">Three things. That's it.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: '📖',
                title: 'Pick a grammar topic',
                desc: "Start with A1 Grammar with Caro. Each topic comes with an explanation, examples, and structure — so you understand it before you practice it.",
                color: 'border-accent-purple/30 hover:border-accent-purple/60',
                num: 'text-accent-purple',
              },
              {
                step: '02',
                icon: '✏️',
                title: 'Fill in the gaps',
                desc: "You see a sentence with a missing word. You type it. No hints, no multiple choice. Just you and the German language.",
                color: 'border-emerald-500/30 hover:border-emerald-500/60',
                num: 'text-emerald-400',
              },
              {
                step: '03',
                icon: '🔄',
                title: 'The app takes over',
                desc: "Every answer you give feeds into the spaced repetition system. Words you know disappear for longer. Ones you struggle with come back sooner.",
                color: 'border-blue-500/30 hover:border-blue-500/60',
                num: 'text-blue-400',
              },
            ].map(({ step, icon, title, desc, color, num }) => (
              <div key={step} className={`bg-[#1a1830] rounded-2xl p-6 border ${color} transition-colors`}>
                <div className={`text-xs font-bold font-mono mb-3 ${num}`}>{step}</div>
                <div className="text-2xl mb-3">{icon}</div>
                <h3 className="text-text-primary font-bold mb-2">{title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Grammar demo section ───────────────────────────────────────────── */}
      <section className="py-16 px-5 bg-[#1a1830]/40" ref={demoRef}>
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#1a1830] rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">A1 GRAMMAR</span>
              </div>
              <h3 className="text-text-primary font-bold text-lg">W-Frage: wie? <span className="text-text-muted font-normal text-base">— W-Question: how?</span></h3>
            </div>
            <div className="p-6 grid sm:grid-cols-2 gap-5">
              {/* Structure */}
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Structure</p>
                <div className="bg-[#0f0e17] rounded-xl p-3 font-mono text-sm border border-white/5">
                  <span className="text-accent-violet">[Verb]</span> + wie + <span className="text-accent-violet">[Noun]</span>?
                </div>
              </div>
              {/* Register */}
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Register</p>
                <div className="space-y-2">
                  {[['Formal','3'],['Standard','3'],['Casual','2']].map(([label, dots]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm text-text-muted">{label}</span>
                      <div className="flex gap-1">
                        {[1,2,3].map(i => (
                          <div key={i} className={`w-2 h-2 rounded-full ${i <= Number(dots) ? 'bg-accent-purple' : 'bg-white/10'}`} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Example sentences */}
              <div className="sm:col-span-2 space-y-2">
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Examples</p>
                {[
                  ['Wie heißt du?', 'What is your name?'],
                  ['Wie geht es dir?', 'How are you?'],
                  ['Wie spät ist es?', 'What time is it?'],
                ].map(([de, en]) => (
                  <div key={de} className="bg-[#252340] rounded-xl p-3 border border-white/5">
                    <p className="text-text-primary text-sm">{de}</p>
                    <p className="text-text-muted text-xs mt-0.5">{en}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 pb-6">
              <Link
                href="/grammar"
                className="text-sm text-accent-violet hover:text-accent-pink transition-colors font-medium"
              >
                Browse all A1 grammar topics →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Who it's for ───────────────────────────────────────────────────── */}
      <section id="for-who" className="py-20 px-5" ref={forWhoRef}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-primary mb-3">This is for you if…</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                emoji: '📱',
                title: "You follow me on TikTok or YouTube",
                desc: "The videos explain the concepts. This is where you practice them until they actually stick. Think of it as the structured study guide to go with the content you already watch.",
                tag: 'GWC Community',
                tagColor: 'bg-accent-purple/15 text-accent-violet border-accent-purple/25',
              },
              {
                emoji: '📋',
                title: "You need to pass the Goethe A1 exam",
                desc: "The vocabulary is based directly on the official Goethe-Institut A1 word list, and the grammar covers every topic that appears in the exam. Systematic, complete, no guessing what to study.",
                tag: 'Exam Prep',
                tagColor: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
              },
              {
                emoji: '😤',
                title: "You tried other apps and gave up",
                desc: "Duolingo felt too gamey. Anki was too much work to set up. Textbooks were boring. This is structured and systematic, but it doesn't feel like homework. The content is already built. You just show up.",
                tag: 'Self-Learners',
                tagColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
              },
            ].map(({ emoji, title, desc, tag, tagColor }) => (
              <div
                key={title}
                className="flex gap-5 bg-[#1a1830] rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="text-3xl shrink-0 mt-0.5">{emoji}</div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="text-text-primary font-bold">{title}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${tagColor}`}>{tag}</span>
                  </div>
                  <p className="text-text-muted text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Beta Pricing ───────────────────────────────────────────────────── */}
      <section id="beta" className="py-20 px-5 bg-[#1a1830]/40" ref={betaRef}>
        <div className="max-w-lg mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-purple/12 border border-accent-purple/25 text-accent-violet text-xs font-bold mb-6">
            🚧 Currently in Beta
          </div>

          <h2 className="text-3xl font-bold text-text-primary mb-4">
            Free now.<br/>
            <span className="text-text-muted font-normal text-2xl">Paid when it's done.</span>
          </h2>

          <p className="text-text-muted leading-relaxed mb-8">
            I'm building the A1 grammar section topic by topic — every week there's more content.
            While that's happening, everything is free. No catch.
          </p>

          {/* Beta card */}
          <div className="relative bg-[#1a1830] rounded-2xl border border-accent-purple/30 p-8 mb-6">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-accent-purple/20 to-accent-pink/10 rounded-2xl blur-sm -z-10" />

            <div className="text-5xl font-bold text-text-primary mb-1">
              €0
              <span className="text-text-muted text-lg font-normal"> / now</span>
            </div>
            <p className="text-text-muted text-sm mb-6">Free during beta · No credit card needed</p>

            <div className="text-left space-y-3 mb-8">
              {[
                'Full access to A1 Grammar with Caro',
                'All vocabulary content + spaced repetition',
                'New grammar topics added every week',
                'Keeps all your progress when it goes paid',
              ].map(item => (
                <div key={item} className="flex items-start gap-3 text-sm text-text-primary">
                  <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                  {item}
                </div>
              ))}
            </div>

            <Link
              href="/dashboard"
              className="block w-full py-3.5 rounded-xl bg-accent-purple text-white font-bold hover:bg-accent-violet transition-colors shadow-lg shadow-accent-purple/30 text-center"
            >
              Sign up free →
            </Link>
          </div>

          {/* Future pricing note */}
          <div className="bg-[#252340]/50 rounded-xl p-4 border border-white/5">
            <p className="text-text-muted text-sm">
              <span className="text-text-primary font-semibold">When it goes paid:</span>{' '}
              €9.99/month — all A1 content, spaced repetition, grammar library, streak tracking. Everything.
              Accounts created during beta keep their progress.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-5" ref={faqRef}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-text-primary mb-3">Questions</h2>
          </div>
          <FAQ />
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-5 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold text-text-primary mb-4">
            Ready to actually learn German?
          </h2>
          <p className="text-text-muted mb-8">
            It's free. It takes 10 minutes to get started. And if you don't like it, you've lost nothing.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-accent-purple text-white font-bold text-lg hover:bg-accent-violet transition-all shadow-xl shadow-accent-purple/30 hover:-translate-y-0.5"
          >
            Start learning free →
          </Link>
          <p className="text-xs text-text-muted mt-4 opacity-60">No credit card · No nonsense · Free during beta</p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-5">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-sm">
            © {new Date().getFullYear()} German With Caro
          </p>
          <div className="flex items-center gap-5">
            {[
              { href: '/impressum', label: 'Impressum' },
              { href: '/privacy',   label: 'Privacy' },
              { href: '/cookies',   label: 'Cookies' },
              { href: '/terms',     label: 'Terms' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="text-text-muted hover:text-text-primary text-sm transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function Home() {
  return <LandingContent />
}
