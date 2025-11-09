import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen, FileText, Sparkles } from 'lucide-react'
import { Button } from '../components/common/Button'
import { MindMap } from '../components/book/MindMap'
import { useTheme } from '../contexts/ThemeContext'
import { bookService, BookStructure, Part, Chapter, Lesson } from '../services/bookService'
import { theme, getThemeColors } from '../styles/theme'

export default function BookMindMap() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const [bookStructure, setBookStructure] = useState<BookStructure | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<{
    type: string
    part?: Part
    chapter?: Chapter
    lesson?: Lesson
  } | null>(null)

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

  const handleNodeClick = (node: { type: string; part?: Part; chapter?: Chapter; lesson?: Lesson }) => {
    setSelectedNode(node)
  }

  const handleViewContent = () => {
    if (!selectedNode) return

    if (selectedNode.lesson && selectedNode.chapter && selectedNode.part) {
      navigate(
        `/books/reader?part=${encodeURIComponent(selectedNode.part.path)}&chapter=${encodeURIComponent(selectedNode.chapter.path)}&lesson=${encodeURIComponent(selectedNode.lesson.path)}`
      )
    } else if (selectedNode.chapter && selectedNode.part) {
      navigate(
        `/books/reader?part=${encodeURIComponent(selectedNode.part.path)}&chapter=${encodeURIComponent(selectedNode.chapter.path)}`
      )
    }
  }

  const handleGenerateQuiz = () => {
    if (!selectedNode) return

    if (selectedNode.chapter && selectedNode.part) {
      // Navigate to quiz generation with chapter context
      navigate(
        `/generate-quiz?book=true&part=${encodeURIComponent(selectedNode.part.path)}&chapter=${encodeURIComponent(selectedNode.chapter.path)}`
      )
    }
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
            Loading mind map...
          </p>
        </motion.div>
      </div>
    )
  }

  if (error || !bookStructure) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0d1117]' : 'bg-[#ffffff]'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className={`p-4 rounded-lg mb-4 ${isDark ? 'bg-[#f85149]/20 text-[#f85149]' : 'bg-[#cf222e]/20 text-[#cf222e]'}`}>
            {error || 'Book structure not found'}
          </div>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/books')}>
              Back to Library
            </Button>
            <Button variant="primary" onClick={loadBookStructure}>
              Retry
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#0d1117]' : 'bg-[#ffffff]'}`}>
      {/* Header */}
      <div className={`border-b ${isDark ? 'border-[#30363d] bg-[#161b22]' : 'border-[#d0d7de] bg-[#f6f8fa]'} px-6 py-4`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="md"
              onClick={() => navigate('/books')}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Back
            </Button>
            <div>
              <h1 className={`text-xl font-semibold ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
                {bookStructure.book.name}
              </h1>
              <p className={`text-sm ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
                Interactive Mind Map
              </p>
            </div>
          </div>

          {selectedNode && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={handleViewContent}
                className="flex items-center gap-2"
              >
                <FileText size={16} />
                View Content
              </Button>
              {(selectedNode.chapter || selectedNode.lesson) && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleGenerateQuiz}
                  className="flex items-center gap-2"
                >
                  <Sparkles size={16} />
                  Generate Quiz
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mind Map Container */}
      <div className="flex-1 relative" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <MindMap
          parts={bookStructure.book.parts}
          onNodeClick={handleNodeClick}
          selectedNodeId={
            selectedNode?.lesson
              ? `lesson-${selectedNode.part?.id}-${selectedNode.chapter?.id}-${selectedNode.lesson.id}`
              : selectedNode?.chapter
              ? `chapter-${selectedNode.part?.id}-${selectedNode.chapter.id}`
              : selectedNode?.part
              ? `part-${selectedNode.part.id}`
              : undefined
          }
        />
      </div>

      {/* Selected Node Info Panel */}
      {selectedNode && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className={`absolute bottom-0 left-0 right-0 ${isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-[#ffffff] border-[#d0d7de]'} border-t p-4`}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {selectedNode.part && <BookOpen size={16} className={isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'} />}
                  {selectedNode.chapter && <FileText size={14} className={isDark ? 'text-[#7c3aed]' : 'text-[#6f42c1]'} />}
                  <h3 className={`font-semibold ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
                    {selectedNode.lesson?.name || selectedNode.chapter?.name || selectedNode.part?.name}
                  </h3>
                </div>
                {(selectedNode.chapter?.description || selectedNode.part?.description) && (
                  <p className={`text-sm ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
                    {selectedNode.chapter?.description || selectedNode.part?.description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNode(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

