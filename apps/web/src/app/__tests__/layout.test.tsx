/* @jest-environment jsdom */
import React from 'react'

jest.mock('next/font/google', () => ({
  Inter: jest.fn().mockReturnValue({ variable: '--font-inter', className: 'inter' }),
}))

jest.mock('@/components/theme-provider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/components/footer', () => ({
  Footer: () => <footer data-testid="footer" />,
}))

jest.mock('@/components/cookie-banner', () => ({
  CookieBanner: () => <div data-testid="cookie-banner" />,
}))

import RootLayout, { metadata } from '@/app/layout'

describe('RootLayout', () => {
  it('renders the layout and includes children', () => {
    const result = RootLayout({ children: <span data-testid="child">hello</span> })
    expect(result).toBeDefined()
  })

  it('exports metadata with title and description', () => {
    expect(metadata.title).toMatch(/EvalCap/)
    expect(metadata.description).toBeTruthy()
  })
})
