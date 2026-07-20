import {
  BarChart3,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  School,
  Users,
} from 'lucide-react'

/**
 * A stylised, static preview of the LearnHub app — pure markup, no data.
 * Used inside the hero to convey "this is a real product" premium feel.
 */
export function DashboardPreview() {
  const bars = [42, 68, 55, 80, 61, 92, 74]
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl shadow-violet-900/10 ring-1 ring-black/5">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400/80" />
        <span className="h-3 w-3 rounded-full bg-amber-400/80" />
        <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
        <div className="ml-3 hidden h-5 flex-1 rounded-md bg-background/70 sm:block" />
      </div>

      <div className="flex">
        {/* sidebar */}
        <aside className="hidden w-40 shrink-0 flex-col gap-1 border-r bg-muted/20 p-3 sm:flex">
          {[
            { icon: LayoutDashboard, label: 'Dashboard', active: true },
            { icon: BookOpen, label: 'Knowledge' },
            { icon: GraduationCap, label: 'Courses' },
            { icon: School, label: 'School' },
            { icon: BarChart3, label: 'Analytics' },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium ${
                item.active
                  ? 'mk-brand-bg text-white'
                  : 'text-muted-foreground'
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </div>
          ))}
        </aside>

        {/* content */}
        <div className="flex-1 space-y-4 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-2.5 w-28 rounded bg-foreground/80" />
              <div className="mt-2 h-2 w-40 rounded bg-muted-foreground/30" />
            </div>
            <div className="h-7 w-20 rounded-md mk-brand-bg opacity-90" />
          </div>

          {/* stat tiles */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Users, v: '1,284', l: 'Members' },
              { icon: GraduationCap, v: '96', l: 'Courses' },
              { icon: BarChart3, v: '87%', l: 'Completion' },
            ].map((s) => (
              <div key={s.l} className="rounded-lg border bg-background p-3">
                <s.icon className="h-4 w-4 text-violet-500" />
                <div className="mt-2 text-sm font-semibold">{s.v}</div>
                <div className="text-[10px] text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>

          {/* chart */}
          <div className="rounded-lg border bg-background p-4">
            <div className="mb-3 h-2 w-24 rounded bg-muted-foreground/30" />
            <div className="flex h-24 items-end gap-2">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t mk-brand-bg"
                  style={{ height: `${h}%`, opacity: 0.55 + (h / 100) * 0.45 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
