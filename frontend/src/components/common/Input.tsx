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
          className={`block mb-2 text-sm font-semibold ${isDark ? 'text-[#e6edf3]' : 'text-[#1f2328]'}`}
        >
          {label}
          {props.required && (
            <span className={isDark ? 'text-[#f85149]' : 'text-[#cf222e]'} aria-label="required"> *</span>
          )}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-4 py-2.5 text-base rounded-md border transition-all duration-200
          outline-none focus:ring-2 focus:ring-offset-0 font-normal
          placeholder:text-gray-400 dark:placeholder:text-gray-500
          ${error
            ? isDark
              ? 'border-[#f85149] focus:ring-[#f85149]/30 focus:border-[#f85149] bg-[#161b22] text-[#e6edf3]'
              : 'border-[#cf222e] focus:ring-[#cf222e]/20 focus:border-[#cf222e] bg-[#ffffff] text-[#1f2328]'
            : isDark
              ? 'border-[#30363d] bg-[#0d1117] text-[#e6edf3] focus:border-[#58a6ff] focus:ring-[#58a6ff]/30 hover:border-[#484f58]'
              : 'border-[#d1d9e0] bg-[#ffffff] text-[#1f2328] focus:border-[#0969da] focus:ring-[#0969da]/20 hover:border-[#a8b3c0]'
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
          className={`mt-1.5 text-xs ${isDark ? 'text-[#9198a1]' : 'text-[#59636e]'}`}
        >
          {helperText}
        </div>
      )}
    </div>
  )
}
