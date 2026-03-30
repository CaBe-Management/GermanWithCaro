// TextBlock — styled text content with left purple border
import type { LessonBlock } from '@/types'

export default function TextBlock({ block }: { block: LessonBlock }) {
  const content = block.content as { heading?: string; text?: string } | null
  const heading = content?.heading
  const text = content?.text ?? ''

  if (!text && !heading) return null

  const paragraphs = text.split(/\n\n/).map((p) => p.trim()).filter(Boolean)

  return (
    <div className="rounded-2xl border-l-4 border-primary bg-bg-subtle px-[22px] py-5">
      {heading && (
        <p className="mb-3 text-[13px] font-bold uppercase tracking-[1.2px] text-primary">
          {heading}
        </p>
      )}
      <div className="space-y-3">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-[15px] leading-[1.7] text-[#334155]">
            {p.split('\n').map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
        ))}
      </div>
    </div>
  )
}
