import React, { useState, useRef } from 'react'
import { FileText } from 'lucide-react'
import { validateFileType, validateFileSize } from '../../utils/validation'
import { useTheme } from '../../contexts/ThemeContext'

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
  const { isDark } = useTheme()
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
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-all duration-300
          ${isDragging
            ? isDark
              ? 'border-[#58a6ff] bg-[#58a6ff]/10'
              : 'border-[#0969da] bg-[#0969da]/10'
            : isDark
              ? 'border-[#30363d] bg-[#0d1117] hover:border-[#484f58]'
              : 'border-[#d0d7de] bg-[#ffffff] hover:border-[#afb8c1]'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />

        {isUploading ? (
          <div>
            <div className={`mb-4 text-base ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
              Uploading... {uploadProgress}%
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#21262d]' : 'bg-[#f6f8fa]'}`}>
              <div
                className={`h-full transition-all duration-300 ${isDark ? 'bg-[#58a6ff]' : 'bg-[#0969da]'}`}
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <FileText size={48} color={isDark ? '#c9d1d9' : '#24292f'} strokeWidth={2} />
            </div>
            <p className={`text-base mb-2 ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
              Drag and drop your file here, or click to browse
            </p>
            <p className={`text-sm ${isDark ? 'text-[#6e7681]' : 'text-[#8c959f]'}`}>
              Supported formats: PDF, DOC, TXT (Max {maxSizeMB}MB)
            </p>
          </>
        )}
      </div>
    </div>
  )
}
