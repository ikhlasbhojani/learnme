import React, { useState, useRef } from 'react'
import { Button } from './Button'
import { validateFileType, validateFileSize } from '../../utils/validation'
import { theme } from '../../styles/theme'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onError?: (error: string) => void
  acceptedTypes?: string[]
  maxSizeMB?: number
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onError,
  acceptedTypes = ['.pdf', '.doc', '.docx', '.txt'],
  maxSizeMB = 5,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    // Validate file type
    if (!validateFileType(file)) {
      onError?.('Invalid file type. Please upload PDF, DOC, or TXT files only.')
      return
    }

    // Validate file size
    if (!validateFileSize(file, maxSizeMB)) {
      onError?.(`File size exceeds ${maxSizeMB}MB limit.`)
      return
    }

    // Simulate upload progress
    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload (in real implementation, this would upload to server)
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setIsUploading(false)
          onFileSelect(file)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        style={{
          border: `2px dashed ${isDragging ? theme.colors.primary[600] : theme.colors.neutral[300]}`,
          borderRadius: theme.borderRadius.xl,
          padding: theme.spacing['2xl'],
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragging ? theme.colors.primary[50] : 'white',
          transition: `all ${theme.transitions.normal}`,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />

        {isUploading ? (
          <div>
            <div
              style={{
                marginBottom: theme.spacing.md,
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.neutral[600],
              }}
            >
              Uploading... {uploadProgress}%
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: theme.colors.neutral[200],
                borderRadius: theme.borderRadius.full,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  backgroundColor: theme.colors.primary[600],
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                fontSize: theme.typography.fontSize['2xl'],
                marginBottom: theme.spacing.md,
              }}
            >
              📄
            </div>
            <p
              style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.neutral[600],
                marginBottom: theme.spacing.sm,
              }}
            >
              Drag and drop your file here, or click to browse
            </p>
            <p
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.neutral[500],
              }}
            >
              Supported formats: PDF, DOC, TXT (Max {maxSizeMB}MB)
            </p>
          </>
        )}
      </div>
    </div>
  )
}
