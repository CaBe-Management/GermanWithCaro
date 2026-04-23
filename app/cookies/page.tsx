import Link from 'next/link'

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gwc-base">
      <div className="max-w-2xl mx-auto px-5 py-12">

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gwc-muted hover:text-gwc-text transition-colors mb-8">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold text-gwc-text mb-2">Cookie Policy</h1>
        <p className="text-gwc-muted text-sm mb-10">Last updated: April 2026</p>

        <div className="space-y-8 text-gwc-muted leading-relaxed">

          <section>
            <h2 className="text-base font-bold text-gwc-text mb-3">What are cookies?</h2>
            <p>
              Cookies are small text files stored in your browser when you visit a website. They are used to keep
              you logged in, remember preferences, and in some cases track behaviour across sites.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gwc-text mb-3">Cookies we use</h2>
            <p className="mb-4">
              German With Caro uses <strong className="text-gwc-text">essential cookies only</strong>. These are
              strictly necessary for the app to function and cannot be disabled without breaking the login system.
            </p>

            {/* Cookie table */}
            <div className="rounded-xl border border-gwc-text/8 overflow-hidden text-sm">
              <div className="grid grid-cols-3 px-4 py-2.5 bg-white/4 text-gwc-text font-semibold text-xs uppercase tracking-wider">
                <span>Cookie</span>
                <span>Provider</span>
                <span>Purpose</span>
              </div>
              {[
                ['sb-access-token',  'Supabase', 'Stores your authentication access token to keep you logged in.'],
                ['sb-refresh-token', 'Supabase', 'Stores a refresh token used to renew your session without re-logging in.'],
              ].map(([name, provider, purpose]) => (
                <div key={name} className="grid grid-cols-3 px-4 py-3 border-t border-gwc-text/6 items-start gap-2">
                  <span className="font-mono text-gwc-accent-soft text-xs break-all">{name}</span>
                  <span>{provider}</span>
                  <span className="text-xs">{purpose}</span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-sm">
              These cookies are set by <strong className="text-gwc-text">Supabase</strong>, our authentication
              and database provider. They are session-management cookies and contain no personal information beyond
              an encrypted token. They expire when you log out or after a standard session period.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gwc-text mb-3">What we do NOT use</h2>
            <ul className="space-y-1.5">
              {[
                'Analytics cookies (e.g. Google Analytics, Plausible)',
                'Advertising or tracking cookies',
                'Social media cookies',
                'Third-party cookies of any kind',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-gwc-error mt-0.5 shrink-0">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gwc-text mb-3">Do I need to consent?</h2>
            <p>
              Because we use only strictly essential cookies (required for the authentication system to function),
              no cookie consent banner is legally required under ePrivacy rules. You cannot opt out of these
              cookies while remaining logged in to the app.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gwc-text mb-3">Managing cookies in your browser</h2>
            <p>
              You can delete cookies at any time through your browser settings. Deleting the Supabase auth cookies
              will log you out of the app. Your learning data will remain saved on our servers and will be
              restored when you log in again.
            </p>
          </section>

        </div>

        <div className="border-t border-gwc-text/6 mt-12 pt-8 flex flex-wrap gap-4 text-xs text-gwc-muted">
          <Link href="/impressum" className="hover:text-gwc-text transition-colors">Impressum</Link>
          <Link href="/privacy"   className="hover:text-gwc-text transition-colors">Privacy Policy</Link>
          <Link href="/terms"     className="hover:text-gwc-text transition-colors">Terms of Use</Link>
        </div>

      </div>
    </div>
  )
}
