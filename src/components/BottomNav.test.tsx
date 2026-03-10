import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BottomNav } from './BottomNav'

const mockUsePathname = vi.fn()
const mockPush = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ push: mockPush }),
}))

describe('BottomNav', () => {
  beforeEach(() => {
    mockUsePathname.mockReset()
    mockPush.mockReset()
    mockSearchParams = new URLSearchParams()
  })

  it('renders 4 navigation tabs', () => {
    mockUsePathname.mockReturnValue('/explore')

    render(<BottomNav />)

    expect(screen.getByLabelText('Home')).toBeInTheDocument()
    expect(screen.getByLabelText('Shorts')).toBeInTheDocument()
    expect(screen.getByLabelText('Learn')).toBeInTheDocument()
    expect(screen.getByLabelText('Settings')).toBeInTheDocument()
  })

  it('treats the legacy root video route as the shorts tab', () => {
    mockUsePathname.mockReturnValue('/')
    mockSearchParams = new URLSearchParams('v=test-video')

    render(<BottomNav />)

    const shortsLink = screen.getByLabelText('Series')
    expect(shortsLink.className).toContain('text-[var(--nav-active)]')
  })

  it('defaults the shorts tab to the Shorts feed when entering from another tab', () => {
    mockUsePathname.mockReturnValue('/explore')

    render(<BottomNav />)

    expect(screen.getByLabelText('Shorts')).toHaveAttribute('href', '/shorts?feed=shorts')
  })
})
