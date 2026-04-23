'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface DemoSentence {
  de: string
  en: string
  hl?: string | null
}

const FALLBACK_SENTENCES: DemoSentence[] = [
  { de: 'Ich bin super müde heute.', en: 'I am super tired today.', hl: 'müde' },
  { de: 'Das ist mein Lieblingsessen.', en: 'That is my favourite food.', hl: 'Lieblingsessen' },
  { de: 'Wo wohnst du gerade?', en: 'Where do you live right now?', hl: 'wohnst' },
]

// ─── Interactive flip card demo ───────────────────────────────────────────────

function FlipCardDemo({ sentences = FALLBACK_SENTENCES }: { sentences?: DemoSentence[] }) {
  const [idx, setIdx]     = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [answered, setAnswered] = useState<'knew' | 'didnt' | null>(null)

  // Reset when sentences change
  useEffect(() => { setIdx(0); setFlipped(false); setAnswered(null) }, [sentences])

  const s = sentences[idx] ?? FALLBACK_SENTENCES[0]

  function handleAnswer(result: 'knew' | 'didnt') {
    setAnswered(result)
    setTimeout(() => {
      setIdx(i => (i + 1) % sentences.length)
      setFlipped(false)
      setAnswered(null)
    }, 650)
  }

  return (
    <div className="bg-gwc-panel rounded-2xl border border-gwc-text/8 p-5 shadow-sm max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1.5">
          {sentences.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i <= idx ? 'w-6 bg-gwc-accent' : 'w-6 bg-gwc-text/10'}`} />
          ))}
        </div>
        <span className="font-mono text-[10px] text-gwc-muted tracking-wider uppercase">Novice II</span>
      </div>

      {/* Card */}
      <div
        className={`rounded-xl p-6 text-center cursor-pointer select-none transition-all duration-250 mb-4 min-h-[120px] flex flex-col items-center justify-center ${
          answered === 'knew'  ? 'bg-gwc-success/8 border border-gwc-success/30' :
          answered === 'didnt' ? 'bg-gwc-error/8 border border-gwc-error/30' :
          flipped              ? 'bg-gwc-accent/6 border border-gwc-accent/25' :
                                 'bg-gwc-raised/60 border border-gwc-text/6 hover:border-gwc-text/12'
        }`}
        onClick={() => !answered && setFlipped(f => !f)}
      >
        {!flipped ? (
          <>
            <p className="font-display text-xl text-gwc-text leading-snug">{s.de}</p>
            <p className="font-mono text-[10px] text-gwc-muted mt-3 tracking-widest uppercase">tap to reveal</p>
          </>
        ) : (
          <>
            <p className="font-display text-sm italic text-gwc-muted mb-2">{s.de}</p>
            <p className="font-display text-lg text-gwc-text">{s.en}</p>
          </>
        )}
      </div>

      {/* Buttons */}
      {flipped && !answered ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleAnswer('didnt')}
            className="py-2.5 rounded-xl border border-gwc-text/10 text-gwc-muted text-sm font-medium hover:border-gwc-error/40 hover:text-gwc-error transition-colors"
          >
            Didn't know
          </button>
          <button
            onClick={() => handleAnswer('knew')}
            className="py-2.5 rounded-xl bg-gwc-text text-gwc-base text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Knew it
          </button>
        </div>
      ) : !flipped ? (
        <p className="text-center font-mono text-[10px] text-gwc-dim tracking-widest uppercase">Space · 1 · 2</p>
      ) : (
        <p className={`text-center text-xs py-2 font-medium ${answered === 'knew' ? 'text-gwc-success' : 'text-gwc-error'}`}>
          {answered === 'knew' ? '✓ Nice, next one coming…' : '✗ We\'ll come back to this'}
        </p>
      )}
    </div>
  )
}

// ─── Browse demo ──────────────────────────────────────────────────────────────

const FALLBACK_BROWSE: (DemoSentence & { added: boolean })[] = [
  { de: 'Ich bin super müde heute.', en: 'I am super tired today.', added: false },
  { de: 'Das ist mein Lieblingsessen.', en: 'That is my favourite food.', added: false },
  { de: 'Wo wohnst du gerade?', en: 'Where do you live right now?', added: false },
  { de: 'Ich lerne Deutsch seit einem Jahr.', en: 'I\'ve been learning German for a year.', added: false },
]

function BrowseDemo({ sentences: initialSentences, videoTitle }: { sentences?: DemoSentence[]; videoTitle?: string }) {
  const base = (initialSentences ?? FALLBACK_BROWSE).map(s => ({ ...s, added: false }))
  const [sentences, setSentences] = useState(base)

  useEffect(() => {
    setSentences((initialSentences ?? FALLBACK_BROWSE).map(s => ({ ...s, added: false })))
  }, [initialSentences])

  const added = sentences.filter(s => s.added).length

  function toggle(i: number) {
    setSentences(prev => prev.map((s, idx) => idx === i ? { ...s, added: !s.added } : s))
  }

  return (
    <div className="bg-gwc-panel rounded-2xl border border-gwc-text/8 p-5 shadow-sm max-w-sm mx-auto">
      {/* Mock video header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gwc-text/6">
        <div className="w-10 h-10 rounded-lg bg-gwc-accent/12 flex items-center justify-center shrink-0 text-lg">📱</div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-sm text-gwc-text truncate">{videoTitle ?? 'I speak SLOW German everyday'}</p>
          <p className="font-mono text-[10px] text-gwc-muted mt-0.5 tracking-wide uppercase">{added}/{sentences.length} sentences saved</p>
        </div>
      </div>

      {/* Progress */}
      <div className="h-0.5 bg-gwc-text/8 rounded-full mb-4 overflow-hidden">
        <div className="h-full bg-gwc-accent rounded-full transition-all duration-300" style={{ width: `${(added / sentences.length) * 100}%` }} />
      </div>

      {/* Sentences */}
      <div className="space-y-2">
        {sentences.map((s, i) => (
          <div key={i} className={`rounded-xl border p-3 transition-all duration-200 ${s.added ? 'border-gwc-accent/25 bg-gwc-accent/5' : 'border-gwc-text/6'}`}>
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm text-gwc-text leading-snug">{s.de}</p>
                <p className="text-xs text-gwc-muted mt-0.5">{s.en}</p>
              </div>
              <button
                onClick={() => toggle(i)}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  s.added ? 'bg-gwc-accent/15 text-gwc-accent' : 'border border-gwc-text/10 text-gwc-muted hover:border-gwc-accent/30 hover:text-gwc-accent'
                }`}
              >
                {s.added ? '✓' : '+'}
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
    q: 'How is this different from just watching your videos?',
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
    <div className="max-w-2xl mx-auto space-y-2">
      {FAQS.map((faq, i) => (
        <div key={i} className="border border-gwc-text/8 rounded-xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 hover:bg-gwc-raised/40 transition-colors"
          >
            <span className="font-display text-gwc-text text-sm leading-snug">{faq.q}</span>
            <span className={`text-gwc-accent shrink-0 transition-transform duration-200 text-lg ${open === i ? 'rotate-45' : ''}`}>+</span>
          </button>
          {open === i && (
            <div className="px-5 pb-5 text-gwc-muted text-sm leading-relaxed border-t border-gwc-text/6 pt-4">
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
  const [stats, setStats] = useState<{ videos: number; sentences: number } | null>(null)
  const [demoSentences, setDemoSentences] = useState<DemoSentence[]>([])
  const [demoVideoTitle, setDemoVideoTitle] = useState<string | undefined>()

  useEffect(() => {
    async function loadStats() {
      const [{ count: videos }, { count: sentences }] = await Promise.all([
        supabase.from('gwc_videos').select('*', { count: 'exact', head: true }).eq('is_draft', false),
        supabase.from('gwc_video_sentences').select('gwc_videos!inner(is_draft)', { count: 'exact', head: true }).eq('gwc_videos.is_draft', false),
      ])
      setStats({ videos: videos ?? 0, sentences: sentences ?? 0 })
    }

    async function loadDemoSentences() {
      // Pick the first published video with sentences
      const { data: video } = await supabase
        .from('gwc_videos')
        .select('id, title')
        .eq('is_draft', false)
        .order('sort_order', { ascending: true })
        .limit(1)
        .single()

      if (!video) return

      const { data: sents } = await supabase
        .from('gwc_video_sentences')
        .select('sentence_de, sentence_en, highlight_de')
        .eq('video_id', video.id)
        .order('sort_order', { ascending: true })
        .limit(4)

      if (sents && sents.length >= 3) {
        setDemoVideoTitle(video.title)
        setDemoSentences(sents.map(s => ({
          de: s.sentence_de,
          en: s.sentence_en,
          hl: s.highlight_de,
        })))
      }
    }

    loadStats()
    loadDemoSentences()
  }, [])

  const howRef    = useFadeIn()
  const demoRef   = useFadeIn()
  const forWhoRef = useFadeIn()
  const faqRef    = useFadeIn()
  const caroRef   = useFadeIn()

  return (
    <div className="min-h-screen bg-gwc-base text-gwc-text">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-gwc-base/90 backdrop-blur-md border-b border-gwc-text/6">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-md bg-gwc-text flex items-center justify-center">
              <span className="font-display text-gwc-base text-sm font-bold italic">C</span>
            </div>
            <span className="font-display text-gwc-text text-base font-semibold hidden sm:block">German with Caro</span>
            <span className="font-display text-gwc-text text-base font-semibold sm:hidden">GWC</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gwc-muted">
            <a href="#how" className="hover:text-gwc-text transition-colors">How it works</a>
            <a href="#for-who" className="hover:text-gwc-text transition-colors">Who it's for</a>
            <a href="#caro" className="hover:text-gwc-text transition-colors">About</a>
            <a href="#faq" className="hover:text-gwc-text transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="px-4 py-2 rounded-lg border border-gwc-text/12 text-gwc-muted text-sm hover:text-gwc-text hover:border-gwc-text/20 transition-colors">
              Log in
            </Link>
            <Link href="/videos" className="px-4 py-2 rounded-lg bg-gwc-text text-gwc-base text-sm font-semibold hover:opacity-90 transition-opacity">
              Browse videos →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="pt-20 pb-10 px-5 relative overflow-hidden">
        {/* blush background blob */}
        <div className="absolute -top-20 -right-32 w-[500px] h-[380px] rounded-full opacity-40 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, #f4dce5 0%, #ecd7e4 50%, transparent 80%)' }} />

        <div className="max-w-2xl mx-auto lg:max-w-5xl relative">
          <div className="lg:grid lg:grid-cols-[1fr,340px] lg:gap-16 lg:items-start">

            {/* Left: text */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-gwc-text/10 bg-gwc-panel mb-6">
                <span className="font-mono text-[9px] text-gwc-base bg-gwc-accent px-2 py-0.5 rounded-full tracking-widest uppercase font-bold">New</span>
                <span className="font-tight text-xs text-gwc-muted">
                  {stats
                    ? `${stats.videos} videos · ${stats.sentences}+ sentences`
                    : '142 videos · 900+ sentences'}
                </span>
              </div>

              <h1 className="font-display text-[clamp(3rem,8vw,5.5rem)] leading-[0.95] tracking-[-0.04em] text-gwc-text mb-5">
                Learn German from<br />
                the videos you{' '}
                <em className="italic text-gwc-accent">already watch.</em>
              </h1>

              <p className="font-display text-lg sm:text-xl text-gwc-muted leading-relaxed mb-8 max-w-lg" style={{ fontStyle: 'normal' }}>
                The study companion to Caro's TikToks, Reels and Shorts. Pick what catches your ear.{' '}
                <em className="italic">Review until it sticks.</em>
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-6 max-w-sm lg:max-w-none">
                <Link
                  href="/videos"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-gwc-text text-gwc-base font-semibold text-base hover:opacity-90 transition-opacity shadow-lg"
                  style={{ boxShadow: '0 4px 16px rgba(43,27,58,0.16)' }}
                >
                  Start learning — free
                </Link>
                <a
                  href="#how"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3.5 rounded-xl border border-gwc-text/12 text-gwc-muted font-medium hover:border-gwc-text/20 hover:text-gwc-text transition-colors"
                >
                  ▶ How it works
                </a>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-3">
                <div className="flex">
                  {['#6b2b5e','#c79b3a','#5e7b56','#bca8bb'].map((bg, i) => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-gwc-base" style={{ background: bg, marginLeft: i === 0 ? 0 : -8 }} />
                  ))}
                </div>
                <p className="font-tight text-xs text-gwc-muted">12K+ learners · IG, TikTok, YouTube</p>
              </div>
            </div>

            {/* Right: Caro photo mockup — hidden on mobile, shown on lg */}
            <div className="hidden lg:block mt-2">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: '9/14', boxShadow: '0 2px 6px rgba(43,27,58,0.08), 0 20px 50px rgba(43,27,58,0.18)' }}>
                <img src="/caro.jpg" alt="Caro" className="w-full h-full object-cover" style={{ filter: 'brightness(0.9) contrast(1.05)' }} />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(43,27,58,0.08) 0%, rgba(43,27,58,0.04) 40%, rgba(43,27,58,0.72) 100%)' }} />
                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-gwc-base text-gwc-text tracking-widest uppercase">A1</span>
                  <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-gwc-accent text-gwc-base tracking-widest uppercase">● Live</span>
                </div>
                {/* Play button */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-gwc-base/95 flex items-center justify-center">
                  <div className="w-0 h-0 ml-1" style={{ borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '14px solid #6b2b5e' }} />
                </div>
                {/* Bottom title */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="font-mono text-[9px] tracking-widest uppercase opacity-80 mb-1">Sample video</p>
                  <p className="font-display text-base leading-tight">German pronouns explained in 60 seconds</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social strip ───────────────────────────────────────────────────── */}
      <section className="py-8 px-5 border-t border-b border-gwc-text/6 bg-gwc-raised/40">
        <div className="max-w-2xl mx-auto">
          <p className="font-display text-sm italic text-gwc-muted text-center mb-5">Seen by learners across —</p>
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { n: '8.9K', l: 'TikTok' },
              { n: '3.7K', l: 'Instagram' },
              { n: '249',  l: 'YouTube' },
            ].map(s => (
              <div key={s.l}>
                <p className="font-display text-2xl sm:text-3xl font-semibold text-gwc-text tracking-tight">{s.n}</p>
                <p className="font-mono text-[9px] text-gwc-muted tracking-widest uppercase mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section id="how" className="py-20 px-5" ref={howRef}>
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <p className="font-mono text-[10px] text-gwc-accent tracking-widest uppercase font-semibold mb-3">01 — How it works</p>
            <h2 className="font-display text-4xl text-gwc-text leading-tight">
              A simple loop.<br />
              <em className="italic text-gwc-muted">Watch. Pick. Review.</em>
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                n: '01',
                title: 'Watch a video',
                desc: 'Browse the library. Each video is tagged A1–C1 so you can start where it makes sense.',
              },
              {
                n: '02',
                title: 'Pick your sentences',
                desc: 'Tap the sentences that catch you — words you want to remember, phrases that felt useful. Straight into your deck.',
              },
              {
                n: '03',
                title: 'Review until it sticks',
                desc: "Flip cards. Rate yourself honestly. The algorithm handles when they come back — you just show up.",
              },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex gap-5 bg-gwc-panel rounded-xl border border-gwc-text/6 p-5 hover:border-gwc-text/12 transition-colors">
                <p className="font-mono text-xs text-gwc-accent font-semibold shrink-0 pt-0.5">{n}</p>
                <div>
                  <p className="font-display text-base text-gwc-text font-semibold mb-1">{title}</p>
                  <p className="text-sm text-gwc-muted leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Try it ─────────────────────────────────────────────────────────── */}
      <section className="py-16 px-5 bg-gwc-raised/40" ref={demoRef}>
        <div className="max-w-2xl mx-auto">
          <p className="font-mono text-[10px] text-gwc-accent tracking-widest uppercase font-semibold mb-3">02 — Try it</p>
          <h2 className="font-display text-3xl text-gwc-text mb-6">
            A real card from the app.
          </h2>
          <div className="flex gap-1 p-1 bg-gwc-panel rounded-xl border border-gwc-text/6 mb-4 w-fit">
            {(['browse', 'review'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveDemo(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                  activeDemo === tab ? 'bg-gwc-text text-gwc-base font-semibold' : 'text-gwc-muted hover:text-gwc-text'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {activeDemo === 'browse'
            ? <BrowseDemo sentences={demoSentences.length >= 3 ? demoSentences : undefined} videoTitle={demoVideoTitle} />
            : <FlipCardDemo sentences={demoSentences.length >= 3 ? demoSentences.slice(0, 3) : undefined} />
          }
        </div>
      </section>

      {/* ── Who it's for ───────────────────────────────────────────────────── */}
      <section id="for-who" className="py-20 px-5" ref={forWhoRef}>
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <p className="font-mono text-[10px] text-gwc-accent tracking-widest uppercase font-semibold mb-3">03 — Who it's for</p>
            <h2 className="font-display text-4xl text-gwc-text leading-tight">This is for you if…</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                title: 'You already follow me on TikTok, Instagram or YouTube Shorts',
                desc: "You watch the videos. You understand the concept. But it doesn't stick the way you want it to. This is where you take what you've seen and actually make it yours.",
                tag: 'GWC Community',
              },
              {
                title: 'You want to learn real, usable German',
                desc: "Not textbook sentences. Not random vocabulary lists. The sentences here come from real videos — the kind of German you'd actually use or hear in conversation.",
                tag: 'Real German',
              },
              {
                title: "You've tried other apps and got bored",
                desc: "Duolingo felt too gamey. Anki was too much effort to set up. Here the content is already there. Pick the sentences that interest you and review them. That's it.",
                tag: 'Self-Learners',
              },
            ].map(({ title, desc, tag }) => (
              <div key={title} className="bg-gwc-panel rounded-xl border border-gwc-text/6 p-6 hover:border-gwc-text/12 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <p className="font-display text-gwc-text font-semibold leading-snug">{title}</p>
                      <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-gwc-accent/10 text-gwc-accent tracking-widest uppercase font-semibold">{tag}</span>
                    </div>
                    <p className="text-sm text-gwc-muted leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About Caro ─────────────────────────────────────────────────────── */}
      <section id="caro" className="py-20 px-5 bg-gwc-raised/40" ref={caroRef}>
        <div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <p className="font-mono text-[10px] text-gwc-accent tracking-widest uppercase font-semibold mb-3">04 — The founder</p>
          </div>
          <div className="grid sm:grid-cols-[auto,1fr] gap-8 items-start">
            <img
              src="/caro.jpg"
              alt="Caro"
              className="w-32 h-40 rounded-xl object-cover border border-gwc-text/8"
            />
            <div>
              <h2 className="font-display text-4xl text-gwc-text mb-4">
                Hi, I'm <em className="italic text-gwc-accent">Caro.</em>
              </h2>
              <p className="text-gwc-muted leading-relaxed mb-3 text-sm">
                I'm not German — I got fluent by living and working in Germany. I know what it's like to learn this language as an outsider, what actually works, and what's just a waste of time. I make German content on TikTok, Instagram and YouTube Shorts, and people kept asking where they could actually practise the sentences from my videos. I couldn't find anything good, so I built it myself.
              </p>
              <p className="text-gwc-muted leading-relaxed mb-5 text-sm">
                Every video, every sentence, every translation in here is made by me. This is the study companion to go with the content you're already watching.
              </p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { href: 'https://www.tiktok.com/@germanwithcaro', label: 'TikTok' },
                  { href: 'https://www.instagram.com/germanwithcaroo', label: 'Instagram' },
                  { href: 'https://www.youtube.com/@germanwithcaro', label: 'YouTube Shorts' },
                ].map(({ href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg border border-gwc-text/10 text-gwc-muted hover:text-gwc-text hover:border-gwc-text/20 transition-colors font-mono text-[10px] tracking-widest uppercase"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-5" ref={faqRef}>
        <div className="max-w-2xl mx-auto">
          <div className="mb-10">
            <p className="font-mono text-[10px] text-gwc-accent tracking-widest uppercase font-semibold mb-3">05 — Questions</p>
            <h2 className="font-display text-4xl text-gwc-text">FAQ</h2>
          </div>
          <FAQ />
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-5 bg-gwc-raised/40">
        <div className="max-w-2xl mx-auto">
          <div className="mb-12">
            <p className="font-mono text-[10px] text-gwc-accent tracking-widest uppercase font-semibold mb-3">06 — Pricing</p>
            <h2 className="font-display text-4xl text-gwc-text mb-2">Simple.</h2>
            <p className="text-gwc-muted">Browse videos for free. Pay when you want to review.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Free */}
            <div className="bg-gwc-panel rounded-xl border border-gwc-text/6 p-7">
              <p className="font-mono text-[10px] text-gwc-muted tracking-widest uppercase font-semibold mb-4">Free</p>
              <p className="font-display text-4xl text-gwc-text mb-1">€0</p>
              <p className="text-xs text-gwc-muted mb-6">forever</p>
              <ul className="space-y-3">
                {['Browse all videos', 'See sentences + translations', 'Filter by level'].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gwc-muted">
                    <span className="text-gwc-accent font-bold text-xs">✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>
            {/* Pro */}
            <div className="bg-gwc-panel rounded-xl border-2 border-gwc-accent/40 p-7">
              <p className="font-mono text-[10px] text-gwc-accent tracking-widest uppercase font-semibold mb-4">Pro</p>
              <p className="font-display text-4xl text-gwc-text mb-1">€4.99</p>
              <p className="text-xs text-gwc-muted mb-6">per month · cancel any time</p>
              <ul className="space-y-3 mb-7">
                {['Everything in Free', 'Save sentences to your deck', 'Daily SRS review', 'Track your progress'].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gwc-muted">
                    <span className="text-gwc-accent font-bold text-xs">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="block text-center py-3 rounded-xl bg-gwc-text text-gwc-base font-semibold hover:opacity-90 transition-opacity">
                Get started →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-5 border-t border-gwc-text/6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-5xl text-gwc-text mb-4 leading-tight">
            Start with one<br />
            <em className="italic text-gwc-accent">sentence.</em>
          </h2>
          <p className="text-gwc-muted mb-8 text-lg">
            Browse the video library. Add what catches you. Review when you're ready.
          </p>
          <Link
            href="/videos"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gwc-text text-gwc-base font-semibold text-base hover:opacity-90 transition-opacity"
          >
            Browse videos — it's free
          </Link>
          <p className="text-xs text-gwc-dim mt-4">No credit card · No commitment</p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gwc-text/6 py-8 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gwc-dim">
          <span className="font-display italic">German with Caro</span>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-gwc-muted transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gwc-muted transition-colors">Terms</Link>
            <Link href="/login" className="hover:text-gwc-muted transition-colors">Log in</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}

export default function Home() {
  return <LandingContent />
}
