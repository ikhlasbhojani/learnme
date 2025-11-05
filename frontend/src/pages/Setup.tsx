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

interface ExternalProvider {
  id: string
  name: string
  baseUrl: string
  models: Array<{ id: string; name: string }>
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
    baseUrl?: string
  }
  availableProviders?: Provider[]
  externalProviders?: ExternalProvider[]
}

export default function Setup() {
  const [provider, setProvider] = useState('openai')
  const [model, setModel] = useState('gpt-4o-mini')
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<SetupStatus | null>(null)
  const [selectedExternalProvider, setSelectedExternalProvider] = useState<string>('')
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
        if (provider === 'custom') {
          setModel('') // Clear for custom input
          // Don't clear baseUrl here - let external provider useEffect handle it
        } else {
          setModel(selectedProvider.models[0].id)
          setBaseUrl('') // Clear baseUrl when switching to OpenAI
        }
      }
    }
    
    // Reset external provider selection when switching away from custom
    if (provider !== 'custom') {
      setSelectedExternalProvider('')
      setBaseUrl('') // Clear baseUrl when switching to OpenAI
    }
  }, [provider, status])
  
  // Handle external provider selection - auto-populate baseUrl
  useEffect(() => {
    if (selectedExternalProvider && status?.externalProviders) {
      const extProvider = status.externalProviders.find((p) => p.id === selectedExternalProvider)
      if (extProvider) {
        // Auto-populate baseUrl when external provider is selected
        setBaseUrl(extProvider.baseUrl)
        if (extProvider.models.length > 0) {
          setModel(extProvider.models[0].id)
        }
      }
    } else if (provider === 'custom' && !selectedExternalProvider && baseUrl) {
      // Clear baseUrl when external provider is deselected, but only if it matches a known provider
      // This allows users to keep custom URLs they've entered
      const isKnownProviderUrl = status?.externalProviders?.some(p => p.baseUrl === baseUrl)
      if (isKnownProviderUrl) {
        setBaseUrl('')
      }
    }
  }, [selectedExternalProvider, status, provider])

  const checkStatus = async () => {
    try {
      setIsLoadingStatus(true)
      const data = await apiClient.get<SetupStatus>('/setup/status')
      setStatus(data)
      if (data.hasApiKey && data.config) {
        setProvider(data.config.provider || 'openai')
        setModel(data.config.model || 'gpt-4o-mini')
        setBaseUrl(data.config.baseUrl || '')
        // Check if this matches an external provider
        if (data.config.baseUrl && data.externalProviders) {
          const matchingProvider = data.externalProviders.find(
            (p) => p.baseUrl === data.config?.baseUrl
          )
          if (matchingProvider) {
            setSelectedExternalProvider(matchingProvider.id)
          }
        }
      } else if (data.hasApiKey) {
        // Legacy config - already configured
        navigate('/home')
      }
    } catch (err) {
      console.error('Failed to check setup status:', err)
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
        ...(baseUrl.trim() && { baseUrl: baseUrl.trim() }),
      })
      // Success - redirect to home
      navigate('/home', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration. Please try again.')
      setLoading(false)
    }
  }

  const selectedProvider = status?.availableProviders?.find((p) => p.id === provider)
  const selectedExternal = status?.externalProviders?.find((p) => p.id === selectedExternalProvider)
  const providerLinks: Record<string, string> = {
    openai: 'https://platform.openai.com/api-keys',
    groq: 'https://console.groq.com/keys',
    together: 'https://api.together.xyz/settings/api-keys',
    openrouter: 'https://openrouter.ai/keys',
    perplexity: 'https://www.perplexity.ai/settings/api',
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

          {provider === 'openai' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>What you need:</strong> An OpenAI API key from OpenAI Platform.
                <br />
                <a
                  href={providerLinks.openai}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-600 dark:hover:text-blue-300 mt-1 inline-block"
                >
                  Get your OpenAI API key here
                </a>
              </p>
            </div>
          )}

          {provider === 'custom' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>External Provider:</strong> Choose a pre-configured provider below or enter a custom OpenAI-compatible API endpoint.
                <br />
                <span className="text-xs mt-1 block">
                  All providers must support the OpenAI-compatible API format.
                </span>
              </p>
            </div>
          )}

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

            {provider === 'custom' && status?.externalProviders && status.externalProviders.length > 0 && (
              <div>
                <label
                  htmlFor="externalProvider"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Pre-configured Provider (Optional)
                </label>
                <select
                  id="externalProvider"
                  value={selectedExternalProvider}
                  onChange={(e) => setSelectedExternalProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a provider or enter custom base URL below...</option>
                  {status.externalProviders.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Choose from popular providers (Groq, Together AI, OpenRouter, Perplexity) or enter a custom endpoint below
                </p>
              </div>
            )}

            <div>
              <label
                htmlFor="model"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Model
                <span className="text-red-500 ml-1">*</span>
              </label>
              {provider === 'custom' ? (
                <>
                  {selectedExternal ? (
                    <select
                      id="model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {selectedExternal.models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id="model"
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="Enter your model name (e.g., llama-3.1-70b)"
                      required
                      className="w-full"
                    />
                  )}
                </>
              ) : (
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
              )}
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
                  selectedExternal
                    ? `Enter your ${selectedExternal.name} API Key`
                    : selectedProvider
                    ? `Enter your ${selectedProvider.name} API Key`
                    : provider === 'openai'
                    ? 'Enter your OpenAI API Key'
                    : 'Enter your API Key'
                }
                required
                className="w-full"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This key is stored locally and only used for quiz generation.
                {selectedExternal && providerLinks[selectedExternal.id] && (
                  <>
                    {' '}
                    <a
                      href={providerLinks[selectedExternal.id]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Get your API key
                    </a>
                  </>
                )}
              </p>
            </div>

            {provider === 'custom' && (
              <div>
                <label
                  htmlFor="baseUrl"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Base URL
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <Input
                  id="baseUrl"
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={
                    selectedExternal
                      ? selectedExternal.baseUrl
                      : 'https://api.example.com/v1'
                  }
                  required
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {selectedExternal
                    ? `Auto-filled from ${selectedExternal.name}. You can edit this if needed.`
                    : 'Required for custom OpenAI-compatible APIs (e.g., local LLM servers)'}
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !apiKey.trim() || !model || (provider === 'custom' && !baseUrl.trim())}
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

