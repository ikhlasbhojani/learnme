"""
Quiz Analysis Agent - Analyzes completed quiz and generates feedback.
"""
from agents import Agent, Runner
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


# Output Model for Quiz Analysis
class QuizAnalysisOutput(BaseModel):
    """Output model for quiz analysis."""
    performanceReview: str = Field(..., description="Overall summary (2-3 sentences)")
    weakAreas: List[str] = Field(..., min_length=5, max_length=7, description="5-7 items")
    suggestions: List[str] = Field(..., min_length=5, max_length=7, description="5-7 items")
    strengths: List[str] = Field(..., min_length=5, max_length=7, description="5-7 items")
    improvementAreas: List[str] = Field(..., min_length=5, max_length=7, description="5-7 items")
    detailedAnalysis: str = Field(..., description="Comprehensive paragraph (4-6 sentences)")
    topicsToReview: List[str] = Field(..., min_length=5, max_length=7, description="5-7 items, prioritized")


class QuizAnalysisAgent:
    """
    Agent jo completed quiz ka analysis generate karta hai.
    """
    
    def __init__(self, gemini_client, model: str):
        """
        Initialize quiz analysis agent.
        
        Args:
            gemini_client: OpenAI-compatible client (AsyncOpenAI)
            model: User-selected model name (e.g., 'gemini-2.5-flash', 'gpt-4o', 'gpt-5', etc.)
        """
        self.client = gemini_client
        self.agent = Agent(
            name="Quiz Analysis Agent",
            instructions=self._get_instructions(),
            model=model,  # ALWAYS use user-selected model (no defaults)
            tools=[],  # No tools needed
            output_type=QuizAnalysisOutput  # Structured output type
        )
    
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
        
        result = await Runner.run(
            self.agent,
            prompt
        )
        
        # output_type automatically validates and parses JSON
        # result.final_output is already a QuizAnalysisOutput instance
        return result.final_output_as(QuizAnalysisOutput)
    
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

