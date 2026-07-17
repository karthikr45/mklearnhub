'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'

import { cn } from '../../lib/utils'

export interface LoadingSpinnerProps {
  overlay?: boolean
  className?: string
}

function LoadingSpinner({ overlay = false, className }: LoadingSpinnerProps) {
  const spinner = (
    <Loader2
      className={cn('h-6 w-6 animate-spin text-muted-foreground', className)}
    />
  )

  if (overlay) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-4">{spinner}</div>
  )
}

export { LoadingSpinner }
