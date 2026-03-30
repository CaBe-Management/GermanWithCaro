import { cn } from '@/lib/utils'

// PageCard — the main card shell used on most app pages
// Has optional header, content area, and footer sections
export function PageCardHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('border-b border-border-light px-[22px] py-[18px]', className)}>
      {children}
    </div>
  )
}

export function PageCardContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('px-[22px] py-6', className)}>
      {children}
    </div>
  )
}

export function PageCardFooter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('border-t border-border-light px-[22px] py-[18px]', className)}>
      {children}
    </div>
  )
}

export default function PageCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[20px] bg-bg-card shadow-[0_4px_24px_rgba(0,0,0,0.08)]',
        className
      )}
    >
      {children}
    </div>
  )
}
