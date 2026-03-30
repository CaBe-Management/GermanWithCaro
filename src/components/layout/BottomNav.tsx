'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, RotateCcw, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/lessons', label: 'Lessons', icon: BookOpen },
  { href: '/review', label: 'Review', icon: RotateCcw },
  { href: '/profile', label: 'Profile', icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 flex h-[60px] w-full max-w-[520px] -translate-x-1/2 items-center justify-around border-t border-border-light bg-bg-card">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors',
              isActive ? 'text-primary' : 'text-text-3'
            )}
          >
            <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
