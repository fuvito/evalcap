'use client'

import { useEffect } from 'react'

export function applyTheme(theme: string) {
  const root = document.documentElement
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (theme === 'dark' || (theme === 'system' && prefersDark)) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem('theme') || 'system'
    applyTheme(stored)

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if ((localStorage.getItem('theme') || 'system') === 'system') {
        applyTheme('system')
      }
    }
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  return <>{children}</>
}
