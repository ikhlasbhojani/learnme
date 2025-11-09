import { pythonApiClient } from './pythonApiClient'

export interface Lesson {
  id: string
  name: string
  path: string
  fullPath?: string
}

export interface Chapter {
  id: string
  name: string
  path: string
  description?: string
  lessons: Lesson[]
}

export interface Part {
  id: string
  name: string
  path: string
  description?: string
  chapters: Chapter[]
}

export interface BookStructure {
  book: {
    name: string
    parts: Part[]
  }
}

export interface LessonContent {
  content: string
  metadata: {
    part: string
    chapter: string
    lesson: string
    title: string
  }
}

export interface ChapterContent {
  content: string
  lessons: Lesson[]
  metadata: {
    part: string
    chapter: string
  }
}

export async function getBookStructure(): Promise<BookStructure> {
  const response = await pythonApiClient.get<BookStructure>('/books/structure')
  return response
}

export async function getLessonContent(
  part: string,
  chapter: string,
  lesson: string
): Promise<LessonContent> {
  const params = new URLSearchParams({ part, chapter, lesson })
  const response = await pythonApiClient.get<LessonContent>(`/books/content/lesson?${params}`)
  return response
}

export async function getChapterContent(
  part: string,
  chapter: string
): Promise<ChapterContent> {
  const params = new URLSearchParams({ part, chapter })
  const response = await pythonApiClient.get<ChapterContent>(`/books/content/chapter?${params}`)
  return response
}

export const bookService = {
  getBookStructure,
  getLessonContent,
  getChapterContent,
}

