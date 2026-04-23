import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gwc-base">
      <div className="max-w-2xl mx-auto px-5 py-12">

        <h1 className="text-3xl font-bold text-gwc-text mb-2">Terms of Use</h1>
        <p className="text-gwc-muted text-sm mb-10">Last updated: April 2026</p>

        <div className="space-y-8 text-gwc-muted leading-relaxed">

          <section>
            <h2 className="text-base font-bold text-gwc-text mb-3">1. About the app</h2>
            <p>
              German With Caro is a free German vocabulary learning application. By creating an account and
              using the app, you agree to these terms. If you do not agree, please do not use the app.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gwc-text mb-3">2. Your account</h2>
            <p className="mb-3">
              You must provide a valid email address to register. You are responsible for:
            </p>
            <ul className="space-y-1.5">
              {[
                'Keeping your login credentials secure',
                'All activity that occurs under your account',
                'Ensuring your email address remains current',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-gwc-accent mt-0.5 shrink-0">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              We reserve the right to suspend or delete accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gwc-text mb-3">3. Acceptable use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="space-y-1.5">
              {[
                'Use the app for any unlawful purpose',
                'Attempt to access, scrape, or copy content or data at scale',
                'Interfere with or disrupt the app or its infrastructure',
                'Circumvent any security or authentication measures',
                'Create accounts by automated means',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-gwc-error mt-0.5 shrink-0">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gwc-text mb-3">4. Content</h2>
            <p>
              All vocabulary, example sentences, and learning content in the app are provided for personal,
              non-commercial educational use only. The content is the property of German With Caro or its
              licensors and may not be reproduced, distributed, or used outside the app without permission.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gwc-text mb-3">5. Availability</h2>
            <p>
              The app is provided free of charge on an "as-is" basis. We make no guarantees about uptime,
              availability, or continuity of the service. We may change, suspend, or discontinue the app at
              any time without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gwc-text mb-3">6. Disclaimer of warranties</h2>
            <p>
              The app is provided without warranties of any kind, express or implied. We do not guarantee that
              the content is accurate, complete, or suitable for any particular purpose. Use of the app is at
              your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gwc-text mb-3">7. Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, German With Caro shall not be liable for any indirect,
              incidental, or consequential damages arising from your use of, or inability to use, the app.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gwc-text mb-3">8. Governing law</h2>
            <p>
              These terms are governed by the laws of Luxembourg. Any disputes shall be subject to the exclusive
              jurisdiction of the courts of Luxembourg.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gwc-text mb-3">9. Changes to these terms</h2>
            <p>
              We may update these terms from time to time. Continued use of the app after changes are posted
              constitutes acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gwc-text mb-3">10. Contact</h2>
            <p>
              For questions about these terms, please contact us using the details in the{' '}
              <Link href="/impressum" className="text-gwc-accent hover:text-gwc-accent-soft transition-colors">
                Impressum
              </Link>.
            </p>
          </section>

        </div>

        <div className="border-t border-white/5 mt-12 pt-8 flex flex-wrap gap-4 text-xs text-gwc-muted">
          <Link href="/impressum" className="hover:text-gwc-text transition-colors">Impressum</Link>
          <Link href="/privacy"   className="hover:text-gwc-text transition-colors">Privacy Policy</Link>
          <Link href="/cookies"   className="hover:text-gwc-text transition-colors">Cookie Policy</Link>
        </div>

      </div>
    </div>
  )
}
