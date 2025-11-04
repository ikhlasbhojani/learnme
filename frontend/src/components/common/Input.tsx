import React from 'react'
import { theme, getThemeColors } from '../../styles/theme'
import { useTheme } from '../../contexts/ThemeContext'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  id,
  className = '',
  ...props
}) => {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    border: `1px solid ${error ? colors.error : colors.border}`,
    borderRadius: theme.borderRadius.md,
    background: colors.cardBg,
    color: colors.text,
    transition: `all ${theme.transitions.normal}`,
    outline: 'none',
    boxShadow: theme.shadows.sm,
  }

  if (error) {
    inputStyle.borderColor = colors.error
  }

  return (
    <div style={{ marginBottom: theme.spacing.md }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: 'block',
            marginBottom: theme.spacing.sm,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            color: colors.text,
          }}
        >
          {label}
          {props.required && <span style={{ color: colors.error }}> *</span>}
        </label>
      )}
      <input
        id={inputId}
        style={inputStyle}
        className={className}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={
          error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
        }
        onFocus={(e) => {
          e.currentTarget.style.borderColor = colors.primary
          e.currentTarget.style.boxShadow = theme.shadows.md
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? colors.error : colors.border
          e.currentTarget.style.boxShadow = theme.shadows.sm
        }}
        {...props}
      />
      {error && (
        <div
          id={`${inputId}-error`}
          role="alert"
          style={{
            marginTop: theme.spacing.xs,
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.error,
          }}
        >
          {error}
        </div>
      )}
      {helperText && !error && (
        <div
          id={`${inputId}-helper`}
          style={{
            marginTop: theme.spacing.xs,
            fontSize: theme.typography.fontSize.sm,
            color: colors.gray[500],
          }}
        >
          {helperText}
        </div>
      )}
    </div>
  )
}
