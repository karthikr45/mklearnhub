'use client'

import { useEffect, useState } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] {
  const [stored, setStored] = useState<T>(initialValue)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) setStored(JSON.parse(item) as T)
    } catch {
      // ignore
    }
  }, [key])

  const setValue = (value: T) => {
    setStored(value)
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // ignore
    }
  }

  return [stored, setValue]
}
