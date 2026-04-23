import Link from 'next/link'

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-gwc-base">
      <div className="max-w-2xl mx-auto px-5 py-12">

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gwc-muted hover:text-gwc-text transition-colors mb-8">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold text-gwc-text mb-2">Impressum</h1>
        <p className="text-gwc-muted text-sm mb-10">Legal notice</p>

        <section className="mb-8">
          <h2 className="text-base font-bold text-gwc-text mb-3">Information pursuant to § 5 TMG</h2>
          <p className="text-gwc-muted leading-relaxed">
            Caroline Betti<br />
            German With Caro<br />
            7, rue Vauban<br />
            Luxembourg
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-gwc-text mb-3">Contact</h2>
          <p className="text-gwc-muted leading-relaxed">
            <a
              href="mailto:cabe.management@gmail.com"
              className="text-gwc-accent hover:text-gwc-accent-soft transition-colors"
            >
              cabe.management@gmail.com
            </a>
          </p>
        </section>

        <div className="border-t border-white/5 pt-8 flex flex-wrap gap-4 text-xs text-gwc-muted">
          <Link href="/privacy" className="hover:text-gwc-text transition-colors">Privacy Policy</Link>
          <Link href="/cookies" className="hover:text-gwc-text transition-colors">Cookie Policy</Link>
          <Link href="/terms"   className="hover:text-gwc-text transition-colors">Terms of Use</Link>
        </div>

      </div>
    </div>
  )
}
