/* @jest-environment jsdom */
import { render } from '@testing-library/react'
import { SkeletonText, SkeletonCard, SkeletonButton, SkeletonGrid, SkeletonPage } from '@/components/skeleton'

describe('SkeletonText', () => {
  it('renders with animate-pulse class', () => {
    const { container } = render(<SkeletonText />)
    expect(container.firstChild).toHaveClass('animate-pulse')
  })

  it('accepts custom className', () => {
    const { container } = render(<SkeletonText className="h-8 w-1/2" />)
    expect(container.firstChild).toHaveClass('h-8', 'w-1/2')
  })
})

describe('SkeletonCard', () => {
  it('renders default 3 skeleton lines', () => {
    const { container } = render(<SkeletonCard />)
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3)
  })

  it('renders custom number of lines', () => {
    const { container } = render(<SkeletonCard lines={5} />)
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(5)
  })
})

describe('SkeletonButton', () => {
  it('renders a pulsing block', () => {
    const { container } = render(<SkeletonButton />)
    expect(container.firstChild).toHaveClass('animate-pulse')
  })
})

describe('SkeletonGrid', () => {
  it('renders default 4 cards', () => {
    const { container } = render(<SkeletonGrid />)
    // Each card has 3 animate-pulse elements
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(12)
  })

  it('renders custom count', () => {
    const { container } = render(<SkeletonGrid count={2} />)
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(6)
  })
})

describe('SkeletonPage', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonPage />)
    // 1 SkeletonText header + 2 SkeletonCards (3 each) = 7
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(7)
  })
})
