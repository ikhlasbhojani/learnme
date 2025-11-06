import React from 'react'
import { motion } from 'framer-motion'
import { theme, getThemeColors } from '../../styles/theme'
import { useTheme } from '../../contexts/ThemeContext'
import { DocumentationTopic } from '../../services/contentService'

interface TopicSelectorProps {
  topics: DocumentationTopic[]
  selectedTopics: DocumentationTopic[]
  onTopicToggle: (topic: DocumentationTopic) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  isLoading?: boolean
}

export const TopicSelector: React.FC<TopicSelectorProps> = ({
  topics,
  selectedTopics,
  onTopicToggle,
  onSelectAll,
  onDeselectAll,
  isLoading,
}) => {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const selectedTopicIds = new Set(selectedTopics.map((t) => t.id))
  const groupedBySection = topics.reduce((acc, topic) => {
    const section = topic.section || 'Other'
    if (!acc[section]) {
      acc[section] = []
    }
    acc[section].push(topic)
    return acc
  }, {} as Record<string, DocumentationTopic[]>)

  const sections = Object.keys(groupedBySection)

  if (isLoading) {
    return (
      <div
        style={{
          padding: theme.spacing.xl,
          textAlign: 'center',
          color: colors.text,
        }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p style={{ marginTop: theme.spacing.md, color: colors.gray[600] }}>
          Extracting topics from documentation...
        </p>
      </div>
    )
  }

  if (topics.length === 0) {
    return (
      <div
        style={{
          padding: theme.spacing.xl,
          textAlign: 'center',
          color: colors.gray[600],
        }}
      >
        <p>No topics found. Please try a different URL.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: theme.spacing.md }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.lg,
        }}
      >
        <h3
          style={{
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            color: colors.text,
          }}
        >
          Select Topics ({selectedTopics.length} of {topics.length} selected)
        </h3>
        <div style={{ display: 'flex', gap: theme.spacing.sm }}>
          <button
            onClick={onSelectAll}
            style={{
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              backgroundColor: colors.primary + '20',
              color: colors.primary,
              border: `1px solid ${colors.primary}`,
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              fontSize: theme.typography.fontSize.sm,
            }}
          >
            Select All
          </button>
          <button
            onClick={onDeselectAll}
            style={{
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              backgroundColor: colors.gray[100],
              color: colors.gray[700],
              border: `1px solid ${colors.border}`,
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              fontSize: theme.typography.fontSize.sm,
            }}
          >
            Deselect All
          </button>
        </div>
      </div>

      <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: theme.spacing.sm }}>
        {sections.map((section) => (
          <div key={section} style={{ marginBottom: theme.spacing.xl }}>
            <h4
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.medium,
                color: colors.text,
                marginBottom: theme.spacing.md,
                paddingBottom: theme.spacing.xs,
                borderBottom: `2px solid ${colors.border}`,
              }}
            >
              {section}
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: theme.spacing.md,
              }}
            >
              {groupedBySection[section].map((topic) => {
                const isSelected = selectedTopicIds.has(topic.id)
                return (
                  <motion.div
                    key={topic.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onTopicToggle(topic)}
                    style={{
                      padding: theme.spacing.md,
                      backgroundColor: isSelected ? colors.primary + '20' : colors.cardBg,
                      border: `2px solid ${isSelected ? colors.primary : colors.border}`,
                      borderRadius: theme.borderRadius.lg,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: theme.spacing.sm,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        style={{
                          marginTop: '4px',
                          cursor: 'pointer',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <h5
                          style={{
                            fontSize: theme.typography.fontSize.base,
                            fontWeight: theme.typography.fontWeight.semibold,
                            color: colors.text,
                            marginBottom: theme.spacing.xs,
                          }}
                        >
                          {topic.title}
                        </h5>
                        {topic.description && (
                          <p
                            style={{
                              fontSize: theme.typography.fontSize.sm,
                              color: colors.gray[600],
                              marginBottom: theme.spacing.xs,
                            }}
                          >
                            {topic.description}
                          </p>
                        )}
                        <a
                          href={topic.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
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
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
