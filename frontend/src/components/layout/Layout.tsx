import React from 'react'
import { Navbar } from './Navbar'
import { theme } from '../../styles/theme'

interface LayoutProps {
  user?: { email: string } | null
  onLogout?: () => void
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar user={user} onLogout={onLogout} />
      <main
        style={{
          flex: 1,
          minHeight: 'calc(100vh - 80px)',
          position: 'relative',
          width: '100%',
        }}
      >
        {children}
      </main>
    </div>
  )
}

