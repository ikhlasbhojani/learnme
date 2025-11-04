import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { theme, getThemeColors } from '../../styles/theme'
import { useTheme } from '../../contexts/ThemeContext'

interface NavbarProps {
  user?: { email: string } | null
  onLogout?: () => void
}

const navItems = [
  { path: '/home', label: 'Home', icon: '📚' },
  { path: '/quiz-config', label: 'New Quiz', icon: '➕' },
  { path: '/quiz-history', label: 'Assessment History', icon: '📋' },
]

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const location = useLocation()
  const { isDark, toggleTheme } = useTheme()
  const colors = getThemeColors(isDark)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  const isActive = (path: string) => {
    return location.pathname === path
  }

  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) {
        setIsMobileMenuOpen(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  // Close dropdown when clicking outside
  React.useEffect(() => {
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

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        background: colors.cardBg,
        borderBottom: `1px solid ${colors.border}`,
        boxShadow: theme.shadows.sm,
        zIndex: 1000,
        padding: `${theme.spacing.md} ${theme.spacing.xl} ${theme.spacing.sm} ${theme.spacing.xl}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1400px',
          margin: '0 auto',
          gap: theme.spacing.lg,
        }}
      >
        {/* Logo */}
        <Link
          to="/home"
          style={{
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.bold,
            color: colors.text,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.xs,
            transition: `all ${theme.transitions.normal}`,
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
            borderRadius: theme.borderRadius.md,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.gray[50]
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <span style={{ fontSize: '20px' }}>📖</span>
          <span>LearnMe</span>
        </Link>

        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: theme.borderRadius.md,
              background: colors.gray[100],
              border: `1px solid ${colors.border}`,
              cursor: 'pointer',
              color: colors.text,
              fontSize: '20px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.gray[200]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.gray[100]
            }}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        )}

        {/* Navigation Links - Desktop */}
        {!isMobile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.md,
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
                      gap: theme.spacing.xs,
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                      borderRadius: theme.borderRadius.md,
                      textDecoration: 'none',
                      background: active ? colors.gray[100] : 'transparent',
                      color: active ? colors.primary : colors.text,
                      fontWeight: active
                        ? theme.typography.fontWeight.semibold
                        : theme.typography.fontWeight.medium,
                      transition: `all ${theme.transitions.normal}`,
                      position: 'relative',
                      fontSize: theme.typography.fontSize.sm,
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = colors.gray[50]
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    <span style={{ fontSize: '16px', opacity: active ? 1 : 0.7 }}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {active && (
                      <motion.div
                        layoutId="active-nav-indicator"
                        style={{
                          position: 'absolute',
                          bottom: `-${theme.spacing.sm}`,
                          left: '8px',
                          right: '8px',
                          height: '2px',
                          background: colors.primary,
                          borderRadius: '2px 2px 0 0',
                        }}
                      />
                    )}
                  </Link>
                )
              })}
            </>
          ) : null}
          </div>
        )}

        {/* Right Side: User Dropdown */}
        {user && (
          <div
            data-user-dropdown
            style={{
              position: 'relative',
            }}
          >
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                borderRadius: theme.borderRadius.md,
                background: colors.gray[100],
                border: `1px solid ${colors.border}`,
                cursor: 'pointer',
                transition: `all ${theme.transitions.normal}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.gray[200]
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.gray[100]
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: colors.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: theme.typography.fontWeight.bold,
                  color: colors.secondary,
                }}
              >
                {user.email[0]?.toUpperCase()}
              </div>
              <span
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: colors.text,
                  fontWeight: theme.typography.fontWeight.medium,
                  maxWidth: '150px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.email}
              </span>
              <span style={{ fontSize: '12px', color: colors.gray[500] }}>
                ▼
              </span>
            </button>

            {/* Dropdown Menu */}
            {isUserDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  minWidth: '200px',
                  background: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: theme.borderRadius.lg,
                  boxShadow: theme.shadows.lg,
                  padding: theme.spacing.xs,
                  zIndex: 1001,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: theme.spacing.xs,
                }}
              >
                {/* User Info */}
                <div
                  style={{
                    padding: theme.spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
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
                        fontSize: '16px',
                        fontWeight: theme.typography.fontWeight.bold,
                        color: colors.secondary,
                      }}
                    >
                      {user.email[0]?.toUpperCase()}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          fontSize: theme.typography.fontSize.sm,
                          fontWeight: theme.typography.fontWeight.semibold,
                          color: colors.text,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {user.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Theme Toggle */}
                <button
                  onClick={async () => {
                    try {
                      await toggleTheme()
                      setIsUserDropdownOpen(false)
                    } catch (err) {
                      console.error('Failed to toggle theme:', err)
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    padding: theme.spacing.md,
                    borderRadius: theme.borderRadius.md,
                    background: 'transparent',
                    border: 'none',
                    color: colors.text,
                    fontWeight: theme.typography.fontWeight.medium,
                    cursor: 'pointer',
                    transition: `all ${theme.transitions.normal}`,
                    fontSize: theme.typography.fontSize.sm,
                    textAlign: 'left',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.gray[50]
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>
                    {isDark ? '☀️' : '🌙'}
                  </span>
                  <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                {/* Divider */}
                <div
                  style={{
                    height: '1px',
                    background: colors.border,
                    margin: `${theme.spacing.xs} 0`,
                  }}
                />

                {/* Logout */}
                <button
                  onClick={() => {
                    onLogout?.()
                    setIsUserDropdownOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    padding: theme.spacing.md,
                    borderRadius: theme.borderRadius.md,
                    background: 'transparent',
                    border: 'none',
                    color: colors.error,
                    fontWeight: theme.typography.fontWeight.medium,
                    cursor: 'pointer',
                    transition: `all ${theme.transitions.normal}`,
                    fontSize: theme.typography.fontSize.sm,
                    textAlign: 'left',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.error + '10'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>🚪</span>
                  <span>Logout</span>
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* Non-authenticated users - Login/Signup */}
        {!user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
            }}
          >
            <Link
              to="/login"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                borderRadius: theme.borderRadius.md,
                textDecoration: 'none',
                background: isActive('/login')
                  ? colors.gray[100]
                  : 'transparent',
                color: colors.text,
                fontWeight: theme.typography.fontWeight.medium,
                transition: `all ${theme.transitions.normal}`,
                fontSize: theme.typography.fontSize.sm,
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
              <span style={{ fontSize: '16px' }}>🔑</span>
              <span>Login</span>
            </Link>
            <Link
              to="/signup"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                borderRadius: theme.borderRadius.md,
                textDecoration: 'none',
                background: colors.primary,
                color: colors.secondary,
                fontWeight: theme.typography.fontWeight.semibold,
                transition: `all ${theme.transitions.normal}`,
                fontSize: theme.typography.fontSize.sm,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)'
              }}
            >
              <span style={{ fontSize: '16px' }}>✨</span>
              <span>Sign Up</span>
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {isMobile && isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.sm,
            paddingTop: theme.spacing.md,
            borderTop: `1px solid ${colors.border}`,
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
                      gap: theme.spacing.sm,
                      padding: theme.spacing.md,
                      borderRadius: theme.borderRadius.lg,
                      textDecoration: 'none',
                      background: active ? colors.gray[100] : 'transparent',
                      color: colors.text,
                      fontWeight: active
                        ? theme.typography.fontWeight.semibold
                        : theme.typography.fontWeight.medium,
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{item.icon}</span>
                    <span>{item.label}</span>
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
                  gap: theme.spacing.sm,
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.lg,
                  textDecoration: 'none',
                  color: colors.text,
                  fontWeight: theme.typography.fontWeight.medium,
                }}
              >
                <span style={{ fontSize: '18px' }}>🔑</span>
                <span>Login</span>
              </Link>
              <Link
                to="/signup"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.lg,
                  textDecoration: 'none',
                  background: colors.primary,
                  color: colors.secondary,
                  fontWeight: theme.typography.fontWeight.semibold,
                }}
              >
                <span style={{ fontSize: '18px' }}>✨</span>
                <span>Sign Up</span>
              </Link>
            </>
          )}
        </motion.div>
      )}
    </motion.nav>
  )
}

