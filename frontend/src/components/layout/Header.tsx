import React from 'react'
import { Link } from 'react-router-dom'
import { theme } from '../../styles/theme'

export interface HeaderProps {
  user?: { email: string } | null
  onLogout?: () => void
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header
      style={{
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid rgba(255, 255, 255, 0.18)`,
        padding: `${theme.spacing.md} ${theme.spacing.xl}`,
        boxShadow: theme.shadows.lg,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link
          to="/"
          style={{
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.black,
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
        <nav>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.lg }}>
              <Link
                to="/home"
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.neutral[800],
                  textDecoration: 'none',
                  fontWeight: theme.typography.fontWeight.medium,
                  borderRadius: theme.borderRadius.md,
                  transition: `all ${theme.transitions.normal}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Home
              </Link>
              <Link
                to="/quiz-history"
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.neutral[800],
                  textDecoration: 'none',
                  fontWeight: theme.typography.fontWeight.medium,
                  borderRadius: theme.borderRadius.md,
                  transition: `all ${theme.transitions.normal}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Assessment History
              </Link>
              <span
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.neutral[800],
                  fontWeight: theme.typography.fontWeight.medium,
                  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                  background: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: theme.borderRadius.md,
                }}
              >
                {user.email}
              </span>
              {onLogout && (
                <button
                  onClick={onLogout}
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.neutral[800],
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    border: `1px solid rgba(255, 255, 255, 0.3)`,
                    borderRadius: theme.borderRadius.md,
                    cursor: 'pointer',
                    fontWeight: theme.typography.fontWeight.medium,
                    transition: `all ${theme.transitions.normal}`,
                    boxShadow: theme.shadows.sm,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = theme.shadows.md
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = theme.shadows.sm
                  }}
                >
                  Logout
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: theme.spacing.md }}>
              <Link
                to="/login"
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.neutral[800],
                  textDecoration: 'none',
                  fontWeight: theme.typography.fontWeight.medium,
                  borderRadius: theme.borderRadius.md,
                  transition: `all ${theme.transitions.normal}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Login
              </Link>
              <Link
                to="/signup"
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  fontSize: theme.typography.fontSize.sm,
                  background: theme.gradients.primary,
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: theme.borderRadius.md,
                  fontWeight: theme.typography.fontWeight.semibold,
                  boxShadow: theme.shadows.md,
                  transition: `all ${theme.transitions.normal}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = theme.shadows.lg
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = theme.shadows.md
                }}
              >
                Sign Up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
