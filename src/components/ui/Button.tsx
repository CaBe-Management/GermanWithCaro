import { cn } from '@/lib/utils'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
  fullWidth?: boolean
}

export default function Button({
  variant = 'primary',
  fullWidth = true,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-[14px] px-5 py-[14px] text-[15px] font-bold transition-all duration-150',
        'active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none',
        variant === 'primary' && [
          'bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white',
          'shadow-[0_4px_14px_rgba(99,102,241,0.30)]',
          'hover:opacity-[0.92]',
        ],
        variant === 'secondary' && [
          'bg-bg-page text-text-2',
          'hover:bg-border',
        ],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
