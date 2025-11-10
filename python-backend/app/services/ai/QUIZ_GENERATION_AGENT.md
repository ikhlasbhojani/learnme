# Quiz Generation Agent

## Purpose

Cleaned content se quiz questions generate karta hai. Difficulty level, number of questions, aur question types ke according questions create karta hai.

## Use Case

**API**: `POST /api/ai/quiz/generate-from-url` aur `POST /api/ai/quiz/generate-from-document`

**Input**: 
- Cleaned content text
- Difficulty level (easy, medium, hard)
- Number of questions

**Output**:
- Array of quiz questions with options, correct answers, explanations

## Agent Structure

```python
from agents import Agent, Runner
from agents.agent_output import AgentOutputSchema
from typing import List, Dict, Optional
from pydantic import BaseModel

# Output Models for Quiz Generation
class Question(BaseModel):
    id: str
    text: str
    options: List[str]  # Exactly 4 options
    correctAnswer: str
    difficulty: str  # "Easy", "Normal", "Hard", "Master"
    explanation: Optional[str] = None
    codeSnippet: Optional[str] = None
    imageReference: Optional[str] = None

class QuizMetadata(BaseModel):
    source: str
    difficulty: str
    requestedQuestions: int
    generatedQuestions: int
    extractedAt: str  # ISO 8601 timestamp
    generatedAt: str  # ISO 8601 timestamp

class QuizGenerationOutput(BaseModel):
    questions: List[Question]
    quizName: str
    metadata: QuizMetadata

class QuizGenerationAgent:
    """
    Agent jo content se quiz questions generate karta hai.
    """
    
    def __init__(self, gemini_client):
        # Create output schema for structured output
        output_schema = AgentOutputSchema(output_type=QuizGenerationOutput)
        
        self.agent = Agent(
            name="Quiz Generation Agent",
            instructions=self._get_instructions(),
            model="gemini-2.0-flash",
            tools=[],  # No tools needed
            output_schema=output_schema  # Structured output schema
        )
        self.client = gemini_client
    
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
        from datetime import datetime
        
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
        
        result = Runner.run_sync(
            self.agent,
            prompt
        )
        
        # AgentOutputSchema automatically validates and parses JSON
        # result.final_output is already a QuizGenerationOutput instance
        return result.final_output
    
    # Note: AgentOutputSchema automatically validates output structure
    # No manual parsing/validation needed - result.final_output is already validated
```

## Input Format

```python
content = """
Introduction to Python

Python is a high-level programming language...

Variables and Data Types

In Python, variables are created by assignment...
"""

difficulty = "medium"
number_of_questions = 10
```

## Output Format

```python
[
    {
        "id": "q-1",
        "text": "What is Python primarily known for?",
        "options": [
            "A low-level programming language",
            "A high-level programming language",
            "A markup language",
            "A database language"
        ],
        "correctAnswer": "A high-level programming language",
        "difficulty": "Normal",
        "explanation": "Python is a high-level programming language known for its simplicity and readability.",
        "codeSnippet": None,
        "imageReference": None
    },
    {
        "id": "q-2",
        "text": "How are variables created in Python?",
        "options": [
            "Using the 'var' keyword",
            "By declaration first",
            "By assignment",
            "Using the 'let' keyword"
        ],
        "correctAnswer": "By assignment",
        "difficulty": "Normal",
        "explanation": "In Python, variables are created simply by assigning a value to them.",
        "codeSnippet": "x = 10",
        "imageReference": None
    }
]
```

## Key Requirements

1. **Question Quality**: Clear, unambiguous questions
2. **Options**: Exactly 4 options per question
3. **Correct Answer**: Must be one of the options
4. **Difficulty**: Match requested difficulty level
5. **Explanations**: Include explanations for better learning
6. **Code Snippets**: Include if content has code
7. **Content Coverage**: Cover different aspects of content

## Error Handling

- Invalid content: Return error
- Too few questions generated: Retry with adjusted prompt
- Invalid question format: Validate and fix or skip
- Difficulty mismatch: Adjust or retry

## Difficulty Mapping

- `easy` → `Easy` (Basic concepts, definitions)
- `medium` → `Normal` (Application, moderate understanding)
- `hard` → `Hard` (Complex scenarios, deep understanding)

