'use client'

import { Bell, LogOut, Moon, Search, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'

export function Topbar() {
  const { user, logout } = useAuth()
  const { data: notifications } = useNotifications()
  const { theme, setTheme } = useTheme()
  const unread = notifications?.length ?? 0
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'U'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/70 px-4 backdrop-blur-xl md:px-6">
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search…"
          className="w-full rounded-full border bg-muted/50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary/40 focus:bg-background focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          aria-label="Toggle theme"
        >
          <Sun className="h-[18px] w-[18px] dark:hidden" />
          <Moon className="hidden h-[18px] w-[18px] dark:block" />
        </button>
        <button
          className="relative rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
          )}
        </button>

        <div className="mx-1 h-6 w-px bg-border" />

        <div className="flex items-center gap-2.5 pl-1">
          <span className="mk-brand-bg flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white">
            {initial}
          </span>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-medium">{user?.name ?? 'Guest'}</p>
            <p className="text-xs capitalize text-muted-foreground">
              {user?.role?.toLowerCase().replace('_', ' ')}
            </p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            aria-label="Log out"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </header>
  )
}
