import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BottomNav } from './BottomNav'

const mockUsePathname = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useSearchParams: () => mockSearchParams,
}))

describe('BottomNav', () => {
  beforeEach(() => {
    mockUsePathname.mockReset()
    mockSearchParams = new URLSearchParams()
  })

  it('renders 4 navigation tabs', () => {
    mockUsePathname.mockReturnValue('/explore')

    render(<BottomNav />)

    expect(screen.getByLabelText('오늘')).toBeInTheDocument()
    expect(screen.getByLabelText('피드')).toBeInTheDocument()
    expect(screen.getByLabelText('보관함')).toBeInTheDocument()
    expect(screen.getByLabelText('설정')).toBeInTheDocument()
  })

  it('treats the legacy root video route as the shorts tab', () => {
    mockUsePathname.mockReturnValue('/')
    mockSearchParams = new URLSearchParams('v=test-video')

    render(<BottomNav />)

    const shortsLink = screen.getByLabelText('피드')
    expect(shortsLink.className).toContain('text-[var(--nav-active)]')
  })
})
