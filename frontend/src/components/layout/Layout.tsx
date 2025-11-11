import React from 'react'
import { Navbar } from './Navbar'
import { theme } from '../../styles/theme'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
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

