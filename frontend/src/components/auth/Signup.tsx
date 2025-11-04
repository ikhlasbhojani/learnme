import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { useAuth } from '../../hooks/useAuth'
import { validatePassword } from '../../utils/validation'
import { theme, getThemeColors } from '../../styles/theme'
import { useTheme } from '../../contexts/ThemeContext'

export const Signup: React.FC = () => {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const { signup, loading } = useAuth()

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    const validation = validatePassword(value)
    setPasswordErrors(validation.errors)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password policy
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      setError(passwordValidation.errors.join(', '))
      return
    }

    const result = await signup(email, password)
    if (!result.success) {
      setError(result.error || 'Signup failed')
    }
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xl,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: colors.cardBg,
          padding: theme.spacing['2xl'],
          borderRadius: theme.borderRadius['2xl'],
          boxShadow: theme.shadows.lg,
          border: `1px solid ${colors.border}`,
        }}
      >
        <h1
          style={{
            fontSize: theme.typography.fontSize['3xl'],
            fontWeight: theme.typography.fontWeight.bold,
            marginBottom: theme.spacing.lg,
            textAlign: 'center',
          color: colors.text,
          }}
        >
          Sign Up
        </h1>

        <form onSubmit={handleSubmit}>
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            autoComplete="email"
          />

          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            required
            disabled={loading}
            autoComplete="new-password"
            helperText="Minimum 8 characters, at least one letter and one number"
            error={passwordErrors.length > 0 ? passwordErrors.join(', ') : undefined}
          />

          <Input
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            autoComplete="new-password"
          />

          {error && (
            <div
              style={{
                marginBottom: theme.spacing.md,
                padding: theme.spacing.md,
                backgroundColor: theme.colors.error + '20',
                color: theme.colors.error,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.sm,
              }}
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            disabled={loading || passwordErrors.length > 0}
            style={{ width: '100%', marginBottom: theme.spacing.md }}
          >
            Sign Up
          </Button>
        </form>

        <p
          style={{
            textAlign: 'center',
            fontSize: theme.typography.fontSize.sm,
            color: colors.text,
            fontWeight: theme.typography.fontWeight.medium,
          }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: colors.text,
              textDecoration: 'none',
              fontWeight: theme.typography.fontWeight.semibold,
            }}
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Signup
