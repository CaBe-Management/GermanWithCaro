export default function ProgressBar({
  value,
  className,
}: {
  value: number // 0-100
  className?: string
}) {
  return (
    <div className={`h-[7px] w-full rounded-full bg-border ${className ?? ''}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] transition-[width] duration-400 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
