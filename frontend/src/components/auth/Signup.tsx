import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { useAuth } from '../../hooks/useAuth'
import { validatePassword, validateEmail } from '../../utils/validation'
import { useTheme } from '../../contexts/ThemeContext'
import { getThemeColors } from '../../styles/theme'

// Helper to extract user-friendly error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    // Network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('failed to fetch')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.'
    }
    
    // Email already exists
    if (message.includes('already registered') || message.includes('already exists') || message.includes('409')) {
      return 'An account with this email already exists. Please sign in instead.'
    }
    
    // Email validation errors
    if (message.includes('email') && (message.includes('invalid') || message.includes('required'))) {
      return 'Please enter a valid email address.'
    }
    
    // Password errors
    if (message.includes('password') && message.includes('required')) {
      return 'Password is required.'
    }
    
    // Server errors
    if (message.includes('500') || message.includes('internal server error')) {
      return 'A server error occurred. Please try again later.'
    }
    
    // Generic error - return the message if it's user-friendly, otherwise generic message
    if (message.length < 100 && !message.includes('error') && !message.includes('exception')) {
      return error.message
    }
  }
  
  return 'An unexpected error occurred. Please try again.'
}

export const Signup: React.FC = () => {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const { signup, loading } = useAuth()

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    const validation = validatePassword(value)
    setPasswordErrors(validation.errors)
    
    // Clear password error if validation passes
    if (validation.valid) {
      setPasswordError(null)
    }
    
    // Clear form error when user types
    if (formError) {
      setFormError(null)
    }
    
    // Re-validate confirm password if it has a value
    if (confirmPassword && value !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match')
    } else if (confirmPassword && value === confirmPassword) {
      setConfirmPasswordError(null)
    }
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    
    if (value && value !== password) {
      setConfirmPasswordError('Passwords do not match')
    } else {
      setConfirmPasswordError(null)
    }
    
    // Clear form error when user types
    if (formError) {
      setFormError(null)
    }
  }

  const validateForm = (): boolean => {
    let isValid = true
    
    // Reset errors
    setEmailError(null)
    setPasswordError(null)
    setConfirmPasswordError(null)
    setFormError(null)
    
    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required')
      isValid = false
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address')
      isValid = false
    }
    
    // Validate password
    const passwordValidation = validatePassword(password)
    if (!password) {
      setPasswordError('Password is required')
      isValid = false
    } else if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.errors[0] || 'Password does not meet requirements')
      isValid = false
    }
    
    // Validate confirm password
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password')
      isValid = false
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match')
      isValid = false
    }
    
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setFormError(null)
    
    // Client-side validation
    if (!validateForm()) {
      return
    }
    
    try {
      const result = await signup(email.trim(), password)
      if (!result.success) {
        const errorMsg = result.error ? getErrorMessage(new Error(result.error)) : 'Signup failed. Please try again.'
        setFormError(errorMsg)
      } else {
        // Force a full page reload to ensure state is in sync
        window.location.href = '/home'
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      setFormError(errorMsg)
    }
  }

  const handleEmailBlur = () => {
    if (email.trim() && !validateEmail(email)) {
      setEmailError('Please enter a valid email address')
    } else {
      setEmailError(null)
    }
  }

  const isPasswordValid = passwordErrors.length === 0 && password.length > 0
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0
  const canSubmit = email.trim() && isPasswordValid && passwordsMatch && !loading

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundColor: colors.bg,
      }}
    >
      <div className="w-full max-w-[340px]">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 
            className="text-2xl font-semibold mb-2"
            style={{ color: colors.text }}
          >
            Create your account
          </h1>
          <p 
            className="text-sm"
            style={{ color: colors.gray[600] }}
          >
            Join LearnMe to start your learning journey.
          </p>
        </div>

        {/* Form Card */}
        <div
          className="rounded-lg border p-6"
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            boxShadow: isDark 
              ? '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)'
              : '0 1px 3px rgba(27, 31, 36, 0.12), 0 1px 2px rgba(27, 31, 36, 0.08)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
                style={{ color: colors.text }}
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (emailError) setEmailError(null)
                  if (formError) setFormError(null)
                }}
                disabled={loading}
                className="w-full px-3 py-2 text-sm rounded-md transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${emailError ? colors.error : colors.border}`,
                  color: colors.text,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = emailError ? colors.error : colors.info
                  e.target.style.boxShadow = `0 0 0 3px ${emailError ? colors.error + '20' : colors.info + '20'}`
                }}
                onBlur={(e) => {
                  handleEmailBlur()
                  e.target.style.borderColor = emailError ? colors.error : colors.border
                  e.target.style.boxShadow = 'none'
                }}
                placeholder="you@example.com"
                aria-invalid={emailError ? 'true' : 'false'}
                aria-describedby={emailError ? 'email-error' : undefined}
              />
              {emailError && (
                <p 
                  id="email-error"
                  className="mt-1 text-xs flex items-center"
                  style={{ color: colors.error }}
                  role="alert"
                >
                  <svg
                    className="w-3 h-3 mr-1 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
                style={{ color: colors.text }}
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 text-sm rounded-md transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${passwordError ? colors.error : colors.border}`,
                  color: colors.text,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = passwordError ? colors.error : colors.info
                  e.target.style.boxShadow = `0 0 0 3px ${passwordError ? colors.error + '20' : colors.info + '20'}`
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = passwordError ? colors.error : colors.border
                  e.target.style.boxShadow = 'none'
                }}
                placeholder="Create a password"
                aria-invalid={passwordError ? 'true' : 'false'}
                aria-describedby={passwordError ? 'password-error' : password.length > 0 ? 'password-requirements' : undefined}
              />
              {passwordError && (
                <p 
                  id="password-error"
                  className="mt-1 text-xs flex items-center"
                  style={{ color: colors.error }}
                  role="alert"
                >
                  <svg
                    className="w-3 h-3 mr-1 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {passwordError}
                </p>
              )}
              {password.length > 0 && !passwordError && (
                <div id="password-requirements" className="mt-2 text-xs space-y-1" style={{ color: colors.gray[600] }}>
                  <div className="flex items-center">
                    <span className={password.length >= 8 ? 'text-green-600' : ''}>
                      {password.length >= 8 ? '✓' : '○'} At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className={/[a-zA-Z]/.test(password) ? 'text-green-600' : ''}>
                      {/[a-zA-Z]/.test(password) ? '✓' : '○'} Contains a letter
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className={/\d/.test(password) ? 'text-green-600' : ''}>
                      {/\d/.test(password) ? '✓' : '○'} Contains a number
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-2"
                style={{ color: colors.text }}
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 text-sm rounded-md transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${confirmPasswordError ? colors.error : passwordsMatch ? colors.success : colors.border}`,
                  color: colors.text,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = confirmPasswordError ? colors.error : colors.info
                  e.target.style.boxShadow = `0 0 0 3px ${confirmPasswordError ? colors.error + '20' : colors.info + '20'}`
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = confirmPasswordError ? colors.error : passwordsMatch ? colors.success : colors.border
                  e.target.style.boxShadow = 'none'
                }}
                placeholder="Confirm your password"
                aria-invalid={confirmPasswordError ? 'true' : 'false'}
                aria-describedby={confirmPasswordError ? 'confirm-password-error' : passwordsMatch ? 'confirm-password-success' : undefined}
              />
              {confirmPasswordError && (
                <p 
                  id="confirm-password-error"
                  className="mt-1 text-xs flex items-center"
                  style={{ color: colors.error }}
                  role="alert"
                >
                  <svg
                    className="w-3 h-3 mr-1 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {confirmPasswordError}
                </p>
              )}
              {confirmPassword.length > 0 && passwordsMatch && !confirmPasswordError && (
                <p 
                  id="confirm-password-success"
                  className="mt-1 text-xs flex items-center"
                  style={{ color: colors.success }}
                >
                  <svg
                    className="w-3 h-3 mr-1 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Passwords match
                </p>
              )}
            </div>

            {/* Form Error Message */}
            {formError && (
              <div
                className="p-3 text-sm rounded-md flex items-start"
                style={{
                  backgroundColor: isDark ? 'rgba(248, 81, 73, 0.1)' : 'rgba(207, 34, 46, 0.1)',
                  border: `1px solid ${isDark ? 'rgba(248, 81, 73, 0.3)' : 'rgba(207, 34, 46, 0.3)'}`,
                  color: colors.error,
                }}
                role="alert"
              >
                <svg
                  className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{formError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative"
              style={{
                backgroundColor: isDark ? '#238636' : '#2da44e',
                color: '#ffffff',
                border: 'none',
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = isDark ? '#2ea043' : '#2c974b'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? '#238636' : '#2da44e'
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>
        </div>

        {/* Sign In Link */}
        <div
          className="mt-6 text-center text-sm rounded-lg border p-4"
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
          }}
        >
          <span style={{ color: colors.gray[600] }}>
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium no-underline hover:underline transition-all"
              style={{ color: colors.info }}
            >
              Sign in
            </Link>
            .
          </span>
        </div>
      </div>
    </div>
  )
}

export default Signup
