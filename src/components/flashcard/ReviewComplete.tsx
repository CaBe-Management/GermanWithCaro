// ReviewComplete — shown when all due flashcards have been reviewed (or there were none)
import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'

export default function ReviewComplete({ reviewed }: { reviewed: number }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm text-center">
        {/* Success icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <Check size={32} className="text-success" />
        </div>

        {/* Message */}
        <h1 className="mt-4 text-xl font-bold text-text">
          {reviewed === 0 ? 'No reviews due!' : 'All done!'}
        </h1>
        <p className="mt-2 text-sm text-text3">
          {reviewed === 0
            ? "You're all caught up. Come back later or start a new lesson."
            : `You reviewed ${reviewed} card${reviewed === 1 ? '' : 's'}. Great work!`}
        </p>

        {/* Link back to dashboard */}
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gold-light"
        >
          Back to Dashboard
          <ArrowRight size={14} />
        </Link>
      </div>
    </main>
  )
}
