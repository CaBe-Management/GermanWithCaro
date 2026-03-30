import { cn } from '@/lib/utils'

type BadgeProps = {
  variant: 'casual' | 'neutral' | 'formal' | 'tag'
  children: React.ReactNode
  className?: string
}

const styles = {
  casual: 'bg-[#fef3c7] text-[#d97706]',
  neutral: 'bg-bg-page text-text-2',
  formal: 'bg-[#dbeafe] text-[#2563eb]',
  tag: 'bg-primary-bg text-[#8b5cf6]',
}

export default function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-full px-[11px] py-[3px] text-[11px] font-semibold uppercase tracking-[0.3px]',
        variant === 'tag' && 'font-bold tracking-[1.2px]',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
