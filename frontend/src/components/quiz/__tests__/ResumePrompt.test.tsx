import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ResumePrompt } from '../ResumePrompt'

// Mock Modal component
vi.mock('../../common/Modal', () => ({
  Modal: ({ isOpen, title, children, onClose }: any) => {
    if (!isOpen) return null
    return (
      <div data-testid="modal" role="dialog">
        <h2>{title}</h2>
        {children}
      </div>
    )
  },
}))

// Mock Button component
vi.mock('../../common/Button', () => ({
  Button: ({ onClick, children, variant }: any) => (
    <button onClick={onClick} data-variant={variant}>
      {children}
    </button>
  ),
}))

describe('ResumePrompt', () => {
  const mockOnResume = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    render(
      <ResumePrompt
        isOpen={false}
        pauseReason="tab-change"
        pausedAt={null}
        onResume={mockOnResume}
      />
    )

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
  })

  it('should render when isOpen is true', () => {
    render(
      <ResumePrompt
        isOpen={true}
        pauseReason="tab-change"
        pausedAt={null}
        onResume={mockOnResume}
      />
    )

    expect(screen.getByTestId('modal')).toBeInTheDocument()
    expect(screen.getByText('Quiz Paused')).toBeInTheDocument()
  })

  it('should display tab-change message when pauseReason is tab-change', () => {
    render(
      <ResumePrompt
        isOpen={true}
        pauseReason="tab-change"
        pausedAt={null}
        onResume={mockOnResume}
      />
    )

    expect(
      screen.getByText('The quiz was paused because you switched tabs.')
    ).toBeInTheDocument()
  })

  it('should display manual pause message when pauseReason is manual', () => {
    render(
      <ResumePrompt
        isOpen={true}
        pauseReason="manual"
        pausedAt={null}
        onResume={mockOnResume}
      />
    )

    expect(screen.getByText('The quiz was paused.')).toBeInTheDocument()
  })

  it('should display paused time when pausedAt is provided', () => {
    const pausedAt = new Date(Date.now() - 65000) // 65 seconds ago

    render(
      <ResumePrompt
        isOpen={true}
        pauseReason="tab-change"
        pausedAt={pausedAt}
        onResume={mockOnResume}
      />
    )

    expect(screen.getByText(/Paused for:/)).toBeInTheDocument()
  })

  it('should format paused time correctly (minutes:seconds)', () => {
    const pausedAt = new Date(Date.now() - 125000) // 125 seconds = 2:05

    render(
      <ResumePrompt
        isOpen={true}
        pauseReason="tab-change"
        pausedAt={pausedAt}
        onResume={mockOnResume}
      />
    )

    const timeText = screen.getByText(/Paused for: \d+:\d{2}/)
    expect(timeText).toBeInTheDocument()
  })

  it('should call onResume when Resume button is clicked', async () => {
    render(
      <ResumePrompt
        isOpen={true}
        pauseReason="tab-change"
        pausedAt={null}
        onResume={mockOnResume}
      />
    )

    const resumeButton = screen.getByText('Resume Quiz')
    fireEvent.click(resumeButton)

    await waitFor(() => {
      expect(mockOnResume).toHaveBeenCalledTimes(1)
    })
  })

  it('should handle async onResume function', async () => {
    const asyncResume = vi.fn().mockImplementation(() => {
      return new Promise((resolve) => setTimeout(resolve, 100))
    })

    render(
      <ResumePrompt
        isOpen={true}
        pauseReason="tab-change"
        pausedAt={null}
        onResume={asyncResume}
      />
    )

    const resumeButton = screen.getByText('Resume Quiz')
    fireEvent.click(resumeButton)

    await waitFor(() => {
      expect(asyncResume).toHaveBeenCalledTimes(1)
    })
  })

  it('should not display paused time when pausedAt is null', () => {
    render(
      <ResumePrompt
        isOpen={true}
        pauseReason="tab-change"
        pausedAt={null}
        onResume={mockOnResume}
      />
    )

    expect(screen.queryByText(/Paused for:/)).not.toBeInTheDocument()
  })
})
