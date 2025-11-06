import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/common/Button'
import { URLInput } from '../components/common/URLInput'
import { TopicSelector } from '../components/common/TopicSelector'
import { theme, getThemeColors } from '../styles/theme'
import { useTheme } from '../contexts/ThemeContext'
import { contentService, DocumentationTopic } from '../services/contentService'

export default function DocumentationTopicSelection() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const [url, setUrl] = useState('')
  const [topics, setTopics] = useState<DocumentationTopic[]>([])
  const [selectedTopics, setSelectedTopics] = useState<DocumentationTopic[]>([])
  const [isExtractingTopics, setIsExtractingTopics] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTopicSelection, setShowTopicSelection] = useState(false)
  const [hasUrlParam, setHasUrlParam] = useState(false)

  // Handle URL from query parameter
  useEffect(() => {
    const urlParam = searchParams.get('url')
    if (urlParam) {
      const decodedUrl = decodeURIComponent(urlParam)
      setUrl(decodedUrl)
      setHasUrlParam(true)
      setIsExtractingTopics(true) // Set loading immediately
      handleExtractTopics(decodedUrl)
    } else {
      setHasUrlParam(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleExtractTopics = async (submittedUrl: string) => {
    setUrl(submittedUrl)
    setError(null)
    setTopics([])
    setSelectedTopics([])
    setShowTopicSelection(false)

    if (!submittedUrl || !submittedUrl.trim()) {
      setError('Please enter a valid URL')
      return
    }

    // Extract topics from documentation
    setIsExtractingTopics(true)
    try {
      const result = await contentService.extractTopicsFromUrl(submittedUrl)
      console.log('Extracted topics:', result)
      if (result.topics && result.topics.length > 0) {
        setTopics(result.topics)
        setShowTopicSelection(true)
      } else {
        setError('No topics found in this documentation. You can still proceed to generate a quiz from the main page.')
      }
    } catch (err: any) {
      console.error('Failed to extract topics:', err)
      setError(err.message || 'Failed to extract topics from documentation. Please try again.')
    } finally {
      setIsExtractingTopics(false)
    }
  }

  const handleURLSubmit = (submittedUrl: string) => {
    handleExtractTopics(submittedUrl)
  }

  const handleTopicToggle = (topic: DocumentationTopic) => {
    setSelectedTopics((prev) => {
      const isSelected = prev.some((t) => t.id === topic.id)
      if (isSelected) {
        return prev.filter((t) => t.id !== topic.id)
      } else {
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

    // Navigate to quiz generation with selected topics
    const topicsParam = encodeURIComponent(JSON.stringify(selectedTopics))
    const urlParam = encodeURIComponent(url)
    navigate(`/generate-quiz?url=${urlParam}&topics=${topicsParam}`)
  }

  const handleContinueWithoutTopics = () => {
    // Navigate to quiz generation with just the URL
    const urlParam = encodeURIComponent(url)
    navigate(`/generate-quiz?url=${urlParam}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        minHeight: 'calc(100vh - 80px)',
        padding: theme.spacing.xl,
        maxWidth: '1200px',
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
        Documentation Topic Selection
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
        Enter a documentation URL to extract topics, then select which topics you want to generate a quiz from
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

      {/* URL Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            marginBottom: theme.spacing.md,
            color: colors.text,
          }}
        >
          Documentation URL
        </h2>
        {hasUrlParam && isExtractingTopics ? (
          // Show loader when URL is provided and extracting
          <div
            style={{
              padding: theme.spacing.xl,
              textAlign: 'center',
            }}
          >
            <div
              className="animate-spin rounded-full border-3 mx-auto mb-4"
              style={{
                width: '48px',
                height: '48px',
                border: `3px solid ${colors.border}`,
                borderTopColor: colors.primary,
              }}
            ></div>
            <p
              style={{
                fontSize: theme.typography.fontSize.base,
                color: colors.text,
                marginBottom: theme.spacing.md,
                fontWeight: theme.typography.fontWeight.medium,
              }}
            >
              Extracting topics from documentation...
            </p>
            <div
              style={{
                padding: theme.spacing.md,
                backgroundColor: colors.primary + '10',
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.sm,
                color: colors.gray[600],
                wordBreak: 'break-all',
                border: `1px solid ${colors.border}`,
              }}
            >
              {url}
            </div>
          </div>
        ) : hasUrlParam && error ? (
          // Show error with URL if extraction failed
          <div>
            <div
              style={{
                padding: theme.spacing.md,
                backgroundColor: colors.primary + '10',
                borderRadius: theme.borderRadius.md,
                marginBottom: theme.spacing.md,
                fontSize: theme.typography.fontSize.sm,
                color: colors.gray[600],
                wordBreak: 'break-all',
                border: `1px solid ${colors.border}`,
              }}
            >
              {url}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setHasUrlParam(false)
                setError(null)
                setUrl('')
              }} 
              style={{ width: '100%' }}
            >
              Try Different URL
            </Button>
          </div>
        ) : !showTopicSelection && !hasUrlParam ? (
          // Show input only if no URL param and not showing topics
          <URLInput onURLSubmit={handleURLSubmit} isLoading={isExtractingTopics} />
        ) : showTopicSelection ? (
          // Show URL loaded state when topics are ready
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
              ✓ URL loaded: {url}
            </div>
            <Button variant="ghost" size="sm" onClick={() => {
              setShowTopicSelection(false)
              setHasUrlParam(false)
              setTopics([])
              setSelectedTopics([])
            }} style={{ width: '100%' }}>
              Change URL
            </Button>
          </div>
        ) : null}
      </motion.div>

      {/* Topic Selection Section */}
      {showTopicSelection && topics.length > 0 && (
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
              onClick={handleContinueWithoutTopics}
              style={{ flex: 1 }}
            >
              Use Main Page Instead
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

