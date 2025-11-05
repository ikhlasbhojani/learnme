import fs from 'fs'
import path from 'path'
import { AIModelConfig } from '../../services/ai/ai-provider.interface'

const envPath = process.env.ENV_FILE_PATH || path.join(process.cwd(), '.env')

export interface SetupStatus {
  hasApiKey: boolean
  isConfigured: boolean
  provider?: string
  model?: string
}

function getEnvValue(key: string): string {
  return process.env[key] || ''
}

function setEnvValue(key: string, value: string): void {
  process.env[key] = value
}

export function getSetupStatus(): SetupStatus {
  // Read directly from process.env to get latest value
  const apiKey = getEnvValue('AI_API_KEY') || getEnvValue('GEMINI_API_KEY') || ''
  const provider = getEnvValue('AI_PROVIDER') || 'openai'
  const model = getEnvValue('AI_MODEL') || ''
  const hasApiKey = !!(apiKey && apiKey.trim().length > 0)
  return {
    hasApiKey,
    isConfigured: hasApiKey,
    provider,
    model,
  }
}

export function getAIConfig(): AIModelConfig {
  const provider = (getEnvValue('AI_PROVIDER') || 'openai') as any
  const model = getEnvValue('AI_MODEL') || (provider === 'openai' ? 'gpt-4o-mini' : '')
  const apiKey = getEnvValue('AI_API_KEY') || getEnvValue('GEMINI_API_KEY') || ''
  const baseUrl = getEnvValue('AI_BASE_URL') || undefined

  return {
    provider,
    model,
    apiKey,
    baseUrl,
  }
}

export function updateAIConfig(config: {
  provider: string
  model: string
  apiKey: string
  baseUrl?: string
}): void {
  // Read existing .env file
  let envContent = ''
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8')
  }

  // Update or add AI configuration
  const lines = envContent.split('\n')
  const updates: Record<string, string> = {
    AI_PROVIDER: config.provider,
    AI_MODEL: config.model,
    AI_API_KEY: config.apiKey,
  }

  if (config.baseUrl) {
    updates.AI_BASE_URL = config.baseUrl
  }

  // Remove old GEMINI_API_KEY if it exists
  const updatedLines = lines
    .filter((line) => {
      const trimmed = line.trim()
      return (
        !trimmed.startsWith('AI_PROVIDER=') &&
        !trimmed.startsWith('AI_MODEL=') &&
        !trimmed.startsWith('AI_API_KEY=') &&
        !trimmed.startsWith('AI_BASE_URL=') &&
        !trimmed.startsWith('GEMINI_API_KEY=')
      )
    })
    .filter((line) => line.trim().length > 0)

  // Add new configuration
  Object.entries(updates).forEach(([key, value]) => {
    updatedLines.push(`${key}=${value}`)
  })

  // Write back to .env file
  fs.writeFileSync(envPath, updatedLines.join('\n') + '\n')

  // Update the in-memory config immediately
  Object.entries(updates).forEach(([key, value]) => {
    setEnvValue(key, value)
  })

  // Keep legacy GEMINI_API_KEY for backward compatibility (if it was set)
  // But we no longer use it as primary

  // Reload dotenv
  const { config: loadEnv } = require('dotenv')
  loadEnv({ path: envPath, override: true })
}

