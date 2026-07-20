'use client'

import {
  Award,
  BarChart3,
  BookOpen,
  ClipboardList,
  Compass,
  Globe,
  GraduationCap,
  HelpCircle,
  Home,
  LayoutDashboard,
  MessagesSquare,
  School,
  Settings,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { navForRole } from '@/lib/roles'
import { useAuthStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const ICONS: Record<string, LucideIcon> = {
  home: Home,
  dashboard: LayoutDashboard,
  book: BookOpen,
  grad: GraduationCap,
  clipboard: ClipboardList,
  school: School,
  chart: BarChart3,
  globe: Globe,
  users: Users,
  settings: Settings,
  compass: Compass,
  award: Award,
  messages: MessagesSquare,
  shield: ShieldCheck,
  target: Target,
  help: HelpCircle,
}

export function Sidebar() {
  const pathname = usePathname()
  const role = useAuthStore((s) => s.user?.role)
  const items = navForRole(role)

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card md:block">
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/dashboard" className="font-bold">
          LearnHub
        </Link>
      </div>
      <nav className="space-y-1 p-3">
        {items.map(({ href, label, icon }) => {
          const Icon = ICONS[icon] ?? Home
          const active =
            href === '/dashboard'
              ? pathname === href
              : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
