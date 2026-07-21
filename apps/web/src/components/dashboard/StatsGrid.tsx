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
        <div
          key={label}
          className="card-elevated card-elevated-hover p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-[18px] w-[18px]" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
          {delta && (
            <p className="mt-1 text-xs font-medium text-emerald-600">{delta}</p>
          )}
        </div>
      ))}
    </div>
  )
}
