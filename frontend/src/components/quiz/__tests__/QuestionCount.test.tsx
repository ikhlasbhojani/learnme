import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuestionCount } from '../QuestionCount'

describe('QuestionCount', () => {
  it('should display current and total questions in full format', () => {
    render(<QuestionCount current={3} total={10} format="full" />)
    
    expect(screen.getByText(/Question 3 of 10/i)).toBeInTheDocument()
  })

  it('should display short format by default', () => {
    render(<QuestionCount current={7} total={10} />)
    
    expect(screen.getByText(/7\/10/i)).toBeInTheDocument()
  })

  it('should handle single question correctly', () => {
    render(<QuestionCount current={1} total={1} format="full" />)
    
    expect(screen.getByText(/Question 1 of 1/i)).toBeInTheDocument()
  })

  it('should handle last question correctly', () => {
    render(<QuestionCount current={10} total={10} format="full" />)
    
    expect(screen.getByText(/Question 10 of 10/i)).toBeInTheDocument()
  })

  it('should update display when props change', () => {
    const { rerender } = render(<QuestionCount current={1} total={10} format="full" />)
    
    expect(screen.getByText(/Question 1 of 10/i)).toBeInTheDocument()
    
    rerender(<QuestionCount current={2} total={10} format="full" />)
    
    expect(screen.getByText(/Question 2 of 10/i)).toBeInTheDocument()
  })
})
