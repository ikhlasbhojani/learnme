import React from 'react'
import { motion } from 'framer-motion'
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
  
  // Base classes - GitHub-inspired sleek design
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-all duration-150 ease-in-out whitespace-nowrap select-none outline-none relative font-sans border'
  
  // Variant classes - Perfect GitHub button styles with proper text colors for light and dark theme
  const variantClasses = {
    primary: isDark 
      ? 'bg-[#21262d] text-white border-[#30363d] shadow-[0_1px_0_0_rgba(27,31,36,0.1),inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:bg-[#30363d] hover:border-[#484f58] hover:text-white hover:shadow-[0_1px_0_0_rgba(27,31,36,0.1),inset_0_1px_0_0_rgba(255,255,255,0.08)] active:bg-[#161b22] active:border-[#21262d] active:text-white active:shadow-[inset_0_1px_0_0_rgba(0,0,0,0.2)]'
      : 'bg-[#24292f] text-white border-[#24292f] shadow-[0_1px_0_0_rgba(27,31,36,0.1),inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:bg-[#161b22] hover:border-[#161b22] hover:text-white hover:shadow-[0_1px_0_0_rgba(27,31,36,0.1),inset_0_1px_0_0_rgba(255,255,255,0.05)] active:bg-[#0d1117] active:border-[#0d1117] active:text-white active:shadow-[inset_0_1px_0_0_rgba(0,0,0,0.2)]',
    secondary: isDark
      ? 'bg-[#161b22] text-[#c9d1d9] border-[#30363d] shadow-[0_1px_0_0_rgba(27,31,36,0.1),inset_0_1px_0_0_rgba(255,255,255,0.03)] hover:bg-[#21262d] hover:border-[#484f58] hover:text-[#c9d1d9] hover:shadow-[0_1px_0_0_rgba(27,31,36,0.1),inset_0_1px_0_0_rgba(255,255,255,0.05)] active:bg-[#161b22] active:border-[#161b22] active:text-[#c9d1d9] active:shadow-[inset_0_1px_0_0_rgba(0,0,0,0.2)]'
      : 'bg-[#ffffff] text-[#24292f] border-[#d1d9de] shadow-[0_1px_0_0_rgba(27,31,36,0.04),inset_0_1px_0_0_rgba(0,0,0,0.02)] hover:bg-[#f6f8fa] hover:border-[#d0d7de] hover:text-[#24292f] hover:shadow-[0_1px_0_0_rgba(27,31,36,0.04),inset_0_1px_0_0_rgba(0,0,0,0.02)] active:bg-[#f3f4f6] active:border-[#d0d7de] active:text-[#24292f] active:shadow-[inset_0_1px_0_0_rgba(0,0,0,0.05)]',
    outline: isDark
      ? 'bg-transparent border-[#30363d] text-[#c9d1d9] shadow-none hover:bg-[#21262d] hover:border-[#484f58] hover:text-[#c9d1d9] active:bg-[#161b22] active:border-[#30363d] active:text-[#c9d1d9]'
      : 'bg-transparent border-[#d1d9de] text-[#24292f] shadow-none hover:bg-[#f6f8fa] hover:border-[#d0d7de] hover:text-[#24292f] active:bg-[#f3f4f6] active:border-[#d1d9de] active:text-[#24292f]',
    ghost: isDark
      ? 'bg-transparent border-transparent text-[#c9d1d9] shadow-none hover:bg-[#21262d] hover:text-[#c9d1d9] active:bg-[#161b22] active:text-[#c9d1d9]'
      : 'bg-transparent border-transparent text-[#24292f] shadow-none hover:bg-[#f6f8fa] hover:text-[#24292f] active:bg-[#f3f4f6] active:text-[#24292f]',
  }
  
  // Size classes - Perfect GitHub button sizes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs min-h-[28px] leading-4',
    md: 'px-4 py-2 text-sm min-h-[32px] leading-5',
    lg: 'px-6 py-3 text-base min-h-[44px] leading-6',
  }
  
  // Disabled/loading classes - Ensure text color is maintained when disabled
  const disabledClasses = (disabled || isLoading) 
    ? 'opacity-50 cursor-not-allowed' 
    : 'cursor-pointer'
  
  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`
  
  return (
    <motion.button
      whileHover={!disabled && !isLoading ? { scale: 1.005 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.995 } : {}}
      className={buttonClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-1">
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </motion.button>
  )
}
