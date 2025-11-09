"""
Book Service - Parses and serves book structure from ai-native-software-development
"""
import os
from pathlib import Path
from typing import List, Dict, Optional
import re


class BookService:
    """Service for parsing and serving book content structure"""
    
    def __init__(self, book_root: Optional[str] = None):
        """
        Initialize book service
        
        Args:
            book_root: Path to ai-native-software-development folder
                      If None, tries to find it relative to current directory
        """
        if book_root:
            self.book_root = Path(book_root)
        else:
            # Try multiple strategies to find the book root
            # Strategy 1: Relative to this file (python-service/app/services/book_service.py)
            current_file = Path(__file__).resolve()
            # Go up: services -> app -> python-service -> LearnMe
            potential_root_1 = current_file.parent.parent.parent.parent / "ai-native-software-development"
            
            # Strategy 2: From current working directory
            cwd = Path.cwd()
            potential_root_2 = cwd / "ai-native-software-development"
            if cwd.name == "python-service":
                potential_root_2 = cwd.parent / "ai-native-software-development"
            
            # Use the first one that exists
            if potential_root_1.exists():
                self.book_root = potential_root_1
            elif potential_root_2.exists():
                self.book_root = potential_root_2
            else:
                # Default to strategy 1 even if it doesn't exist (will raise error below)
                self.book_root = potential_root_1
        
        self.docs_path = self.book_root / "book-source" / "docs"
        
        if not self.docs_path.exists():
            raise ValueError(f"Book docs path not found: {self.docs_path}. Tried: {self.book_root}")
    
    def get_book_structure(self) -> Dict:
        """
        Parse the book structure and return hierarchical JSON
        
        Returns:
            {
                "book": {
                    "name": "AI Native Software Development",
                    "parts": [
                        {
                            "id": "01",
                            "name": "Introducing AI-Driven Development",
                            "path": "01-Introducing-AI-Driven-Development",
                            "chapters": [
                                {
                                    "id": "01",
                                    "name": "AI Development Revolution",
                                    "path": "01-ai-development-revolution",
                                    "lessons": [
                                        {
                                            "id": "01",
                                            "name": "Moment That Changed Everything",
                                            "path": "01-moment_that_changed_everything.md",
                                            "fullPath": "..."
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            }
        """
        structure = {
            "book": {
                "name": "AI Native Software Development",
                "parts": []
            }
        }
        
        if not self.docs_path.exists():
            return structure
        
        # Get all part directories (01-Introducing-AI-Driven-Development, etc.)
        part_dirs = sorted([d for d in self.docs_path.iterdir() 
                           if d.is_dir() and re.match(r'^\d{2}-', d.name)])
        
        for part_dir in part_dirs:
            part_match = re.match(r'^(\d{2})-(.+)$', part_dir.name)
            if not part_match:
                continue
            
            part_id = part_match.group(1)
            part_name = part_match.group(2).replace('-', ' ')
            
            # Read part README if exists
            part_readme = part_dir / "README.md"
            part_description = ""
            if part_readme.exists():
                try:
                    with open(part_readme, 'r', encoding='utf-8') as f:
                        # Read first few lines for description
                        lines = f.readlines()[:10]
                        part_description = "".join(lines).strip()
                except:
                    pass
            
            part_data = {
                "id": part_id,
                "name": part_name,
                "path": part_dir.name,
                "description": part_description[:500] if part_description else "",  # Limit description length
                "chapters": []
            }
            
            # Get all chapter directories within this part
            chapter_dirs = sorted([d for d in part_dir.iterdir() 
                                  if d.is_dir() and re.match(r'^\d{2}-', d.name)])
            
            for chapter_dir in chapter_dirs:
                chapter_match = re.match(r'^(\d{2})-(.+)$', chapter_dir.name)
                if not chapter_match:
                    continue
                
                chapter_id = chapter_match.group(1)
                chapter_name = chapter_match.group(2).replace('-', ' ')
                
                # Read chapter README if exists
                chapter_readme = chapter_dir / "README.md"
                chapter_description = ""
                if chapter_readme.exists():
                    try:
                        with open(chapter_readme, 'r', encoding='utf-8') as f:
                            lines = f.readlines()[:10]
                            chapter_description = "".join(lines).strip()
                    except:
                        pass
                
                chapter_data = {
                    "id": chapter_id,
                    "name": chapter_name,
                    "path": chapter_dir.name,
                    "description": chapter_description[:300] if chapter_description else "",
                    "lessons": []
                }
                
                # Get all lesson files (.md files) within this chapter
                lesson_files = sorted([f for f in chapter_dir.iterdir() 
                                      if f.is_file() and f.suffix == '.md' and f.name != 'README.md'])
                
                for lesson_file in lesson_files:
                    lesson_match = re.match(r'^(\d{2})-(.+)$', lesson_file.stem)
                    if not lesson_match:
                        continue
                    
                    lesson_id = lesson_match.group(1)
                    lesson_name = lesson_match.group(2).replace('_', ' ').replace('-', ' ')
                    
                    # Try to read title from frontmatter or first line
                    lesson_title = lesson_name
                    try:
                        with open(lesson_file, 'r', encoding='utf-8') as f:
                            content = f.read()
                            # Check for YAML frontmatter
                            if content.startswith('---'):
                                frontmatter_end = content.find('---', 3)
                                if frontmatter_end > 0:
                                    frontmatter = content[3:frontmatter_end]
                                    title_match = re.search(r'title:\s*["\'](.+?)["\']', frontmatter)
                                    if title_match:
                                        lesson_title = title_match.group(1)
                            else:
                                # Try first heading
                                first_line = content.split('\n')[0]
                                if first_line.startswith('#'):
                                    lesson_title = first_line.lstrip('#').strip()
                    except:
                        pass
                    
                    lesson_data = {
                        "id": lesson_id,
                        "name": lesson_title,
                        "path": lesson_file.name,
                        "fullPath": str(lesson_file.relative_to(self.book_root))
                    }
                    
                    chapter_data["lessons"].append(lesson_data)
                
                if chapter_data["lessons"]:  # Only add chapters with lessons
                    part_data["chapters"].append(chapter_data)
            
            if part_data["chapters"]:  # Only add parts with chapters
                structure["book"]["parts"].append(part_data)
        
        return structure
    
    def get_lesson_content(self, part_path: str, chapter_path: str, lesson_path: str) -> Dict:
        """
        Get content of a specific lesson
        
        Args:
            part_path: e.g., "01-Introducing-AI-Driven-Development"
            chapter_path: e.g., "01-ai-development-revolution"
            lesson_path: e.g., "01-moment_that_changed_everything.md"
        
        Returns:
            {
                "content": "...",
                "metadata": {
                    "part": "...",
                    "chapter": "...",
                    "lesson": "...",
                    "title": "..."
                }
            }
        """
        lesson_file = self.docs_path / part_path / chapter_path / lesson_path
        
        if not lesson_file.exists():
            raise FileNotFoundError(f"Lesson not found: {lesson_file}")
        
        try:
            with open(lesson_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract frontmatter if present
            metadata = {
                "part": part_path,
                "chapter": chapter_path,
                "lesson": lesson_path,
                "title": lesson_path.replace('.md', '').replace('-', ' ').replace('_', ' ')
            }
            
            if content.startswith('---'):
                frontmatter_end = content.find('---', 3)
                if frontmatter_end > 0:
                    frontmatter = content[3:frontmatter_end]
                    content = content[frontmatter_end + 3:].lstrip('\n')
                    
                    # Parse frontmatter
                    title_match = re.search(r'title:\s*["\'](.+?)["\']', frontmatter)
                    if title_match:
                        metadata["title"] = title_match.group(1)
            
            return {
                "content": content,
                "metadata": metadata
            }
        except Exception as e:
            raise ValueError(f"Error reading lesson: {str(e)}")
    
    def get_chapter_content(self, part_path: str, chapter_path: str) -> Dict:
        """
        Get all lessons in a chapter as combined content
        
        Args:
            part_path: e.g., "01-Introducing-AI-Driven-Development"
            chapter_path: e.g., "01-ai-development-revolution"
        
        Returns:
            {
                "content": "...",  # Combined content from all lessons
                "lessons": [...],  # List of lesson metadata
                "metadata": {...}
            }
        """
        chapter_dir = self.docs_path / part_path / chapter_path
        
        if not chapter_dir.exists():
            raise FileNotFoundError(f"Chapter not found: {chapter_dir}")
        
        lessons = []
        combined_content = []
        
        # Get all lesson files
        lesson_files = sorted([f for f in chapter_dir.iterdir() 
                              if f.is_file() and f.suffix == '.md' and f.name != 'README.md'])
        
        for lesson_file in lesson_files:
            try:
                with open(lesson_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Extract title
                title = lesson_file.stem.replace('-', ' ').replace('_', ' ')
                if content.startswith('---'):
                    frontmatter_end = content.find('---', 3)
                    if frontmatter_end > 0:
                        frontmatter = content[3:frontmatter_end]
                        title_match = re.search(r'title:\s*["\'](.+?)["\']', frontmatter)
                        if title_match:
                            title = title_match.group(1)
                        content = content[frontmatter_end + 3:].lstrip('\n')
                
                lessons.append({
                    "id": lesson_file.stem.split('-')[0] if '-' in lesson_file.stem else "01",
                    "name": title,
                    "path": lesson_file.name
                })
                
                combined_content.append(f"# {title}\n\n{content}\n\n")
            except Exception as e:
                continue
        
        return {
            "content": "\n".join(combined_content),
            "lessons": lessons,
            "metadata": {
                "part": part_path,
                "chapter": chapter_path
            }
        }


# Singleton instance
_book_service: Optional[BookService] = None


def get_book_service() -> BookService:
    """Get or create book service singleton"""
    global _book_service
    if _book_service is None:
        try:
            # Try to get book root from settings if available
            from app.config.settings import settings
            book_root = settings.book_root_path
            _book_service = BookService(book_root=book_root)
        except ValueError as e:
            # If path doesn't exist, create a service that returns empty structure
            # This allows the app to start even if the book path is missing
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Book service initialization failed: {e}. Returning empty structure.")
            # Create a dummy service that returns empty structure
            class DummyBookService:
                def get_book_structure(self):
                    return {
                        "book": {
                            "name": "AI Native Software Development",
                            "parts": []
                        }
                    }
                def get_lesson_content(self, part, chapter, lesson):
                    raise FileNotFoundError(f"Book path not configured: {e}")
                def get_chapter_content(self, part, chapter):
                    raise FileNotFoundError(f"Book path not configured: {e}")
            _book_service = DummyBookService()
    return _book_service

