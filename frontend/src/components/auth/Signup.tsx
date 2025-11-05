import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { useAuth } from '../../hooks/useAuth'
import { validatePassword } from '../../utils/validation'
import { useTheme } from '../../contexts/ThemeContext'

export const Signup: React.FC = () => {
  const { isDark } = useTheme()
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
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-8">
      <div className={`w-full max-w-[400px] ${isDark ? 'bg-[#161b22]' : 'bg-[#ffffff]'} p-8 rounded-xl border ${isDark ? 'border-[#30363d]' : 'border-[#d0d7de]'} shadow-lg`}>
        <h1 className={`text-3xl font-bold mb-6 text-center ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
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
              className={`mb-4 p-4 rounded-md text-sm ${isDark ? 'bg-[#f85149]/20 text-[#f85149]' : 'bg-[#cf222e]/20 text-[#cf222e]'}`}
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
            className="w-full mb-4"
          >
            Sign Up
          </Button>
        </form>

        <p className={`text-center text-sm font-medium ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
          Already have an account?{' '}
          <Link
            to="/login"
            className={`font-semibold no-underline ${isDark ? 'text-[#58a6ff] hover:text-[#79c0ff]' : 'text-[#0969da] hover:text-[#0860ca]'}`}
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Signup
