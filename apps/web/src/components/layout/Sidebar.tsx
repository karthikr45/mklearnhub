'use client'

import {
  Award,
  BarChart3,
  BookOpen,
  ClipboardList,
  Compass,
  GraduationCap,
  HelpCircle,
  Home,
  Layers,
  Library,
  LayoutDashboard,
  MessagesSquare,
  PenTool,
  School,
  Settings,
  ShieldCheck,
  Target,
  Trophy,
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
  globe: Compass,
  users: Users,
  settings: Settings,
  compass: Compass,
  award: Award,
  messages: MessagesSquare,
  shield: ShieldCheck,
  target: Target,
  help: HelpCircle,
  trophy: Trophy,
  pen: PenTool,
  layers: Layers,
  library: Library,
}

export function Sidebar() {
  const pathname = usePathname()
  const role = useAuthStore((s) => s.user?.role)
  const items = navForRole(role)

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-card/60 md:flex">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="mk-brand-bg flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm shadow-violet-500/30">
          <GraduationCap className="h-5 w-5" />
        </span>
        <span className="text-lg font-semibold tracking-tight">LearnHub</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {items.map(({ href, label, icon }) => {
          const Icon = ICONS[icon] ?? Home
          const active =
            href === '/dashboard' ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'mk-brand-bg text-white shadow-sm shadow-violet-500/30'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon
                className={cn(
                  'h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110',
                  active ? 'text-white' : '',
                )}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3">
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-violet-500/5 p-3">
          <p className="text-xs font-medium">Need help?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Explore guides in the knowledge base.
          </p>
        </div>
      </div>
    </aside>
  )
}
