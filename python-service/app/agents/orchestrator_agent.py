from typing import Dict, Any, Optional
from app.agents.base_agent import BaseAgent, AgentContext, AgentResult
from app.agents.content_extraction_agent import ContentExtractionAgent
from app.agents.quiz_generation_agent import QuizGenerationAgent


class OrchestratorAgent(BaseAgent):
    """Orchestrator agent that coordinates content extraction and quiz generation using OpenAI Agents SDK"""
    
    def __init__(self):
        super().__init__(
            name="Orchestrator",
            instructions="""You are an orchestrator agent that manages the quiz generation process.
            Your job is to coordinate between content extraction and quiz generation agents.
            When given a URL or document, you should:
            1. First extract the content using the content extraction agent
            2. Then generate quiz questions based on the extracted content and user specifications
            Always ensure the workflow is executed in the correct order."""
        )
        self.content_extraction_agent = ContentExtractionAgent()
        self.quiz_generation_agent = QuizGenerationAgent()
    
    async def run(self, context: AgentContext) -> AgentResult:
        """Run orchestration workflow"""
        input_data = context.input
        url = input_data.get("url")
        urls = input_data.get("urls")
        document = input_data.get("document")
        difficulty = input_data.get("difficulty", "medium")
        number_of_questions = input_data.get("numberOfQuestions", 10)
        
        # Validate input
        if not url and not urls and not document:
            raise ValueError("Either URL, URLs array, or document must be provided")
        
        if difficulty not in ["easy", "medium", "hard"]:
            raise ValueError("Difficulty must be easy, medium, or hard")
        
        number_of_questions = min(number_of_questions or 100, 100)
        
        try:
            # Step 1: Extract content
            extraction_context = AgentContext(
                input_data={"url": url, "urls": urls, "document": document},
                metadata=context.metadata
            )
            extraction_result = await self.content_extraction_agent.run(extraction_context)
            
            extracted_content = extraction_result.output["content"]
            page_title = extraction_result.output.get("pageTitle")
            source = extraction_result.output.get("source", url or "document")
            
            # Step 2: Generate quiz name using agent
            quiz_name = await self._generate_quiz_name(
                extracted_content, source, page_title, context
            )
            
            # Step 3: Generate quiz
            quiz_context = AgentContext(
                input_data={
                    "content": extracted_content,
                    "difficulty": difficulty,
                    "numberOfQuestions": number_of_questions
                },
                metadata={
                    **context.metadata,
                    "source": source
                }
            )
            quiz_result = await self.quiz_generation_agent.run(quiz_context)
            
            return AgentResult(
                output={
                    "questions": quiz_result.output["questions"],
                    "quizName": quiz_name,
                    "metadata": {
                        "source": source,
                        "difficulty": difficulty,
                        "requestedQuestions": number_of_questions,
                        "generatedQuestions": len(quiz_result.output["questions"]),
                        "extractedAt": extraction_result.output.get("extractedAt"),
                        "generatedAt": quiz_result.output.get("generatedAt")
                    }
                },
                metadata={
                    "extractionMetadata": extraction_result.metadata,
                    "generationMetadata": quiz_result.metadata
                }
            )
        except Exception as e:
            raise Exception(f"Orchestration failed: {str(e)}")
    
    async def _generate_quiz_name(
        self,
        content: str,
        source: str,
        page_title: Optional[str],
        context: AgentContext
    ) -> str:
        """Generate quiz name from content using agent"""
        try:
            agent_input = {
                "content": content[:2000],
                "source": source,
                "pageTitle": page_title,
                "task": "Generate a concise and descriptive quiz title (maximum 60 characters) that summarizes the main topic. Do not include words like 'Quiz', 'Test', or 'Assessment'. Return only the title."
            }
            
            result = await self._call_agent(agent_input, context.metadata)
            name = result if isinstance(result, str) else result.get("title", "")
            
            # Clean up the name
            import re
            clean_name = name.replace('"', '').replace("'", "").strip()
            clean_name = re.sub(r'^Title:\s*', '', clean_name, flags=re.IGNORECASE)
            clean_name = re.sub(r'^Quiz\s*Title:\s*', '', clean_name, flags=re.IGNORECASE)
            clean_name = clean_name.strip()
            
            # Limit to 60 characters
            if len(clean_name) > 60:
                truncated = clean_name[:57]
                last_space = truncated.rfind(' ')
                clean_name = truncated[:last_space] + '...' if last_space > 40 else truncated + '...'
            
            return clean_name or self._get_fallback_name(source, page_title)
        except Exception as e:
            print(f"Failed to generate quiz name: {e}")
            return self._get_fallback_name(source, page_title)
    
    def _get_fallback_name(self, source: str, page_title: Optional[str]) -> str:
        """Get fallback name from source or page title"""
        if page_title:
            cleaned = page_title.split('|')[0].split('-')[0].strip()
            if 0 < len(cleaned) <= 60:
                return cleaned
        
        # Try to extract from URL
        try:
            from urllib.parse import urlparse
            parsed = urlparse(source)
            if parsed.path:
                path_parts = [p for p in parsed.path.split('/') if p]
                if path_parts:
                    last_part = path_parts[-1]
                    name = last_part.replace('.html', '').replace('.htm', '')
                    name = name.replace('-', ' ').replace('_', ' ')
                    name = ' '.join(word.capitalize() for word in name.split())
                    return name if name else "Generated Quiz"
        except:
            pass
        
        return "Generated Quiz"
