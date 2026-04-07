'use client'

interface StatsCardProps {
  label: string
  value: string | number
  icon?: string
  color?: 'purple' | 'orange' | 'success' | 'muted'
}

export default function StatsCard({ label, value, icon, color = 'purple' }: StatsCardProps) {
  const getColorClass = () => {
    switch (color) {
      case 'orange':
        return 'text-orange-500'
      case 'success':
        return 'text-success'
      case 'muted':
        return 'text-text-muted'
      default:
        return 'text-accent-purple'
    }
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-muted text-sm font-medium mb-2">{label}</p>
          <p className={`text-4xl font-bold ${getColorClass()}`}>{value}</p>
        </div>
        {icon && <span className="text-3xl">{icon}</span>}
      </div>
    </div>
  )
}
