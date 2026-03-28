// GrammarChip — small pill that highlights a grammar term inside lesson text
// Used by TextBlock to render [grammar] tags as styled inline chips
export default function GrammarChip({ label }: { label: string }) {
  return (
    <span className="mx-0.5 inline-block rounded-full bg-sage-bg px-2 py-0.5 text-xs font-medium text-sage-dark">
      {label}
    </span>
  )
}
