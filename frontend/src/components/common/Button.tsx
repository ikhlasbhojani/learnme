import React from 'react'
import { motion } from 'framer-motion'
import { theme, getThemeColors } from '../../styles/theme'
import { useTheme } from '../../contexts/ThemeContext'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}) => {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: theme.typography.fontWeight.medium,
    borderRadius: theme.borderRadius.lg,
    transition: `all ${theme.transitions.normal} ease-in-out`,
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.6 : 1,
  }

  const variantStyles = {
    primary: {
      background: colors.primary,
      color: colors.secondary,
      border: `1px solid ${colors.primary}`,
      boxShadow: theme.shadows.md,
    },
    secondary: {
      background: colors.cardBg,
      color: colors.text,
      border: `1px solid ${colors.border}`,
      boxShadow: theme.shadows.md,
    },
    outline: {
      background: 'transparent',
      border: `2px solid ${colors.primary}`,
      color: colors.text,
    },
    ghost: {
      background: 'transparent',
      color: colors.text,
      border: 'none',
    },
  }

  const sizeStyles = {
    sm: {
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      fontSize: theme.typography.fontSize.sm,
    },
    md: {
      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
      fontSize: theme.typography.fontSize.base,
    },
    lg: {
      padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
      fontSize: theme.typography.fontSize.lg,
    },
  }

  const buttonStyle: React.CSSProperties = {
    ...baseStyles,
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...props.style,
  }

  return (
    <motion.button
      whileHover={
        !disabled && !isLoading
          ? {
              scale: 1.05,
              y: -2,
              boxShadow: theme.shadows.lg,
            }
          : {}
      }
      whileTap={!disabled && !isLoading ? { scale: 0.95 } : {}}
      style={buttonStyle}
      disabled={disabled || isLoading}
      className={className}
      onMouseEnter={(e) => {
        if (!disabled && !isLoading) {
          if (variant === 'primary' || variant === 'secondary') {
            e.currentTarget.style.filter = 'brightness(1.1)'
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isLoading) {
          if (variant === 'primary' || variant === 'secondary') {
            e.currentTarget.style.filter = 'brightness(1)'
          }
        }
      }}
      {...props}
    >
      {isLoading ? (
        <>
          <span style={{ marginRight: theme.spacing.sm }}>Loading...</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  )
}
