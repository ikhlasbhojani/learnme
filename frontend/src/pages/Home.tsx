import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { BookOpen, Sparkles, ArrowRight, FileText, Link as LinkIcon, Pencil, Zap, TrendingUp, Users, Github, Linkedin } from 'lucide-react'
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
    // Navigate to documentation topic selection page first
    navigate('/documentation-topics?url=' + encodeURIComponent(url))
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
        
        {/* Noise Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" 
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
        />

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
              ? 'radial-gradient(circle, rgba(88, 166, 255, 0.08) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(9, 105, 218, 0.05) 0%, transparent 70%)',
            filter: 'blur(60px)',
            x: mousePosition.x - 300,
            y: mousePosition.y - 300,
            transition: 'transform 0.2s ease-out',
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
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 border backdrop-blur-sm
                ${isDark 
                  ? 'bg-[#21262d]/50 border-[#30363d] text-[#c9d1d9]' 
                  : 'bg-[#f6f8fa]/80 border-[#d0d7de] text-[#24292f]'}`}
            >
              <Sparkles size={14} className={isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'} />
              <span className="text-xs font-medium tracking-wide uppercase">
                AI-Powered Learning Platform
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className={`text-5xl md:text-7xl font-bold mb-6 tracking-tight ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}
              style={{ lineHeight: '1.1' }}
            >
              Let's <span className={`bg-clip-text text-transparent bg-gradient-to-r ${isDark ? 'from-[#58a6ff] to-[#a371f7]' : 'from-[#0969da] to-[#8250df]'}`}>learn</span> from here.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className={`text-xl md:text-2xl mb-12 max-w-3xl mx-auto font-light leading-relaxed ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}
            >
              Harnessed for productivity. Designed for learning.
              <br className="hidden md:block" />
              Celebrated for built-in intelligence.
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
                disabled={true}
                className="flex items-center gap-2 group shadow-lg shadow-blue-500/20 opacity-60 cursor-not-allowed"
              >
                <Sparkles size={20} className="shrink-0" />
                Coming Soon
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/quiz-history')}
                className="flex items-center gap-2 group backdrop-blur-sm"
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
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 tracking-tight ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
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
              className={`relative group p-8 rounded-2xl border transition-all duration-300
                ${isDark 
                  ? 'bg-[#0d1117] border-[#30363d] opacity-75' 
                  : 'bg-white border-[#d0d7de] opacity-75'}`}
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-6
                ${isDark ? 'bg-[#1f6feb]/10' : 'bg-[#0969da]/10'}`}>
                <Pencil size={24} className={isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'} />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
                Manual Input
              </h3>
              <p className={`text-base mb-8 leading-relaxed ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
                Type or paste your learning topic directly. AI will generate questions tailored to your content.
              </p>
              <Button
                variant="primary"
                size="md"
                disabled={true}
                className="w-full shadow-md opacity-60 cursor-not-allowed"
              >
                Coming Soon
              </Button>
            </motion.div>

            {/* File Upload Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className={`relative group p-8 rounded-2xl border transition-all duration-300
                ${isDark 
                  ? 'bg-[#0d1117] border-[#30363d] opacity-75' 
                  : 'bg-white border-[#d0d7de] opacity-75'}`}
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-6
                ${isDark ? 'bg-[#1f6feb]/10' : 'bg-[#0969da]/10'}`}>
                <FileText size={24} className={isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'} />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
                Upload File
              </h3>
              <p className={`text-base mb-8 leading-relaxed ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
                Upload PDF, DOC, or TXT files. We'll extract the content and create quizzes automatically.
              </p>
              <Button
                variant="secondary"
                size="md"
                disabled={true}
                className="w-full shadow-sm border opacity-60 cursor-not-allowed"
              >
                Coming Soon
              </Button>
            </motion.div>

            {/* URL Input Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className={`relative group p-8 rounded-2xl border transition-all duration-300
                ${isDark 
                  ? 'bg-[#0d1117] border-[#30363d] hover:border-[#58a6ff]/50 hover:shadow-lg hover:shadow-[#58a6ff]/10' 
                  : 'bg-white border-[#d0d7de] hover:border-[#0969da]/50 hover:shadow-xl hover:shadow-blue-500/5'}`}
            >
               {/* Hover Gradient Overlay */}
               <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none
                ${isDark 
                  ? 'bg-gradient-to-br from-[#58a6ff]/5 via-transparent to-transparent' 
                  : 'bg-gradient-to-br from-[#0969da]/5 via-transparent to-transparent'}`} 
              />

              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-6 transition-transform duration-300 group-hover:scale-110
                ${isDark ? 'bg-[#1f6feb]/10' : 'bg-[#0969da]/10'}`}>
                <LinkIcon size={24} className={isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'} />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
                Add via URL
              </h3>
              <p className={`text-base mb-8 leading-relaxed ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
                Paste a web link to learning content. We'll fetch and process it for quiz generation.
              </p>
              <button
                onClick={() => setShowURLModal(true)}
                className={`w-full px-4 py-2.5 rounded-md font-semibold text-sm transition-all duration-200 shadow-sm border
                  ${isDark
                    ? 'bg-[#21262d] border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d] hover:text-white'
                    : 'bg-[#f6f8fa] border-[#d0d7de] text-[#24292f] hover:bg-[#eaeef2]'
                  }`}
              >
                Add URL
              </button>
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

      {/* Footer */}
      <footer className={`${isDark ? 'bg-[#0d1117] border-t-2 border-[#30363d]' : 'bg-[#f6f8fa] border-t-2 border-[#d0d7de]'} py-12 mt-16`}>
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* About Section */}
            <div className="space-y-4">
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#1f2328]'}`}>
                LearnMe
              </h3>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
                An AI-native learning platform that transforms any web content into personalized quizzes and interactive learning experiences.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com/ikhlasbhojani/learnme"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    isDark 
                      ? 'bg-[#21262d] text-[#58a6ff] hover:bg-[#30363d] hover:text-white border border-[#30363d]' 
                      : 'bg-white text-[#0969da] hover:bg-[#f3f4f6] border border-[#d0d7de] shadow-sm'
                  }`}
                >
                  <Github size={18} />
                  View on GitHub
                </a>
              </div>
            </div>

            {/* Creators Section */}
            <div className="space-y-4">
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#1f2328]'}`}>
                Created By
              </h3>
              <div className="space-y-3">
                {/* Ikhlas Bhojani */}
                <div className="space-y-1">
                  <p className={`text-sm font-semibold ${isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'}`}>
                    Ikhlas Bhojani
                  </p>
                  <div className="flex items-center gap-3">
                    <a
                      href="https://www.linkedin.com/in/ikhlas-bhojani/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-2 rounded-lg transition-all ${
                        isDark 
                          ? 'bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] hover:text-[#58a6ff] border border-[#30363d]' 
                          : 'bg-white text-[#656d76] hover:bg-[#f3f4f6] hover:text-[#0969da] border border-[#d0d7de]'
                      }`}
                      aria-label="Ikhlas Bhojani LinkedIn"
                    >
                      <Linkedin size={18} />
                    </a>
                    <a
                      href="https://github.com/ikhlasbhojani"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-2 rounded-lg transition-all ${
                        isDark 
                          ? 'bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] hover:text-[#58a6ff] border border-[#30363d]' 
                          : 'bg-white text-[#656d76] hover:bg-[#f3f4f6] hover:text-[#0969da] border border-[#d0d7de]'
                      }`}
                      aria-label="Ikhlas Bhojani GitHub"
                    >
                      <Github size={18} />
                    </a>
                  </div>
                </div>

                {/* Talal Ahmed */}
                <div className="space-y-1">
                  <p className={`text-sm font-semibold ${isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'}`}>
                    Talal Ahmed
                  </p>
                  <div className="flex items-center gap-3">
                    <a
                      href="https://www.linkedin.com/in/talal--ahmed/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-2 rounded-lg transition-all ${
                        isDark 
                          ? 'bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] hover:text-[#58a6ff] border border-[#30363d]' 
                          : 'bg-white text-[#656d76] hover:bg-[#f3f4f6] hover:text-[#0969da] border border-[#d0d7de]'
                      }`}
                      aria-label="Talal Ahmed LinkedIn"
                    >
                      <Linkedin size={18} />
                    </a>
                    <a
                      href="https://github.com/Demolinator"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-2 rounded-lg transition-all ${
                        isDark 
                          ? 'bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] hover:text-[#58a6ff] border border-[#30363d]' 
                          : 'bg-white text-[#656d76] hover:bg-[#f3f4f6] hover:text-[#0969da] border border-[#d0d7de]'
                      }`}
                      aria-label="Talal Ahmed GitHub"
                    >
                      <Github size={18} />
                    </a>
                  </div>
                </div>

                {/* Muhammad Qasim */}
                <div className="space-y-1">
                  <p className={`text-sm font-semibold ${isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'}`}>
                    Muhammad Qasim
                  </p>
                  <div className="flex items-center gap-3">
                    <a
                      href="https://www.linkedin.com/in/sirqasim/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-2 rounded-lg transition-all ${
                        isDark 
                          ? 'bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] hover:text-[#58a6ff] border border-[#30363d]' 
                          : 'bg-white text-[#656d76] hover:bg-[#f3f4f6] hover:text-[#0969da] border border-[#d0d7de]'
                      }`}
                      aria-label="Muhammad Qasim LinkedIn"
                    >
                      <Linkedin size={18} />
                    </a>
                    <a
                      href="https://github.com/EnggQasim"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-2 rounded-lg transition-all ${
                        isDark 
                          ? 'bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] hover:text-[#58a6ff] border border-[#30363d]' 
                          : 'bg-white text-[#656d76] hover:bg-[#f3f4f6] hover:text-[#0969da] border border-[#d0d7de]'
                      }`}
                      aria-label="Muhammad Qasim GitHub"
                    >
                      <Github size={18} />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Resources & Links Section */}
            <div className="space-y-4">
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#1f2328]'}`}>
                Resources
              </h3>
              <div className={`text-sm space-y-3 ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
                <div>
                  <p className="font-semibold mb-2">Features</p>
                  <ul className="space-y-1">
                    <li>• AI-Powered Quiz Generation</li>
                    <li>• URL Content Extraction</li>
                    <li>• Personalized Learning</li>
                    <li>• Multiple AI Providers</li>
                  </ul>
                </div>
                <div className="pt-2">
                  <p className="font-semibold mb-2">Support</p>
                  <ul className="space-y-1">
                    <li>
                      <a 
                        href="https://github.com/ikhlasbhojani/learnme/blob/main/README.md" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`hover:underline ${isDark ? 'text-[#58a6ff] hover:text-white' : 'text-[#0969da] hover:text-[#1f2328]'}`}
                      >
                        Documentation
                      </a>
                    </li>
                    <li>
                      <a 
                        href="https://github.com/ikhlasbhojani/learnme/blob/main/CONTRIBUTING.md" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`hover:underline ${isDark ? 'text-[#58a6ff] hover:text-white' : 'text-[#0969da] hover:text-[#1f2328]'}`}
                      >
                        Contribute
                      </a>
                    </li>
                    <li>
                      <a 
                        href="https://github.com/ikhlasbhojani/learnme/issues" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`hover:underline ${isDark ? 'text-[#58a6ff] hover:text-white' : 'text-[#0969da] hover:text-[#1f2328]'}`}
                      >
                        Report Issues
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className={`pt-8 border-t ${isDark ? 'border-[#30363d]' : 'border-[#d0d7de]'} flex flex-col md:flex-row items-center justify-between gap-4`}>
            <div className={`text-sm ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
              <p>
                © {new Date().getFullYear()} LearnMe. All Rights Reserved.
              </p>
            </div>
            <div className={`text-sm ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
              <p>
                Built with <span className="text-red-500">❤️</span> for learners worldwide
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
