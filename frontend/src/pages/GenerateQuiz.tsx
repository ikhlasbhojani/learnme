import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { URLInput } from '../components/common/URLInput'
import { TopicSelector } from '../components/common/TopicSelector'
import { theme, getThemeColors } from '../styles/theme'
import { useTheme } from '../contexts/ThemeContext'
import { quizGenerationService } from '../services/quizGenerationService'
import { contentService, DocumentationTopic } from '../services/contentService'

type InputType = 'url' | null

export default function GenerateQuiz() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const [inputType, setInputType] = useState<InputType>(null)
  const [url, setUrl] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [numberOfQuestions, setNumberOfQuestions] = useState('10')
  const [timeDuration, setTimeDuration] = useState('3600')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Topic extraction state
  const [topics, setTopics] = useState<DocumentationTopic[]>([])
  const [selectedTopics, setSelectedTopics] = useState<DocumentationTopic[]>([])
  const [isExtractingTopics, setIsExtractingTopics] = useState(false)
  const [showTopicSelection, setShowTopicSelection] = useState(false)

  // Handle URL parameters for pre-filling
  useEffect(() => {
    const urlParam = searchParams.get('url')
    const topicsParam = searchParams.get('topics')
    
    if (urlParam) {
      const decodedUrl = decodeURIComponent(urlParam)
      setUrl(decodedUrl)
      setInputType('url')
      
      // If topics are provided, use them (coming from DocumentationTopicSelection page)
      if (topicsParam) {
        try {
          const parsedTopics = JSON.parse(decodeURIComponent(topicsParam)) as DocumentationTopic[]
          if (Array.isArray(parsedTopics) && parsedTopics.length > 0) {
            setSelectedTopics(parsedTopics)
            // Don't show topic selection UI since topics are already selected
            setShowTopicSelection(false)
          }
        } catch (err) {
          console.error('Failed to parse topics from URL:', err)
        }
      }
    }
  }, [searchParams])

  const handleURLSubmit = async (submittedUrl: string) => {
    setUrl(submittedUrl)
    setInputType('url')
    setError(null)
    setTopics([])
    setSelectedTopics([])
    setShowTopicSelection(false)

    // Extract topics from documentation
    setIsExtractingTopics(true)
    try {
      const result = await contentService.extractTopicsFromUrl(submittedUrl)
      console.log('Extracted topics:', result)
      if (result.topics && result.topics.length > 0) {
        setTopics(result.topics)
        setShowTopicSelection(true)
        // Don't select any topic by default - user must choose
      } else {
        // No topics found, allow proceeding with single URL
        // User can still generate quiz from the main page
        console.log('No topics found, user can proceed with main URL')
      }
    } catch (err: any) {
      console.error('Failed to extract topics:', err)
      setError(err.message || 'Failed to extract topics from documentation. Please try again or use a single URL.')
      // Continue without topic selection - user can still generate from single URL
    } finally {
      setIsExtractingTopics(false)
    }
  }

  const handleTopicToggle = (topic: DocumentationTopic) => {
    setSelectedTopics((prev) => {
      const isSelected = prev.some((t) => t.id === topic.id)
      if (isSelected) {
        // Remove topic
        return prev.filter((t) => t.id !== topic.id)
      } else {
        // Add topic
        return [...prev, topic]
      }
    })
  }

  const handleSelectAllTopics = () => {
    setSelectedTopics([...topics])
  }

  const handleDeselectAllTopics = () => {
    setSelectedTopics([])
  }

  const handleContinueWithTopics = () => {
    if (selectedTopics.length === 0) {
      setError('Please select at least one topic to continue')
      return
    }
    setShowTopicSelection(false)
  }

  const handleSkipTopicSelection = () => {
    setShowTopicSelection(false)
    setSelectedTopics([])
    // User wants to use the main URL instead
  }

  const handleGenerate = async () => {
    setError(null)

    // Validate inputs
    if (!inputType || !url) {
      setError('Please enter a valid URL')
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
      // Use selected topic if available, otherwise use single URL
      const request: any = {
        difficulty,
        numberOfQuestions: numQuestions,
        timeDuration: duration,
      }
      
      if (selectedTopics.length > 0) {
        // User selected one or more topics
        request.selectedTopics = selectedTopics
      } else {
        // Use the main URL
        request.url = url
      }

      const response = await quizGenerationService.generateQuizFromUrl(request)

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
    setError(null)
    setTopics([])
    setSelectedTopics([])
    setShowTopicSelection(false)
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
        Provide a URL, and our AI will create a personalized quiz for you
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

      {/* URL Input Card - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          backgroundColor: colors.cardBg,
          padding: theme.spacing.xl,
          borderRadius: theme.borderRadius.xl,
          boxShadow: theme.shadows.md,
          border: `2px solid ${inputType === 'url' ? colors.primary : colors.border}`,
          marginBottom: theme.spacing.xl,
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
            
            {/* Show Selected Topics if provided */}
            {selectedTopics.length > 0 && (
              <div
                style={{
                  padding: theme.spacing.md,
                  backgroundColor: colors.primary + '10',
                  borderRadius: theme.borderRadius.md,
                  marginBottom: theme.spacing.md,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <h3
                  style={{
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: colors.text,
                    marginBottom: theme.spacing.sm,
                  }}
                >
                  Selected Topics ({selectedTopics.length}):
                </h3>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: theme.spacing.xs,
                  }}
                >
                  {selectedTopics.map((topic) => (
                    <div
                      key={topic.id}
                      style={{
                        padding: theme.spacing.sm,
                        backgroundColor: colors.cardBg,
                        borderRadius: theme.borderRadius.sm,
                        border: `1px solid ${colors.border}`,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: theme.spacing.sm,
                      }}
                    >
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: colors.primary,
                          marginTop: '6px',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: theme.typography.fontSize.sm,
                            fontWeight: theme.typography.fontWeight.medium,
                            color: colors.text,
                            marginBottom: theme.spacing.xs / 2,
                          }}
                        >
                          {topic.title}
                        </div>
                        {topic.section && (
                          <div
                            style={{
                              fontSize: theme.typography.fontSize.xs,
                              color: colors.gray[600],
                              marginBottom: theme.spacing.xs / 2,
                            }}
                          >
                            {topic.section}
                          </div>
                        )}
                        <a
                          href={topic.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: theme.typography.fontSize.xs,
                            color: colors.primary,
                            textDecoration: 'none',
                          }}
                        >
                          View page →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <Button variant="ghost" size="sm" onClick={resetForm} style={{ width: '100%' }}>
              Change URL
            </Button>
          </div>
        )}
      </motion.div>

      {/* Topic Selection - Only show if topics were extracted on this page (not from query params) */}
      {showTopicSelection && topics.length > 0 && selectedTopics.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
            Select Topics
          </h2>
          <p
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: colors.gray[600],
              marginBottom: theme.spacing.lg,
            }}
          >
            We found {topics.length} topics in this documentation. Select one or more topics to generate a quiz from.
          </p>
          <TopicSelector
            topics={topics}
            selectedTopics={selectedTopics}
            onTopicToggle={handleTopicToggle}
            onSelectAll={handleSelectAllTopics}
            onDeselectAll={handleDeselectAllTopics}
            isLoading={isExtractingTopics}
          />
          <div style={{ display: 'flex', gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
            <Button
              variant="primary"
              onClick={handleContinueWithTopics}
              disabled={selectedTopics.length === 0}
              style={{ flex: 1 }}
            >
              Continue with Selected Topics ({selectedTopics.length})
            </Button>
            <Button
              variant="outline"
              onClick={handleSkipTopicSelection}
              style={{ flex: 1 }}
            >
              Use Main Page Instead
            </Button>
          </div>
        </motion.div>
      )}

      {/* Quiz Configuration - Show when URL is selected (with or without topics) */}
      {inputType === 'url' && (
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
            disabled={isGenerating || (!url && selectedTopics.length === 0)}
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

