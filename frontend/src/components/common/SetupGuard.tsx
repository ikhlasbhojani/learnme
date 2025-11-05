import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { apiClient } from '../../services/apiClient'

interface SetupStatus {
  hasApiKey: boolean
  isConfigured: boolean
}

interface SetupGuardProps {
  children: React.ReactNode
}

export const SetupGuard: React.FC<SetupGuardProps> = ({ children }) => {
  const [loading, setLoading] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)

  useEffect(() => {
    checkSetup()
  }, [])

  const checkSetup = async () => {
    try {
      const status = await apiClient.get<SetupStatus>('/setup/status')
      if (!status.hasApiKey) {
        setNeedsSetup(true)
      }
    } catch (error) {
      console.error('Failed to check setup status:', error)
      // On error, allow through (might be network issue)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return null // or a loading spinner
  }

  if (needsSetup) {
    return <Navigate to="/setup" replace />
  }

  return <>{children}</>
}

