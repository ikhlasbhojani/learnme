import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/common/Button'
import { useTheme } from '../contexts/ThemeContext'
import { CheckCircle, Brain, FileText, MessageSquare } from 'lucide-react'

export default function LearningModes() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const [searchParams] = useSearchParams()
  
  const handleMCQs = () => navigate('/quiz-config')

  const modes = [
    {
      title: 'MCQs',
      description: 'Test your knowledge with multiple choice questions generated from your content.',
      icon: CheckCircle,
      action: handleMCQs,
      active: true,
      buttonText: 'Start Quiz'
    },
    {
      title: 'Mind Map',
      description: 'Visualize concepts with interactive mind maps and generate quizzes from specific branches.',
      icon: Brain,
      action: () => navigate('/book-mind-map'),
      active: true,
      buttonText: 'Explore Mind Maps'
    },
    {
      title: 'Flashcards',
      description: 'Master key concepts with spaced repetition flashcards.',
      icon: FileText,
      active: false,
      buttonText: 'Coming Soon'
    },
    {
      title: 'Q&A Chat',
      description: 'Chat with your documents to get instant answers and explanations.',
      icon: MessageSquare,
      active: false,
      buttonText: 'Coming Soon'
    }
  ]

  return (
    <div className={`min-h-[calc(100vh-64px)] p-6 md:p-12 ${isDark ? 'bg-[#0d1117]' : 'bg-[#ffffff]'}`}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className={`text-3xl md:text-4xl font-bold mb-4 tracking-tight ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
            Choose Learning Mode
          </h1>
          <p className={`text-lg ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
            Select how you want to engage with your learning material
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {modes.map((mode, index) => (
            <motion.div
              key={mode.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={mode.active ? { y: -4 } : {}}
              className={`relative p-8 rounded-2xl border transition-all duration-300
                ${mode.active 
                  ? (isDark 
                      ? 'bg-[#0d1117] border-[#30363d] hover:border-[#58a6ff]/50 hover:shadow-lg hover:shadow-[#58a6ff]/10' 
                      : 'bg-white border-[#d0d7de] hover:border-[#0969da]/50 hover:shadow-xl hover:shadow-blue-500/5')
                  : (isDark
                      ? 'bg-[#161b22]/50 border-[#30363d] opacity-60'
                      : 'bg-[#f6f8fa]/50 border-[#d0d7de] opacity-60')
                }`}
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-6
                ${mode.active
                  ? (isDark ? 'bg-[#1f6feb]/10 text-[#58a6ff]' : 'bg-[#0969da]/10 text-[#0969da]')
                  : (isDark ? 'bg-[#30363d] text-[#8b949e]' : 'bg-[#eaeef2] text-[#656d76]')
                }`}
              >
                <mode.icon size={24} />
              </div>

              <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
                {mode.title}
              </h2>
              <p className={`text-base mb-8 min-h-[3rem] ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
                {mode.description}
              </p>

              <Button
                variant={mode.active ? 'primary' : 'ghost'}
                size="lg"
                onClick={mode.active ? mode.action : undefined}
                disabled={!mode.active}
                className={`w-full ${!mode.active && 'cursor-not-allowed'}`}
              >
                {mode.buttonText}
              </Button>

              {!mode.active && (
                <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-xs font-medium border
                  ${isDark 
                    ? 'bg-[#161b22] border-[#30363d] text-[#8b949e]' 
                    : 'bg-[#f6f8fa] border-[#d0d7de] text-[#656d76]'}`}
                >
                  Soon
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
