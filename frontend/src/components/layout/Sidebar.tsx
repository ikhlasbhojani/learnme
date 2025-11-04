import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { theme, getThemeColors } from '../../styles/theme'
import { useTheme } from '../../hooks/useTheme'

export interface SidebarProps {
  user?: { email: string } | null
  onLogout?: () => void
}

interface NavItem {
  path: string
  label: string
  icon: string
  requiresAuth?: boolean
}

const navItems: NavItem[] = [
  { path: '/home', label: 'Home', icon: '🏠', requiresAuth: true },
  { path: '/quiz-config', label: 'New Quiz', icon: '📝', requiresAuth: true },
  { path: '/quiz-history', label: 'Assessment History', icon: '📊', requiresAuth: true },
]

export const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const { isDark, toggleTheme } = useTheme()
  const colors = getThemeColors(isDark)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setIsOpen(false)
      } else {
        setIsOpen(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false)
    }
  }, [location.pathname, isMobile])

  const toggleSidebar = () => {
    const newState = !isOpen
    setIsOpen(newState)
    // Notify layout about sidebar width change
    const event = new CustomEvent('sidebar-toggle', {
      detail: { width: newState ? '280px' : '80px', toggle: false },
    })
    window.dispatchEvent(event)
  }

  // Listen for external toggle requests (mobile menu button)
  useEffect(() => {
    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail?.toggle) {
        setIsOpen(!isOpen)
      }
    }

    window.addEventListener('sidebar-toggle', handleToggle)
    return () => window.removeEventListener('sidebar-toggle', handleToggle)
  }, [isOpen])

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const sidebarWidth = isOpen ? '280px' : '80px'

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 998,
          }}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarWidth,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          position: 'fixed',
          left: isMobile && !isOpen ? '-280px' : 0,
          top: 0,
          bottom: 0,
          background: colors.cardBg,
          borderRight: `1px solid ${colors.border}`,
          boxShadow: theme.shadows.lg,
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: `left ${theme.transitions.normal}`,
        }}
      >
        {/* Logo Section */}
        <div
          style={{
            padding: theme.spacing.lg,
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: isOpen ? 'space-between' : 'center',
            minHeight: '70px',
          }}
        >
          {isOpen ? (
            <Link
              to="/"
              style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: colors.text,
                textDecoration: 'none',
                transition: `transform ${theme.transitions.normal}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              LearnMe
            </Link>
          ) : (
            <div
              style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: colors.text,
              }}
            >
              L
            </div>
          )}
          <button
            onClick={toggleSidebar}
            style={{
            background: colors.gray[100],
            border: `1px solid ${colors.border}`,
            borderRadius: theme.borderRadius.md,
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '18px',
            color: colors.text,
              transition: `all ${theme.transitions.normal}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.gray[200]
              e.currentTarget.style.transform = 'rotate(180deg)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.gray[100]
              e.currentTarget.style.transform = 'rotate(0deg)'
            }}
          >
            {isOpen ? '←' : '→'}
          </button>
        </div>

        {/* Navigation */}
        <nav
          style={{
            flex: 1,
            padding: theme.spacing.md,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.xs,
          }}
        >
          {user ? (
            <>
              {navItems.map((item) => {
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.md,
                      padding: theme.spacing.md,
                      borderRadius: theme.borderRadius.lg,
                      textDecoration: 'none',
                      background: active
                        ? colors.gray[100]
                        : 'transparent',
                      border: active
                        ? `1px solid ${colors.primary}`
                        : '1px solid transparent',
                      color: colors.text,
                      fontWeight: active
                        ? theme.typography.fontWeight.semibold
                        : theme.typography.fontWeight.medium,
                      transition: `all ${theme.transitions.normal}`,
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = colors.gray[50]
                        e.currentTarget.style.transform = 'translateX(4px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.transform = 'translateX(0)'
                      }
                    }}
                  >
                    <span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>
                      {item.icon}
                    </span>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                          }}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '4px',
                          height: '60%',
                          background: colors.primary,
                          borderRadius: '0 4px 4px 0',
                        }}
                      />
                    )}
                  </Link>
                )
              })}
            </>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.lg,
                  textDecoration: 'none',
                  background: isActive('/login')
                    ? colors.gray[100]
                    : 'transparent',
                  color: colors.text,
                  fontWeight: theme.typography.fontWeight.medium,
                  transition: `all ${theme.transitions.normal}`,
                  marginBottom: theme.spacing.xs,
                }}
                onMouseEnter={(e) => {
                  if (!isActive('/login')) {
                    e.currentTarget.style.background = colors.gray[50]
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive('/login')) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>🔐</span>
                <AnimatePresence>
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                    >
                      Login
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
              <Link
                to="/signup"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.lg,
                  textDecoration: 'none',
                  background: colors.primary,
                  color: colors.secondary,
                  fontWeight: theme.typography.fontWeight.semibold,
                  transition: `all ${theme.transitions.normal}`,
                  boxShadow: theme.shadows.md,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)'
                  e.currentTarget.style.boxShadow = theme.shadows.lg
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = theme.shadows.md
                }}
              >
                <span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>✨</span>
                <AnimatePresence>
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                    >
                      Sign Up
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </>
          )}
        </nav>

        {/* User Section */}
        {user && (
          <div
            style={{
              padding: theme.spacing.md,
              borderTop: `1px solid ${colors.border}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.md,
                padding: theme.spacing.md,
                borderRadius: theme.borderRadius.lg,
                background: colors.gray[50],
                marginBottom: theme.spacing.sm,
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: colors.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: theme.typography.fontWeight.bold,
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                {user.email.charAt(0).toUpperCase()}
              </div>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: theme.typography.fontSize.sm,
                    color: colors.text,
                    fontWeight: theme.typography.fontWeight.medium,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                      }}
                    >
                      {user.email}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.lg,
                  background: colors.gray[100],
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                  fontWeight: theme.typography.fontWeight.medium,
                  cursor: 'pointer',
                  transition: `all ${theme.transitions.normal}`,
                  fontSize: theme.typography.fontSize.sm,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.gray[200]
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.gray[100]
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <span style={{ fontSize: '18px', minWidth: '24px', textAlign: 'center' }}>🚪</span>
                <AnimatePresence>
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                    >
                      Logout
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )}
          </div>
        )}
      </motion.aside>
    </>
  )
}

