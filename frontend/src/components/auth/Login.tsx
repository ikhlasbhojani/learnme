import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { useAuth } from '../../hooks/useAuth'
import { theme, getThemeColors } from '../../styles/theme'
import { useTheme } from '../../contexts/ThemeContext'

export const Login: React.FC = () => {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { login, loading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const result = await login(email, password)
    if (!result.success) {
      setError(result.error || 'Login failed')
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
          Login
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
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            autoComplete="current-password"
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
            disabled={loading}
            style={{ width: '100%', marginBottom: theme.spacing.md }}
          >
            Login
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
          Don't have an account?{' '}
          <Link
            to="/signup"
            style={{
              color: colors.text,
              textDecoration: 'none',
              fontWeight: theme.typography.fontWeight.semibold,
            }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
