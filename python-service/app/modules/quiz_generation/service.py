from typing import Dict, Any
from app.agents.orchestrator_agent import OrchestratorAgent, AgentContext


async def generate_quiz_from_url(
    user_id: str,
    url: str = None,
    urls: list = None,
    difficulty: str = "medium",
    number_of_questions: int = 10,
    time_duration: int = 3600
) -> Dict[str, Any]:
    """Generate quiz from URL(s)"""
    if not url and (not urls or len(urls) == 0):
        raise ValueError("Either URL or URLs array must be provided")
    
    number_of_questions = min(max(1, number_of_questions or 10), 100)
    
    orchestrator = OrchestratorAgent()
    
    orchestrator_input = {
        "url": url,
        "urls": urls,
        "difficulty": difficulty,
        "numberOfQuestions": number_of_questions
    }
    
    context = AgentContext(
        input_data=orchestrator_input,
        metadata={"userId": user_id, "sourceType": "url"}
    )
    
    result = await orchestrator.run(context)
    
    questions = result.output["questions"]
    
    # Map difficulty
    difficulty_mapping = {
        "easy": "Easy",
        "medium": "Normal",
        "hard": "Hard"
    }
    mapped_difficulty = difficulty_mapping.get(difficulty, "Normal")
    
    return {
        "questions": questions,
        "metadata": result.output["metadata"],
        "quizName": result.output.get("quizName"),
        "configuration": {
            "difficulty": mapped_difficulty,
            "numberOfQuestions": len(questions),
            "timeDuration": time_duration
        }
    }


async def generate_quiz_from_document(
    user_id: str,
    document: str,
    difficulty: str = "medium",
    number_of_questions: int = 10,
    time_duration: int = 3600
) -> Dict[str, Any]:
    """Generate quiz from document"""
    if not document or len(document.strip()) == 0:
        raise ValueError("Document content cannot be empty")
    
    number_of_questions = min(max(1, number_of_questions or 10), 100)
    
    orchestrator = OrchestratorAgent()
    
    orchestrator_input = {
        "document": document,
        "difficulty": difficulty,
        "numberOfQuestions": number_of_questions
    }
    
    context = AgentContext(
        input_data=orchestrator_input,
        metadata={"userId": user_id, "sourceType": "document"}
    )
    
    result = await orchestrator.run(context)
    
    questions = result.output["questions"]
    
    # Map difficulty
    difficulty_mapping = {
        "easy": "Easy",
        "medium": "Normal",
        "hard": "Hard"
    }
    mapped_difficulty = difficulty_mapping.get(difficulty, "Normal")
    
    return {
        "questions": questions,
        "metadata": result.output["metadata"],
        "quizName": result.output.get("quizName"),
        "configuration": {
            "difficulty": mapped_difficulty,
            "numberOfQuestions": len(questions),
            "timeDuration": time_duration
        }
    }

