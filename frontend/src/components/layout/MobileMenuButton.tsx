import React from 'react'
import { motion } from 'framer-motion'
import { Menu } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

interface MobileMenuButtonProps {
  onClick: () => void
}

export const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({ onClick }) => {
  const { isDark } = useTheme()
  
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`
        fixed top-4 left-4 z-[1001]
        w-12 h-12 rounded-lg
        flex items-center justify-center
        cursor-pointer transition-all duration-300
        ${isDark
          ? 'bg-[#161b22] border border-[#30363d] text-[#c9d1d9] shadow-lg hover:bg-[#1c2128]'
          : 'bg-[#f6f8fa] border border-[#d0d7de] text-[#24292f] shadow-lg hover:bg-[#f0f3f6]'
        }
      `}
    >
      <Menu size={24} />
    </motion.button>
  )
}
