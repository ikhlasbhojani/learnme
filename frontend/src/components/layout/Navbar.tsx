import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Plus, FileText, Moon, Sun, X, Menu, ChevronDown, Settings } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { getStorageItem, STORAGE_KEYS } from '../../utils/storage'

export const Navbar: React.FC = () => {
  const location = useLocation()
  const { isDark, toggleTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const displayName = getStorageItem<string>(STORAGE_KEYS.DISPLAY_NAME) || 'Guest'

  const isActive = (path: string) => location.pathname === path

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setIsMobileMenuOpen(false)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserDropdownOpen) {
        const target = event.target as HTMLElement
        if (!target.closest('[data-user-dropdown]')) {
          setIsUserDropdownOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isUserDropdownOpen])

  const navItems = [
    { path: '/home', label: 'Home', icon: BookOpen },
    { path: '/quiz-config', label: 'New Quiz', icon: Plus },
    { path: '/quiz-history', label: 'History', icon: FileText },
  ]

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className={`sticky top-0 z-50 w-full border-b backdrop-blur-md transition-colors duration-300
        ${isDark 
          ? 'bg-[#0d1117]/80 border-[#30363d]' 
          : 'bg-white/80 border-[#d1d9e0]'
        }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/home"
            className={`flex items-center gap-2 text-xl font-bold transition-colors duration-200
              ${isDark ? 'text-[#e6edf3] hover:text-[#58a6ff]' : 'text-[#1f2328] hover:text-[#0969da]'}`}
          >
            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-[#1f6feb]/10' : 'bg-[#0969da]/10'}`}>
              <BookOpen size={20} className={isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'} />
            </div>
            <span>LearnMe</span>
          </Link>

          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const active = isActive(item.path)
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2
                      ${active 
                        ? (isDark ? 'text-[#58a6ff]' : 'text-[#0969da]') 
                        : (isDark ? 'text-[#e6edf3] hover:bg-[#161b22]' : 'text-[#1f2328] hover:bg-[#f6f8fa]')
                      }`}
                  >
                    <Icon size={16} className={active ? 'opacity-100' : 'opacity-70'} />
                    <span>{item.label}</span>
                    {active && (
                      <motion.div
                        layoutId="active-nav-indicator"
                        className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-t-full
                          ${isDark ? 'bg-[#58a6ff]' : 'bg-[#0969da]'}`}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            {isMobile && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 rounded-md transition-colors
                  ${isDark 
                    ? 'text-[#e6edf3] hover:bg-[#161b22]' 
                    : 'text-[#1f2328] hover:bg-[#f6f8fa]'}`}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}

            {/* User Dropdown */}
            <div className="relative" data-user-dropdown>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border transition-all duration-200
                  ${isDark 
                    ? 'bg-[#161b22] border-[#30363d] hover:border-[#8b949e] text-[#e6edf3]' 
                    : 'bg-white border-[#d1d9e0] hover:border-[#59636e] text-[#1f2328]'}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white
                  ${isDark ? 'bg-[#238636]' : 'bg-[#1a7f37]'}`}>
                  {displayName[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium max-w-[100px] truncate hidden sm:block">
                  {displayName}
                </span>
                <ChevronDown size={14} className={`opacity-50 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isUserDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    className={`absolute right-0 mt-2 w-56 rounded-xl border shadow-xl overflow-hidden
                      ${isDark 
                        ? 'bg-[#161b22] border-[#30363d] shadow-black/20' 
                        : 'bg-white border-[#d1d9e0] shadow-gray-200'}`}
                  >
                    {/* User Header */}
                    <div className={`px-4 py-3 border-b ${isDark ? 'border-[#30363d]' : 'border-[#d1d9e0]'}`}>
                      <p className={`text-sm font-medium ${isDark ? 'text-[#e6edf3]' : 'text-[#1f2328]'}`}>
                        Signed in as
                      </p>
                      <p className={`text-sm font-bold truncate ${isDark ? 'text-[#e6edf3]' : 'text-[#1f2328]'}`}>
                        {displayName}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="p-1">
                      <Link
                        to="/settings"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors
                          ${isDark 
                            ? 'text-[#e6edf3] hover:bg-[#21262d]' 
                            : 'text-[#1f2328] hover:bg-[#f6f8fa]'}`}
                      >
                        <Settings size={16} />
                        Settings
                      </Link>
                      
                      <div className={`h-px my-1 mx-2 ${isDark ? 'bg-[#30363d]' : 'bg-[#d1d9e0]'}`} />
                      
                      <button
                        onClick={() => {
                          toggleTheme()
                          // Keep open to see change
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors
                          ${isDark 
                            ? 'text-[#e6edf3] hover:bg-[#21262d]' 
                            : 'text-[#1f2328] hover:bg-[#f6f8fa]'}`}
                      >
                        <div className="flex items-center gap-2">
                          {isDark ? <Moon size={16} /> : <Sun size={16} />}
                          <span>Theme</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${isDark 
                            ? 'bg-[#30363d] text-[#8b949e]' 
                            : 'bg-[#eaeef2] text-[#656d76]'}`}>
                          {isDark ? 'Dark' : 'Light'}
                        </span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobile && isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`border-t ${isDark ? 'border-[#30363d] bg-[#0d1117]' : 'border-[#d1d9e0] bg-white'}`}
          >
            <div className="p-4 space-y-2">
              {navItems.map((item) => {
                const active = isActive(item.path)
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                      ${active
                        ? (isDark ? 'bg-[#1f6feb]/15 text-[#58a6ff]' : 'bg-[#0969da]/10 text-[#0969da]')
                        : (isDark ? 'text-[#e6edf3] hover:bg-[#161b22]' : 'text-[#1f2328] hover:bg-[#f6f8fa]')
                      }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

