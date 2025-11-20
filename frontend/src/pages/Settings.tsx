import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { theme, getThemeColors } from '../styles/theme'
import { useTheme } from '../contexts/ThemeContext'
import { validateAPIKey } from '../services/aiValidation'

const AI_MODELS = {
  gemini: [
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Fast, Free)' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Balanced)' },
    { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Experimental)' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recommended)' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Advanced Reasoning)' },
    { value: 'gemini-3-pro', label: 'Gemini 3 Pro (Latest - Nov 2025)' }
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Affordable)' },
    { value: 'gpt-4o', label: 'GPT-4o (Balanced)' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Fast)' },
    { value: 'gpt-4.1', label: 'GPT-4.1 (Enhanced)' },
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini (Efficient)' },
    { value: 'o4-mini', label: 'o4-Mini (Reasoning Model)' },
    { value: 'gpt-4.5', label: 'GPT-4.5 Orion (Accurate)' },
    { value: 'gpt-5', label: 'GPT-5 (Flagship - Aug 2025)' },
    { value: 'gpt-5.1', label: 'GPT-5.1 (Latest - Nov 2025)' }
  ]
}

const DEFAULT_MODELS = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o'
}

const BASE_URLS = {
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  openai: 'https://api.openai.com/v1'
}

export default function Settings() {
  const { currentUser, updateProfile } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const colors = getThemeColors(isDark)

  // AI Configuration State
  const [provider, setProvider] = useState<'gemini' | 'openai'>(
    (currentUser?.aiProvider as 'gemini' | 'openai') || 'gemini'
  )
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState(currentUser?.aiModel || DEFAULT_MODELS.gemini)
  const [baseUrl, setBaseUrl] = useState(currentUser?.aiBaseUrl || BASE_URLS.gemini)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // UI State
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<string | null>(null)
  const [validationSuccess, setValidationSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)

  // Initialize form with current user data
  useEffect(() => {
    if (currentUser) {
      if (currentUser.aiProvider) {
        setProvider(currentUser.aiProvider as 'gemini' | 'openai')
      }
      if (currentUser.aiModel) {
        setModel(currentUser.aiModel)
      }
      if (currentUser.aiBaseUrl) {
        setBaseUrl(currentUser.aiBaseUrl)
      }
    }
  }, [currentUser])

  const handleProviderChange = (newProvider: 'gemini' | 'openai') => {
    setProvider(newProvider)
    setModel(DEFAULT_MODELS[newProvider])
    setBaseUrl(BASE_URLS[newProvider])
    setValidationSuccess(false)
    setError(null)
    setErrorType(null)
  }

  const handleValidate = async () => {
    if (!apiKey.trim()) {
      setError('API key is required')
      return
    }

    setValidating(true)
    setError(null)
    setErrorType(null)
    setValidationSuccess(false)

    try {
      const result = await validateAPIKey(
        provider,
        apiKey.trim(),
        model || DEFAULT_MODELS[provider],
        baseUrl || BASE_URLS[provider]
      )

      if (result.valid) {
        setValidationSuccess(true)
        setError(null)
        setErrorType(null)
      } else {
        setError(result.error || 'API key validation failed')
        setErrorType(result.errorType || null)
        setValidationSuccess(false)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to validate API key. Please try again.')
      setErrorType('UNKNOWN')
      setValidationSuccess(false)
    } finally {
      setValidating(false)
    }
  }

  const handleSaveAIConfig = async () => {
    if (!apiKey.trim()) {
      setError('API key is required')
      return
    }

    if (!validationSuccess) {
      setError('Please validate your API key before saving')
      return
    }

    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await updateProfile({
        aiProvider: provider,
        aiApiKey: apiKey.trim(),
        aiModel: model || DEFAULT_MODELS[provider],
        aiBaseUrl: baseUrl || BASE_URLS[provider]
      })

      setSuccessMessage('AI configuration updated successfully!')
      setApiKey('') // Clear the input after successful save
      setValidationSuccess(false)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        minHeight: 'calc(100vh - 80px)',
        padding: theme.spacing.xl,
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          marginBottom: theme.spacing.sm,
          color: colors.text,
        }}
      >
        Settings
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          fontSize: theme.typography.fontSize.base,
          color: colors.gray[600],
          marginBottom: theme.spacing['2xl'],
        }}
      >
        Manage your AI configuration and preferences
      </motion.p>

      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: theme.spacing.lg,
            padding: theme.spacing.md,
            backgroundColor: isDark ? '#1a4d2e20' : '#dcfce740',
            color: isDark ? '#4ade80' : '#15803d',
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${isDark ? '#15803d' : '#86efac'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'start', gap: theme.spacing.sm }}>
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" style={{ width: '20px', height: '20px' }}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMessage}</span>
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: theme.spacing.lg,
            padding: theme.spacing.md,
            backgroundColor: isDark ? '#4d1a1a20' : '#fee2e240',
            color: isDark ? '#f87171' : '#dc2626',
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${isDark ? '#dc2626' : '#fca5a5'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'start', gap: theme.spacing.sm }}>
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" style={{ width: '20px', height: '20px' }}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: theme.typography.fontWeight.semibold, marginBottom: '0.25rem' }}>
                {errorType === 'INVALID_KEY' && '❌ Invalid API Key'}
                {errorType === 'QUOTA_EXCEEDED' && '⚠️ Quota Exceeded'}
                {errorType === 'PERMISSION_DENIED' && '🚫 Permission Denied'}
                {errorType === 'NETWORK_ERROR' && '🌐 Network Error'}
                {(!errorType || errorType === 'UNKNOWN') && '⚠️ Error'}
              </p>
              <p>{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Validation Success */}
      {validationSuccess && !error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: theme.spacing.lg,
            padding: theme.spacing.md,
            backgroundColor: isDark ? '#1a4d2e20' : '#dcfce740',
            color: isDark ? '#4ade80' : '#15803d',
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${isDark ? '#15803d' : '#86efac'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" style={{ width: '20px', height: '20px' }}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>API key validated successfully! You can now save your configuration.</span>
          </div>
        </motion.div>
      )}

      {/* AI Configuration Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          backgroundColor: colors.cardBg,
          padding: theme.spacing.xl,
          borderRadius: theme.borderRadius.xl,
          boxShadow: theme.shadows.md,
          border: `1px solid ${colors.border}`,
          marginBottom: theme.spacing.xl,
        }}
      >
        <h2
          style={{
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.semibold,
            marginBottom: theme.spacing.md,
            color: colors.text,
          }}
        >
          AI Configuration
        </h2>
        <p
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: colors.gray[600],
            marginBottom: theme.spacing.lg,
          }}
        >
          Update your AI provider API key and model preferences. Your API key is stored securely.
        </p>

        {/* Current Configuration Display */}
        {currentUser?.aiProvider && (
          <div
            style={{
              padding: theme.spacing.md,
              backgroundColor: isDark ? '#1a4d2e20' : '#dcfce720',
              borderRadius: theme.borderRadius.md,
              marginBottom: theme.spacing.lg,
              border: `1px solid ${colors.border}`,
            }}
          >
            <p style={{ fontSize: theme.typography.fontSize.sm, color: colors.gray[600], marginBottom: theme.spacing.xs }}>
              Current Configuration:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.md, fontSize: theme.typography.fontSize.sm }}>
              <div>
                <span style={{ fontWeight: theme.typography.fontWeight.semibold, color: colors.text }}>Provider:</span>{' '}
                <span style={{ color: colors.gray[600] }}>{currentUser.aiProvider === 'gemini' ? 'Google Gemini' : 'OpenAI'}</span>
              </div>
              <div>
                <span style={{ fontWeight: theme.typography.fontWeight.semibold, color: colors.text }}>Model:</span>{' '}
                <span style={{ color: colors.gray[600] }}>{currentUser.aiModel || 'Not set'}</span>
              </div>
              <div>
                <span style={{ fontWeight: theme.typography.fontWeight.semibold, color: colors.text }}>API Key:</span>{' '}
                <span style={{ color: colors.gray[600] }}>••••••••</span>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
          {/* Provider Selection */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.semibold,
                marginBottom: theme.spacing.sm,
                color: colors.text,
              }}
            >
              AI Provider <span style={{ color: colors.error }}>*</span>
            </label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as 'gemini' | 'openai')}
              style={{
                width: '100%',
                padding: '0.625rem 1rem',
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.cardBg,
                color: colors.text,
                fontSize: theme.typography.fontSize.base,
                outline: 'none',
                transition: 'all 0.2s',
              }}
            >
              <option value="gemini">Google Gemini (Recommended - Free tier available)</option>
              <option value="openai">OpenAI (Pay-as-you-go)</option>
            </select>
          </div>

          {/* API Key Input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.semibold,
                marginBottom: theme.spacing.sm,
                color: colors.text,
              }}
            >
              New API Key <span style={{ color: colors.error }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value)
                    setValidationSuccess(false)
                    setError(null)
                    setErrorType(null)
                  }}
                  placeholder={`Enter your ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} API key`}
                  className="w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: colors.gray[600],
                    fontSize: theme.typography.fontSize.sm,
                  }}
                >
                  {showApiKey ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <Button
                onClick={handleValidate}
                disabled={!apiKey.trim() || validating || validationSuccess}
                variant="secondary"
                style={{ whiteSpace: 'nowrap' }}
              >
                {validating ? 'Validating...' : validationSuccess ? '✓ Validated' : 'Validate'}
              </Button>
            </div>
            <p style={{ marginTop: '0.375rem', fontSize: theme.typography.fontSize.xs, color: colors.gray[600] }}>
              Your API key will be encrypted and stored securely in your browser and database.
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.semibold,
                marginBottom: theme.spacing.sm,
                color: colors.text,
              }}
            >
              Model
            </label>
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value)
                setValidationSuccess(false)
                setError(null)
                setErrorType(null)
              }}
              style={{
                width: '100%',
                padding: '0.625rem 1rem',
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.cardBg,
                color: colors.text,
                fontSize: theme.typography.fontSize.base,
                outline: 'none',
                transition: 'all 0.2s',
              }}
            >
              {AI_MODELS[provider].map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <p style={{ marginTop: '0.375rem', fontSize: theme.typography.fontSize.xs, color: colors.gray[600] }}>
              Recommended: {provider === 'gemini' ? 'Gemini 2.5 Flash' : 'GPT-4o'}
            </p>
          </div>

          {/* Advanced Options */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: colors.primary,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
              }}
            >
              {showAdvanced ? '▼' : '▶'} {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>

            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ marginTop: theme.spacing.md }}
              >
                <label
                  style={{
                    display: 'block',
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.semibold,
                    marginBottom: theme.spacing.sm,
                    color: colors.text,
                  }}
                >
                  Base URL (Optional)
                </label>
                <Input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="Custom endpoint URL"
                  className="w-full"
                />
                <p style={{ marginTop: '0.375rem', fontSize: theme.typography.fontSize.xs, color: colors.gray[600] }}>
                  Only needed for custom API endpoints or proxies.
                </p>
              </motion.div>
            )}
          </div>

          {/* Save Button */}
          <div style={{ paddingTop: theme.spacing.sm }}>
            {!validationSuccess && (
              <p style={{ fontSize: theme.typography.fontSize.xs, color: colors.gray[600], textAlign: 'center', marginBottom: theme.spacing.sm }}>
                Please validate your API key before saving
              </p>
            )}
            <Button
              onClick={handleSaveAIConfig}
              disabled={!apiKey.trim() || !validationSuccess || loading}
              className="w-full"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              {loading ? 'Saving Configuration...' : 'Save AI Configuration'}
            </Button>
          </div>

          {/* Help Links */}
          <div style={{ paddingTop: theme.spacing.md, borderTop: `1px solid ${colors.border}` }}>
            <p style={{ fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold, marginBottom: theme.spacing.sm, color: colors.text }}>
              Don't have an API key?
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              {provider === 'gemini' ? (
                <a
                  href="https://ai.google.dev/gemini-api/docs/api-key"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: theme.spacing.xs,
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    borderRadius: theme.borderRadius.md,
                    backgroundColor: isDark ? '#21262d' : '#f6f8fa',
                    color: colors.primary,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  Get Gemini API Key (Free) →
                </a>
              ) : (
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: theme.spacing.xs,
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    borderRadius: theme.borderRadius.md,
                    backgroundColor: isDark ? '#21262d' : '#f6f8fa',
                    color: colors.primary,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  Get OpenAI API Key →
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Theme Preferences Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          backgroundColor: colors.cardBg,
          padding: theme.spacing.xl,
          borderRadius: theme.borderRadius.xl,
          boxShadow: theme.shadows.md,
          border: `1px solid ${colors.border}`,
        }}
      >
        <h2
          style={{
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.semibold,
            marginBottom: theme.spacing.md,
            color: colors.text,
          }}
        >
          Appearance
        </h2>
        <p
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: colors.gray[600],
            marginBottom: theme.spacing.lg,
          }}
        >
          Customize how LearnMe looks for you
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: theme.typography.fontSize.base, fontWeight: theme.typography.fontWeight.medium, color: colors.text, marginBottom: '0.25rem' }}>
              Dark Mode
            </p>
            <p style={{ fontSize: theme.typography.fontSize.sm, color: colors.gray[600] }}>
              {isDark ? 'Dark mode is enabled' : 'Light mode is enabled'}
            </p>
          </div>
          <Button
            onClick={toggleTheme}
            variant="secondary"
          >
            {isDark ? '🌙 Dark' : '☀️ Light'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

