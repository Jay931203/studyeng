import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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

    expect(screen.getByRole('button', { name: 'Toggle browse' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Learn' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Toggle feed' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Series' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Shorts' })).toBeInTheDocument()
    expect(screen.getByLabelText('My')).toBeInTheDocument()
    expect(screen.getByLabelText('Settings')).toBeInTheDocument()
  })

  it('treats the legacy root video route as the shorts tab', () => {
    mockUsePathname.mockReturnValue('/')
    mockSearchParams = new URLSearchParams('v=test-video')

    render(<BottomNav />)

    expect(screen.getByRole('button', { name: 'Series' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Shorts' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('opens the Shorts feed from another tab when the label is pressed', () => {
    mockUsePathname.mockReturnValue('/explore')

    render(<BottomNav />)

    fireEvent.click(screen.getByRole('button', { name: 'Shorts' }))

    expect(mockPush).toHaveBeenCalledWith('/shorts?feed=shorts', { scroll: false })
  })

  it('shows the bottom feed switcher and highlights Shorts in shorts mode', () => {
    mockUsePathname.mockReturnValue('/shorts')
    mockSearchParams = new URLSearchParams('feed=shorts')

    render(<BottomNav />)

    expect(screen.getByRole('button', { name: 'Series' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Shorts' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('toggles feed when the play button is pressed', () => {
    mockUsePathname.mockReturnValue('/shorts')
    mockSearchParams = new URLSearchParams('feed=shorts')

    render(<BottomNav />)

    fireEvent.click(screen.getByRole('button', { name: 'Toggle feed' }))

    expect(mockPush).toHaveBeenCalledWith('/shorts', { scroll: false })
  })

  it('shows the home/learn switcher and highlights Learn on the learn page', () => {
    mockUsePathname.mockReturnValue('/explore/learn')

    render(<BottomNav />)

    expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Learn' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('toggles browse when the home button is pressed', () => {
    mockUsePathname.mockReturnValue('/explore')

    render(<BottomNav />)

    fireEvent.click(screen.getByRole('button', { name: 'Toggle browse' }))

    expect(mockPush).toHaveBeenCalledWith('/explore/learn', { scroll: false })
  })
})
