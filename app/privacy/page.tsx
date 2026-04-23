import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gwc-base">
      <div className="max-w-2xl mx-auto px-5 py-12">

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gwc-muted hover:text-gwc-text transition-colors mb-8">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold text-gwc-text mb-2">Privacy Policy</h1>
        <p className="text-gwc-muted text-sm mb-10">Last updated: April 2026</p>

        <div className="space-y-8 text-gwc-muted leading-relaxed">

          <section>
            <h2 className="text-base font-bold text-gwc-text mb-3">1. Who we are</h2>
            <p>
              German With Caro is a German vocabulary learning application operated from Luxembourg (7, rue Vauban).
              This policy explains what personal data we collect, why we collect it, and how we protect it.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gwc-text mb-3">2. Data we collect</h2>
            <p className="mb-3">We collect only what is necessary to provide the service:</p>
            <ul className="space-y-2 list-none">
              {[
                ['Email address', 'Used to create and identify your account.'],
                ['Learning data', 'Your review history, XP, streak, badges, and daily goal — stored so your progress is saved across sessions.'],
                ['Session data', 'An authentication token stored in a browser cookie to keep you logged in.'],
              ].map(([label, desc]) => (
                <li key={label} className="pl-4 border-l-2 border-gwc-accent/30">
                  <span className="text-gwc-text font-medium">{label}:</span> {desc}
                </li>
              ))}
            </ul>
            <p className="mt-3">
              We do <strong className="text-gwc-text">not</strong> collect analytics data, advertising identifiers,
              device fingerprints, or any other tracking information.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gwc-text mb-3">3. Legal basis (GDPR)</h2>
            <p>
              We process your data on the basis of <strong className="text-gwc-text">contract performance</strong> (Art. 6(1)(b) GDPR) —
              your data is processed solely to deliver the learning service you signed up for.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gwc-text mb-3">4. Data processor — Supabase</h2>
            <p>
              We use <strong className="text-gwc-text">Supabase</strong> (Supabase Inc.) as our backend infrastructure provider.
              Supabase stores your account information and learning data on our behalf and acts as a data processor
              under a Data Processing Agreement. Supabase is GDPR-compliant and may store data on servers in the
              United States or the European Union. For details, see{' '}
              <a
                href="https://supabase.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gwc-accent hover:text-gwc-accent-soft transition-colors underline"
              >
                supabase.com/privacy
              </a>.
            </p>
            <p className="mt-3">
              No other third parties have access to your personal data.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gwc-text mb-3">5. Cookies</h2>
            <p>
              We use only <strong className="text-gwc-text">essential cookies</strong> required for authentication.
              These cookies are set by Supabase to maintain your login session. No analytics, advertising, or
              third-party cookies are used. See our <Link href="/cookies" className="text-gwc-accent hover:text-gwc-accent-soft transition-colors">Cookie Policy</Link> for details.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gwc-text mb-3">6. Data retention</h2>
            <p>
              Your data is retained for as long as your account is active. If you wish to delete your account and
              all associated data, please contact us using the details in the Impressum.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gwc-text mb-3">7. Your rights under GDPR</h2>
            <p className="mb-3">As a user in the European Economic Area, you have the right to:</p>
            <ul className="space-y-1.5 list-none">
              {[
                'Access the personal data we hold about you',
                'Correct inaccurate data',
                'Request deletion of your data ("right to be forgotten")',
                'Receive your data in a portable format',
                'Restrict or object to processing',
                'Lodge a complaint with your local data protection authority',
              ].map(right => (
                <li key={right} className="flex items-start gap-2">
                  <span className="text-gwc-accent mt-0.5 shrink-0">·</span>
                  <span>{right}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at the address listed in the{' '}
              <Link href="/impressum" className="text-gwc-accent hover:text-gwc-accent-soft transition-colors">Impressum</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gwc-text mb-3">8. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. Any changes will be posted on this page with an
              updated date. Continued use of the app after changes constitutes acceptance of the updated policy.
            </p>
          </section>

        </div>

        <div className="border-t border-white/5 mt-12 pt-8 flex flex-wrap gap-4 text-xs text-gwc-muted">
          <Link href="/impressum" className="hover:text-gwc-text transition-colors">Impressum</Link>
          <Link href="/cookies"   className="hover:text-gwc-text transition-colors">Cookie Policy</Link>
          <Link href="/terms"     className="hover:text-gwc-text transition-colors">Terms of Use</Link>
        </div>

      </div>
    </div>
  )
}
