import { cn } from '@/lib/utils'

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}

export default function Input({
  label,
  error,
  className,
  id,
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="text-[13px] font-semibold text-text-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'w-full rounded-xl border-[1.5px] bg-bg-subtle px-4 py-3 text-[15px] text-text-1 outline-none transition-all',
          error
            ? 'border-error bg-error-bg'
            : 'border-border focus:border-primary focus:bg-bg-card focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-[13px] text-error">{error}</p>
      )}
    </div>
  )
}
