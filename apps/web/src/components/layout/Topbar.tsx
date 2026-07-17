'use client'

import { Bell, LogOut, Search } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'

export function Topbar() {
  const { user, logout } = useAuth()
  const { data: notifications } = useNotifications()
  const { theme, setTheme } = useTheme()
  const unread = notifications?.length ?? 0

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Search…"
          className="w-full rounded-md border bg-background py-2 pl-8 pr-3 text-sm"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-md p-2 hover:bg-accent"
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 dark:hidden" />
          <Moon className="hidden h-4 w-4 dark:block" />
        </button>
        <button className="relative rounded-md p-2 hover:bg-accent" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
          )}
        </button>
        <div className="flex items-center gap-2">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-none">{user?.name ?? 'Guest'}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-md p-2 hover:bg-accent"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
