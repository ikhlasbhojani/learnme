import React, { useEffect, useState } from 'react'
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../../utils/storage'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState<string>('')

  useEffect(() => {
    const stored = getStorageItem<string>(STORAGE_KEYS.DISPLAY_NAME)
    setDisplayName(stored)
    if (stored) {
      setNameInput(stored)
    }
  }, [])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = nameInput.trim()
    if (!trimmed) return
    setStorageItem(STORAGE_KEYS.DISPLAY_NAME, trimmed)
    setDisplayName(trimmed)
  }

  if (!displayName) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <form onSubmit={handleSave} className="w-full max-w-sm rounded-lg border p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Welcome! What should we call you?</h2>
          <p className="text-sm text-gray-600 mb-4">Enter your name to personalize your experience.</p>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your name"
            className="w-full px-3 py-2 border rounded-md mb-3 focus:outline-none focus:ring-2"
            autoFocus
          />
          <button
            type="submit"
            className="w-full px-4 py-2 rounded-md text-white"
            style={{ backgroundColor: '#2da44e' }}
            disabled={!nameInput.trim()}
          >
            Continue
          </button>
        </form>
      </div>
    )
  }

  return <>{children}</>
}
