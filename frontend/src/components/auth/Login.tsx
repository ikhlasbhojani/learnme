import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../contexts/ThemeContext'

export const Login: React.FC = () => {
  const { isDark } = useTheme()
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
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-8">
      <div className={`w-full max-w-[400px] ${isDark ? 'bg-[#161b22]' : 'bg-[#ffffff]'} p-8 rounded-xl border ${isDark ? 'border-[#30363d]' : 'border-[#d0d7de]'} shadow-lg`}>
        <h1 className={`text-3xl font-bold mb-6 text-center ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
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
            disabled={loading}
            className="w-full mb-4"
          >
            Login
          </Button>
        </form>

        <p className={`text-center text-sm font-medium ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
          Don't have an account?{' '}
          <Link
            to="/signup"
            className={`font-semibold no-underline ${isDark ? 'text-[#58a6ff] hover:text-[#79c0ff]' : 'text-[#0969da] hover:text-[#0860ca]'}`}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
