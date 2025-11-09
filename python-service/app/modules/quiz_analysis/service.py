from typing import Dict, Any, Optional
from app.agents.quiz_analysis_agent import QuizAnalysisAgent, AgentContext


async def analyze_quiz(
    user_id: str,
    quiz: Dict[str, Any],
    answers: Dict[str, str],
    original_content: Optional[str] = None
) -> Dict[str, Any]:
    """Analyze quiz performance"""
    if not quiz:
        raise ValueError("Quiz is required for analysis")
    
    # Verify ownership
    if quiz.get("userId") != user_id:
        raise ValueError("You are not allowed to access this quiz")
    
    status = quiz.get("status")
    if status not in ["completed", "expired"]:
        raise ValueError("Quiz must be completed or expired before analysis")
    
    analysis_agent = QuizAnalysisAgent()
    
    context = AgentContext(
        input_data={
            "quiz": quiz,
            "answers": answers,
            "originalContent": original_content
        },
        metadata={
            "userId": user_id,
            "quizId": quiz.get("id")
        }
    )
    
    result = await analysis_agent.run(context)
    
    return result.output

