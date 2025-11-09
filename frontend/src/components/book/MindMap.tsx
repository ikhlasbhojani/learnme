import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, BookOpen, FileText, FolderOpen, Folder, Sparkles } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { Part, Chapter, Lesson } from '../../services/bookService'
import { theme, getThemeColors } from '../../styles/theme'

interface MindMapNode {
  id: string
  name: string
  type: 'part' | 'chapter' | 'lesson'
  level: number
  children?: MindMapNode[]
  data?: Part | Chapter | Lesson
  expanded?: boolean
}

interface MindMapProps {
  parts: Part[]
  onNodeClick?: (node: { type: string; part?: Part; chapter?: Chapter; lesson?: Lesson }) => void
  selectedNodeId?: string
}

interface NodeProps {
  node: MindMapNode
  x: number
  y: number
  onToggle: (id: string) => void
  onClick: (node: MindMapNode) => void
  isSelected: boolean
  isDark: boolean
}

const NodeComponent: React.FC<NodeProps> = ({ node, x, y, onToggle, onClick, isSelected, isDark }) => {
  const colors = getThemeColors(isDark)
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = node.expanded ?? false

  const getNodeColor = () => {
    switch (node.type) {
      case 'part':
        return isDark ? '#58a6ff' : '#0969da'
      case 'chapter':
        return isDark ? '#7c3aed' : '#6f42c1'
      case 'lesson':
        return isDark ? '#2ea043' : '#1a7f37'
      default:
        return colors.primary
    }
  }

  const getNodeSize = () => {
    switch (node.type) {
      case 'part':
        return { width: 200, height: 80, fontSize: 16 }
      case 'chapter':
        return { width: 160, height: 60, fontSize: 14 }
      case 'lesson':
        return { width: 140, height: 50, fontSize: 12 }
      default:
        return { width: 120, height: 50, fontSize: 12 }
    }
  }

  const { width, height, fontSize } = getNodeSize()
  const nodeColor = getNodeColor()

  return (
    <g>
      {/* Connection line from parent (if not root) */}
      {node.level > 0 && (
        <line
          x1={x}
          y1={y - height / 2}
          x2={x}
          y2={y - 100}
          stroke={isDark ? '#30363d' : '#d0d7de'}
          strokeWidth={2}
          opacity={0.5}
        />
      )}

      {/* Node rectangle */}
      <motion.rect
        x={x - width / 2}
        y={y - height / 2}
        width={width}
        height={height}
        rx={12}
        fill={isSelected ? nodeColor : isDark ? '#161b22' : '#ffffff'}
        stroke={isSelected ? nodeColor : isDark ? '#30363d' : '#d0d7de'}
        strokeWidth={isSelected ? 3 : 2}
        style={{ cursor: 'pointer' }}
        whileHover={{ scale: 1.05, strokeWidth: 3 }}
        onClick={() => onClick(node)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Node content */}
      <foreignObject
        x={x - width / 2 + 12}
        y={y - height / 2 + 8}
        width={width - 24}
        height={height - 16}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: '100%',
          }}
        >
          {/* Icon */}
          <div style={{ flexShrink: 0 }}>
            {node.type === 'part' && <BookOpen size={16} color={nodeColor} />}
            {node.type === 'chapter' && (isExpanded ? <FolderOpen size={14} color={nodeColor} /> : <Folder size={14} color={nodeColor} />)}
            {node.type === 'lesson' && <FileText size={12} color={nodeColor} />}
          </div>

          {/* Text */}
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize,
              fontWeight: node.type === 'part' ? 600 : node.type === 'chapter' ? 500 : 400,
              color: isSelected ? nodeColor : colors.text,
            }}
            title={node.name}
          >
            {node.name}
          </div>

          {/* Expand/Collapse icon */}
          {hasChildren && (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ flexShrink: 0, cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation()
                onToggle(node.id)
              }}
            >
              <ChevronRight size={14} color={colors.gray[500]} />
            </motion.div>
          )}
        </div>
      </foreignObject>
    </g>
  )
}

export const MindMap: React.FC<MindMapProps> = ({ parts, onNodeClick, selectedNodeId }) => {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const svgRef = useRef<SVGSVGElement>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  // Convert parts to mind map nodes
  const buildMindMapNodes = (): MindMapNode[] => {
    return parts.map((part, partIndex) => {
      const partNode: MindMapNode = {
        id: `part-${part.id}`,
        name: part.name,
        type: 'part',
        level: 0,
        data: part,
        expanded: expandedNodes.has(`part-${part.id}`),
        children: part.chapters.map((chapter, chapterIndex) => {
          const chapterNode: MindMapNode = {
            id: `chapter-${part.id}-${chapter.id}`,
            name: chapter.name,
            type: 'chapter',
            level: 1,
            data: chapter,
            expanded: expandedNodes.has(`chapter-${part.id}-${chapter.id}`),
            children: chapter.lessons.map((lesson, lessonIndex) => ({
              id: `lesson-${part.id}-${chapter.id}-${lesson.id}`,
              name: lesson.name,
              type: 'lesson',
              level: 2,
              data: lesson,
            })),
          }
          return chapterNode
        }),
      }
      return partNode
    })
  }

  const nodes = buildMindMapNodes()

  // Calculate positions for nodes (hierarchical layout)
  const calculatePositions = (nodes: MindMapNode[], startX: number, startY: number, level: number = 0): Array<{ node: MindMapNode; x: number; y: number }> => {
    const positions: Array<{ node: MindMapNode; x: number; y: number }> = []
    let currentY = startY

    const spacing = {
      part: { vertical: 300, horizontal: 400 },
      chapter: { vertical: 200, horizontal: 300 },
      lesson: { vertical: 120, horizontal: 200 },
    }

    nodes.forEach((node) => {
      const isExpanded = expandedNodes.has(node.id)
      const nodeSpacing = spacing[node.type] || spacing.lesson

      positions.push({ node, x: startX + level * nodeSpacing.horizontal, y: currentY })

      if (isExpanded && node.children && node.children.length > 0) {
        const childPositions = calculatePositions(
          node.children,
          startX + level * nodeSpacing.horizontal,
          currentY + nodeSpacing.vertical,
          level + 1
        )
        positions.push(...childPositions)
        currentY += childPositions.length * nodeSpacing.vertical
      }

      if (!isExpanded || !node.children || node.children.length === 0) {
        currentY += nodeSpacing.vertical
      }
    })

    return positions
  }

  const nodePositions = calculatePositions(nodes, 200, 150)

  const handleToggle = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  const handleNodeClick = (node: MindMapNode) => {
    if (onNodeClick) {
      onNodeClick({
        type: node.type,
        part: node.type === 'part' ? (node.data as Part) : undefined,
        chapter: node.type === 'chapter' ? (node.data as Chapter) : undefined,
        lesson: node.type === 'lesson' ? (node.data as Lesson) : undefined,
      })
    }
  }

  // Pan and zoom handlers
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom((prev) => Math.max(0.5, Math.min(2, prev * delta)))
  }

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 0) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: isDark ? '#0d1117' : '#ffffff',
      }}
    >
      {/* Controls */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
          display: 'flex',
          gap: 8,
          flexDirection: 'column',
        }}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setZoom((prev) => Math.min(2, prev + 0.1))}
          style={{
            padding: '8px 12px',
            backgroundColor: isDark ? '#161b22' : '#f6f8fa',
            border: `1px solid ${isDark ? '#30363d' : '#d0d7de'}`,
            borderRadius: 8,
            color: colors.text,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          +
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.1))}
          style={{
            padding: '8px 12px',
            backgroundColor: isDark ? '#161b22' : '#f6f8fa',
            border: `1px solid ${isDark ? '#30363d' : '#d0d7de'}`,
            borderRadius: 8,
            color: colors.text,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          −
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setZoom(1)
            setPan({ x: 0, y: 0 })
          }}
          style={{
            padding: '8px 12px',
            backgroundColor: isDark ? '#161b22' : '#f6f8fa',
            border: `1px solid ${isDark ? '#30363d' : '#d0d7de'}`,
            borderRadius: 8,
            color: colors.text,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Reset
        </motion.button>
      </div>

      {/* SVG Mind Map */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{
          cursor: isPanning ? 'grabbing' : 'grab',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {nodePositions.map(({ node, x, y }) => (
            <NodeComponent
              key={node.id}
              node={node}
              x={x}
              y={y}
              onToggle={handleToggle}
              onClick={handleNodeClick}
              isSelected={selectedNodeId === node.id}
              isDark={isDark}
            />
          ))}
        </g>
      </svg>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          backgroundColor: isDark ? '#161b22' : '#f6f8fa',
          border: `1px solid ${isDark ? '#30363d' : '#d0d7de'}`,
          borderRadius: 8,
          padding: 12,
          fontSize: 12,
          zIndex: 10,
        }}
      >
        <div style={{ marginBottom: 8, fontWeight: 600, color: colors.text }}>Legend</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={14} color={isDark ? '#58a6ff' : '#0969da'} />
            <span style={{ color: colors.gray[500] }}>Part</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Folder size={14} color={isDark ? '#7c3aed' : '#6f42c1'} />
            <span style={{ color: colors.gray[500] }}>Chapter</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={12} color={isDark ? '#2ea043' : '#1a7f37'} />
            <span style={{ color: colors.gray[500] }}>Lesson</span>
          </div>
        </div>
      </div>
    </div>
  )
}

