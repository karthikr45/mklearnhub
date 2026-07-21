'use client'

import type { OrgTrends } from '@learnhub/types'
import { useQuery } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

const PRIMARY = 'hsl(243 75% 59%)'
const EMERALD = 'hsl(160 84% 39%)'
const BAR_COLORS = [
  'hsl(243 75% 59%)',
  'hsl(262 83% 58%)',
  'hsl(199 89% 48%)',
  'hsl(160 84% 39%)',
  'hsl(38 92% 50%)',
  'hsl(340 82% 52%)',
]

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="card-elevated p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  )
}

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--card))',
  fontSize: 12,
  boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'trends'],
    queryFn: async () => (await api.get<OrgTrends>('/analytics/trends')).data,
  })

  const stats = data?.stats
  const series = data?.enrollmentsByMonth ?? []
  const topCourses = data?.topCourses ?? []
  const hasSeries = series.some((s) => s.enrollments > 0 || s.completions > 0)

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Live enrollment, completion, and course performance for your organization."
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Total members" value={stats?.totalUsers ?? 0} />
            <KpiCard label="Courses" value={stats?.totalCourses ?? 0} />
            <KpiCard
              label="Enrollments"
              value={stats?.totalEnrollments ?? 0}
              sub={`${stats?.activeLearners ?? 0} active learners`}
            />
            <KpiCard
              label="Completion rate"
              value={`${stats?.completionRate ?? 0}%`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card-elevated p-6">
              <h3 className="mb-1 font-semibold">Enrollments & completions</h3>
              <p className="mb-4 text-xs text-muted-foreground">
                Last 6 months
              </p>
              {hasSeries ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={series}>
                    <defs>
                      <linearGradient id="enr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="cmp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={EMERALD} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={EMERALD} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Area
                      type="monotone"
                      name="Enrollments"
                      dataKey="enrollments"
                      stroke={PRIMARY}
                      strokeWidth={2}
                      fill="url(#enr)"
                    />
                    <Area
                      type="monotone"
                      name="Completions"
                      dataKey="completions"
                      stroke={EMERALD}
                      strokeWidth={2}
                      fill="url(#cmp)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="No enrollment activity in the last 6 months yet." />
              )}
            </div>

            <div className="card-elevated p-6">
              <h3 className="mb-1 font-semibold">Top courses</h3>
              <p className="mb-4 text-xs text-muted-foreground">
                By enrollment
              </p>
              {topCourses.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={topCourses}
                    layout="vertical"
                    margin={{ left: 8, right: 16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="title"
                      fontSize={11}
                      width={110}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                    <Bar dataKey="enrollments" radius={[0, 6, 6, 0]}>
                      {topCourses.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="No course enrollments yet." />
              )}
            </div>
          </div>

          <div className="card-elevated p-6">
            <h3 className="mb-1 font-semibold">Completion rate by course</h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Share of enrolled learners who finished
            </p>
            {topCourses.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={topCourses}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="title" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, 'Completion']} />
                  <Line
                    type="monotone"
                    dataKey="completionRate"
                    stroke={PRIMARY}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: PRIMARY }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No completion data yet." />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
