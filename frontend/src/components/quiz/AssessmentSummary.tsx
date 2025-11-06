import React from 'react'
import { ArrowRight } from 'lucide-react'
import { AssessmentResult } from '../../types'
import { theme, getThemeColors } from '../../styles/theme'
import { useTheme } from '../../contexts/ThemeContext'

interface AssessmentSummaryProps {
  result: AssessmentResult
  quizName?: string | null
}

export const AssessmentSummary: React.FC<AssessmentSummaryProps> = ({ result, quizName }) => {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  
  return (
    <div
      style={{
        backgroundColor: colors.cardBg,
        padding: theme.spacing['2xl'],
        borderRadius: theme.borderRadius.xl,
        boxShadow: theme.shadows.lg,
        border: `1px solid ${colors.border}`,
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      {quizName && (
        <div
          style={{
            textAlign: 'center',
            marginBottom: theme.spacing.lg,
          }}
        >
          <div
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: colors.gray[500],
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: theme.spacing.xs,
            }}
          >
            Quiz Name
          </div>
          <h1
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: colors.text,
            }}
          >
            {quizName}
          </h1>
        </div>
      )}
      
      <h2
        style={{
          fontSize: theme.typography.fontSize['2xl'],
          fontWeight: theme.typography.fontWeight.bold,
          marginBottom: theme.spacing.xl,
          color: colors.text,
        }}
      >
        Performance Review
      </h2>

      <div
        style={{
          padding: theme.spacing.lg,
          backgroundColor: colors.gray[50],
          borderRadius: theme.borderRadius.md,
          marginBottom: theme.spacing.xl,
          fontSize: theme.typography.fontSize.base,
          lineHeight: 1.6,
          color: colors.gray[500],
        }}
      >
        {result.performanceReview}
      </div>

      {/* Detailed Analysis Section */}
      {result.detailedAnalysis && (
        <div style={{ marginBottom: theme.spacing.xl }}>
          <h3
            style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.md,
              color: colors.text,
            }}
          >
            Detailed Analysis
          </h3>
          <div
            style={{
              padding: theme.spacing.lg,
              backgroundColor: colors.gray[50],
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.base,
              lineHeight: 1.8,
              color: colors.gray[700],
              whiteSpace: 'pre-wrap',
            }}
          >
            {result.detailedAnalysis}
          </div>
        </div>
      )}

      {/* Strengths Section */}
      {result.strengths && result.strengths.length > 0 && (
        <div style={{ marginBottom: theme.spacing.xl }}>
          <h3
            style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.md,
              color: colors.text,
            }}
          >
            Your Strengths
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {result.strengths.map((strength, index) => (
              <span
                key={index}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  backgroundColor: colors.success + '20',
                  color: colors.success,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                }}
              >
                {strength}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Weak Areas Section */}
      {result.weakAreas.length > 0 && (
        <div style={{ marginBottom: theme.spacing.xl }}>
          <h3
            style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.md,
              color: colors.text,
            }}
          >
            Areas Needing Improvement
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {result.weakAreas.map((area, index) => (
              <span
                key={index}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  backgroundColor: colors.warning + '20',
                  color: colors.warning,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                }}
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Improvement Areas Section */}
      {result.improvementAreas && result.improvementAreas.length > 0 && (
        <div style={{ marginBottom: theme.spacing.xl }}>
          <h3
            style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.md,
              color: colors.text,
            }}
          >
            Specific Improvement Areas
          </h3>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing.sm,
            }}
          >
            {result.improvementAreas.map((area, index) => (
              <li
                key={index}
                style={{
                  padding: theme.spacing.md,
                  backgroundColor: colors.gray[50],
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  color: colors.gray[700],
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: theme.spacing.sm,
                }}
              >
                <span style={{ color: colors.warning, fontSize: '1.2em' }}>•</span>
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested Improvements Section */}
      <div>
        <h3
          style={{
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            marginBottom: theme.spacing.md,
            color: colors.text,
          }}
        >
          Actionable Recommendations
        </h3>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.sm,
          }}
        >
          {result.suggestions.map((suggestion, index) => (
            <li
              key={index}
              style={{
                padding: theme.spacing.md,
                backgroundColor: colors.info + '15',
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.base,
                color: colors.gray[700],
                display: 'flex',
                alignItems: 'flex-start',
                gap: theme.spacing.sm,
                borderLeft: `3px solid ${colors.info}`,
              }}
            >
              <ArrowRight size={16} color={colors.info} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
