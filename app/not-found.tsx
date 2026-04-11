import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center px-5">
      <div className="w-full max-w-sm text-center">

        <div className="text-7xl mb-6">🇩🇪</div>

        <h1 className="text-6xl font-black text-[#7c6df2] mb-3">404</h1>

        <p className="text-2xl font-bold text-[#e8e6f0] mb-2">
          Diese Seite gibt es nicht
        </p>
        <p className="text-[#9b98b0] mb-10">
          That page doesn&apos;t exist — but your German journey does.
        </p>

        <Link
          href="/dashboard"
          className="inline-block py-3.5 px-8 rounded-xl bg-[#7c6df2] text-white font-bold text-base hover:bg-[#9b8cf5] transition-colors"
        >
          Back to dashboard
        </Link>

        <p className="mt-5 text-sm text-[#9b98b0]">
          Or go to the{' '}
          <Link href="/" className="text-[#9b8cf5] hover:underline">
            home page
          </Link>
        </p>

      </div>
    </div>
  )
}
