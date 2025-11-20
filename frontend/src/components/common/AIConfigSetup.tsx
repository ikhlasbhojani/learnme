import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from './Button'
import { Input } from './Input'
import { Modal } from './Modal'
import { validateAPIKey } from '../../services/aiValidation'

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

// Default models (recommended for each provider)
const DEFAULT_MODELS = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o'
}

// Base URLs for each provider (as of Nov 19, 2025)
const BASE_URLS = {
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  openai: 'https://api.openai.com/v1'
}

interface AIConfigSetupProps {
  onComplete: () => void
}

export function AIConfigSetup({ onComplete }: AIConfigSetupProps) {
  const { updateProfile } = useAuth()
  const [provider, setProvider] = useState<'gemini' | 'openai'>('gemini')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState(DEFAULT_MODELS.gemini)
  const [baseUrl, setBaseUrl] = useState(BASE_URLS.gemini)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<string | null>(null)
  const [validationSuccess, setValidationSuccess] = useState(false)

  // Update model and base URL when provider changes
  const handleProviderChange = (newProvider: 'gemini' | 'openai') => {
    setProvider(newProvider)
    setModel(DEFAULT_MODELS[newProvider])
    setBaseUrl(BASE_URLS[newProvider])
    // Reset validation state when provider changes
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

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('API key is required')
      return
    }

    // Require validation before saving
    if (!validationSuccess) {
      setError('Please validate your API key before saving')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Use useAuth's updateProfile which updates BOTH backend AND localStorage
      await updateProfile({
        aiProvider: provider,
        aiApiKey: apiKey.trim(),
        aiModel: model || DEFAULT_MODELS[provider], // Ensure model is set
        aiBaseUrl: baseUrl || BASE_URLS[provider] // Ensure base URL is set
      })
      onComplete()
    } catch (err: any) {
      setError(err.message || 'Failed to save API key. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal 
      isOpen={true} 
      onClose={() => {}} 
      showCloseButton={false}
      closeOnBackdrop={false}
      closeOnEscape={false}
    >
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 dark:text-[#e6edf3]">Configure AI Provider</h2>
          <p className="text-[#59636e] dark:text-[#9198a1]">
            To use LearnMe, you need to provide your own AI API key. Your key is stored locally and never shared.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md text-sm">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold mb-1">
                  {errorType === 'INVALID_KEY' && '❌ Invalid API Key'}
                  {errorType === 'QUOTA_EXCEEDED' && '⚠️ Quota Exceeded'}
                  {errorType === 'PERMISSION_DENIED' && '🚫 Permission Denied'}
                  {errorType === 'NETWORK_ERROR' && '🌐 Network Error'}
                  {(!errorType || errorType === 'UNKNOWN') && '⚠️ Validation Failed'}
                </p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {validationSuccess && !error && (
          <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-md text-sm flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>API key validated successfully! You can now save your configuration.</span>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2 dark:text-[#e6edf3]">
              AI Provider <span className="text-red-500">*</span>
            </label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as 'gemini' | 'openai')}
              className={`w-full px-4 py-2.5 rounded-md border transition-all duration-200 outline-none focus:ring-2
                ${true // isDark check is handled by CSS variables in parent or explicit classes
                  ? 'dark:bg-[#0d1117] dark:border-[#30363d] dark:text-[#e6edf3] dark:focus:border-[#58a6ff] dark:focus:ring-[#58a6ff]/30' 
                  : ''}
                bg-white border-[#d1d9e0] text-[#1f2328] focus:border-[#0969da] focus:ring-[#0969da]/20`}
            >
              <option value="gemini">Google Gemini (Recommended - Free tier available)</option>
              <option value="openai">OpenAI (Pay-as-you-go)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 dark:text-[#e6edf3]">
              API Key <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value)
                  // Reset validation when API key changes
                  setValidationSuccess(false)
                  setError(null)
                  setErrorType(null)
                }}
                placeholder={`Enter your ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} API key`}
                className="flex-1"
              />
              <Button
                onClick={handleValidate}
                disabled={!apiKey.trim() || validating || validationSuccess}
                variant="secondary"
                className="whitespace-nowrap"
              >
                {validating ? 'Validating...' : validationSuccess ? '✓ Validated' : 'Validate'}
              </Button>
            </div>
            <p className="mt-1.5 text-xs text-[#59636e] dark:text-[#9198a1]">
              Your API key is stored securely in your browser's local storage.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 dark:text-[#e6edf3]">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value)
                // Reset validation when model changes
                setValidationSuccess(false)
                setError(null)
                setErrorType(null)
              }}
              className={`w-full px-4 py-2.5 rounded-md border transition-all duration-200 outline-none focus:ring-2
                ${true 
                  ? 'dark:bg-[#0d1117] dark:border-[#30363d] dark:text-[#e6edf3] dark:focus:border-[#58a6ff] dark:focus:ring-[#58a6ff]/30' 
                  : ''}
                bg-white border-[#d1d9e0] text-[#1f2328] focus:border-[#0969da] focus:ring-[#0969da]/20`}
            >
              {AI_MODELS[provider].map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-[#59636e] dark:text-[#9198a1]">
              Recommended: {provider === 'gemini' ? 'Gemini 2.5 Flash' : 'GPT-4o'}
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>

            {showAdvanced && (
              <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-semibold mb-2 dark:text-[#e6edf3]">
                  Base URL (Optional)
                </label>
                <Input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="Custom endpoint URL"
                  className="w-full"
                />
                <p className="mt-1.5 text-xs text-[#59636e] dark:text-[#9198a1]">
                  Only needed for custom API endpoints or proxies.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2 space-y-2">
            {!validationSuccess && (
              <p className="text-xs text-[#59636e] dark:text-[#9198a1] text-center">
                Please validate your API key before saving
              </p>
            )}
            <Button
              onClick={handleSave}
              disabled={!apiKey.trim() || !validationSuccess || loading}
              className="w-full py-2.5 text-base shadow-sm"
            >
              {loading ? 'Saving Configuration...' : 'Save & Continue'}
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-[#d1d9e0] dark:border-[#30363d]">
            <p className="text-sm font-semibold mb-3 dark:text-[#e6edf3]">Don't have an API key?</p>
            <div className="flex flex-wrap gap-3">
              {provider === 'gemini' ? (
                <a
                  href="https://ai.google.dev/gemini-api/docs/api-key"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-[#f6f8fa] dark:bg-[#21262d] text-[#0969da] dark:text-[#58a6ff] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] transition-colors"
                >
                  Get Gemini API Key (Free) →
                </a>
              ) : (
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-[#f6f8fa] dark:bg-[#21262d] text-[#0969da] dark:text-[#58a6ff] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] transition-colors"
                >
                  Get OpenAI API Key →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

