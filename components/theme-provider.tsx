'use client'

import * as React from 'react'
<<<<<<< HEAD

type Theme = 'dark' | 'light' | 'system'

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  attribute?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

const ThemeContext = React.createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: 'dark',
  setTheme: () => {},
})

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  attribute = 'class',
  disableTransitionOnChange,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme)

  React.useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) setThemeState(stored)
  }, [])

  React.useEffect(() => {
    const root = document.documentElement
    const resolved = theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : theme

    if (disableTransitionOnChange) {
      root.classList.add('[&_*]:!transition-none')
      setTimeout(() => root.classList.remove('[&_*]:!transition-none'), 0)
    }

    if (attribute === 'class') {
      root.classList.remove('light', 'dark')
      root.classList.add(resolved)
    } else {
      root.setAttribute(attribute, resolved)
    }
  }, [theme, attribute, disableTransitionOnChange])

  const setTheme = (t: Theme) => {
    localStorage.setItem('theme', t)
    setThemeState(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return React.useContext(ThemeContext)
}
=======
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
>>>>>>> 8e65d384dde44947171ecc45644050188674abdc
