import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { useTheme } from '../contexts/ThemeContext'
import { getThemeColors } from '../styles/theme'

export default function QuizConfigPage() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const handleStart = () => {
    // Navigate to quiz generation page
    navigate('/generate-quiz')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        minHeight: 'calc(100vh - 80px)',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          width: '100%',
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.border}`,
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: colors.text, marginBottom: '24px', textAlign: 'center' }}>
          Create New Quiz
        </h1>

        <p style={{ fontSize: '16px', color: colors.text, opacity: 0.7, marginBottom: '32px', textAlign: 'center' }}>
          Configure your quiz settings and start generating questions from your content.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button onClick={handleStart} variant="primary" size="lg">
            Get Started
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

