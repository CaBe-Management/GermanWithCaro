// TextBlock — renders a text content block inside a lesson
// Supports [grammar] syntax which gets turned into styled GrammarChip pills
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
  // The content field is a JSONB object — we expect { text: "..." } format
  const content = block.content as { text?: string } | null
  const text = content?.text ?? ''

  if (!text) return null

  // Split by newlines so each paragraph gets its own <p> tag
  const paragraphs = text.split('\n').filter((p) => p.trim())

  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, i) => (
        <p key={i} className="text-sm leading-relaxed text-text2">
          {parseContent(paragraph)}
        </p>
      ))}
    </div>
  )
}
