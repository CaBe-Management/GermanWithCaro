'use client'

// AppNav — navigation links + logout button for the app header
// Highlights the current page and works on mobile
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Library, BookOpen, User, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AppNav() {
  const pathname = usePathname()
  const router = useRouter()

  // Navigation links
  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/library', label: 'My Lessons', icon: Library },
    { href: '/review', label: 'Review', icon: BookOpen },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1">
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition',
              isActive
                ? 'bg-primary-bg text-primary'
                : 'text-text3 hover:bg-surface hover:text-text2'
            )}
          >
            <link.icon size={16} />
            {/* Hide label on very small screens to save space */}
            <span className="hidden sm:inline">{link.label}</span>
          </Link>
        )
      })}

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="ml-1 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-text3 transition hover:bg-surface hover:text-text2"
      >
        <LogOut size={16} />
        <span className="hidden sm:inline">Log out</span>
      </button>
    </div>
  )
}
