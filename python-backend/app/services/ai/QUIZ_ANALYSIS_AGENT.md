# Quiz Analysis Agent

## Purpose

Completed quiz ka AI-powered analysis generate karta hai. Performance review, weak areas, suggestions, strengths, aur detailed analysis provide karta hai.

## Use Case

**API**: `POST /api/ai/quiz/analyze`

**Input**: 
- Quiz questions
- User's answers
- Quiz configuration
- Original content (optional)

**Output**:
- Performance review
- Weak areas
- Suggestions
- Strengths
- Improvement areas
- Detailed analysis
- Topics to review

## Agent Structure

```python
from agents import Agent, Runner
from agents.agent_output import AgentOutputSchema
from typing import Dict, List, Optional
from pydantic import BaseModel

# Output Model for Quiz Analysis
class QuizAnalysisOutput(BaseModel):
    performanceReview: str  # Overall summary (2-3 sentences)
    weakAreas: List[str]  # 5-7 items
    suggestions: List[str]  # 5-7 items
    strengths: List[str]  # 5-7 items
    improvementAreas: List[str]  # 5-7 items
    detailedAnalysis: str  # Comprehensive paragraph (4-6 sentences)
    topicsToReview: List[str]  # 5-7 items, prioritized

class QuizAnalysisAgent:
    """
    Agent jo completed quiz ka analysis generate karta hai.
    """
    
    def __init__(self, gemini_client):
        # Create output schema for structured output
        output_schema = AgentOutputSchema(output_type=QuizAnalysisOutput)
        
        self.agent = Agent(
            name="Quiz Analysis Agent",
            instructions=self._get_instructions(),
            model="gemini-2.0-flash",
            tools=[],  # No tools needed
            output_schema=output_schema  # Structured output schema
        )
        self.client = gemini_client
    
    def _get_instructions(self) -> str:
        return """
You are an expert educational analyst who provides detailed, constructive feedback on quiz performance.

Your task:
1. Analyze user's quiz answers against correct answers
2. Calculate performance metrics (score, accuracy)
3. Identify areas of strength and weakness
4. Provide actionable suggestions for improvement
5. Generate detailed, personalized analysis

Analysis Guidelines:

Performance Review:
- Provide overall performance summary (2-3 sentences)
- Mention score percentage
- Give context (above average, needs improvement, etc.)
- Be encouraging but honest

Weak Areas:
- List specific topics/concepts where user struggled
- Based on incorrect answers
- Be specific (e.g., "List Comprehensions" not just "Python")
- Maximum 5-7 weak areas

Suggestions:
- Actionable, specific recommendations
- Based on weak areas identified
- Include study strategies, practice suggestions
- Be constructive and helpful
- Maximum 5-7 suggestions

Strengths:
- Topics where user performed well
- List specific concepts/topics
- Acknowledge good understanding
- Maximum 5-7 strengths

Improvement Areas:
- General areas that need attention
- Broader than weak areas (e.g., "Advanced Concepts")
- Help user understand where to focus
- Maximum 5-7 areas

Detailed Analysis:
- Comprehensive paragraph (4-6 sentences)
- Summarize performance
- Highlight key strengths and weaknesses
- Provide context and recommendations
- Be detailed but readable

Topics to Review:
- Specific topics user should review
- Based on incorrect answers
- Prioritized list (most important first)
- Maximum 5-7 topics

Output Requirements:
- Be constructive and encouraging
- Provide specific, actionable feedback
- Focus on learning and improvement
- Avoid generic or vague statements
"""
    
    async def analyze_quiz(
        self,
        quiz: Dict,
        answers: Dict[str, str],
        original_content: Optional[str] = None
    ) -> QuizAnalysisOutput:
        """
        Analyze completed quiz and generate feedback.
        
        Args:
            quiz: Quiz object with questions and configuration
            answers: User's answers (questionId: answer mapping)
            original_content: Original content text (optional)
            
        Returns:
            QuizAnalysisOutput with all feedback fields
        """
        # Calculate score
        score_data = self._calculate_score(quiz, answers)
        
        prompt = f"""
Analyze the following quiz performance and provide detailed feedback.

Quiz Configuration:
- Difficulty: {quiz['configuration']['difficulty']}
- Total Questions: {quiz['configuration']['numberOfQuestions']}
- Time Duration: {quiz['configuration']['timeDuration']} seconds

Performance Summary:
- Correct Answers: {score_data['correct']}/{score_data['total']}
- Score: {score_data['percentage']}%
- Incorrect Questions: {len(score_data['incorrect_questions'])}

Questions and Answers:
{self._format_qa(quiz, answers, score_data)}

Original Content (if available):
{original_content[:5000] if original_content else "Not provided"}

Please provide a comprehensive analysis with:
1. Performance Review: Overall summary (2-3 sentences)
2. Weak Areas: List of topics where user struggled (5-7 items)
3. Suggestions: Actionable recommendations (5-7 items)
4. Strengths: Topics where user performed well (5-7 items)
5. Improvement Areas: General areas needing attention (5-7 items)
6. Detailed Analysis: Comprehensive paragraph (4-6 sentences)
7. Topics to Review: Specific topics to review (5-7 items, prioritized)

Return a JSON object with all these fields.
"""
        
        result = Runner.run_sync(
            self.agent,
            prompt
        )
        
        # AgentOutputSchema automatically validates and parses JSON
        # result.final_output is already a QuizAnalysisOutput instance
        return result.final_output
    
    def _calculate_score(self, quiz: Dict, answers: Dict[str, str]) -> Dict:
        """Calculate quiz score and identify incorrect questions."""
        questions = quiz['questions']
        total = len(questions)
        correct = 0
        incorrect_questions = []
        
        for question in questions:
            q_id = question['id']
            user_answer = answers.get(q_id, '')
            correct_answer = question['correctAnswer']
            
            if user_answer == correct_answer:
                correct += 1
            else:
                incorrect_questions.append({
                    'id': q_id,
                    'text': question['text'],
                    'user_answer': user_answer,
                    'correct_answer': correct_answer,
                    'topic': question.get('explanation', '')
                })
        
        percentage = (correct / total * 100) if total > 0 else 0
        
        return {
            'total': total,
            'correct': correct,
            'incorrect': total - correct,
            'percentage': round(percentage, 2),
            'incorrect_questions': incorrect_questions
        }
    
    def _format_qa(self, quiz: Dict, answers: Dict[str, str], score_data: Dict) -> str:
        """Format questions and answers for prompt."""
        formatted = []
        for question in quiz['questions']:
            q_id = question['id']
            user_answer = answers.get(q_id, 'Not answered')
            correct_answer = question['correctAnswer']
            is_correct = user_answer == correct_answer
            
            formatted.append(f"""
Question: {question['text']}
User Answer: {user_answer} {'✓' if is_correct else '✗'}
Correct Answer: {correct_answer}
Difficulty: {question['difficulty']}
""")
        
        return "\n".join(formatted)
    
    # Note: AgentOutputSchema automatically validates output structure
    # No manual parsing/validation needed - result.final_output is already validated
```

## Input Format

```python
quiz = {
    "id": "quiz-123",
    "questions": [
        {
            "id": "q-1",
            "text": "What is Python?",
            "options": ["A", "B", "C", "D"],
            "correctAnswer": "A",
            "difficulty": "Easy",
            "explanation": "..."
        }
    ],
    "configuration": {
        "difficulty": "Easy",
        "numberOfQuestions": 10,
        "timeDuration": 3600
    }
}

answers = {
    "q-1": "A",
    "q-2": "B"  # Incorrect
}

original_content = "Python is a programming language..."  # Optional
```

## Output Format

```python
{
    "performanceReview": "You scored 70% which is above average. Your performance shows strong understanding of basic concepts, but there are areas that need improvement.",
    "weakAreas": [
        "List Comprehensions",
        "Error Handling",
        "Advanced Data Structures"
    ],
    "suggestions": [
        "Review list comprehensions and practice with examples",
        "Study exception handling and try-except blocks",
        "Practice with dictionaries and sets"
    ],
    "strengths": [
        "Basic Syntax",
        "Data Types",
        "String Operations"
    ],
    "improvementAreas": [
        "Advanced Concepts",
        "Best Practices",
        "Code Optimization"
    ],
    "detailedAnalysis": "Your performance analysis shows that you have a solid foundation in Python basics. You correctly answered 7 out of 10 questions. Your strengths include understanding of basic syntax and data types. However, you struggled with list comprehensions and error handling concepts. We recommend focusing on these areas for improvement.",
    "topicsToReview": [
        "Python List Comprehensions",
        "Exception Handling",
        "Dictionary Operations"
    ]
}
```

## Key Requirements

1. **Performance Review**: Overall summary (2-3 sentences)
2. **Weak Areas**: Specific topics where user struggled (5-7 items)
3. **Suggestions**: Actionable recommendations (5-7 items)
4. **Strengths**: Topics where user performed well (5-7 items)
5. **Improvement Areas**: General areas needing attention (5-7 items)
6. **Detailed Analysis**: Comprehensive paragraph (4-6 sentences)
7. **Topics to Review**: Prioritized list of topics (5-7 items)

## Error Handling

- Invalid quiz data: Return error
- Missing answers: Calculate based on available answers
- Empty analysis: Retry with adjusted prompt
- Invalid response format: Parse and validate, use fallback if needed

## Analysis Quality

- **Constructive**: Focus on improvement, not just criticism
- **Specific**: Avoid generic statements
- **Actionable**: Provide clear next steps
- **Encouraging**: Acknowledge strengths while addressing weaknesses

