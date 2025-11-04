import React from 'react'
import { motion } from 'framer-motion'
import { theme, getThemeColors } from '../../styles/theme'
import { useTheme } from '../../hooks/useTheme'

interface MobileMenuButtonProps {
  onClick: () => void
}

export const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({ onClick }) => {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      style={{
        position: 'fixed',
        top: theme.spacing.md,
        left: theme.spacing.md,
        zIndex: 1001,
        width: '48px',
        height: '48px',
        borderRadius: theme.borderRadius.lg,
        background: colors.cardBg,
        border: `1px solid ${colors.border}`,
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
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = colors.cardBg
      }}
    >
      ☰
    </motion.button>
  )
}

