import React from 'react'
import { motion } from 'framer-motion'
import { theme, getThemeColors } from '../../styles/theme'
import { useTheme } from '../../hooks/useTheme'

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme()
  const colors = getThemeColors(isDark)

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      style={{
        position: 'fixed',
        top: theme.spacing.md,
        right: theme.spacing.md,
        zIndex: 1001,
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: colors.cardBg,
        border: `2px solid ${colors.border}`,
        boxShadow: theme.shadows.lg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '24px',
        color: colors.text,
        transition: `all ${theme.transitions.normal}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = colors.gray[100]
        e.currentTarget.style.boxShadow = theme.shadows.xl
        e.currentTarget.style.transform = 'rotate(180deg)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = colors.cardBg
        e.currentTarget.style.boxShadow = theme.shadows.lg
        e.currentTarget.style.transform = 'rotate(0deg)'
      }}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? '☀️' : '🌙'}
    </motion.button>
  )
}

