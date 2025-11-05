import React from 'react'
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
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={inputId}
          className={`block mb-2 text-sm font-medium ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}
        >
          {label}
          {props.required && (
            <span className={isDark ? 'text-[#f85149]' : 'text-[#cf222e]'}> *</span>
          )}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-4 py-2 text-base rounded-md border transition-all duration-300
          outline-none focus:ring-2 focus:ring-offset-0
          ${error
            ? isDark
              ? 'border-[#f85149] focus:ring-[#f85149] focus:border-[#f85149]'
              : 'border-[#cf222e] focus:ring-[#cf222e] focus:border-[#cf222e]'
            : isDark
              ? 'border-[#30363d] bg-[#0d1117] text-[#c9d1d9] focus:border-[#58a6ff] focus:ring-[#58a6ff]'
              : 'border-[#d0d7de] bg-[#ffffff] text-[#24292f] focus:border-[#0969da] focus:ring-[#0969da]'
          }
          ${className}
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={
          error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
        }
        {...props}
      />
      {error && (
        <div
          id={`${inputId}-error`}
          role="alert"
          className={`mt-1 text-sm ${isDark ? 'text-[#f85149]' : 'text-[#cf222e]'}`}
        >
          {error}
        </div>
      )}
      {helperText && !error && (
        <div
          id={`${inputId}-helper`}
          className={`mt-1 text-sm ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}
        >
          {helperText}
        </div>
      )}
    </div>
  )
}
