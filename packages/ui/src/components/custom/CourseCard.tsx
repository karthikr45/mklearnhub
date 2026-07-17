'use client'

import * as React from 'react'
import { Star } from 'lucide-react'

import { cn } from '../../lib/utils'
import { Badge } from '../Badge'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../Card'
import { Progress } from '../Progress'

export interface CourseCardProps {
  title: string
  instructor?: string
  thumbnailUrl?: string
  progress?: number
  rating?: number
  onClick?: () => void
  className?: string
}

function CourseCard({
  title,
  instructor,
  thumbnailUrl,
  progress,
  rating,
  onClick,
  className,
}: CourseCardProps) {
  const isInteractive = typeof onClick === 'function'

  return (
    <Card
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (event: React.KeyboardEvent<HTMLDivElement>) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      className={cn(
        'overflow-hidden',
        isInteractive &&
          'cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
    >
      <div className="aspect-video w-full overflow-hidden bg-muted">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-2 text-base">{title}</CardTitle>
        {instructor ? (
          <p className="text-sm text-muted-foreground">{instructor}</p>
        ) : null}
      </CardHeader>
      <CardContent className="pb-2">
        {typeof progress === 'number' ? (
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {Math.round(progress)}% complete
            </p>
          </div>
        ) : null}
      </CardContent>
      {typeof rating === 'number' ? (
        <CardFooter className="pt-0">
          <Badge variant="secondary" className="gap-1">
            <Star className="h-3 w-3 fill-current" />
            {rating.toFixed(1)}
          </Badge>
        </CardFooter>
      ) : null}
    </Card>
  )
}

export { CourseCard }
