import axios from 'axios'
import * as cheerio from 'cheerio'
import { BaseAgent, type AgentContext, type AgentResult } from './base.agent'

/**
 * Check if URL is a GitHub URL
 */
function isGitHubUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname === 'github.com'
  } catch {
    return false
  }
}

/**
 * Parse GitHub URL to extract owner, repo, branch, and path
 */
function parseGitHubUrl(url: string): { owner: string; repo: string; branch: string; path: string; type: 'tree' | 'blob' } | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter((p) => p.length > 0)
    
    if (pathParts.length < 2) return null
    
    const owner = pathParts[0]
    const repo = pathParts[1]
    
    let branch = 'main'
    let path = ''
    let type: 'tree' | 'blob' = 'tree'
    
    if (pathParts[2] === 'tree' && pathParts.length >= 4) {
      type = 'tree'
      branch = pathParts[3]
      path = pathParts.slice(4).join('/')
    } else if (pathParts[2] === 'blob' && pathParts.length >= 4) {
      type = 'blob'
      branch = pathParts[3]
      path = pathParts.slice(4).join('/')
    }
    
    return { owner, repo, branch, path, type }
  } catch {
    return null
  }
}

/**
 * Get all files recursively from a GitHub folder
 */
async function getAllFilesFromGitHubFolder(
  owner: string,
  repo: string,
  branch: string,
  folderPath: string
): Promise<Array<{ url: string; path: string; name: string }>> {
  const files: Array<{ url: string; path: string; name: string }> = []
  
  try {
    // Use GitHub REST API to get repository contents (more reliable than scraping)
    // API endpoint: GET /repos/{owner}/{repo}/contents/{path}
    const apiUrl = folderPath
      ? `https://api.github.com/repos/${owner}/${repo}/contents/${folderPath}?ref=${branch}`
      : `https://api.github.com/repos/${owner}/${repo}/contents?ref=${branch}`
    
    console.log(`Fetching GitHub folder via API: ${apiUrl}`)
    
    try {
      const apiResponse = await axios.get(apiUrl, {
        timeout: 30000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          Accept: 'application/vnd.github.v3+json',
        },
      })

      // GitHub API returns an array of file/folder objects
      if (Array.isArray(apiResponse.data)) {
        const subfolders: Array<{ owner: string; repo: string; branch: string; path: string }> = []
        
        for (const item of apiResponse.data) {
          if (item.type === 'file') {
            // It's a file
            files.push({
              url: `https://github.com/${owner}/${repo}/blob/${branch}/${item.path}`,
              path: item.path,
              name: item.name,
            })
            console.log(`Found file (API): ${item.path}`)
          } else if (item.type === 'dir') {
            // It's a directory - collect for recursive processing
            subfolders.push({
              owner,
              repo,
              branch,
              path: item.path,
            })
            console.log(`Found subfolder (API): ${item.path}`)
          }
        }
        
        // Recursively get files from subfolders
        for (const subfolder of subfolders) {
          try {
            const subfolderFiles = await getAllFilesFromGitHubFolder(
              subfolder.owner,
              subfolder.repo,
              subfolder.branch,
              subfolder.path
            )
            files.push(...subfolderFiles)
          } catch (error) {
            console.warn(`Failed to get files from subfolder ${subfolder.path}:`, error)
            // Continue with other subfolders
          }
        }
        
        return files
      }
    } catch (apiError) {
      console.warn('GitHub API request failed, falling back to HTML scraping:', apiError)
      // Fall through to HTML scraping fallback
    }
    
    // Fallback: HTML scraping if API fails
    const treeUrl = folderPath
      ? `https://github.com/${owner}/${repo}/tree/${branch}/${folderPath}`
      : `https://github.com/${owner}/${repo}/tree/${branch}`
    
    console.log(`Fetching GitHub folder (HTML fallback): ${treeUrl}`)
    
    const response = await axios.get(treeUrl, {
      timeout: 30000,
      maxRedirects: 5,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'text/html',
      },
    })

    const $ = cheerio.load(response.data)
    
    // Debug: Log some info about the page
    const pageTitle = $('title').text()
    console.log(`GitHub page title: ${pageTitle}`)
    
    // Find all file and folder links - try multiple strategies
    const seenUrls = new Set<string>()
    const subfolders: Array<{ owner: string; repo: string; branch: string; path: string }> = []
    
    // Strategy 1: Try to find file listing in the HTML
    // GitHub uses different structures - try multiple approaches
    let allLinksCount = 0
    let matchingLinksCount = 0
    
    // First, try to find file rows in the repository file browser
    // GitHub uses <tr> elements with role="row" for file listings
    $('tr[role="row"]').each((_, element) => {
      const $row = $(element)
      // Find the link in the row
      const $link = $row.find('a[href]')
      if ($link.length === 0) return
      
      const href = $link.attr('href')
      if (!href) return
      
      allLinksCount++
      
      // Check if it's a blob or tree link
      const isBlob = href.includes('/blob/')
      const isTree = href.includes('/tree/')
      
      if ((isBlob || isTree) && href.includes(`/${owner}/${repo}/`)) {
        matchingLinksCount++
        
        const absoluteUrl = href.startsWith('http') ? href : `https://github.com${href}`
        
        if (seenUrls.has(absoluteUrl)) return
        seenUrls.add(absoluteUrl)
        
        // Parse the URL to get the file path
        const githubInfo = parseGitHubUrl(absoluteUrl)
        if (githubInfo && githubInfo.branch === branch) {
          // Calculate relative path from the current folder
          let relativePath = ''
          let isWithinFolder = false
          
          if (!folderPath) {
            // Root folder - include everything at root level
            relativePath = githubInfo.path
            isWithinFolder = true
          } else {
            // Check if path is within the folder
            if (githubInfo.path === folderPath) {
              // This is the folder itself, skip
              return
            }
            if (githubInfo.path.startsWith(folderPath + '/')) {
              relativePath = githubInfo.path.substring(folderPath.length + 1)
              isWithinFolder = true
            } else if (githubInfo.path.startsWith(folderPath)) {
              // Fallback for exact match
              relativePath = ''
              isWithinFolder = true
            }
          }
          
          if (isWithinFolder) {
            // Calculate depth of the relative path
            // relativePath = "" means it's the folder itself (already skipped)
            // relativePath = "file.md" means one path segment = direct child (depth 1)
            // relativePath = "subfolder/file.md" means two segments = nested (depth 2)
            const pathSegments = relativePath.split('/').filter((p) => p.length > 0)
            const depth = pathSegments.length
            
            // Only include direct children (depth 1 = one path segment = direct child)
            // This works for both root folder and nested folders:
            // - Root: relativePath = "file.md" -> depth = 1 ✓
            // - Folder: relativePath = "file.md" (from "folder/file.md") -> depth = 1 ✓
            if (depth === 1) {
              if (isBlob) {
                // It's a file - add it
                const fileName = githubInfo.path.split('/').pop() || githubInfo.path
                files.push({
                  url: absoluteUrl,
                  path: githubInfo.path,
                  name: fileName,
                })
                console.log(`Found file: ${githubInfo.path}`)
              } else if (isTree) {
                // It's a folder - add it for recursive processing
                subfolders.push({
                  owner: githubInfo.owner,
                  repo: githubInfo.repo,
                  branch: githubInfo.branch,
                  path: githubInfo.path,
                })
                console.log(`Found subfolder: ${githubInfo.path}`)
              }
            }
          }
        } else {
          // githubInfo is null or branch doesn't match
          if (!githubInfo) {
            console.log(`Skipping link (failed to parse): ${href}`)
          } else if (githubInfo.branch !== branch) {
            console.log(`Skipping link (wrong branch: ${githubInfo.branch} != ${branch}): ${href}`)
          }
        }
      }
    })
    
    console.log(`Total links found: ${allLinksCount}, matching blob/tree: ${matchingLinksCount}`)
    console.log(`Found ${files.length} files and ${subfolders.length} subfolders in ${folderPath || 'root'}`)
    
    // If no files found, try to find any links at all for debugging
    if (files.length === 0 && subfolders.length === 0) {
      console.warn(`No files or folders found in ${treeUrl}`)
      // Try to find any links that might be relevant
      const sampleLinks: string[] = []
      $('a[href]').each((_, element) => {
        const href = $(element).attr('href')
        if (href && (href.includes('/blob/') || href.includes('/tree/'))) {
          sampleLinks.push(href)
          if (sampleLinks.length >= 5) return false // Stop after 5
        }
      })
      console.warn(`Sample blob/tree links found: ${JSON.stringify(sampleLinks)}`)
    }
    
    // Recursively get files from subfolders
    for (const subfolder of subfolders) {
      try {
        const subfolderFiles = await getAllFilesFromGitHubFolder(
          subfolder.owner,
          subfolder.repo,
          subfolder.branch,
          subfolder.path
        )
        files.push(...subfolderFiles)
      } catch (error) {
        console.warn(`Failed to get files from subfolder ${subfolder.path}:`, error)
        // Continue with other subfolders
      }
    }
    
    return files
  } catch (error) {
    console.error(`Failed to get files from GitHub folder ${folderPath}:`, error)
    throw error // Re-throw to propagate the error
  }
}

/**
 * Extract raw content from a GitHub file
 */
async function extractGitHubFileContent(
  owner: string,
  repo: string,
  branch: string,
  filePath: string
): Promise<string> {
  try {
    // Use GitHub's raw content URL
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`
    
    const response = await axios.get(rawUrl, {
      timeout: 30000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'text/plain, text/*, */*',
      },
    })

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch GitHub file content: ${error.message}`)
    }
    throw error
  }
}

export class ContentExtractionAgent extends BaseAgent {
  constructor() {
    super(
      'ContentExtractor',
      `You are a content extraction agent. Your job is to extract and summarize relevant content from URLs or documents.
      Extract the main text content, key concepts, and important information that would be useful for quiz generation.
      Focus on educational content, facts, concepts, and explanations.
      Remove any navigation, ads, or irrelevant content.`
    )
  }

  async run(context: AgentContext): Promise<AgentResult> {
    const { url, urls, document } = context.input as any

    try {
      let extractedContent = ''
      let pageTitle: string | null = null
      const sources: string[] = []

      // Handle multiple URLs (for selected topics)
      if (urls && Array.isArray(urls) && urls.length > 0) {
        const extractedContents: string[] = []
        const titles: string[] = []

        for (const singleUrl of urls) {
          try {
            const urlResult = await this.extractFromUrl(singleUrl)
            extractedContents.push(urlResult.content)
            if (urlResult.title) {
              titles.push(urlResult.title)
            }
            sources.push(singleUrl)
          } catch (error) {
            console.warn(`Failed to extract from ${singleUrl}:`, error)
            // Continue with other URLs
          }
        }

        // Combine all extracted content
        extractedContent = extractedContents.join('\n\n---\n\n')
        pageTitle = titles.length > 0 ? titles.join(' | ') : null
      } else if (url) {
        // Single URL
        const urlResult = await this.extractFromUrl(url)
        extractedContent = urlResult.content
        pageTitle = urlResult.title
        sources.push(url)
      } else if (document) {
        extractedContent = this.extractFromDocument(document)
        sources.push('document')
      } else {
        throw new Error('Either URL, URLs array, or document must be provided')
      }

      if (!extractedContent || extractedContent.trim().length === 0) {
        throw new Error('No content could be extracted from the provided sources')
      }

      // Use AI provider to clean and summarize the content
      const cleanedContent = await this.cleanAndSummarize(extractedContent, context)

      return {
        output: {
          content: cleanedContent,
          source: sources.join(', ') || url || 'document',
          pageTitle: pageTitle || null,
          extractedAt: new Date().toISOString(),
        },
        metadata: {
          originalLength: extractedContent.length,
          cleanedLength: cleanedContent.length,
          sources: sources,
        },
      }
    } catch (error) {
      throw new Error(
        `Content extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private async extractFromUrl(url: string): Promise<{ content: string; title: string | null }> {
    try {
      // Check if it's a GitHub URL
      if (isGitHubUrl(url)) {
        const githubInfo = parseGitHubUrl(url)
        if (githubInfo) {
          if (githubInfo.type === 'blob') {
            // It's a GitHub file - extract raw content
            const fileContent = await extractGitHubFileContent(
              githubInfo.owner,
              githubInfo.repo,
              githubInfo.branch,
              githubInfo.path
            )
            
            const fileName = githubInfo.path.split('/').pop() || githubInfo.path
            
            return {
              content: fileContent,
              title: fileName,
            }
          } else if (githubInfo.type === 'tree') {
            // It's a GitHub folder - get all files and extract their content
            const files = await getAllFilesFromGitHubFolder(
              githubInfo.owner,
              githubInfo.repo,
              githubInfo.branch,
              githubInfo.path || '' // Empty string for root
            )
            
            if (files.length === 0) {
              throw new Error('No files found in the GitHub folder')
            }
            
            // Extract content from all files
            const fileContents: string[] = []
            const fileNames: string[] = []
            
            // Limit to reasonable number of files to avoid token limits
            const maxFiles = 50
            const filesToProcess = files.slice(0, maxFiles)
            
            for (const file of filesToProcess) {
              try {
                const content = await extractGitHubFileContent(
                  githubInfo.owner,
                  githubInfo.repo,
                  githubInfo.branch,
                  file.path
                )
                
                // Filter out binary or very large files
                if (content.length > 100000) {
                  console.warn(`Skipping large file: ${file.path} (${content.length} chars)`)
                  continue
                }
                
                // Add file header to identify the source
                fileContents.push(`\n=== File: ${file.name} (${file.path}) ===\n${content}`)
                fileNames.push(file.name)
              } catch (error) {
                console.warn(`Failed to extract content from ${file.path}:`, error)
                // Continue with other files
              }
            }
            
            if (fileContents.length === 0) {
              throw new Error('No file content could be extracted from the GitHub folder')
            }
            
            const folderName = githubInfo.path
              ? githubInfo.path.split('/').pop() || githubInfo.path
              : githubInfo.repo
            const combinedContent = fileContents.join('\n\n---\n\n')
            
            return {
              content: combinedContent,
              title: folderName,
            }
          }
        }
      }
      
      // Regular URL extraction (non-GitHub)
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      })

      const $ = cheerio.load(response.data)

      // Extract page title
      let pageTitle: string | null = null
      // Try multiple methods to get title
      pageTitle = $('title').text().trim() || null
      if (!pageTitle) {
        pageTitle = $('meta[property="og:title"]').attr('content')?.trim() || null
      }
      if (!pageTitle) {
        pageTitle = $('meta[name="title"]').attr('content')?.trim() || null
      }
      if (!pageTitle) {
        pageTitle = $('h1').first().text().trim() || null
      }

      // Remove script and style elements
      $('script, style, nav, header, footer, aside, .ad, .advertisement').remove()

      // Extract text from main content areas
      const contentSelectors = [
        'article',
        'main',
        '.content',
        '.post-content',
        '.entry-content',
        '#content',
        'body',
      ]

      let text = ''
      for (const selector of contentSelectors) {
        const elements = $(selector)
        if (elements.length > 0) {
          text = elements.text()
          break
        }
      }

      // Fallback to body if no specific content found
      if (!text) {
        text = $('body').text()
      }

      // Clean up whitespace
      const cleanedText = text
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim()

      return {
        content: cleanedText,
        title: pageTitle || null,
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch URL: ${error.message}`)
      }
      throw error
    }
  }

  private extractFromDocument(document: string | Buffer): string {
    if (Buffer.isBuffer(document)) {
      // For binary files, you might want to use a different extraction method
      // For now, we'll assume text content
      return document.toString('utf-8')
    }
    return document
  }

  private async cleanAndSummarize(content: string, context: AgentContext): Promise<string> {
    const prompt = `Please clean and summarize the following extracted content, focusing on key educational information, concepts, facts, and explanations that would be useful for creating quiz questions. Remove any redundant information, formatting artifacts, or irrelevant content. Keep the summary comprehensive but focused on educational content.

Content to process:
${content.substring(0, 50000)}${content.length > 50000 ? '... (truncated)' : ''}`

    try {
      return await this.callModelDirect(prompt, {
        input: { content },
        metadata: context.metadata,
      })
    } catch (error) {
      // If cleaning fails, return original content
      console.warn('Content cleaning failed, using original content:', error)
      return content.substring(0, 50000)
    }
  }
}

