import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from './Button'
import { theme } from '../../styles/theme'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/home'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: theme.spacing.xl,
            backgroundColor: theme.colors.neutral[50],
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              backgroundColor: 'white',
              padding: theme.spacing['2xl'],
              borderRadius: theme.borderRadius.xl,
              boxShadow: theme.shadows.lg,
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontSize: theme.typography.fontSize['3xl'],
                fontWeight: theme.typography.fontWeight.bold,
                marginBottom: theme.spacing.md,
                color: theme.colors.error,
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.neutral[600],
                marginBottom: theme.spacing.xl,
              }}
            >
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button variant="primary" onClick={this.handleReset}>
              Return to Home
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
