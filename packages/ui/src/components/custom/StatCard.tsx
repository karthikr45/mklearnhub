'use client'

import * as React from 'react'

import { cn } from '../../lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '../Card'

export interface StatCardProps {
  label: string
  value: string | number
  delta?: string
  icon?: React.ReactNode
  className?: string
}

function StatCard({ label, value, delta, icon, className }: StatCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {icon ? (
          <span className="text-muted-foreground [&_svg]:size-4">{icon}</span>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {delta ? (
          <p className="mt-1 text-xs text-muted-foreground">{delta}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

export { StatCard }
