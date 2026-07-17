import type { LucideIcon } from 'lucide-react'

interface Stat {
  label: string
  value: string | number
  icon: LucideIcon
  delta?: string
}

export function StatsGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, delta }) => (
        <div key={label} className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{label}</p>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          {delta && <p className="mt-1 text-xs text-green-600">{delta}</p>}
        </div>
      ))}
    </div>
  )
}
