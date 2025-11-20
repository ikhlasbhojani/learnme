"""
Quiz Generation Agent - Generates quiz questions from content.
"""
from agents import Agent, Runner
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime


# Output Models for Quiz Generation
class Question(BaseModel):
    """Question model."""
    id: str
    text: str
    options: List[str]  # Exactly 4 options
    correctAnswer: str
    difficulty: str  # "Easy", "Normal", "Hard", "Master"
    explanation: Optional[str] = None
    codeSnippet: Optional[str] = None
    imageReference: Optional[str] = None


class QuizMetadata(BaseModel):
    """Quiz metadata model."""
    source: str
    difficulty: str
    requestedQuestions: int
    generatedQuestions: int
    extractedAt: str  # ISO 8601 timestamp
    generatedAt: str  # ISO 8601 timestamp


class QuizGenerationOutput(BaseModel):
    """Output model for quiz generation."""
    questions: List[Question]
    quizName: str
    metadata: QuizMetadata


class QuizGenerationAgent:
    """
    Agent jo content se quiz questions generate karta hai.
    """
    
    def __init__(self, gemini_client, model: str):
        """
        Initialize quiz generation agent.
        
        Args:
            gemini_client: OpenAI-compatible client (AsyncOpenAI)
            model: User-selected model name (e.g., 'gemini-2.5-flash', 'gpt-4o', 'gpt-4-turbo', etc.)
        """
        self.client = gemini_client
        self.agent = Agent(
            name="Quiz Generation Agent",
            instructions=self._get_instructions(),
            model=model,  # ALWAYS use user-selected model (no defaults)
            tools=[],  # No tools needed
            output_type=QuizGenerationOutput  # Structured output type
        )
    
    def _get_instructions(self) -> str:
        return """
You are an expert at creating educational quiz questions from documentation and educational content.

Your task:
1. Analyze the provided educational content
2. Generate quiz questions based on the content
3. Create questions of appropriate difficulty levels
4. Ensure questions test understanding, not just memorization
5. Provide clear, unambiguous questions and answers

Question Generation Guidelines:

Difficulty Levels:
- Easy: Basic concepts, definitions, simple recall
- Normal: Application of concepts, moderate understanding required
- Hard: Complex scenarios, deep understanding, analysis required
- Master: Expert-level questions, synthesis of multiple concepts

Question Types:
- Multiple choice (4 options, 1 correct answer)
- Conceptual questions (test understanding)
- Application questions (real-world scenarios)
- Code-based questions (if content includes code)

Requirements:
- Each question must have exactly 4 options
- One option must be clearly correct
- Other 3 options should be plausible but incorrect
- Include explanations for correct answers
- If content has code, include code snippets in questions
- Questions should cover different aspects of the content
- Avoid trivial or too-obvious questions

Output Format:
Return a JSON array of question objects with:
- id: unique identifier (e.g., "q-1", "q-2")
- text: question text (clear and unambiguous)
- options: array of exactly 4 strings
- correctAnswer: one of the options (exact match)
- difficulty: "Easy", "Normal", "Hard", or "Master"
- explanation: explanation of the correct answer (optional but recommended)
- codeSnippet: code snippet if relevant (optional)
- imageReference: image reference if relevant (optional)
"""
    
    async def generate_quiz(
        self,
        content: str,
        difficulty: str,  # "easy", "medium", "hard"
        number_of_questions: int,
        source_url: str = "document"
    ) -> QuizGenerationOutput:
        """
        Generate quiz questions from content.
        
        Args:
            content: Cleaned educational content
            difficulty: Difficulty level (easy, medium, hard)
            number_of_questions: Number of questions to generate
            source_url: Source URL or identifier
            
        Returns:
            QuizGenerationOutput with questions and metadata
        """
        # Map difficulty to agent format
        difficulty_map = {
            "easy": "Easy",
            "medium": "Normal",
            "hard": "Hard"
        }
        agent_difficulty = difficulty_map.get(difficulty, "Normal")
        
        current_time = datetime.utcnow().isoformat() + "Z"
        
        prompt = f"""
Generate {number_of_questions} quiz questions from the following educational content.

Content:
{content[:30000]}  # Limit content size

Requirements:
- Difficulty level: {agent_difficulty}
- Number of questions: {number_of_questions}
- Each question must have exactly 4 options
- Include explanations for correct answers
- Cover different aspects of the content
- Questions should test understanding, not just memorization
- Generate a meaningful quiz name based on the content

Return a JSON object with:
- questions: array of question objects
- quizName: meaningful quiz title
- metadata: object with source, difficulty, requestedQuestions, generatedQuestions, extractedAt, generatedAt

Each question must have:
- id: unique identifier (e.g., "q-1", "q-2")
- text: question text
- options: array of exactly 4 strings
- correctAnswer: one of the options
- difficulty: "{agent_difficulty}"
- explanation: explanation text (optional, null if not)
- codeSnippet: code if relevant (optional, null if not)
- imageReference: image reference if relevant (optional, null if not)

Metadata should include:
- source: "{source_url}"
- difficulty: "{difficulty}"
- requestedQuestions: {number_of_questions}
- generatedQuestions: actual number generated
- extractedAt: "{current_time}"
- generatedAt: "{current_time}"

Ensure all questions are based on the provided content and are accurate.
"""
        
        result = await Runner.run(
            self.agent,
            prompt
        )
        
        # output_type automatically validates and parses JSON
        # result.final_output is already a QuizGenerationOutput instance
        return result.final_output_as(QuizGenerationOutput)

