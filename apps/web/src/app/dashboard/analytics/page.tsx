'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { PageHeader } from '@/components/layout/PageHeader'

const enrollmentData = [
  { month: 'Jan', enrollments: 12 },
  { month: 'Feb', enrollments: 19 },
  { month: 'Mar', enrollments: 15 },
  { month: 'Apr', enrollments: 27 },
  { month: 'May', enrollments: 34 },
  { month: 'Jun', enrollments: 30 },
]

const completionData = [
  { week: 'W1', rate: 40 },
  { week: 'W2', rate: 52 },
  { week: 'W3', rate: 61 },
  { week: 'W4', rate: 68 },
]

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Enrollment and completion trends."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-elevated p-6">
          <h3 className="mb-4 font-semibold">Enrollments</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={enrollmentData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="enrollments" fill="hsl(var(--primary))" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card-elevated p-6">
          <h3 className="mb-4 font-semibold">Completion rate</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="week" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
