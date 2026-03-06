import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BottomNav } from './BottomNav'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

describe('BottomNav', () => {
  it('renders 4 navigation tabs', () => {
    render(<BottomNav />)
    expect(screen.getByText('Feed')).toBeInTheDocument()
    expect(screen.getByText('Explore')).toBeInTheDocument()
    expect(screen.getByText('Learning')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })

  it('highlights active tab', () => {
    render(<BottomNav />)
    const feedLink = screen.getByText('Feed').closest('a')
    expect(feedLink).toHaveClass('text-blue-500')
  })
})
