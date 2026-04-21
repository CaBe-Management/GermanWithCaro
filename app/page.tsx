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

// ─── Floating background words ────────────────────────────────────────────────

const BG_WORDS = [
  { word: 'ich bin',    size: 14, x: 8,  y: 15, delay: 0   },
  { word: 'lernen',     size: 18, x: 82, y: 10, delay: 1   },
  { word: 'danke',      size: 22, x: 75, y: 70, delay: 0.5 },
  { word: 'Alltag',     size: 16, x: 55, y: 20, delay: 1.5 },
  { word: 'sprechen',   size: 13, x: 20, y: 75, delay: 3   },
  { word: 'bitte',      size: 20, x: 88, y: 42, delay: 2.5 },
  { word: 'schön',      size: 15, x: 40, y: 82, delay: 0.8 },
  { word: 'eigentlich', size: 12, x: 5,  y: 60, delay: 2   },
  { word: 'gehen',      size: 17, x: 30, y: 30, delay: 1.2 },
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

// ─── Interactive flip card demo ───────────────────────────────────────────────

const DEMO_SENTENCES = [
  { de: 'Ich bin super müde heute.', en: 'I am super tired today.' },
  { de: 'Das ist mein Lieblingsessen.', en: 'That is my favourite food.' },
  { de: 'Wo wohnst du gerade?', en: 'Where do you live right now?' },
]

function FlipCardDemo() {
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [answered, setAnswered] = useState<'knew' | 'didnt' | null>(null)

  const sentence = DEMO_SENTENCES[cardIndex]

  function handleAnswer(result: 'knew' | 'didnt') {
    setAnswered(result)
    setTimeout(() => {
      setCardIndex(i => (i + 1) % DEMO_SENTENCES.length)
      setFlipped(false)
      setAnswered(null)
    }, 700)
  }

  return (
    <div className="bg-[#0f0e17] rounded-2xl border border-white/8 p-6 max-w-sm mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-purple rounded-full transition-all duration-500"
            style={{ width: `${((cardIndex) / DEMO_SENTENCES.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-[#9b98b0]">Card {cardIndex + 1} / {DEMO_SENTENCES.length}</span>
      </div>

      {/* Card */}
      <div
        className={`relative min-h-[140px] rounded-xl border cursor-pointer select-none transition-all duration-300 mb-4 flex flex-col items-center justify-center text-center p-6 ${
          flipped
            ? 'bg-[#7c6df2]/10 border-[#7c6df2]/40'
            : 'bg-[#1a1830] border-white/8 hover:border-white/15'
        } ${answered === 'knew' ? 'border-emerald-500/60 bg-emerald-500/5' : answered === 'didnt' ? 'border-red-500/40 bg-red-500/5' : ''}`}
        onClick={() => !answered && setFlipped(f => !f)}
      >
        {!flipped ? (
          <>
            <p className="text-xl font-bold text-[#e8e6f0] mb-2">{sentence.de}</p>
            <p className="text-xs text-[#9b98b0]">tap to reveal translation</p>
          </>
        ) : (
          <>
            <p className="text-sm text-[#9b98b0] mb-1">🇩🇪 {sentence.de}</p>
            <p className="text-lg font-semibold text-[#e8e6f0]">🇬🇧 {sentence.en}</p>
          </>
        )}
      </div>

      {/* Buttons */}
      {flipped && !answered ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleAnswer('didnt')}
            className="py-2.5 rounded-xl bg-red-500/15 text-red-400 font-semibold text-sm hover:bg-red-500/25 transition-colors"
          >
            ✗ Didn't know
          </button>
          <button
            onClick={() => handleAnswer('knew')}
            className="py-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 font-semibold text-sm hover:bg-emerald-500/25 transition-colors"
          >
            ✓ Knew it
          </button>
        </div>
      ) : !flipped ? (
        <p className="text-center text-xs text-[#4a4760]">← tap the card to flip it</p>
      ) : (
        <div className={`text-center text-sm font-semibold py-2 rounded-xl ${
          answered === 'knew' ? 'text-emerald-400' : 'text-red-400'
        }`}>
          {answered === 'knew' ? '✓ Next card coming up...' : '✗ We\'ll review this again soon'}
        </div>
      )}
    </div>
  )
}

// ─── Sentence browse demo ─────────────────────────────────────────────────────

const DEMO_VIDEO_SENTENCES = [
  { de: 'Ich bin super müde heute.', en: 'I am super tired today.', added: false },
  { de: 'Das ist mein Lieblingsessen.', en: 'That is my favourite food.', added: false },
  { de: 'Wo wohnst du gerade?', en: 'Where do you live right now?', added: false },
  { de: 'Ich lerne Deutsch seit einem Jahr.', en: 'I have been learning German for a year.', added: false },
]

function BrowseDemo() {
  const [sentences, setSentences] = useState(DEMO_VIDEO_SENTENCES)

  function toggle(i: number) {
    setSentences(prev => prev.map((s, idx) => idx === i ? { ...s, added: !s.added } : s))
  }

  const addedCount = sentences.filter(s => s.added).length

  return (
    <div className="bg-[#0f0e17] rounded-2xl border border-white/8 p-4 max-w-sm mx-auto">
      {/* Mock video header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
        <div className="w-12 h-12 rounded-lg bg-[#7c6df2]/20 flex items-center justify-center shrink-0">
          <span className="text-xl">📱</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#e8e6f0] leading-tight">I speak SLOW German everyday 🇩🇪</p>
          <p className="text-xs text-[#9b98b0] mt-0.5">{addedCount}/{sentences.length} sentences saved</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-[#7c6df2] rounded-full transition-all duration-300"
          style={{ width: `${(addedCount / sentences.length) * 100}%` }}
        />
      </div>

      {/* Sentences */}
      <div className="space-y-2">
        {sentences.map((s, i) => (
          <div key={i} className={`rounded-xl border p-3 transition-all ${s.added ? 'border-[#7c6df2]/40 bg-[#7c6df2]/5' : 'border-white/8 bg-[#1a1830]'}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#e8e6f0] leading-snug">{s.de}</p>
                <p className="text-xs text-[#9b98b0] mt-0.5">{s.en}</p>
              </div>
              <button
                onClick={() => toggle(i)}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  s.added
                    ? 'bg-[#7c6df2]/20 text-[#9b8cf5]'
                    : 'bg-white/5 text-[#9b98b0] hover:bg-[#7c6df2]/20 hover:text-[#9b8cf5]'
                }`}
              >
                {s.added ? '✓ Added' : '+ Add'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'How is this different from just watching your TikToks?',
    a: "Watching gets you exposure. But exposure alone doesn't make things stick. Here you actively retrieve sentences from memory — flip the card, recall the meaning, judge yourself honestly. That retrieval is what builds lasting memory. The videos are the input. This is the practice.",
  },
  {
    q: 'Do I need to watch your videos first?',
    a: "You don't have to, but it helps. The sentences in the app come directly from the videos — so if you've watched them, the context is already there. If not, the German and English are always shown together so you're never lost.",
  },
  {
    q: 'What is spaced repetition?',
    a: "It's a scheduling system that shows you cards at the exact moment you're about to forget them. Say you got a card right — it won't show up again for a few days. Get it right again? Maybe a week. Over time, cards you know well appear less and less. Cards you struggle with come back sooner. It's the most efficient way to memorise things long-term.",
  },
  {
    q: 'Is this free?',
    a: "Yes, for now. The video library is free to browse. The SRS review system will become a paid feature once there's enough content to make it worth it. If you sign up now, you'll keep your progress either way.",
  },
  {
    q: 'What level is the content?',
    a: "It depends on the video. Each video is tagged with a level (A1–C1) so you can filter for what suits you. There's content for total beginners up to more advanced learners.",
  },
  {
    q: 'How much time do I need per day?',
    a: "10 minutes is enough. Browse a video, add the sentences that interest you, then review what's due. The SRS system handles the scheduling — you just show up.",
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
            <span className="text-[#e8e6f0] font-medium text-sm">{faq.q}</span>
            <span className={`text-accent-purple text-xl shrink-0 transition-transform duration-200 ${open === i ? 'rotate-45' : ''}`}>+</span>
          </button>
          {open === i && (
            <div className="px-5 pb-4 text-[#9b98b0] text-sm leading-relaxed border-t border-white/5 pt-3">
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
  const [activeDemo, setActiveDemo] = useState<'browse' | 'review'>('browse')

  const howRef    = useFadeIn()
  const demoRef   = useFadeIn()
  const forWhoRef = useFadeIn()
  const faqRef    = useFadeIn()
  const caroRef   = useFadeIn()

  return (
    <div className="min-h-screen bg-[#0f0e17] text-[#e8e6f0]" style={{ scrollBehavior: 'smooth' }}>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f0e17]/85 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-base shrink-0">
            <span>🇩🇪</span>
            <span className="hidden sm:inline">German With Caro</span>
            <span className="sm:hidden">GWC</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-[#9b98b0]">
            <a href="#how" className="hover:text-[#e8e6f0] transition-colors">How it works</a>
            <a href="#for-who" className="hover:text-[#e8e6f0] transition-colors">Who it's for</a>
            <a href="#caro" className="hover:text-[#e8e6f0] transition-colors">About</a>
            <a href="#faq" className="hover:text-[#e8e6f0] transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-white/8 text-[#e8e6f0] text-sm font-bold hover:bg-white/12 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/videos"
              className="px-4 py-2 rounded-xl bg-[#7c6df2] text-white text-sm font-bold hover:bg-[#6b5de0] transition-colors shadow-lg shadow-[#7c6df2]/25"
            >
              Browse videos →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-5 overflow-hidden">
        <FloatingWords />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7c6df2]/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7c6df2]/12 border border-[#7c6df2]/25 text-[#9b8cf5] text-xs font-bold mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9b8cf5] animate-pulse" />
                Real sentences · Real retention
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-[#e8e6f0] leading-[1.1] mb-5">
                Learn German from<br />
                <span className="bg-gradient-to-r from-[#7c6df2] to-[#c084fc] bg-clip-text text-transparent">
                  videos that actually stick.
                </span>
              </h1>

              <p className="text-lg text-[#9b98b0] leading-relaxed mb-4">
                Pick sentences from my TikTok videos. Add the ones you want to learn. Review them with spaced repetition until they're part of you.
              </p>
              <p className="text-base text-[#9b98b0] leading-relaxed mb-8">
                No random word lists. No gamified streaks. Just real German, from real context, drilled until it sticks.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/videos"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#7c6df2] text-white font-bold text-base hover:bg-[#6b5de0] transition-all shadow-xl shadow-[#7c6df2]/30 hover:-translate-y-0.5"
                >
                  Browse videos →
                </Link>
                <a
                  href="#how"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 text-[#9b98b0] font-semibold hover:bg-white/5 hover:text-[#e8e6f0] transition-all"
                >
                  See how it works ↓
                </a>
              </div>

              <p className="text-xs text-[#9b98b0] mt-4 opacity-70">
                Free to browse · No credit card needed
              </p>
            </div>

            {/* Right: interactive demo */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-1 p-1 bg-[#1a1830] rounded-xl border border-white/5">
                <button
                  onClick={() => setActiveDemo('browse')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeDemo === 'browse' ? 'bg-[#7c6df2] text-white shadow-lg shadow-[#7c6df2]/25' : 'text-[#9b98b0] hover:text-[#e8e6f0]'}`}
                >
                  Browse
                </button>
                <button
                  onClick={() => setActiveDemo('review')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeDemo === 'review' ? 'bg-[#7c6df2] text-white shadow-lg shadow-[#7c6df2]/25' : 'text-[#9b98b0] hover:text-[#e8e6f0]'}`}
                >
                  Review
                </button>
              </div>

              <div className="w-full animate-float-bob">
                {activeDemo === 'browse' ? <BrowseDemo /> : <FlipCardDemo />}
              </div>
              <p className="text-xs text-[#4a4760]">↑ Live demo — try it out</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section id="how" className="py-20 px-5" ref={howRef}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#e8e6f0] mb-3">How it works</h2>
            <p className="text-[#9b98b0]">Three steps. That's it.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: '🎬',
                title: 'Watch a video',
                desc: 'Browse the video library. Each video has real German sentences from the content — tagged by level so you can start where it makes sense.',
                color: 'border-[#7c6df2]/30 hover:border-[#7c6df2]/60',
                num: 'text-[#7c6df2]',
              },
              {
                step: '02',
                icon: '＋',
                title: 'Pick your sentences',
                desc: 'Tap the sentences that catch your eye — words you want to remember, phrases that felt useful. They go straight into your personal review queue.',
                color: 'border-emerald-500/30 hover:border-emerald-500/60',
                num: 'text-emerald-400',
              },
              {
                step: '03',
                icon: '🔄',
                title: 'Review until it sticks',
                desc: 'Flip cards. German one side, English the other. "Knew it" or "didn\'t know". The SRS algorithm handles the rest — showing you what you need, when you need it.',
                color: 'border-blue-500/30 hover:border-blue-500/60',
                num: 'text-blue-400',
              },
            ].map(({ step, icon, title, desc, color, num }) => (
              <div key={step} className={`bg-[#1a1830] rounded-2xl p-6 border ${color} transition-colors`}>
                <div className={`text-xs font-bold font-mono mb-3 ${num}`}>{step}</div>
                <div className="text-2xl mb-3">{icon}</div>
                <h3 className="text-[#e8e6f0] font-bold mb-2">{title}</h3>
                <p className="text-[#9b98b0] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why SRS ────────────────────────────────────────────────────────── */}
      <section className="py-16 px-5 bg-[#1a1830]/40" ref={demoRef}>
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#1a1830] rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-[#e8e6f0] font-bold text-lg">Why spaced repetition?</h3>
              <p className="text-[#9b98b0] text-sm mt-1">The science behind remembering things long-term</p>
            </div>
            <div className="p-6 grid sm:grid-cols-3 gap-5">
              {[
                {
                  icon: '📉',
                  title: 'We forget fast',
                  desc: 'Without review, you forget 70% of new information within 24 hours. Passive reading doesn\'t help.',
                },
                {
                  icon: '⏱️',
                  title: 'Timing matters',
                  desc: 'Reviewing at the right moment — just before you forget — is far more effective than reviewing randomly.',
                },
                {
                  icon: '🧠',
                  title: 'Retrieval builds memory',
                  desc: 'Every time you successfully recall something, the memory gets stronger. Flip cards force retrieval. Scrolling doesn\'t.',
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="bg-[#0f0e17] rounded-xl p-4 border border-white/5">
                  <div className="text-2xl mb-2">{icon}</div>
                  <p className="text-[#e8e6f0] font-semibold text-sm mb-1">{title}</p>
                  <p className="text-[#9b98b0] text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Who it's for ───────────────────────────────────────────────────── */}
      <section id="for-who" className="py-20 px-5" ref={forWhoRef}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#e8e6f0] mb-3">This is for you if…</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                emoji: '📱',
                title: 'You already follow me on TikTok or YouTube',
                desc: "You watch the videos. You understand the concept. But it doesn't stick the way you want it to. This is where you take what you've seen and actually make it yours — sentence by sentence.",
                tag: 'GWC Community',
                tagColor: 'bg-[#7c6df2]/15 text-[#9b8cf5] border-[#7c6df2]/25',
              },
              {
                emoji: '🎯',
                title: "You want to learn real, usable German",
                desc: "Not textbook sentences. Not random vocabulary lists. The sentences here come from real videos — the kind of German you'd actually use or hear in conversation.",
                tag: 'Real German',
                tagColor: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
              },
              {
                emoji: '😤',
                title: "You've tried other apps and got bored",
                desc: "Duolingo felt too gamey. Anki was too much effort to set up. Here the content is already there. You just pick the sentences that interest you and review them. That's it.",
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
                    <h3 className="text-[#e8e6f0] font-bold">{title}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${tagColor}`}>{tag}</span>
                  </div>
                  <p className="text-[#9b98b0] text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About Caro ─────────────────────────────────────────────────────── */}
      <section id="caro" className="py-20 px-5 bg-[#1a1830]/40" ref={caroRef}>
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#1a1830] rounded-2xl border border-white/5 p-8 flex flex-col sm:flex-row gap-8 items-center sm:items-start">
            <img
              src="/caro.jpg"
              alt="Caro"
              className="w-32 h-32 rounded-full object-cover shrink-0 border-2 border-[#7c6df2]/40 shadow-lg shadow-[#7c6df2]/10"
            />
            <div>
              <p className="text-xs font-bold text-[#7c6df2] uppercase tracking-widest mb-2">The person behind it</p>
              <h2 className="text-2xl font-bold text-[#e8e6f0] mb-3">Hi, I'm Caro 👋</h2>
              <p className="text-[#9b98b0] leading-relaxed mb-3">
                I'm not German — I got fluent by living and working in Germany. I know what it's like to learn this language as an outsider, what actually works, and what's just a waste of time. I make German content on TikTok and YouTube, and people kept asking where they could actually practise the sentences from my videos. I couldn't find anything good, so I built it myself.
              </p>
              <p className="text-[#9b98b0] leading-relaxed mb-4">
                Every video, every sentence, every translation in here is made by me. This is the study companion to go with the content you're already watching.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://www.tiktok.com/@germanwithcaro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-[#9b98b0] hover:text-[#e8e6f0] hover:bg-white/10 transition-colors text-sm font-medium"
                >
                  📱 TikTok
                </a>
                <a
                  href="https://www.youtube.com/@germanwithcaro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-[#9b98b0] hover:text-[#e8e6f0] hover:bg-white/10 transition-colors text-sm font-medium"
                >
                  ▶️ YouTube
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-5" ref={faqRef}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#e8e6f0] mb-3">Questions</h2>
          </div>
          <FAQ />
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-[#7c6df2] uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-3xl font-bold text-[#e8e6f0] mb-3">Simple.</h2>
            <p className="text-[#9b98b0]">Browse videos for free. Pay when you want to review.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Free */}
            <div className="bg-[#1a1830] border border-white/6 rounded-2xl p-7">
              <p className="text-xs font-bold text-[#9b98b0] uppercase tracking-widest mb-4">Free</p>
              <p className="text-4xl font-bold text-[#e8e6f0] mb-1">€0</p>
              <p className="text-sm text-[#6b6880] mb-6">forever</p>
              <ul className="space-y-3">
                {['Browse all videos', 'See sentences + translations', 'Filter by level'].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-[#9b98b0]">
                    <span className="text-[#7c6df2] font-bold">✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>
            {/* Pro */}
            <div className="bg-[#1a1830] border border-[#7c6df2]/40 rounded-2xl p-7 relative">
              <p className="text-xs font-bold text-[#7c6df2] uppercase tracking-widest mb-4">Pro</p>
              <p className="text-4xl font-bold text-[#e8e6f0] mb-1">€4.99</p>
              <p className="text-sm text-[#6b6880] mb-6">per month · cancel any time</p>
              <ul className="space-y-3 mb-7">
                {['Everything in Free', 'Save sentences to your deck', 'Daily SRS review', 'Track your progress'].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-[#9b98b0]">
                    <span className="text-[#7c6df2] font-bold">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="block text-center py-3 rounded-xl bg-[#7c6df2] text-white font-bold hover:bg-[#9b8cf5] transition-colors"
              >
                Get started →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-5 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold text-[#e8e6f0] mb-4">
            Ready to make it stick?
          </h2>
          <p className="text-[#9b98b0] mb-8">
            Pick a video. Add the sentences you want to learn. Come back tomorrow for your review. That's the whole thing.
          </p>
          <Link
            href="/videos"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#7c6df2] text-white font-bold text-lg hover:bg-[#6b5de0] transition-all shadow-xl shadow-[#7c6df2]/30 hover:-translate-y-0.5"
          >
            Browse videos →
          </Link>
          <p className="text-xs text-[#9b98b0] mt-4 opacity-60">Free to use · No credit card</p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-5">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#9b98b0] text-sm">
            © {new Date().getFullYear()} German With Caro
          </p>
          <div className="flex items-center gap-5">
            {[
              { href: '/impressum', label: 'Impressum' },
              { href: '/privacy',   label: 'Privacy' },
              { href: '/cookies',   label: 'Cookies' },
              { href: '/terms',     label: 'Terms' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="text-[#9b98b0] hover:text-[#e8e6f0] text-sm transition-colors">
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
