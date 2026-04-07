import Link from 'next/link'

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <div className="max-w-2xl mx-auto px-5 py-12">

        <h1 className="text-3xl font-bold text-[#e8e6f0] mb-2">Impressum</h1>
        <p className="text-[#9b98b0] text-sm mb-10">Legal notice</p>

        <section className="mb-8">
          <h2 className="text-base font-bold text-[#e8e6f0] mb-3">Information pursuant to § 5 TMG</h2>
          <p className="text-[#9b98b0] leading-relaxed">
            Caroline Betti<br />
            German With Caro<br />
            7, rue Vauban<br />
            Luxembourg
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-base font-bold text-[#e8e6f0] mb-3">Contact</h2>
          <p className="text-[#9b98b0] leading-relaxed">
            <a
              href="mailto:cabe.management@gmail.com"
              className="text-[#7c6df2] hover:text-[#9b8cf5] transition-colors"
            >
              cabe.management@gmail.com
            </a>
          </p>
        </section>

        <div className="border-t border-white/5 pt-8 flex flex-wrap gap-4 text-xs text-[#9b98b0]">
          <Link href="/privacy" className="hover:text-[#e8e6f0] transition-colors">Privacy Policy</Link>
          <Link href="/cookies" className="hover:text-[#e8e6f0] transition-colors">Cookie Policy</Link>
          <Link href="/terms"   className="hover:text-[#e8e6f0] transition-colors">Terms of Use</Link>
        </div>

      </div>
    </div>
  )
}
