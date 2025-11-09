import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '../components/common/Button'
import { useTheme } from '../contexts/ThemeContext'
import { bookService, BookStructure } from '../services/bookService'
import { theme, getThemeColors } from '../styles/theme'

export default function BookLibrary() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const [bookStructure, setBookStructure] = useState<BookStructure | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBookStructure()
  }, [])

  const loadBookStructure = async () => {
    try {
      setLoading(true)
      setError(null)
      const structure = await bookService.getBookStructure()
      setBookStructure(structure)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load book structure')
    } finally {
      setLoading(false)
    }
  }

  const handleBookClick = (bookName: string) => {
    navigate(`/books/mindmap?book=${encodeURIComponent(bookName)}`)
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0d1117]' : 'bg-[#ffffff]'}`}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Sparkles size={48} className={`animate-pulse ${isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'}`} />
          <p className={`mt-4 text-lg ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
            Loading books...
          </p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0d1117]' : 'bg-[#ffffff]'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className={`p-4 rounded-lg mb-4 ${isDark ? 'bg-[#f85149]/20 text-[#f85149]' : 'bg-[#cf222e]/20 text-[#cf222e]'}`}>
            {error}
          </div>
          <Button variant="primary" onClick={loadBookStructure}>
            Retry
          </Button>
        </motion.div>
      </div>
    )
  }

  // For now, we have one book - AI Native Software Development
  const books = bookStructure ? [
    {
      name: bookStructure.book.name,
      description: 'Comprehensive guide to AI-driven software development',
      parts: bookStructure.book.parts.length,
      chapters: bookStructure.book.parts.reduce((sum, part) => sum + part.chapters.length, 0),
      structure: bookStructure,
    }
  ] : []

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0d1117]' : 'bg-[#ffffff]'}`}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
            Book Library
          </h1>
          <p className={`text-lg ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
            Explore interactive mind maps of learning materials
          </p>
        </motion.div>

        {/* Books Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book, index) => (
            <motion.div
              key={book.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className={`${isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-[#ffffff] border-[#d0d7de]'} border rounded-xl p-6 cursor-pointer group`}
              onClick={() => handleBookClick(book.name)}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-lg ${isDark ? 'bg-[#21262d]' : 'bg-[#f6f8fa]'} group-hover:scale-110 transition-transform`}>
                  <BookOpen size={32} className={isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
                    {book.name}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
                    {book.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className={`text-sm ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
                  <span className="font-semibold">{book.parts}</span> Parts
                </div>
                <div className={`text-sm ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
                  <span className="font-semibold">{book.chapters}</span> Chapters
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={(e) => {
                  e.stopPropagation()
                  handleBookClick(book.name)
                }}
                className="w-full flex items-center justify-center gap-2"
              >
                <Sparkles size={16} />
                Explore Mind Map
                <ArrowRight size={16} />
              </Button>
            </motion.div>
          ))}
        </div>

        {books.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <BookOpen size={64} className={`mx-auto mb-4 ${isDark ? 'text-[#30363d]' : 'text-[#d0d7de]'}`} />
            <p className={`text-lg ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
              No books available
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

