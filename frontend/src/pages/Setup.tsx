import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../services/apiClient'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { motion } from 'framer-motion'

interface Provider {
  id: string
  name: string
  models: Array<{ id: string; name: string }>
  baseUrl?: string
}

interface SetupStatus {
  hasApiKey: boolean
  isConfigured: boolean
  provider?: string
  model?: string
  config?: {
    provider: string
    model: string
    apiKey?: string
  }
  availableProviders?: Provider[]
}

export default function Setup() {
  const [provider, setProvider] = useState('openai')
  const [model, setModel] = useState('gpt-4o-mini')
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<SetupStatus | null>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkStatus()
  }, [])

  useEffect(() => {
    // Set default model when provider changes
    if (status?.availableProviders) {
      const selectedProvider = status.availableProviders.find((p) => p.id === provider)
      if (selectedProvider && selectedProvider.models.length > 0) {
        setModel(selectedProvider.models[0].id)
      }
    }
  }, [provider, status])

  const checkStatus = async () => {
    try {
      setIsLoadingStatus(true)
      const data = await apiClient.get<SetupStatus>('/setup/status')
      setStatus(data)
      if (data.hasApiKey && data.config) {
        setProvider(data.config.provider || 'openai')
        setModel(data.config.model || 'gpt-4o-mini')
        // Don't populate API key field for security (user can re-enter if needed)
        // But show the form so they can update it
      } else if (data.hasApiKey && !data.config) {
        // Legacy config - has key but no config, show form to configure
        // Don't redirect, allow user to set up provider/model
      }
      // If no API key, form will show empty and user can enter it
    } catch (err: any) {
      console.error('Failed to check setup status:', err)
      // If unauthorized, redirect to login
      if (err?.status === 401 || err?.response?.status === 401) {
        navigate('/login', { replace: true })
      }
    } finally {
      setIsLoadingStatus(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await apiClient.post('/setup/config', {
        provider,
        model,
        apiKey: apiKey.trim(),
      })
      // Success - redirect to home
      navigate('/home', { replace: true })
    } catch (err: any) {
      // If unauthorized, redirect to login
      if (err?.status === 401 || err?.response?.status === 401) {
        navigate('/login', { replace: true })
        return
      }
      setError(err.message || 'Failed to save configuration. Please try again.')
      setLoading(false)
    }
  }

  const selectedProvider = status?.availableProviders?.find((p) => p.id === provider)
  const providerLinks: Record<string, string> = {
    openai: 'https://platform.openai.com/api-keys',
    gemini: 'https://makersuite.google.com/app/apikey',
    grok: 'https://x.ai/api',
    claude: 'https://console.anthropic.com/settings/keys',
    deepseek: 'https://platform.deepseek.com/api_keys',
    mistral: 'https://console.mistral.ai/api-keys',
  }

  if (isLoadingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to LearnMe!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Let's get you started with a quick setup
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>What you need:</strong> An API key from your selected provider.
              <br />
              {providerLinks[provider] && (
                <a
                  href={providerLinks[provider]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-600 dark:hover:text-blue-300 mt-1 inline-block"
                >
                  Get your {selectedProvider?.name || provider} API key here
                </a>
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="provider"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                AI Provider
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                id="provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {status?.availableProviders?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="model"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Model
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {selectedProvider?.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="apiKey"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                API Key
                <span className="text-red-500 ml-1">*</span>
              </label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  selectedProvider
                    ? `Enter your ${selectedProvider.name} API Key`
                    : 'Enter your API Key'
                }
                required
                className="w-full"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This key is stored locally and only used for quiz generation.
                {status?.hasApiKey && (
                  <span className="block mt-1 text-yellow-600 dark:text-yellow-400">
                    ⚠️ An API key is already configured. Enter a new key to update it.
                  </span>
                )}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !apiKey.trim() || !model}
              className="w-full"
            >
              {loading ? 'Saving...' : 'Continue'}
            </Button>
          </form>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            You can update this later from your profile settings
          </p>
        </div>
      </motion.div>
    </div>
  )
}

