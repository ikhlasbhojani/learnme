import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { URLInput } from '../components/common/URLInput'
import { FileUpload } from '../components/common/FileUpload'
import { Modal } from '../components/common/Modal'
import { theme, getThemeColors } from '../styles/theme'
import { useTheme } from '../contexts/ThemeContext'
import { quizGenerationService } from '../services/quizGenerationService'

type InputType = 'url' | 'document' | null

export default function GenerateQuiz() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const [inputType, setInputType] = useState<InputType>(null)
  const [url, setUrl] = useState('')
  const [document, setDocument] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [numberOfQuestions, setNumberOfQuestions] = useState('10')
  const [timeDuration, setTimeDuration] = useState('3600')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  // Handle URL parameters for pre-filling
  useEffect(() => {
    const urlParam = searchParams.get('url')
    const documentParam = searchParams.get('document')
    
    if (urlParam) {
      setUrl(decodeURIComponent(urlParam))
      setInputType('url')
    } else if (documentParam) {
      // Only use URL param for small documents
      const docContent = decodeURIComponent(documentParam)
      if (docContent.length < 5000) {
        setDocument(docContent)
        setInputType('document')
      }
    }
  }, [searchParams])

  const handleFileSelect = async (file: File) => {
    setFileError(null)
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        if (content && content.trim().length > 0) {
          setDocument(content)
          setInputType('document')
        } else {
          setFileError('File appears to be empty. Please select a file with content.')
        }
      }
      reader.onerror = () => {
        setFileError('Failed to read file. Please try again.')
      }
      reader.readAsText(file)
    } catch (err) {
      setFileError('Failed to process file. Please try again.')
    }
  }

  const handleURLSubmit = (submittedUrl: string) => {
    setUrl(submittedUrl)
    setInputType('url')
  }

  const handleGenerate = async () => {
    setError(null)

    // Validate inputs
    if (!inputType) {
      setError('Please select an input method (URL or Document)')
      return
    }

    if (inputType === 'url' && !url) {
      setError('Please enter a valid URL')
      return
    }

    if (inputType === 'document' && !document.trim()) {
      setError('Please provide document content')
      return
    }

    const numQuestions = parseInt(numberOfQuestions, 10)
    const duration = parseInt(timeDuration, 10)

    if (isNaN(numQuestions) || numQuestions < 1 || numQuestions > 100) {
      setError('Number of questions must be between 1 and 100')
      return
    }

    if (isNaN(duration) || duration < 60) {
      setError('Time duration must be at least 60 seconds')
      return
    }

    setIsGenerating(true)

    try {
      let response
      if (inputType === 'url') {
        response = await quizGenerationService.generateQuizFromUrl({
          url,
          difficulty,
          numberOfQuestions: numQuestions,
          timeDuration: duration,
        })
      } else {
        response = await quizGenerationService.generateQuizFromDocument({
          document,
          difficulty,
          numberOfQuestions: numQuestions,
          timeDuration: duration,
        })
      }

      // Validate quizId exists
      console.log('Quiz generation response:', response)
      if (!response.quizId) {
        console.error('Quiz ID missing in response:', response)
        throw new Error('Quiz ID not returned from server')
      }

      console.log('Navigating to quiz:', response.quizId)
      // Navigate to quiz with generated quiz ID
      navigate(`/quiz/${response.quizId}`)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to generate quiz. Please try again.'
      setError(errorMessage)
      setIsGenerating(false)
    }
  }

  const resetForm = () => {
    setInputType(null)
    setUrl('')
    setDocument('')
    setError(null)
    setFileError(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        minHeight: 'calc(100vh - 80px)',
        padding: theme.spacing.xl,
        maxWidth: '1000px',
        margin: '0 auto',
      }}
    >
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          marginBottom: theme.spacing.xl,
          textAlign: 'center',
          color: colors.text,
        }}
      >
        Generate Quiz with AI
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          fontSize: theme.typography.fontSize.lg,
          color: colors.gray[600],
          marginBottom: theme.spacing['2xl'],
          textAlign: 'center',
        }}
      >
        Provide a URL or document, and our AI will create a personalized quiz for you
      </motion.p>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: theme.spacing.lg,
            padding: theme.spacing.md,
            backgroundColor: colors.error + '20',
            color: colors.error,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${colors.error}`,
          }}
        >
          {error}
        </motion.div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: theme.spacing.xl,
          marginBottom: theme.spacing.xl,
        }}
      >
        {/* URL Input Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            backgroundColor: colors.cardBg,
            padding: theme.spacing.xl,
            borderRadius: theme.borderRadius.xl,
            boxShadow: theme.shadows.md,
            border: `2px solid ${inputType === 'url' ? colors.primary : colors.border}`,
          }}
        >
          <h2
            style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.md,
              color: colors.text,
            }}
          >
            Generate from URL
          </h2>
          {inputType !== 'url' ? (
            <URLInput onURLSubmit={handleURLSubmit} isLoading={isGenerating} />
          ) : (
            <div>
              <div
                style={{
                  padding: theme.spacing.md,
                  backgroundColor: colors.primary + '20',
                  borderRadius: theme.borderRadius.md,
                  marginBottom: theme.spacing.md,
                  fontSize: theme.typography.fontSize.sm,
                  color: colors.text,
                  wordBreak: 'break-all',
                }}
              >
                ✓ URL selected: {url}
              </div>
              <Button variant="ghost" size="sm" onClick={resetForm} style={{ width: '100%' }}>
                Change URL
              </Button>
            </div>
          )}
        </motion.div>

        {/* Document Upload Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            backgroundColor: colors.cardBg,
            padding: theme.spacing.xl,
            borderRadius: theme.borderRadius.xl,
            boxShadow: theme.shadows.md,
            border: `2px solid ${inputType === 'document' ? colors.primary : colors.border}`,
          }}
        >
          <h2
            style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.md,
              color: colors.text,
            }}
          >
            Generate from Document
          </h2>
          {inputType !== 'document' ? (
            <FileUpload
              onFileSelect={handleFileSelect}
              onError={setFileError}
              maxSizeMB={5}
              acceptedTypes={['.txt', '.md']}
            />
          ) : (
            <div>
              <div
                style={{
                  padding: theme.spacing.md,
                  backgroundColor: colors.primary + '20',
                  borderRadius: theme.borderRadius.md,
                  marginBottom: theme.spacing.md,
                  fontSize: theme.typography.fontSize.sm,
                  color: colors.text,
                }}
              >
                ✓ Document loaded ({document.length} characters)
              </div>
              <Button variant="ghost" size="sm" onClick={resetForm} style={{ width: '100%' }}>
                Change Document
              </Button>
            </div>
          )}
          {fileError && (
            <div
              style={{
                marginTop: theme.spacing.sm,
                padding: theme.spacing.sm,
                backgroundColor: colors.error + '20',
                color: colors.error,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.sm,
              }}
            >
              {fileError}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quiz Configuration */}
      {inputType && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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
              marginBottom: theme.spacing.lg,
              color: colors.text,
            }}
          >
            Quiz Configuration
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: theme.spacing.lg,
            }}
          >
            {/* Difficulty Selection */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  marginBottom: theme.spacing.sm,
                  color: colors.text,
                }}
              >
                Difficulty Level
              </label>
              <div
                style={{
                  display: 'flex',
                  gap: theme.spacing.sm,
                  flexWrap: 'wrap',
                }}
              >
                {(['easy', 'medium', 'hard'] as const).map((level) => (
                  <Button
                    key={level}
                    variant={difficulty === level ? 'primary' : 'outline'}
                    size="md"
                    onClick={() => setDifficulty(level)}
                    style={{ flex: 1, minWidth: '100px' }}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Number of Questions */}
            <div>
              <Input
                type="number"
                label="Number of Questions"
                value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(e.target.value)}
                min="1"
                max="100"
                required
                helperText="Maximum 100 questions"
              />
            </div>

            {/* Time Duration */}
            <div>
              <Input
                type="number"
                label="Time Duration (seconds)"
                value={timeDuration}
                onChange={(e) => setTimeDuration(e.target.value)}
                min="60"
                required
                helperText="Minimum 60 seconds"
              />
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerate}
            isLoading={isGenerating}
            disabled={isGenerating}
            style={{
              width: '100%',
              marginTop: theme.spacing.lg,
            }}
          >
            {isGenerating ? 'Generating Quiz...' : 'Generate Quiz'}
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}

