import json
import re
from typing import Dict, Any, List, Optional
from datetime import datetime
from agents import function_tool
from app.agents.base_agent import BaseAgent, AgentContext, AgentResult


def calculate_difficulty_stats(questions: list, answers: dict) -> dict:
    """Calculate performance statistics by difficulty level. Returns dict with difficulty as key and stats as value."""
    difficulty_stats = {}
    for question in questions:
        diff = question.get("difficulty", "Normal")
        if diff not in difficulty_stats:
            difficulty_stats[diff] = {"correct": 0, "total": 0, "incorrect": 0}
        difficulty_stats[diff]["total"] += 1
        
        user_answer = answers.get(question.get("id"))
        if user_answer:
            is_correct = user_answer == question.get("correctAnswer")
            if is_correct:
                difficulty_stats[diff]["correct"] += 1
            else:
                difficulty_stats[diff]["incorrect"] += 1
    return difficulty_stats


class QuizAnalysisAgent(BaseAgent):
    """Agent for analyzing quiz performance using OpenAI Agents SDK"""
    
    def __init__(self):
        super().__init__(
            name="QuizAnalyzer",
            instructions="""You are an expert quiz analysis agent specializing in providing detailed, actionable feedback on quiz performance.
            
            Your role is to:
            1. Analyze quiz results comprehensively
            2. Identify specific weak areas and patterns
            3. Provide detailed, actionable improvement strategies
            4. Highlight strengths to build confidence
            5. Offer personalized learning recommendations
            
            Always provide:
            - Detailed performance breakdown by difficulty level
            - Specific weak areas with examples
            - Concrete, actionable improvement steps
            - Encouragement and positive reinforcement
            - Learning path recommendations
            
            Analyze performance by difficulty level and provide comprehensive feedback."""
        )
    
    async def run(self, context: AgentContext) -> AgentResult:
        """Analyze quiz performance"""
        input_data = context.input
        quiz = input_data.get("quiz")
        answers = input_data.get("answers", {})
        original_content = input_data.get("originalContent")
        user_id = context.metadata.get("userId")
        
        if not quiz:
            raise ValueError("Quiz is required for analysis")
        
        try:
            analysis = await self._analyze_quiz(quiz, answers, original_content, user_id)
            return AgentResult(
                output=analysis,
                metadata={
                    "analyzedAt": self._get_iso_timestamp(),
                    "quizId": quiz.get("id")
                }
            )
        except Exception as e:
            raise Exception(f"Quiz analysis failed: {str(e)}")
    
    async def _analyze_quiz(
        self,
        quiz: Dict[str, Any],
        answers: Dict[str, str],
        original_content: Optional[str],
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        """Perform comprehensive quiz analysis"""
        questions = quiz.get("questions", [])
        total_questions = len(questions)
        answered_count = len(answers)
        unanswered_count = total_questions - answered_count
        
        score = quiz.get("score", 0)
        correct_count = quiz.get("correctCount", 0)
        incorrect_count = quiz.get("incorrectCount", 0)
        
        # Calculate performance by difficulty
        difficulty_stats: Dict[str, Dict[str, int]] = {}
        answered_questions_list = []
        
        for question in questions:
            diff = question.get("difficulty", "Normal")
            if diff not in difficulty_stats:
                difficulty_stats[diff] = {"correct": 0, "total": 0, "incorrect": 0}
            difficulty_stats[diff]["total"] += 1
            
            user_answer = answers.get(question.get("id"))
            if user_answer:
                is_correct = user_answer == question.get("correctAnswer")
                if is_correct:
                    difficulty_stats[diff]["correct"] += 1
                else:
                    difficulty_stats[diff]["incorrect"] += 1
                
                answered_questions_list.append({
                    "question": question.get("text", ""),
                    "userAnswer": user_answer,
                    "correctAnswer": question.get("correctAnswer", ""),
                    "difficulty": diff,
                    "isCorrect": is_correct
                })
        
        # Extract topics from wrong questions
        incorrect_questions = [q for q in answered_questions_list if not q["isCorrect"]]
        topics_to_review = []
        
        if incorrect_questions:
            try:
                topics_to_review = await self._extract_topics_from_wrong_questions(
                    incorrect_questions, original_content, user_id
                )
            except Exception as e:
                print(f"Failed to extract topics from wrong questions: {e}")
        
        # Build analysis prompt
        prompt = self._build_analysis_prompt(
            score, correct_count, incorrect_count, unanswered_count,
            difficulty_stats, answered_questions_list, total_questions,
            topics_to_review, original_content
        )
        
        try:
            analysis_text = await self._call_agent(prompt, {"userId": user_id, "quizId": quiz.get("id")})
            
            # Parse the analysis
            analysis = self._parse_analysis(analysis_text, difficulty_stats, score)
            
            # Add topics to review
            analysis["topicsToReview"] = topics_to_review
            
            return analysis
        except Exception as e:
            print(f"AI analysis failed, using basic analysis: {e}")
            basic_analysis = self._generate_basic_analysis(
                score, correct_count, incorrect_count, unanswered_count, difficulty_stats
            )
            basic_analysis["topicsToReview"] = topics_to_review
            return basic_analysis
    
    async def _extract_topics_from_wrong_questions(
        self,
        incorrect_questions: List[Dict],
        original_content: Optional[str],
        user_id: Optional[str]
    ) -> List[str]:
        """Extract topics from incorrect questions using AI"""
        if not incorrect_questions:
            return []
        
        questions_text = "\n\n".join([
            f"{i+1}. {q['question']}\n   Your Answer: {q['userAnswer']}\n   Correct Answer: {q['correctAnswer']}"
            for i, q in enumerate(incorrect_questions)
        ])
        
        # Build original content context string separately to avoid f-string backslash issue
        original_context_str = ""
        if original_content:
            truncated = original_content[:2000]
            ellipsis = "..." if len(original_content) > 2000 else ""
            original_context_str = f"Original Content Context:\n{truncated}{ellipsis}\n\n"
        
        prompt = f"""Analyze the following questions that were answered incorrectly and identify the specific topics, concepts, or subject areas that the user needs to review.

{original_context_str}Incorrect Questions:
{questions_text}

Based on these incorrect answers, identify 5-10 specific topics, concepts, or subject areas that the user should focus on reviewing. Be specific and actionable.

Return ONLY a JSON array of topic strings, no other text:
["Topic 1", "Topic 2", "Topic 3", ...]"""
        
        try:
            response = await self._call_agent(prompt, {"userId": user_id} if user_id else {})
            
            # Clean and parse JSON
            cleaned = response.strip() if isinstance(response, str) else str(response)
            if cleaned.startswith("```"):
                cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned, flags=re.IGNORECASE)
                cleaned = re.sub(r'\s*```$', '', cleaned)
            
            array_match = re.search(r'\[[\s\S]*\]', cleaned)
            if array_match:
                json_str = array_match.group(0)
                json_str = re.sub(r',(\s*[\]}])', r'\1', json_str)
                json_str = re.sub(r'[\x00-\x1F\x7F]', '', json_str)
                
                parsed = json.loads(json_str)
                if isinstance(parsed, list):
                    return [t for t in parsed if isinstance(t, str) and len(t.strip()) > 0]
        except Exception as e:
            print(f"Failed to extract topics: {e}")
        
        return []
    
    def _build_correct_answers_section(self, correct_questions: List[Dict]) -> str:
        """Build correct answers section string"""
        if not correct_questions:
            return ""
        newline = chr(10)
        questions_text = newline.join([
            f"{i+1}. [{q['difficulty']}] {q['question'][:200]}{'...' if len(q['question']) > 200 else ''}{newline}   ✅ Correctly answered: {q['userAnswer']}"
            for i, q in enumerate(correct_questions[:5])
        ])
        return f"{newline}Correct Answers (showing strengths):{newline}{questions_text}"
    
    def _build_topics_section(self, topics_to_review: List[str]) -> str:
        """Build topics to review section string"""
        if not topics_to_review:
            return ""
        newline = chr(10)
        topics_text = newline.join([f"{i+1}. {t}" for i, t in enumerate(topics_to_review)])
        return f"{newline}=== IDENTIFIED TOPICS TO REVIEW ==={newline}{topics_text}{newline}"
    
    def _build_original_content_section(self, original_content: Optional[str]) -> str:
        """Build original content context section string"""
        if not original_content:
            return ""
        newline = chr(10)
        truncated = original_content[:3000]
        suffix = newline + "... (content truncated)" if len(original_content) > 3000 else ""
        return f"{newline}=== ORIGINAL CONTENT CONTEXT ==={newline}{truncated}{suffix}{newline}"
    
    def _build_analysis_prompt(
        self,
        score: float,
        correct_count: int,
        incorrect_count: int,
        unanswered_count: int,
        difficulty_stats: Dict[str, Dict[str, int]],
        answered_questions: List[Dict],
        total_questions: int,
        topics_to_review: List[str],
        original_content: Optional[str]
    ) -> str:
        """Build comprehensive analysis prompt"""
        incorrect_questions = [q for q in answered_questions if not q["isCorrect"]]
        correct_questions = [q for q in answered_questions if q["isCorrect"]]
        
        # Analyze patterns in incorrect answers
        incorrect_by_difficulty: Dict[str, int] = {}
        for q in incorrect_questions:
            diff = q["difficulty"]
            incorrect_by_difficulty[diff] = incorrect_by_difficulty.get(diff, 0) + 1
        
        prompt = f"""You are analyzing a quiz performance. Provide a DETAILED, COMPREHENSIVE analysis with specific insights and actionable recommendations.

=== PERFORMANCE METRICS ===
Overall Score: {score:.1f}%
- Correct Answers: {correct_count} out of {total_questions} ({((correct_count / total_questions) * 100):.1f}%)
- Incorrect Answers: {incorrect_count} ({((incorrect_count / total_questions) * 100):.1f}%)
- Unanswered Questions: {unanswered_count} ({((unanswered_count / total_questions) * 100):.1f}%)

=== PERFORMANCE BY DIFFICULTY LEVEL ===
{chr(10).join([f"- {diff}: {stats['correct']}/{stats['total']} correct ({((stats['correct'] / stats['total']) * 100):.1f}%) - {'Excellent' if (stats['correct'] / stats['total']) * 100 >= 80 else 'Good' if (stats['correct'] / stats['total']) * 100 >= 60 else 'Needs Improvement' if (stats['correct'] / stats['total']) * 100 >= 40 else 'Weak'}" for diff, stats in difficulty_stats.items()])}

=== INCORRECT ANSWERS ANALYSIS ===
Total Incorrect: {incorrect_count}
Breakdown by Difficulty:
{chr(10).join([f"- {diff}: {count} incorrect" for diff, count in incorrect_by_difficulty.items()])}

=== SAMPLE QUESTIONS FOR ANALYSIS ===
Incorrect Answers (showing patterns):
{chr(10).join([f"{i+1}. [{q['difficulty']}] {q['question']}{chr(10)}   ❌ Your Answer: {q['userAnswer']}{chr(10)}   ✅ Correct Answer: {q['correctAnswer']}" for i, q in enumerate(incorrect_questions[:10])])}

{self._build_correct_answers_section(correct_questions) if correct_questions else ''}

{self._build_topics_section(topics_to_review) if topics_to_review else ''}

{self._build_original_content_section(original_content) if original_content else ''}

=== ANALYSIS REQUIREMENTS ===
Provide a comprehensive analysis in this EXACT JSON format (NO trailing commas, valid JSON only):
{{
  "performanceReview": "A detailed 4-5 paragraph comprehensive review covering: 1) Overall performance assessment with specific score interpretation, 2) What the score means in the context of the material covered, 3) Key observations about the user's knowledge level and understanding, 4) Specific patterns observed in correct vs incorrect answers, 5) An encouraging but honest evaluation with specific examples. Reference actual questions and topics where relevant.",
  "weakAreas": ["List specific weak areas based on the incorrect questions. For each difficulty level where performance < 60%, include: 'Difficulty Level: [Easy/Normal/Hard/Master] - [specific topic/concept]'. Reference the identified topics to review. Be very specific - e.g., 'Hard: Advanced concepts in [specific topic from topics list]', 'Normal: Application of [specific concept]', 'Master: Understanding of [specific topic]'. Include at least 5-7 specific weak areas."],
  "suggestions": ["Provide 7-10 actionable, specific suggestions. Each should be: 1) Specific to their weak areas and the topics identified, 2) Actionable (what to do, not just 'study more'), 3) Prioritized (most important first), 4) Reference specific topics from the topics to review list. Examples: 'Review [specific topic from topics list] - focus on [specific aspect]', 'Practice [specific topic] questions at [difficulty] level', 'Re-read the section on [specific topic] and take notes', 'Create flashcards for [specific concept]', 'Take another quiz focusing on [weak area]'. Be very specific and actionable."],
  "strengths": ["List 4-6 specific strengths. Be specific: 'Strong performance in [difficulty] level questions about [specific topic]', 'Good understanding of [topic/concept] - answered [X] questions correctly', 'Consistent accuracy in [area] - [specific examples]', 'Excellent grasp of [concept] as shown by correct answers to [specific questions]'. Include positive reinforcement with specific examples."],
  "improvementAreas": ["List 5-7 specific areas needing improvement. Be detailed: 'Master difficulty questions about [specific topic] - scored [X]%', 'Time management - [X] unanswered questions', 'Concept application in [specific area] - missed [X] questions', 'Understanding of [specific topic] - got [X] out of [Y] questions wrong', 'Application of [concept] in practical scenarios'. Include specific metrics and reference topics."],
  "detailedAnalysis": "A comprehensive 6-8 paragraph detailed analysis covering: 1) Performance patterns and trends with specific statistics, 2) Deep analysis of incorrect answers (what patterns emerge, what concepts were misunderstood, why the wrong answers were chosen), 3) Difficulty progression analysis (how performance changes across difficulty levels, where the user struggles most), 4) Learning gaps identification (specific knowledge gaps based on wrong questions and topics), 5) Topic-specific analysis (which topics from the identified list need the most attention and why), 6) Personalized learning path recommendations (what to study next, in what order, how to progress, which topics to prioritize), 7) Study strategy recommendations (how to approach reviewing the weak areas). Be very specific, reference actual questions, topics, and provide actionable insights."
}}

=== CRITICAL INSTRUCTIONS ===
1. Be SPECIFIC - mention actual difficulty levels, topics from the topics list, and concepts from the questions
2. Be ACTIONABLE - every suggestion should tell them WHAT to do, not just what's wrong. Reference specific topics to review.
3. Be ENCOURAGING - highlight strengths while being honest about weaknesses
4. Be DETAILED - the detailedAnalysis should be comprehensive (6-8 paragraphs), performanceReview should be 4-5 paragraphs
5. Use the actual data provided - reference specific scores, difficulty levels, question patterns, and topics
6. Reference the identified topics to review throughout your analysis
7. Analyze WHY questions were wrong - what concepts were misunderstood
8. Provide topic-specific recommendations based on the topics list
9. Return ONLY valid JSON - no markdown, no code blocks, no extra text

Generate the detailed analysis now:"""
        
        return prompt
    
    def _parse_analysis(
        self,
        analysis_text: Any,
        difficulty_stats: Dict[str, Dict[str, int]],
        score: float
    ) -> Dict[str, Any]:
        """Parse analysis from agent result"""
        try:
            # If result is already a dict, use it
            if isinstance(analysis_text, dict):
                return {
                    "performanceReview": analysis_text.get("performanceReview", ""),
                    "weakAreas": analysis_text.get("weakAreas", []),
                    "suggestions": analysis_text.get("suggestions", []),
                    "strengths": analysis_text.get("strengths", []),
                    "improvementAreas": analysis_text.get("improvementAreas", []),
                    "detailedAnalysis": analysis_text.get("detailedAnalysis", "")
                }
            
            # If result is a string, try to parse JSON
            if isinstance(analysis_text, str):
                cleaned_text = analysis_text.strip()
                if cleaned_text.startswith("```"):
                    cleaned_text = re.sub(r'^```(?:json)?\s*', '', cleaned_text, flags=re.IGNORECASE)
                    cleaned_text = re.sub(r'\s*```$', '', cleaned_text)
                
                json_match = re.search(r'\{[\s\S]*\}', cleaned_text)
                if json_match:
                    json_str = json_match.group(0)
                    json_str = self._clean_json_string(json_str)
                    
                    try:
                        parsed = json.loads(json_str)
                        return {
                            "performanceReview": parsed.get("performanceReview", ""),
                            "weakAreas": parsed.get("weakAreas", []),
                            "suggestions": parsed.get("suggestions", []),
                            "strengths": parsed.get("strengths", []),
                            "improvementAreas": parsed.get("improvementAreas", []),
                            "detailedAnalysis": parsed.get("detailedAnalysis", "")
                        }
                    except json.JSONDecodeError:
                        # Try aggressive cleaning
                        try:
                            json_str = self._aggressive_json_clean(json_str)
                            parsed = json.loads(json_str)
                            return {
                                "performanceReview": parsed.get("performanceReview", ""),
                                "weakAreas": parsed.get("weakAreas", []),
                                "suggestions": parsed.get("suggestions", []),
                                "strengths": parsed.get("strengths", []),
                                "improvementAreas": parsed.get("improvementAreas", []),
                                "detailedAnalysis": parsed.get("detailedAnalysis", "")
                            }
                        except:
                            pass
        except Exception as e:
            print(f"Failed to parse AI analysis: {e}")
        
        # Fallback to basic analysis
        return self._generate_basic_analysis(
            score,
            sum(s.get("correct", 0) for s in difficulty_stats.values()),
            sum(s.get("incorrect", 0) for s in difficulty_stats.values()),
            0,
            difficulty_stats
        )
    
    def _clean_json_string(self, json_str: str) -> str:
        """Clean JSON string"""
        cleaned = json_str
        # Remove trailing commas (multiple passes)
        cleaned = re.sub(r',(\s*[\]}])', r'\1', cleaned)
        cleaned = re.sub(r',(\s*[\]}])', r'\1', cleaned)  # Second pass
        # Fix common quote issues
        cleaned = re.sub(r'([\'"])?([a-zA-Z0-9_]+)([\'"])?\s*:', r'"\2":', cleaned)
        # Fix double commas
        cleaned = re.sub(r',,+', ',', cleaned)
        # Remove commas at start of objects/arrays
        cleaned = re.sub(r'(\[|\{)\s*,', r'\1', cleaned)
        # Fix missing commas between array elements
        cleaned = re.sub(r'\]\s*\[', r'], [', cleaned)
        # Remove control characters
        cleaned = re.sub(r'[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]', '', cleaned)
        return cleaned
    
    def _aggressive_json_clean(self, json_str: str) -> str:
        """Aggressively clean JSON string"""
        try:
            first_brace = json_str.find('{')
            last_brace = json_str.rfind('}')
            
            if first_brace == -1 or last_brace == -1 or first_brace >= last_brace:
                raise ValueError("No valid object structure found")
            
            cleaned = json_str[first_brace:last_brace + 1]
            cleaned = self._clean_json_string(cleaned)
            # Additional aggressive fixes
            cleaned = re.sub(r'(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', cleaned)
            cleaned = re.sub(r',+', ',', cleaned)
            cleaned = re.sub(r'\}\s*\{', '},{', cleaned)
            return cleaned
        except Exception as e:
            print(f"Aggressive JSON clean failed: {e}")
            return json_str
    
    def _generate_basic_analysis(
        self,
        score: float,
        correct_count: int,
        incorrect_count: int,
        unanswered_count: int,
        difficulty_stats: Dict[str, Dict[str, int]]
    ) -> Dict[str, Any]:
        """Generate basic analysis fallback"""
        weak_areas = []
        strengths = []
        improvement_areas = []
        
        for difficulty, stats in difficulty_stats.items():
            percentage = (stats["correct"] / stats["total"]) * 100 if stats["total"] > 0 else 0
            if percentage < 50:
                weak_areas.append(f"{difficulty} difficulty ({percentage:.1f}% correct)")
                improvement_areas.append(
                    f"{difficulty} level questions - scored {percentage:.1f}% "
                    f"({stats['correct']}/{stats['total']} correct)"
                )
            elif percentage >= 75:
                strengths.append(
                    f"Strong performance in {difficulty} level questions ({percentage:.1f}% correct)"
                )
            else:
                improvement_areas.append(
                    f"{difficulty} level questions - scored {percentage:.1f}% (needs improvement)"
                )
        
        # Generate performance review
        if score >= 90:
            performance_review = (
                f"Excellent performance! You scored {score:.1f}% with {correct_count} correct answers "
                f"out of {correct_count + incorrect_count + unanswered_count} total questions. "
                f"You have demonstrated a strong understanding of the material across all difficulty levels."
            )
        elif score >= 70:
            performance_review = (
                f"Good performance! You scored {score:.1f}% with {correct_count} correct and "
                f"{incorrect_count} incorrect answers. You have a solid grasp of most concepts, "
                f"with room for improvement in some areas."
            )
        elif score >= 50:
            performance_review = (
                f"Fair performance. You scored {score:.1f}% with {correct_count} correct and "
                f"{incorrect_count} incorrect answers. There is room for improvement in several areas."
            )
        else:
            performance_review = (
                f"Your score of {score:.1f}% indicates that you need to review the material more thoroughly. "
                f"You answered {correct_count} questions correctly and {incorrect_count} incorrectly."
            )
        
        # Generate suggestions
        suggestions = []
        if weak_areas:
            suggestions.append(
                f"Focus on practicing {', '.join([a.split(' ')[0] for a in weak_areas])} "
                f"difficulty questions to improve your understanding in these areas."
            )
        if unanswered_count > 0:
            suggestions.append(
                f"Try to answer all questions. You left {unanswered_count} "
                f"question{'s' if unanswered_count > 1 else ''} unanswered, which affected your score."
            )
        if score < 70:
            suggestions.append(
                "Review the source material again, paying special attention to the concepts you missed, "
                "and take another quiz to reinforce your learning."
            )
        if incorrect_count > correct_count:
            suggestions.append(
                "Consider reviewing the fundamental concepts before attempting more advanced questions. "
                "Build a strong foundation first."
            )
        if not suggestions:
            suggestions.append("Keep up the great work! Continue practicing to maintain and further improve your skills.")
        
        # Generate detailed analysis
        difficulty_breakdown = ", ".join([
            f"{diff}: {stats['correct']}/{stats['total']} ({((stats['correct'] / stats['total']) * 100):.1f}%)"
            for diff, stats in difficulty_stats.items()
        ])
        
        detailed_analysis = f"""Performance Analysis:
You achieved an overall score of {score:.1f}%, answering {correct_count} questions correctly, {incorrect_count} incorrectly, and leaving {unanswered_count} unanswered.

Performance Breakdown by Difficulty:
{difficulty_breakdown}

{weak_areas and f'Areas needing attention: {", ".join(weak_areas)}.' or ''}
{strengths and f'Your strengths: {", ".join(strengths)}.' or ''}

{score >= 70 and 'You have a solid foundation. Continue practicing to maintain and improve your performance.' or 'Focus on reviewing the material, especially in the areas where you struggled, and take practice quizzes to reinforce your learning.'}"""
        
        return {
            "performanceReview": performance_review,
            "weakAreas": [a.split('(')[0].strip() for a in weak_areas],
            "suggestions": suggestions,
            "strengths": strengths,
            "improvementAreas": improvement_areas,
            "detailedAnalysis": detailed_analysis
        }
    
    def _get_iso_timestamp(self) -> str:
        """Get ISO timestamp"""
        return datetime.utcnow().isoformat() + "Z"
