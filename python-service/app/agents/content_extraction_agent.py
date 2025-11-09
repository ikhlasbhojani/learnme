import httpx
from bs4 import BeautifulSoup
from typing import Optional, List, Dict
from urllib.parse import urlparse
from agents import function_tool
from app.agents.base_agent import BaseAgent, AgentContext, AgentResult
import re


def is_github_url(url: str) -> bool:
    """Check if URL is a GitHub URL"""
    try:
        parsed = urlparse(url)
        return parsed.hostname == "github.com"
    except:
        return False


def parse_github_url(url: str) -> Optional[Dict[str, str]]:
    """Parse GitHub URL to extract owner, repo, branch, and path"""
    try:
        parsed = urlparse(url)
        path_parts = [p for p in parsed.path.split("/") if p]
        
        if len(path_parts) < 2:
            return None
        
        owner = path_parts[0]
        repo = path_parts[1]
        branch = "main"
        path = ""
        url_type = "tree"
        
        if len(path_parts) >= 4:
            if path_parts[2] == "tree":
                url_type = "tree"
                branch = path_parts[3]
                path = "/".join(path_parts[4:])
            elif path_parts[2] == "blob":
                url_type = "blob"
                branch = path_parts[3]
                path = "/".join(path_parts[4:])
        
        return {
            "owner": owner,
            "repo": repo,
            "branch": branch,
            "path": path,
            "type": url_type
        }
    except:
        return None


async def get_all_files_from_github_folder(
    owner: str, repo: str, branch: str, folder_path: str = ""
) -> List[Dict[str, str]]:
    """Get all files recursively from a GitHub folder"""
    files: List[Dict[str, str]] = []
    
    try:
        # Use GitHub REST API first (more reliable)
        api_url = (
            f"https://api.github.com/repos/{owner}/{repo}/contents/{folder_path}?ref={branch}"
            if folder_path
            else f"https://api.github.com/repos/{owner}/{repo}/contents?ref={branch}"
        )
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    api_url,
                    headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        "Accept": "application/vnd.github.v3+json",
                    },
                )
                response.raise_for_status()
                data = response.json()
                
                if isinstance(data, list):
                    subfolders: List[Dict[str, str]] = []
                    
                    for item in data:
                        if item.get("type") == "file":
                            files.append({
                                "url": f"https://github.com/{owner}/{repo}/blob/{branch}/{item['path']}",
                                "path": item["path"],
                                "name": item["name"],
                            })
                        elif item.get("type") == "dir":
                            subfolders.append({
                                "owner": owner,
                                "repo": repo,
                                "branch": branch,
                                "path": item["path"],
                            })
                    
                    # Recursively get files from subfolders
                    for subfolder in subfolders:
                        try:
                            subfolder_files = await get_all_files_from_github_folder(
                                subfolder["owner"],
                                subfolder["repo"],
                                subfolder["branch"],
                                subfolder["path"]
                            )
                            files.extend(subfolder_files)
                        except Exception as e:
                            print(f"Failed to get files from subfolder {subfolder['path']}: {e}")
                            continue
                    
                    return files
        except Exception as api_error:
            print(f"GitHub API request failed, falling back to HTML scraping: {api_error}")
            # Fall through to HTML scraping fallback
        
        # Fallback: HTML scraping
        tree_url = (
            f"https://github.com/{owner}/{repo}/tree/{branch}/{folder_path}"
            if folder_path
            else f"https://github.com/{owner}/{repo}/tree/{branch}"
        )
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                tree_url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                },
            )
            response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "lxml")
        seen_urls = set()
        subfolders: List[Dict[str, str]] = []
        
        # Find file and folder links
        for row in soup.select('tr[role="row"]'):
            link = row.select_one('a[href]')
            if not link:
                continue
            
            href = link.get("href", "")
            if not href:
                continue
            
            is_blob = "/blob/" in href
            is_tree = "/tree/" in href
            
            if (is_blob or is_tree) and f"/{owner}/{repo}/" in href:
                absolute_url = href if href.startswith("http") else f"https://github.com{href}"
                
                if absolute_url in seen_urls:
                    continue
                seen_urls.add(absolute_url)
                
                github_info = parse_github_url(absolute_url)
                if github_info and github_info["branch"] == branch:
                    relative_path = github_info["path"]
                    if folder_path:
                        if relative_path == folder_path:
                            continue
                        if not relative_path.startswith(folder_path + "/"):
                            continue
                        relative_path = relative_path[len(folder_path) + 1:]
                    
                    path_segments = [p for p in relative_path.split("/") if p]
                    depth = len(path_segments)
                    
                    if depth == 1:
                        if is_blob:
                            file_name = github_info["path"].split("/")[-1]
                            files.append({
                                "url": absolute_url,
                                "path": github_info["path"],
                                "name": file_name,
                            })
                        elif is_tree:
                            subfolders.append({
                                "owner": github_info["owner"],
                                "repo": github_info["repo"],
                                "branch": github_info["branch"],
                                "path": github_info["path"],
                            })
        
        # Recursively get files from subfolders
        for subfolder in subfolders:
            try:
                subfolder_files = await get_all_files_from_github_folder(
                    subfolder["owner"],
                    subfolder["repo"],
                    subfolder["branch"],
                    subfolder["path"]
                )
                files.extend(subfolder_files)
            except Exception as e:
                print(f"Failed to get files from subfolder {subfolder['path']}: {e}")
                continue
        
        return files
    except Exception as e:
        print(f"Failed to get files from GitHub folder {folder_path}: {e}")
        raise


async def extract_github_file_content(
    owner: str, repo: str, branch: str, file_path: str
) -> str:
    """Extract raw content from a GitHub file"""
    try:
        raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{file_path}"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                raw_url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "text/plain, text/*, */*",
                },
            )
            response.raise_for_status()
            return response.text
    except Exception as e:
        raise Exception(f"Failed to fetch GitHub file content: {str(e)}")


def _extract_url_content_sync(url: str) -> Dict[str, str]:
    """Synchronous URL content extraction (for function_tool)"""
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            )
            response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "lxml")
        
        # Extract title
        page_title = None
        if soup.title:
            page_title = soup.title.string.strip() if soup.title.string else None
        if not page_title:
            og_title = soup.find("meta", property="og:title")
            if og_title and og_title.get("content"):
                page_title = og_title["content"].strip()
        
        # Remove unwanted elements
        for element in soup(["script", "style", "nav", "header", "footer", "aside"]):
            element.decompose()
        
        # Extract main content
        content_selectors = ["article", "main", ".content", ".post-content", ".entry-content", "#content"]
        text = ""
        
        for selector in content_selectors:
            elements = soup.select(selector)
            if elements:
                text = elements[0].get_text()
                break
        
        if not text:
            text = soup.get_text()
        
        # Clean whitespace
        cleaned_text = " ".join(text.split())
        
        return {
            "content": cleaned_text,
            "title": page_title or ""
        }
    except Exception as e:
        return {"content": "", "title": "", "error": str(e)}


@function_tool
def extract_url_content(url: str) -> Dict[str, str]:
    """Extract content from a URL. Returns content and title."""
    return _extract_url_content_sync(url)


async def _extract_url_content_async(url: str) -> Dict[str, str]:
    """Async URL content extraction (for direct calls)"""
    try:
        # Check if it's a GitHub URL
        if is_github_url(url):
            github_info = parse_github_url(url)
            if github_info:
                if github_info["type"] == "blob":
                    # It's a GitHub file - extract raw content
                    file_content = await extract_github_file_content(
                        github_info["owner"],
                        github_info["repo"],
                        github_info["branch"],
                        github_info["path"]
                    )
                    
                    file_name = github_info["path"].split("/")[-1]
                    
                    return {
                        "content": file_content,
                        "title": file_name,
                    }
                elif github_info["type"] == "tree":
                    # It's a GitHub folder - get all files and extract their content
                    files = await get_all_files_from_github_folder(
                        github_info["owner"],
                        github_info["repo"],
                        github_info["branch"],
                        github_info["path"] or ""
                    )
                    
                    if len(files) == 0:
                        raise Exception("No files found in the GitHub folder")
                    
                    # Extract content from all files
                    file_contents: List[str] = []
                    file_names: List[str] = []
                    
                    # Limit to reasonable number of files
                    max_files = 50
                    files_to_process = files[:max_files]
                    
                    for file in files_to_process:
                        try:
                            content = await extract_github_file_content(
                                github_info["owner"],
                                github_info["repo"],
                                github_info["branch"],
                                file["path"]
                            )
                            
                            # Filter out binary or very large files
                            if len(content) > 100000:
                                print(f"Skipping large file: {file['path']} ({len(content)} chars)")
                                continue
                            
                            # Add file header to identify the source
                            file_contents.append(f"\n=== File: {file['name']} ({file['path']}) ===\n{content}")
                            file_names.append(file["name"])
                        except Exception as e:
                            print(f"Failed to extract content from {file['path']}: {e}")
                            continue
                    
                    if len(file_contents) == 0:
                        raise Exception("No file content could be extracted from the GitHub folder")
                    
                    folder_name = (
                        github_info["path"].split("/")[-1] if github_info["path"] else github_info["repo"]
                    )
                    combined_content = "\n\n---\n\n".join(file_contents)
                    
                    return {
                        "content": combined_content,
                        "title": folder_name,
                    }
        
        # Regular URL extraction (non-GitHub)
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            )
            response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "lxml")
        
        # Extract page title
        page_title = None
        if soup.title:
            page_title = soup.title.string.strip() if soup.title.string else None
        if not page_title:
            og_title = soup.find("meta", property="og:title")
            if og_title and og_title.get("content"):
                page_title = og_title["content"].strip()
        if not page_title:
            h1 = soup.find("h1")
            if h1:
                page_title = h1.get_text().strip()
        
        # Remove unwanted elements
        for element in soup(["script", "style", "nav", "header", "footer", "aside", ".ad", ".advertisement"]):
            element.decompose()
        
        # Extract main content
        content_selectors = ["article", "main", ".content", ".post-content", ".entry-content", "#content", "body"]
        text = ""
        
        for selector in content_selectors:
            elements = soup.select(selector)
            if elements:
                text = elements[0].get_text()
                break
        
        if not text:
            text = soup.get_text()
        
        # Clean whitespace
        cleaned_text = re.sub(r'\s+', ' ', text)
        cleaned_text = re.sub(r'\n\s*\n', '\n', cleaned_text)
        cleaned_text = cleaned_text.strip()
        
        return {
            "content": cleaned_text,
            "title": page_title or None,
        }
    except Exception as e:
        raise Exception(f"Failed to fetch URL: {str(e)}")


class ContentExtractionAgent(BaseAgent):
    """Agent for extracting content from URLs or documents using OpenAI Agents SDK"""
    
    def __init__(self):
        super().__init__(
            name="ContentExtractor",
            instructions="""You are a content extraction agent. Your job is to extract and summarize relevant content from URLs or documents.
            Extract the main text content, key concepts, and important information that would be useful for quiz generation.
            Focus on educational content, facts, concepts, and explanations.
            Remove any navigation, ads, or irrelevant content.
            When given a URL, use the extract_url_content tool to fetch and extract the content.
            When given multiple URLs, extract content from each and combine them.
            Clean and summarize the extracted content, focusing on educational information.""",
            tools=[extract_url_content]
        )
    
    async def run(self, context: AgentContext) -> AgentResult:
        """Extract content from URL, URLs array, or document"""
        input_data = context.input
        url = input_data.get("url")
        urls = input_data.get("urls")
        document = input_data.get("document")
        
        try:
            extracted_content = ""
            page_title: Optional[str] = None
            sources: List[str] = []
            
            # Handle multiple URLs (for selected topics)
            if urls and isinstance(urls, list) and len(urls) > 0:
                extracted_contents = []
                titles = []
                
                # Extract from each URL (use async version for better performance)
                for single_url in urls:
                    try:
                        url_result = await _extract_url_content_async(single_url)
                        if url_result.get("content"):
                            extracted_contents.append(url_result["content"])
                        if url_result.get("title"):
                            titles.append(url_result["title"])
                        sources.append(single_url)
                    except Exception as e:
                        print(f"Failed to extract from {single_url}: {e}")
                        continue
                
                # Combine and clean using agent
                if extracted_contents:
                    combined_content = "\n\n---\n\n".join(extracted_contents)
                    agent_input = {
                        "content": combined_content[:50000],
                        "task": "Clean and summarize this combined content from multiple sources, focusing on key educational information"
                    }
                    cleaned_result = await self._call_agent(agent_input, context.metadata)
                    extracted_content = cleaned_result if isinstance(cleaned_result, str) else cleaned_result.get("content", combined_content)
                    page_title = " | ".join(titles) if titles else None
            elif url:
                # Single URL - extract using async version
                url_result = await _extract_url_content_async(url)
                extracted_content = url_result["content"]
                page_title = url_result.get("title")
                
                # Clean and summarize using agent
                if extracted_content:
                    agent_input = {
                        "content": extracted_content[:50000],
                        "task": "Clean and summarize this extracted content, focusing on key educational information for quiz generation"
                    }
                    cleaned_result = await self._call_agent(agent_input, context.metadata)
                    extracted_content = cleaned_result if isinstance(cleaned_result, str) else cleaned_result.get("content", extracted_content)
                
                sources.append(url)
            elif document:
                # Document - clean and summarize using agent
                agent_input = {
                    "document": document,
                    "task": "Clean and summarize this document, focusing on key educational information for quiz generation"
                }
                result = await self._call_agent(agent_input, context.metadata)
                extracted_content = result if isinstance(result, str) else result.get("content", document)
                sources.append("document")
            else:
                raise ValueError("Either URL, URLs array, or document must be provided")
            
            if not extracted_content or len(extracted_content.strip()) == 0:
                raise ValueError("No content could be extracted from the provided sources")
            
            return AgentResult(
                output={
                    "content": extracted_content,
                    "source": ", ".join(sources) if sources else (url or "document"),
                    "pageTitle": page_title,
                    "extractedAt": self._get_iso_timestamp()
                },
                metadata={
                    "originalLength": len(extracted_content),
                    "sources": sources
                }
            )
        except Exception as e:
            raise Exception(f"Content extraction failed: {str(e)}")
    
    def _get_iso_timestamp(self) -> str:
        """Get ISO timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat() + "Z"
