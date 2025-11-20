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
  
  // Variant classes - Professional, modern button styles with perfect contrast
  const variantClasses = {
    primary: isDark 
      ? 'bg-[#238636] text-white border-[#238636] shadow-[0_1px_0_0_rgba(0,0,0,0.1)] hover:bg-[#2ea043] hover:border-[#2ea043] hover:shadow-[0_4px_8px_rgba(0,0,0,0.2)] active:bg-[#1a7f30] active:shadow-inner transition-all duration-200'
      : 'bg-[#0969da] text-white border-[#0969da] shadow-[0_1px_0_0_rgba(0,0,0,0.05)] hover:bg-[#0550ae] hover:border-[#0550ae] hover:shadow-[0_4px_8px_rgba(9,105,218,0.3)] active:bg-[#033d8b] active:shadow-inner transition-all duration-200',
    secondary: isDark
      ? 'bg-[#161b22] text-[#e6edf3] border-[#30363d] shadow-[0_1px_0_0_rgba(0,0,0,0.1)] hover:bg-[#1c2128] hover:border-[#484f58] hover:shadow-[0_4px_8px_rgba(0,0,0,0.15)] active:bg-[#0d1117] active:shadow-inner transition-all duration-200'
      : 'bg-[#f6f8fa] text-[#1f2328] border-[#d1d9e0] shadow-[0_1px_0_0_rgba(0,0,0,0.04)] hover:bg-[#eaeef2] hover:border-[#a8b3c0] hover:shadow-[0_4px_8px_rgba(0,0,0,0.08)] active:bg-[#d1d9e0] active:shadow-inner transition-all duration-200',
    outline: isDark
      ? 'bg-transparent border-[#484f58] text-[#e6edf3] hover:bg-[#161b22] hover:border-[#58a6ff] hover:text-[#58a6ff] hover:shadow-[0_0_0_1px_#58a6ff_inset] active:bg-[#0d1117] transition-all duration-200'
      : 'bg-transparent border-[#d1d9e0] text-[#1f2328] hover:bg-[#f6f8fa] hover:border-[#0969da] hover:text-[#0969da] hover:shadow-[0_0_0_1px_#0969da_inset] active:bg-[#eaeef2] transition-all duration-200',
    ghost: isDark
      ? 'bg-transparent border-transparent text-[#e6edf3] hover:bg-[#161b22] hover:text-[#58a6ff] active:bg-[#1c2128] transition-all duration-200'
      : 'bg-transparent border-transparent text-[#1f2328] hover:bg-[#f6f8fa] hover:text-[#0969da] active:bg-[#eaeef2] transition-all duration-200',
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
