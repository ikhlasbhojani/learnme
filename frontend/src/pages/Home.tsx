import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/common/Button'
import { FileUpload } from '../components/common/FileUpload'
import { URLInput } from '../components/common/URLInput'
import { Modal } from '../components/common/Modal'
import { theme, getThemeColors } from '../styles/theme'
import { useTheme } from '../contexts/ThemeContext'

export default function Home() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const colors = useMemo(() => getThemeColors(isDark), [isDark])
  const [showFileModal, setShowFileModal] = useState(false)
  const [showURLModal, setShowURLModal] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)

  const handleManualInput = () => {
    navigate('/learning-modes?input=manual')
  }

  const handleFileSelect = (file: File) => {
    setFileError(null)
    // File is uploaded, navigate to learning modes
    setShowFileModal(false)
    navigate('/learning-modes?input=file')
  }

  const handleURLSubmit = (url: string) => {
    // URL is processed, navigate to learning modes
    setShowURLModal(false)
    navigate('/learning-modes?input=url')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xl,
        position: 'relative',
      }}
    >
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: theme.typography.fontWeight.bold,
          marginBottom: theme.spacing.lg,
          textAlign: 'center',
          color: colors.text,
        }}
      >
        Welcome to LearnMe
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          fontSize: theme.typography.fontSize.xl,
          color: colors.text,
          marginBottom: theme.spacing['3xl'],
          textAlign: 'center',
          maxWidth: '600px',
          fontWeight: theme.typography.fontWeight.medium,
        }}
      >
        Choose how you'd like to provide your learning content
      </motion.p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: theme.spacing.xl,
          width: '100%',
          maxWidth: '900px',
        }}
      >
        <motion.div
          key={`card-manual-${isDark}-${colors.cardBg}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            backgroundColor: colors.cardBg,
          }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05, y: -8 }}
          style={{
            backgroundColor: colors.cardBg,
            padding: theme.spacing['2xl'],
            borderRadius: theme.borderRadius['2xl'],
            boxShadow: theme.shadows.lg,
            border: `1px solid ${colors.border}`,
            textAlign: 'center',
            cursor: 'pointer',
          }}
          onClick={handleManualInput}
        >
          <div
            style={{
              fontSize: '3rem',
              marginBottom: theme.spacing.md,
            }}
          >
            ✍️
          </div>
          <h2
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              marginBottom: theme.spacing.md,
              color: colors.text,
            }}
          >
            Manual Input
          </h2>
          <p
            style={{
              fontSize: theme.typography.fontSize.base,
              color: colors.gray[500],
              marginBottom: theme.spacing.lg,
              fontWeight: theme.typography.fontWeight.medium,
            }}
          >
            Type or paste your learning topic
          </p>
          <Button variant="primary" size="lg" onClick={handleManualInput}>
            Start Learning
          </Button>
        </motion.div>

        <motion.div
          key={`card-file-${isDark}-${colors.cardBg}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            backgroundColor: colors.cardBg,
          }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05, y: -8 }}
          style={{
            backgroundColor: colors.cardBg,
            padding: theme.spacing['2xl'],
            borderRadius: theme.borderRadius['2xl'],
            boxShadow: theme.shadows.lg,
            border: `1px solid ${colors.border}`,
            textAlign: 'center',
            cursor: 'pointer',
          }}
          onClick={() => setShowFileModal(true)}
        >
          <div
            style={{
              fontSize: '3rem',
              marginBottom: theme.spacing.md,
            }}
          >
            📄
          </div>
          <h2
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              marginBottom: theme.spacing.md,
              color: colors.text,
            }}
          >
            Upload File
          </h2>
          <p
            style={{
              fontSize: theme.typography.fontSize.base,
              color: colors.gray[500],
              marginBottom: theme.spacing.lg,
              fontWeight: theme.typography.fontWeight.medium,
            }}
          >
            Upload PDF, DOC, or TXT file
          </p>
          <Button variant="secondary" size="lg" onClick={() => setShowFileModal(true)}>
            Upload File
          </Button>
        </motion.div>

        <motion.div
          key={`card-url-${isDark}-${colors.cardBg}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            backgroundColor: colors.cardBg,
          }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.05, y: -8 }}
          style={{
            backgroundColor: colors.cardBg,
            padding: theme.spacing['2xl'],
            borderRadius: theme.borderRadius['2xl'],
            boxShadow: theme.shadows.lg,
            border: `1px solid ${colors.border}`,
            textAlign: 'center',
            cursor: 'pointer',
          }}
          onClick={() => setShowURLModal(true)}
        >
          <div
            style={{
              fontSize: '3rem',
              marginBottom: theme.spacing.md,
            }}
          >
            🔗
          </div>
          <h2
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              marginBottom: theme.spacing.md,
              color: colors.text,
            }}
          >
            Add via URL
          </h2>
          <p
            style={{
              fontSize: theme.typography.fontSize.base,
              color: colors.gray[500],
              marginBottom: theme.spacing.lg,
              fontWeight: theme.typography.fontWeight.medium,
            }}
          >
            Paste a web link to learning content
          </p>
          <Button variant="outline" size="lg" onClick={() => setShowURLModal(true)}>
            Add URL
          </Button>
        </motion.div>
      </div>

      {/* File Upload Modal */}
      <Modal
        isOpen={showFileModal}
        onClose={() => {
          setShowFileModal(false)
          setFileError(null)
        }}
        title="Upload Learning File"
        size="md"
      >
        {fileError && (
          <div
            style={{
              marginBottom: theme.spacing.md,
              padding: theme.spacing.md,
              backgroundColor: colors.error + '20',
              color: colors.error,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.sm,
            }}
          >
            {fileError}
          </div>
        )}
        <FileUpload
          onFileSelect={handleFileSelect}
          onError={setFileError}
          maxSizeMB={5}
        />
      </Modal>

      {/* URL Input Modal */}
      <Modal
        isOpen={showURLModal}
        onClose={() => setShowURLModal(false)}
        title="Add Learning Content via URL"
        size="md"
      >
        <URLInput onURLSubmit={handleURLSubmit} />
      </Modal>
    </motion.div>
  )
}
