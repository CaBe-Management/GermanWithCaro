import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gwc-base flex items-center justify-center px-5">
      <div className="w-full max-w-sm text-center">

        <div className="text-7xl mb-6">🇩🇪</div>

        <h1 className="text-6xl font-black text-gwc-accent mb-3">404</h1>

        <p className="text-2xl font-bold text-gwc-text mb-2">
          Diese Seite gibt es nicht
        </p>
        <p className="text-gwc-muted mb-10">
          That page doesn&apos;t exist — but your German journey does.
        </p>

        <Link
          href="/dashboard"
          className="inline-block py-3.5 px-8 rounded-xl bg-gwc-accent text-white font-bold text-base hover:bg-gwc-accent-soft transition-colors"
        >
          Back to dashboard
        </Link>

        <p className="mt-5 text-sm text-gwc-muted">
          Or go to the{' '}
          <Link href="/" className="text-gwc-accent-soft hover:underline">
            home page
          </Link>
        </p>

      </div>
    </div>
  )
}
