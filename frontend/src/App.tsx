import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
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

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
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
