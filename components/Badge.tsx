'use client'

interface BadgeProps {
  type: 'typ' | 'level' | 'srs'
  value: string
}

export default function Badge({ type, value }: BadgeProps) {
  const getClassName = () => {
    switch (type) {
      case 'typ':
        if (value === 'NOMEN') return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
        if (value === 'VERB') return 'bg-green-500/20 text-green-400 border border-green-500/30'
        if (value === 'ADJEKTIV') return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
        if (value === 'GRAMMATIK') return 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30'
        return 'bg-text-muted/10 text-text-muted border border-text-muted/20'
      case 'level':
        return 'bg-accent-purple/20 text-accent-violet border border-accent-purple/30'
      case 'srs':
        return 'bg-text-muted/10 text-text-muted border border-text-muted/20'
      default:
        return 'bg-text-muted/10 text-text-muted border border-text-muted/20'
    }
  }

  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getClassName()}`}>
      {value}
    </span>
  )
}
