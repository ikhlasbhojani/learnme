import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import { AIConfigSetup } from './components/common/AIConfigSetup'
import { useAuth } from './hooks/useAuth'
import Home from './pages/Home'
import LearningModes from './pages/LearningModes'
import QuizConfigPage from './pages/QuizConfig'
import DocumentationTopicSelection from './pages/DocumentationTopicSelection'
import GenerateQuiz from './pages/GenerateQuiz'
import Quiz from './pages/Quiz'
import Assessment from './pages/Assessment'
import QuizHistory from './pages/QuizHistory'
import BookLibrary from './pages/BookLibrary'
import BookMindMap from './pages/BookMindMap'
import BookReader from './pages/BookReader'
import Settings from './pages/Settings'

function App() {
  const { user, refreshUser, loading } = useAuth()
  const [showAIConfig, setShowAIConfig] = useState(false)
  const [checkingConfig, setCheckingConfig] = useState(true)

  // Check if THIS BROWSER has been configured (not just if DB has API key)
  useEffect(() => {
    if (!loading) {
      // Check if this browser session has been configured
      // This flag persists in localStorage and is cleared when user clears site data
      const browserConfigured = localStorage.getItem('learnme_ai_configured') === 'true'
      
      if (!browserConfigured) {
        // Browser not configured - show modal even if DB has API key
        setShowAIConfig(true)
      }
      setCheckingConfig(false)
    }
  }, [loading])

  const handleAIConfigComplete = async () => {
    // Flag already set by updateProfile, just refresh and close
    await refreshUser()
    setShowAIConfig(false)
  }

  // Show loading state while checking config
  if (checkingConfig || loading) {
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        </ThemeProvider>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
      {showAIConfig && <AIConfigSetup onComplete={handleAIConfigComplete} />}
      <Routes>
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route
                  path="/home"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                       <Route
                         path="/learning-modes"
                         element={
                           <ProtectedRoute>
                             <LearningModes />
                           </ProtectedRoute>
                         }
                       />
                       <Route
                         path="/quiz-config"
                         element={
                           <ProtectedRoute>
                             <QuizConfigPage />
                           </ProtectedRoute>
                         }
                       />
                       <Route
                         path="/documentation-topics"
                         element={
                           <ProtectedRoute>
                             <DocumentationTopicSelection />
                           </ProtectedRoute>
                         }
                       />
                       <Route
                         path="/generate-quiz"
                         element={
                           <ProtectedRoute>
                             <GenerateQuiz />
                           </ProtectedRoute>
                         }
                       />
                <Route
                  path="/quiz/:quizId"
                  element={
                    <ProtectedRoute>
                      <Quiz />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/assessment/:quizId"
                  element={
                    <ProtectedRoute>
                      <Assessment />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/quiz-history"
                  element={
                    <ProtectedRoute>
                      <QuizHistory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/books"
                  element={
                    <ProtectedRoute>
                      <BookLibrary />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/books/mindmap"
                  element={
                    <ProtectedRoute>
                      <BookMindMap />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/books/reader"
                  element={
                    <ProtectedRoute>
                      <BookReader />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/home" replace />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
