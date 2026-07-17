import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

/** Format a duration in seconds as "2h 30m" / "45m" / "30s". */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const parts: string[] = []
  if (h) parts.push(`${h}h`)
  if (m) parts.push(`${m}m`)
  if (!h && !m) parts.push(`${s}s`)
  return parts.join(' ')
}

export function formatDate(date: Date | string, format = 'MMM D, YYYY'): string {
  return dayjs(date).format(format)
}

export function getRelativeTime(date: Date | string): string {
  return dayjs(date).fromNow()
}

export function isExpired(date: Date | string): boolean {
  return dayjs(date).isBefore(dayjs())
}
