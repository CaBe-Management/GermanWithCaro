// TextBlock — renders a text content block inside a lesson
// Supports headings (content.heading), [grammar] chips, and paragraph spacing
import GrammarChip from '@/components/lesson/GrammarChip'
import type { LessonBlock } from '@/types'

// Parse text content and replace [grammar] tags with styled chips
function parseContent(text: string) {
  // Split on [text] patterns — keeps the matched groups too
  const parts = text.split(/(\[[^\]]+\])/)

  return parts.map((part, i) => {
    // Check if this part is a [grammar] tag
    if (part.startsWith('[') && part.endsWith(']')) {
      const label = part.slice(1, -1) // remove the brackets
      return <GrammarChip key={i} label={label} />
    }
    // Regular text
    return <span key={i}>{part}</span>
  })
}

export default function TextBlock({ block }: { block: LessonBlock }) {
  // The content field is a JSONB object — { heading?: "...", text: "..." }
  const content = block.content as { heading?: string; text?: string } | null
  const heading = content?.heading
  const text = content?.text ?? ''

  if (!text && !heading) return null

  // Split on double newlines for proper paragraph separation
  const paragraphs = text.split(/\n\n/).map((p) => p.trim()).filter(Boolean)

  return (
    <div>
      {/* Section heading */}
      {heading && (
        <h2 className="mt-8 mb-4 font-display text-[22px] font-semibold text-text">
          {heading}
        </h2>
      )}

      {/* Text content — each double-newline-separated block is a paragraph */}
      <div className="space-y-3">
        {paragraphs.map((paragraph, i) => {
          // Handle single-newline breaks within a paragraph as line breaks
          const lines = paragraph.split('\n')
          return (
            <p key={i} className="text-[15px] leading-relaxed text-text2">
              {lines.map((line, j) => (
                <span key={j}>
                  {j > 0 && <br />}
                  {parseContent(line)}
                </span>
              ))}
            </p>
          )
        })}
      </div>
    </div>
  )
}
