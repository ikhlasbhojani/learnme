import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { BookOpen, Sparkles, ArrowRight, FileText, Link as LinkIcon, Pencil, Zap, TrendingUp, Users } from 'lucide-react'
import { Button } from '../components/common/Button'
import { FileUpload } from '../components/common/FileUpload'
import { URLInput } from '../components/common/URLInput'
import { Modal } from '../components/common/Modal'
import { useTheme } from '../contexts/ThemeContext'

// Floating particles component
const FloatingParticle = ({ delay, isDark }: { delay: number; isDark: boolean }) => {
  const x = useMotionValue(Math.random() * 100)
  const y = useMotionValue(Math.random() * 100)
  const springX = useSpring(x, { stiffness: 50, damping: 20 })
  const springY = useSpring(y, { stiffness: 50, damping: 20 })

  useEffect(() => {
    const interval = setInterval(() => {
      x.set(Math.random() * 100)
      y.set(Math.random() * 100)
    }, 3000 + delay * 1000)

    return () => clearInterval(interval)
  }, [x, y, delay])

  return (
    <motion.div
      style={{
        position: 'absolute',
        x: springX,
        y: springY,
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        background: isDark ? 'rgba(88, 166, 255, 0.3)' : 'rgba(9, 105, 218, 0.2)',
        pointerEvents: 'none',
      }}
      animate={{
        opacity: [0.3, 0.6, 0.3],
        scale: [1, 1.5, 1],
      }}
      transition={{
        duration: 2 + delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

// Animated stat component
const AnimatedStat = ({ value, label, icon: Icon, delay, isDark }: { value: string; label: string; icon: React.ElementType; delay: number; isDark: boolean }) => {
  const [displayValue, setDisplayValue] = useState('0')
  
  useEffect(() => {
    const target = parseInt(value)
    const duration = 2000
    const steps = 60
    const increment = target / steps
    let current = 0
    let step = 0

    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        step++
        current = Math.min(increment * step, target)
        setDisplayValue(Math.floor(current).toString())
        
        if (step >= steps) {
          clearInterval(interval)
          setDisplayValue(value)
        }
      }, duration / steps)
    }, delay * 200)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 + 0.8 }}
      className="flex items-center gap-3"
    >
      <Icon size={24} className={isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'} />
      <div>
        <div className={`text-2xl font-bold ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>{displayValue}+</div>
        <div className={`text-sm ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>{label}</div>
      </div>
    </motion.div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const [showFileModal, setShowFileModal] = useState(false)
  const [showURLModal, setShowURLModal] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleManualInput = () => {
    navigate('/learning-modes?input=manual')
  }

  const handleURLSubmit = (url: string) => {
    setShowURLModal(false)
    navigate('/generate-quiz?url=' + encodeURIComponent(url))
  }

  const handleFileSelect = (file: File) => {
    setFileError(null)
    setShowFileModal(false)
    navigate('/generate-quiz')
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0d1117]' : 'bg-[#ffffff]'}`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background gradient */}
        <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-[#0d1117] via-[#161b22] to-[#0d1117]' : 'bg-gradient-to-br from-[#ffffff] via-[#f6f8fa] to-[#ffffff]'}`} />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(${isDark ? 'rgba(201, 209, 217, 0.1)' : 'rgba(36, 41, 47, 0.05)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(201, 209, 217, 0.1)' : 'rgba(36, 41, 47, 0.05)'} 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Floating particles */}
        {Array.from({ length: 8 }).map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.3} isDark={isDark} />
        ))}

        {/* Interactive gradient orb that follows mouse */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: isDark
              ? 'radial-gradient(circle, rgba(88, 166, 255, 0.1) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(9, 105, 218, 0.08) 0%, transparent 70%)',
            filter: 'blur(60px)',
            x: mousePosition.x - 300,
            y: mousePosition.y - 300,
            transition: 'transform 0.3s ease-out',
          }}
        />

        <div className="relative max-w-[1280px] mx-auto px-6 py-24 md:py-32">
          {/* Main Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 ${isDark ? 'bg-[#21262d] border border-[#30363d]' : 'bg-[#f6f8fa] border border-[#d0d7de]'}`}
            >
              <Sparkles size={16} className={isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'} />
              <span className={`text-sm font-medium ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
                AI-Powered Learning Platform
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className={`text-5xl md:text-6xl lg:text-7xl font-bold mb-6 ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}
              style={{ lineHeight: '1.1' }}
            >
              Let's <span className={isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'}>learn</span> from here
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className={`text-xl md:text-2xl mb-12 max-w-3xl mx-auto ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}
              style={{ lineHeight: '1.6' }}
            >
              Harnessed for productivity.{' '}
              <span className={isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}>
                Designed for learning.
              </span>{' '}
              Celebrated for built-in intelligence.
              <br />
              Welcome to the platform learners trust.
            </motion.p>

            {/* Quick Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-4 mb-16"
            >
              <Button
                variant="primary"
                size="lg"
                onClick={handleManualInput}
                className="flex items-center gap-2 group"
              >
                <Sparkles size={20} className="shrink-0 group-hover:rotate-180 transition-transform duration-500" />
                Start Learning
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/quiz-history')}
                className="flex items-center gap-2 group"
              >
                View History
                <ArrowRight size={18} className="shrink-0 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>

            {/* Animated Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-8 md:gap-12"
            >
              <AnimatedStat value="1000" label="Quizzes Created" icon={Zap} delay={0} isDark={isDark} />
              <AnimatedStat value="500" label="Active Learners" icon={Users} delay={1} isDark={isDark} />
              <AnimatedStat value="95" label="Success Rate" icon={TrendingUp} delay={2} isDark={isDark} />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className={`relative ${isDark ? 'bg-[#161b22]' : 'bg-[#f6f8fa]'} py-24`}>
        <div className="max-w-[1280px] mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
              Choose your learning path
            </h2>
            <p className={`text-lg ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
              Multiple ways to create personalized quizzes from your content
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Manual Input Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className={`${isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-[#ffffff] border-[#d0d7de]'} border rounded-xl p-8 hover:border-[#58a6ff] transition-all duration-300 cursor-pointer group`}
              onClick={handleManualInput}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-6 group-hover:scale-110 transition-transform duration-300 ${isDark ? 'bg-[#21262d]' : 'bg-[#f6f8fa]'}`}>
                <Pencil size={24} className={isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'} />
              </div>
              <h3 className={`text-xl font-semibold mb-3 ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
                Manual Input
              </h3>
              <p className={`text-base mb-6 ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
                Type or paste your learning topic directly. AI will generate questions tailored to your content.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={(e) => {
                  e.stopPropagation()
                  handleManualInput()
                }}
                className="w-full"
              >
                Start Learning
              </Button>
            </motion.div>

            {/* File Upload Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className={`${isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-[#ffffff] border-[#d0d7de]'} border rounded-xl p-8 hover:border-[#58a6ff] transition-all duration-300 cursor-pointer group`}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-6 group-hover:scale-110 transition-transform duration-300 ${isDark ? 'bg-[#21262d]' : 'bg-[#f6f8fa]'}`}>
                <FileText size={24} className={isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'} />
              </div>
              <h3 className={`text-xl font-semibold mb-3 ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
                Upload File
              </h3>
              <p className={`text-base mb-6 ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
                Upload PDF, DOC, or TXT files. We'll extract the content and create quizzes automatically.
              </p>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowFileModal(true)}
                className="w-full"
              >
                Upload File
              </Button>
            </motion.div>

            {/* URL Input Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className={`${isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-[#ffffff] border-[#d0d7de]'} border rounded-xl p-8 hover:border-[#58a6ff] transition-all duration-300 cursor-pointer group`}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-6 group-hover:scale-110 transition-transform duration-300 ${isDark ? 'bg-[#21262d]' : 'bg-[#f6f8fa]'}`}>
                <LinkIcon size={24} className={isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'} />
              </div>
              <h3 className={`text-xl font-semibold mb-3 ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
                Add via URL
              </h3>
              <p className={`text-base mb-6 ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
                Paste a web link to learning content. We'll fetch and process it for quiz generation.
              </p>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowURLModal(true)}
                className="w-full"
              >
                Add URL
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features List Section */}
      <div className={`${isDark ? 'bg-[#0d1117]' : 'bg-[#ffffff]'} py-24`}>
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isDark ? 'bg-[#21262d]' : 'bg-[#f6f8fa]'}`}>
                <BookOpen size={32} className={isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
                AI-Powered
              </h3>
              <p className={`text-base ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
                Advanced AI generates intelligent questions from your content
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isDark ? 'bg-[#21262d]' : 'bg-[#f6f8fa]'}`}>
                <Sparkles size={32} className={isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
                Personalized
              </h3>
              <p className={`text-base ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
                Customize difficulty levels and question counts to match your needs
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isDark ? 'bg-[#21262d]' : 'bg-[#f6f8fa]'}`}>
                <FileText size={32} className={isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
                Detailed Analytics
              </h3>
              <p className={`text-base ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
                Get comprehensive insights into your learning progress and performance
              </p>
            </motion.div>
          </div>
        </div>
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
          <div className={`mb-4 p-4 rounded-md text-sm ${isDark ? 'bg-[#f85149]/20 text-[#f85149]' : 'bg-[#cf222e]/20 text-[#cf222e]'}`}>
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
    </div>
  )
}
