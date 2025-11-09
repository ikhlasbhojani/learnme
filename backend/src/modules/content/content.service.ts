import axios from 'axios'
import * as cheerio from 'cheerio'
import { AppError } from '../../utils/appError'
import OpenAI from 'openai'
import { appEnv } from '../../config/env'

export interface DocumentationTopic {
  id: string
  title: string
  url: string
  description?: string
  section?: string
}

export interface ExtractTopicsResult {
  topics: DocumentationTopic[]
  mainUrl: string
  totalPages: number
}

/**
 * Check if URL is a GitHub repository URL
 */
function isGitHubRepoUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter((p) => p.length > 0)
    // GitHub repo URLs: github.com/owner/repo or github.com/owner/repo/tree/branch
    return (
      urlObj.hostname === 'github.com' &&
      pathParts.length >= 2 &&
      pathParts[0] !== 'orgs' &&
      pathParts[0] !== 'settings' &&
      pathParts[0] !== 'marketplace'
    )
  } catch {
    return false
  }
}

/**
 * Extract GitHub repository owner, repo, and branch from URL
 */
function parseGitHubUrl(url: string): { owner: string; repo: string; branch: string; path: string } | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter((p) => p.length > 0)
    
    if (pathParts.length < 2) return null
    
    const owner = pathParts[0]
    const repo = pathParts[1]
    
    // Check if it's a tree/blob/blob path
    let branch = 'main' // default branch
    let path = ''
    
    if (pathParts[2] === 'tree' && pathParts.length >= 4) {
      branch = pathParts[3]
      path = pathParts.slice(4).join('/')
    } else if (pathParts[2] === 'blob' && pathParts.length >= 4) {
      branch = pathParts[3]
      path = pathParts.slice(4).join('/')
    } else {
      // Root of repo, try to get default branch
      branch = 'main'
    }
    
    return { owner, repo, branch, path }
  } catch {
    return null
  }
}

/**
 * Extract GitHub repository structure (files and folders)
 */
async function extractGitHubRepoStructure(
  userId: string,
  baseUrl: string,
  owner: string,
  repo: string,
  branch: string,
  path: string
): Promise<DocumentationTopic[]> {
  try {
    const topics: DocumentationTopic[] = []
    
    // Build the GitHub tree URL
    // If branch is not specified or is 'main', we'll try to get it from the page
    // GitHub API: GET /repos/{owner}/{repo}/contents/{path}
    // Or scrape: https://github.com/{owner}/{repo}/tree/{branch}/{path}
    // For root repo URLs, try to access the repo root which will redirect to default branch
    let treeUrl = path
      ? `https://github.com/${owner}/${repo}/tree/${branch}/${path}`
      : `https://github.com/${owner}/${repo}/tree/${branch}`
    
    // If branch is 'main' and we're at root, try the repo root first to get default branch
    if (branch === 'main' && !path) {
      // Try accessing repo root which will show default branch
      treeUrl = `https://github.com/${owner}/${repo}`
    }
    
    const response = await axios.get(treeUrl, {
      timeout: 30000,
      maxRedirects: 5, // Follow redirects to get actual branch
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'text/html',
      },
    })

    const $ = cheerio.load(response.data)
    
    // Try to get the actual branch from the response
    // GitHub may redirect to the default branch, check the response URL
    let actualBranch = branch
    // Axios follows redirects, so check the final request URL
    const responseUrl = (response.request as any)?._redirectable?._currentUrl || 
                        (response.request as any)?._options?.url || 
                        treeUrl
    
    // Extract branch from URL if available
    const branchMatch = responseUrl.match(/\/tree\/([^\/\?"']+)/)
    if (branchMatch && branchMatch[1]) {
      actualBranch = branchMatch[1]
    } else {
      // Try to extract from HTML content
      const htmlBranchMatch = response.data.match(/\/tree\/([^\/"']+)/)
      if (htmlBranchMatch && htmlBranchMatch[1]) {
        actualBranch = htmlBranchMatch[1]
      }
    }
    
    // Update branch in the info if we found it
    if (actualBranch !== branch) {
      branch = actualBranch
    }
    
    // GitHub uses specific selectors for the file tree
    // Look for links in the repository file browser
    const fileLinks: Array<{ url: string; name: string; type: 'file' | 'directory' }> = []
    const seenUrls = new Set<string>()
    
    // Multiple selectors to catch different GitHub UI versions
    const selectors = [
      'a[data-pjax="#repo-content-pjax-container"]',
      'a[data-turbo-frame="repo-content-turbo-frame"]',
      '.react-directory-row a',
      '.js-navigation-open',
      '[role="row"] a[href*="/blob/"]',
      '[role="row"] a[href*="/tree/"]',
      'td.content a[href*="/blob/"]',
      'td.content a[href*="/tree/"]',
    ]
    
    selectors.forEach((selector) => {
      $(selector).each((_, element) => {
        const $el = $(element)
        const href = $el.attr('href')
        let text = $el.text().trim()
        
        // Try to get text from aria-label or title if text is empty
        if (!text) {
          text = $el.attr('aria-label') || $el.attr('title') || ''
        }
        
        if (!href || !text) return
        
        // Check if it's a file or directory link within this repo
        const isBlob = href.includes('/blob/')
        const isTree = href.includes('/tree/')
        
        if (href.includes(`/${owner}/${repo}/`) && (isBlob || isTree)) {
          const type = isBlob ? 'file' : 'directory'
          const absoluteUrl = href.startsWith('http') ? href : `https://github.com${href}`
          
          // Skip if we've already seen this URL
          if (seenUrls.has(absoluteUrl)) return
          seenUrls.add(absoluteUrl)
          
          // Extract the file/folder name from the path or text
          const urlParts = absoluteUrl.split('/')
          let name = urlParts[urlParts.length - 1] || text
          
          // Clean up the name (remove query params, fragments)
          name = name.split('?')[0].split('#')[0]
          
          // If name is still empty or too generic, use text
          if (!name || name.length < 2) {
            name = text.split('/').pop() || text
          }
          
          fileLinks.push({
            url: absoluteUrl,
            name: name.trim(),
            type,
          })
        }
      })
    })
    
    // Remove duplicates by URL
    const uniqueFileLinks = Array.from(
      new Map(fileLinks.map((link) => [link.url, link])).values()
    )
    
    // Organize by directory structure
    const organizedTopics = organizeGitHubFilesIntoTopics(uniqueFileLinks, owner, repo)
    
    return organizedTopics
  } catch (error) {
    console.error('Failed to extract GitHub repo structure:', error)
    // Fallback: return basic topic
    return [
      {
        id: `topic-${Date.now()}-0`,
        title: `${owner}/${repo}`,
        url: baseUrl,
        description: `GitHub repository: ${owner}/${repo}`,
        section: 'Repository',
      },
    ]
  }
}

/**
 * Organize GitHub files into topics based on folder structure
 */
function organizeGitHubFilesIntoTopics(
  fileLinks: Array<{ url: string; name: string; type: 'file' | 'directory' }>,
  owner: string,
  repo: string
): DocumentationTopic[] {
  const topics: DocumentationTopic[] = []
  const sections = new Map<string, DocumentationTopic[]>()
  
  fileLinks.forEach((file, index) => {
    const urlObj = new URL(file.url)
    const pathParts = urlObj.pathname.split('/').filter((p) => p.length > 0)
    
    // Extract path after /owner/repo/tree/branch or /owner/repo/blob/branch
    const repoIndex = pathParts.indexOf(repo)
    if (repoIndex >= 0 && pathParts.length > repoIndex + 3) {
      const relativePath = pathParts.slice(repoIndex + 4).join('/')
      const pathSegments = relativePath.split('/')
      
      // Determine section based on folder structure
      let section = 'Root'
      if (pathSegments.length > 1) {
        section = pathSegments[0] // First folder name
      } else if (file.type === 'directory') {
        section = 'Folders'
      } else {
        // Determine section by file extension or common patterns
        const ext = file.name.split('.').pop()?.toLowerCase()
        if (['md', 'txt', 'rst'].includes(ext || '')) {
          section = 'Documentation'
        } else if (['js', 'ts', 'py', 'java', 'cpp', 'c'].includes(ext || '')) {
          section = 'Source Code'
        } else if (['json', 'yaml', 'yml', 'toml'].includes(ext || '')) {
          section = 'Configuration'
        } else {
          section = 'Files'
        }
      }
      
      // Create topic
      const topic: DocumentationTopic = {
        id: `topic-${Date.now()}-${index}`,
        title: file.name,
        url: file.url,
        description: file.type === 'directory' ? `Folder: ${file.name}` : `File: ${file.name}`,
        section,
      }
      
      topics.push(topic)
      
      // Group by section
      if (!sections.has(section)) {
        sections.set(section, [])
      }
      sections.get(section)!.push(topic)
    } else {
      // Fallback for root level items
      const topic: DocumentationTopic = {
        id: `topic-${Date.now()}-${index}`,
        title: file.name,
        url: file.url,
        description: file.type === 'directory' ? `Folder: ${file.name}` : `File: ${file.name}`,
        section: 'Root',
      }
      topics.push(topic)
    }
  })
  
  return topics
}

/**
 * Extract all links from a documentation page and organize them into topics
 */
export async function extractTopicsFromDocumentation(
  userId: string,
  baseUrl: string
): Promise<ExtractTopicsResult> {
  try {
    // Validate URL
    const urlObj = new URL(baseUrl)
    
    // Check if it's a GitHub repository URL
    if (isGitHubRepoUrl(baseUrl)) {
      const githubInfo = parseGitHubUrl(baseUrl)
      if (githubInfo) {
        const topics = await extractGitHubRepoStructure(
          userId,
          baseUrl,
          githubInfo.owner,
          githubInfo.repo,
          githubInfo.branch,
          githubInfo.path
        )
        
        return {
          topics,
          mainUrl: baseUrl,
          totalPages: topics.length,
        }
      }
    }
    
    // Regular documentation extraction for non-GitHub URLs
    // Fetch the main page
    const response = await axios.get(baseUrl, {
      timeout: 30000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    })

    const $ = cheerio.load(response.data)
    
    // Extract all links from the page
    const links: Array<{ url: string; text: string; title?: string }> = []
    
    // Common documentation link patterns
    const linkSelectors = [
      'a[href]',
      'nav a[href]',
      '.sidebar a[href]',
      '.toc a[href]',
      '.navigation a[href]',
      '[role="navigation"] a[href]',
    ]

    linkSelectors.forEach((selector) => {
      $(selector).each((_, element) => {
        const $el = $(element)
        const href = $el.attr('href')
        const text = $el.text().trim()
        
        if (!href || !text) return

        try {
          // Resolve relative URLs
          const absoluteUrl = new URL(href, baseUrl).href
          
          // Only include links from the same domain
          const linkUrl = new URL(absoluteUrl)
          if (linkUrl.origin === urlObj.origin) {
            links.push({
              url: absoluteUrl,
              text,
              title: $el.attr('title') || undefined,
            })
          }
        } catch {
          // Invalid URL, skip
        }
      })
    })

    // Remove duplicates and filter out non-documentation links
    const uniqueLinks = Array.from(
      new Map(links.map((link) => [link.url, link])).values()
    ).filter((link) => {
      // Filter out common non-documentation links
      const url = link.url.toLowerCase()
      const excludePatterns = [
        '/login',
        '/logout',
        '/signup',
        '/register',
        '/api/',
        '.pdf',
        '.zip',
        '.jpg',
        '.png',
        '.gif',
        '#',
        'mailto:',
        'tel:',
      ]
      return !excludePatterns.some((pattern) => url.includes(pattern))
    })

    // Use AI to organize links into topics/sections
    const topics = await organizeLinksIntoTopics(userId, baseUrl, uniqueLinks)

    return {
      topics,
      mainUrl: baseUrl,
      totalPages: topics.length,
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new AppError(`Failed to fetch documentation: ${error.message}`, 400)
    }
    throw error
  }
}

/**
 * Use AI to organize links into meaningful topics/sections
 */
async function organizeLinksIntoTopics(
  userId: string,
  baseUrl: string,
  links: Array<{ url: string; text: string; title?: string }>
): Promise<DocumentationTopic[]> {
  try {
    // Use simple OpenAI API client instead of Agents SDK
    if (!process.env.OPENAI_API_KEY) {
      throw new AppError('OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.', 500)
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Limit links to avoid token limits
    const limitedLinks = links.slice(0, 100)
    
    const prompt = `Analyze the following list of documentation links and organize them into meaningful topics/sections.
    
Base URL: ${baseUrl}

Links:
${limitedLinks.map((link, index) => `${index + 1}. ${link.text} - ${link.url}`).join('\n')}

Please organize these links into topics/sections. For each topic, provide:
- A descriptive title
- The URL
- A brief description (if possible)
- The section/category it belongs to

Return a JSON array with this structure:
[
  {
    "title": "Topic Title",
    "url": "https://example.com/page",
    "description": "Brief description of this topic",
    "section": "Section Name"
  }
]

Group related links together under similar topics. If a link doesn't fit well, you can still include it as a standalone topic.
Return only the JSON array, no other text.`

    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Parse JSON response
    let result: any
    try {
      result = JSON.parse(content)
      // If response is wrapped in a property, extract the array
      if (result.topics && Array.isArray(result.topics)) {
        result = result.topics
      } else if (result.items && Array.isArray(result.items)) {
        result = result.items
      } else if (!Array.isArray(result)) {
        // If it's an object but not an array, try to find array values
        const arrayValues = Object.values(result).find((v) => Array.isArray(v))
        if (arrayValues) {
          result = arrayValues
        } else {
          throw new Error('Response is not an array')
        }
      }
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1])
      } else {
        throw new Error('Failed to parse JSON response')
      }
    }

    if (!Array.isArray(result)) {
      throw new Error('Invalid response format from AI')
    }

    // Validate and map to DocumentationTopic
    const topics: DocumentationTopic[] = result
      .filter((item: any) => item && item.title && item.url)
      .map((item: any, index: number) => ({
        id: `topic-${Date.now()}-${index}`,
        title: item.title || 'Untitled',
        url: item.url || '',
        description: item.description || undefined,
        section: item.section || undefined,
      }))
      .filter((topic) => {
        // Validate URL is from same domain
        try {
          const topicUrl = new URL(topic.url)
          const baseUrlObj = new URL(baseUrl)
          return topicUrl.origin === baseUrlObj.origin
        } catch {
          return false
        }
      })

    // If AI didn't organize well, fall back to simple topic creation
    if (topics.length === 0) {
      return limitedLinks.map((link, index) => ({
        id: `topic-${Date.now()}-${index}`,
        title: link.text || link.title || 'Untitled',
        url: link.url,
        description: link.title || undefined,
      }))
    }

    return topics
  } catch (error) {
    // Fallback: create simple topics from links
    return links.slice(0, 50).map((link, index) => ({
      id: `topic-${Date.now()}-${index}`,
      title: link.text || link.title || 'Untitled',
      url: link.url,
      description: link.title || undefined,
    }))
  }
}
