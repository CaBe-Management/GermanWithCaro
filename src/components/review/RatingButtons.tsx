// RatingButtons — "Again 🔁" and "Got it! ✓" buttons
import Button from '@/components/ui/Button'

export default function RatingButtons({
  onAgain,
  onGotIt,
}: {
  onAgain: () => void
  onGotIt: () => void
}) {
  return (
    <div className="flex gap-3">
      <Button variant="secondary" onClick={onAgain} fullWidth>
        Again 🔁
      </Button>
      <Button onClick={onGotIt} fullWidth>
        Got it! ✓
      </Button>
    </div>
  )
}
