import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles, FileText } from 'lucide-react'
import { Button } from '../components/common/Button'
import { useTheme } from '../contexts/ThemeContext'
import { bookService, LessonContent, ChapterContent } from '../services/bookService'
import { theme, getThemeColors } from '../styles/theme'

export default function BookReader() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const [content, setContent] = useState<string>('')
  const [metadata, setMetadata] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const part = searchParams.get('part')
  const chapter = searchParams.get('chapter')
  const lesson = searchParams.get('lesson')

  useEffect(() => {
    if (part && chapter) {
      loadContent()
    }
  }, [part, chapter, lesson])

  const loadContent = async () => {
    try {
      setLoading(true)
      setError(null)

      if (lesson && part && chapter) {
        // Load specific lesson
        const result = await bookService.getLessonContent(part, chapter, lesson)
        setContent(result.content)
        setMetadata(result.metadata)
      } else if (part && chapter) {
        // Load entire chapter
        const result = await bookService.getChapterContent(part, chapter)
        setContent(result.content)
        setMetadata(result.metadata)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateQuiz = () => {
    if (part && chapter) {
      navigate(`/generate-quiz?book=true&part=${encodeURIComponent(part)}&chapter=${encodeURIComponent(chapter)}`)
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
          <FileText size={48} className={`animate-pulse ${isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'}`} />
          <p className={`mt-4 text-lg ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
            Loading content...
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
          <Button variant="primary" onClick={() => navigate('/books')}>
            Back to Library
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0d1117]' : 'bg-[#ffffff]'}`}>
      {/* Header */}
      <div className={`border-b ${isDark ? 'border-[#30363d] bg-[#161b22]' : 'border-[#d0d7de] bg-[#f6f8fa]'} px-6 py-4 sticky top-0 z-10`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="md"
              onClick={() => navigate('/books/mindmap')}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Back
            </Button>
            <div>
              <h1 className={`text-xl font-semibold ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
                {metadata?.title || metadata?.chapter || 'Content'}
              </h1>
              {metadata?.part && (
                <p className={`text-sm ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
                  {metadata.part.replace(/-/g, ' ')} → {metadata.chapter?.replace(/-/g, ' ')}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleGenerateQuiz}
            className="flex items-center gap-2"
          >
            <Sparkles size={16} />
            Generate Quiz
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`prose prose-lg max-w-none ${
            isDark
              ? 'prose-invert prose-headings:text-[#c9d1d9] prose-p:text-[#c9d1d9] prose-strong:text-[#c9d1d9] prose-code:text-[#58a6ff]'
              : 'prose-headings:text-[#24292f] prose-p:text-[#24292f] prose-strong:text-[#24292f] prose-code:text-[#0969da]'
          }`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                  <pre
                    className={`${className} rounded-lg p-4 overflow-x-auto ${
                      isDark ? 'bg-[#161b22] border border-[#30363d]' : 'bg-[#f6f8fa] border border-[#d0d7de]'
                    }`}
                    {...props}
                  >
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code
                    className={`${className} ${isDark ? 'bg-[#21262d] text-[#58a6ff]' : 'bg-[#f6f8fa] text-[#0969da]'} px-1.5 py-0.5 rounded`}
                    {...props}
                  >
                    {children}
                  </code>
                )
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </motion.div>
      </div>
    </div>
  )
}

