import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BottomNav } from './BottomNav'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

describe('BottomNav', () => {
  it('renders 4 navigation tabs', () => {
    render(<BottomNav />)
    expect(screen.getByText('홈')).toBeInTheDocument()
    expect(screen.getByText('탐색')).toBeInTheDocument()
    expect(screen.getByText('학습')).toBeInTheDocument()
    expect(screen.getByText('MY')).toBeInTheDocument()
  })

  it('highlights active tab', () => {
    render(<BottomNav />)
    const feedLink = screen.getByText('홈').closest('a')
    expect(feedLink).toHaveClass('text-blue-500')
  })
})
