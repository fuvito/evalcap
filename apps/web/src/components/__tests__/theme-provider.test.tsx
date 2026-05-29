/* @jest-environment jsdom */
import { render, act } from '@testing-library/react'
import { ThemeProvider, applyTheme } from '@/components/theme-provider'

const mockAddEventListener = jest.fn()
const mockRemoveEventListener = jest.fn()

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockReturnValue({
      matches,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    }),
  })
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ''
  mockMatchMedia(false)
  mockAddEventListener.mockClear()
  mockRemoveEventListener.mockClear()
})

describe('applyTheme', () => {
  it('adds dark class for dark theme', () => {
    mockMatchMedia(false)
    applyTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes dark class for light theme', () => {
    document.documentElement.classList.add('dark')
    applyTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('adds dark class for system theme when prefers-dark', () => {
    mockMatchMedia(true)
    applyTheme('system')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes dark class for system theme when prefers-light', () => {
    document.documentElement.classList.add('dark')
    mockMatchMedia(false)
    applyTheme('system')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})

describe('ThemeProvider', () => {
  it('renders children', async () => {
    await act(async () => {
      render(<ThemeProvider><span data-testid="child">hello</span></ThemeProvider>)
    })
    expect(document.querySelector('[data-testid="child"]')).toBeInTheDocument()
  })

  it('applies stored theme on mount', async () => {
    localStorage.setItem('theme', 'dark')
    await act(async () => {
      render(<ThemeProvider><span /></ThemeProvider>)
    })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('defaults to system theme when nothing stored', async () => {
    await act(async () => {
      render(<ThemeProvider><span /></ThemeProvider>)
    })
    expect(mockAddEventListener).toHaveBeenCalled()
  })

  it('removes event listener on unmount', async () => {
    let unmount: () => void
    await act(async () => {
      const result = render(<ThemeProvider><span /></ThemeProvider>)
      unmount = result.unmount
    })
    await act(async () => { unmount() })
    expect(mockRemoveEventListener).toHaveBeenCalled()
  })

  it('applies system dark theme when media query fires a change event', async () => {
    localStorage.setItem('theme', 'system')
    let capturedHandler: (() => void) | undefined
    mockAddEventListener.mockImplementation((_event: string, handler: () => void) => {
      capturedHandler = handler
    })
    await act(async () => { render(<ThemeProvider><span /></ThemeProvider>) })

    mockMatchMedia(true)
    await act(async () => { if (capturedHandler) capturedHandler() })

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('does not reapply theme on change when a fixed theme is set', async () => {
    localStorage.setItem('theme', 'light')
    let capturedHandler: (() => void) | undefined
    mockAddEventListener.mockImplementation((_event: string, handler: () => void) => {
      capturedHandler = handler
    })
    await act(async () => { render(<ThemeProvider><span /></ThemeProvider>) })

    mockMatchMedia(true) // simulate OS switching to dark, but user chose 'light'
    await act(async () => { if (capturedHandler) capturedHandler() })

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
