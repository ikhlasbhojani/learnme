import React from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme()

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`
        fixed top-4 right-4 z-[1001]
        w-14 h-14 rounded-full
        flex items-center justify-center
        cursor-pointer transition-all duration-300
        ${isDark 
          ? 'bg-[#161b22] border-2 border-[#30363d] text-[#c9d1d9] shadow-lg hover:bg-[#1c2128] hover:shadow-xl' 
          : 'bg-[#f6f8fa] border-2 border-[#d0d7de] text-[#24292f] shadow-lg hover:bg-[#f0f3f6] hover:shadow-xl'
        }
      `}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'rotate(180deg)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'rotate(0deg)'
      }}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? <Sun size={24} /> : <Moon size={24} />}
    </motion.button>
  )
}
