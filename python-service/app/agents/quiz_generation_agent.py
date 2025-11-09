import json
import math
import re
from typing import List, Dict, Any, Optional, Literal
from datetime import datetime
from agents import function_tool
from app.agents.base_agent import BaseAgent, AgentContext, AgentResult
from app.agents.quiz_instructions import (
    get_quiz_instructions,
    GENERAL_QUIZ_REQUIREMENTS,
    ANSWER_VERIFICATION_INSTRUCTIONS,
    CODE_BASED_QUESTION_INSTRUCTIONS,
    FINAL_REMINDER_INSTRUCTIONS
)

DifficultyLevel = Literal["easy", "medium", "hard"]


@function_tool
def detect_code_in_content(content: str) -> bool:
    """Detect if content contains code examples. Returns True if code is found."""
    code_patterns = [
        r'```[\s\S]*?```',  # Markdown code blocks
        r'`[^`]+`',  # Inline code
        r'\bfunction\s+\w+\s*\(',  # Function declarations
        r'\bclass\s+\w+',  # Class declarations
        r'\bconst\s+\w+\s*=',  # Const declarations
        r'\blet\s+\w+\s*=',  # Let declarations
        r'\bvar\s+\w+\s*=',  # Var declarations
        r'\bdef\s+\w+\s*\(',  # Python function
        r'\bimport\s+.*from',  # Import statements
        r'\breturn\s+',  # Return statements
        r'\{[\s\S]{20,}\}',  # Code blocks with braces
        r'\[[\s\S]{20,}\]',  # Code blocks with brackets
        r'<script[\s\S]*?>[\s\S]*?</script>',  # Script tags
        r'<code[\s\S]*?>[\s\S]*?</code>',  # Code tags
    ]
    return any(re.search(pattern, content, re.IGNORECASE) for pattern in code_patterns)


@function_tool
def extract_code_examples(content: str) -> List[str]:
    """Extract code examples from content. Returns list of code snippets."""
    code_examples = []
    
    # Extract markdown code blocks
    markdown_code_regex = r'```(?:[\w]+)?\n?([\s\S]*?)```'
    for match in re.finditer(markdown_code_regex, content):
        code = match.group(1).strip()
        lines = [line for line in code.split('\n') if line.strip()]
        # Filter out single-line commands
        is_single_command = len(lines) == 1 and (
            code.startswith('pip ') or
            code.startswith('npm ') or
            code.startswith('yarn ') or
            (code.startswith('import ') and '{' not in code and '(' not in code) or
            (code.startswith('from ') and 'import' not in code) or
            len(code.strip().split()) <= 3
        )
        if not is_single_command and 10 < len(code) < 3000 and len(lines) >= 1:
            code_examples.append(code)
    
    # Extract code from <code> tags
    code_tag_regex = r'<code[^>]*>([\s\S]*?)</code>'
    for match in re.finditer(code_tag_regex, content, re.IGNORECASE):
        code = match.group(1).strip()
        lines = [line for line in code.split('\n') if line.strip()]
        is_single_command = len(lines) == 1 and (
            code.startswith('pip ') or
            code.startswith('npm ') or
            code.startswith('yarn ') or
            (code.startswith('import ') and '{' not in code and '(' not in code) or
            (code.startswith('from ') and 'import' not in code) or
            len(code.strip().split()) <= 3
        )
        if not is_single_command and 10 < len(code) < 3000 and len(lines) >= 1:
            code_examples.append(code)
    
    # Extract code from <pre> tags
    pre_tag_regex = r'<pre[^>]*>([\s\S]*?)</pre>'
    for match in re.finditer(pre_tag_regex, content, re.IGNORECASE):
        code = match.group(1).strip()
        lines = [line for line in code.split('\n') if line.strip()]
        is_single_command = len(lines) == 1 and (
            code.startswith('pip ') or
            code.startswith('npm ') or
            code.startswith('yarn ') or
            (code.startswith('import ') and '{' not in code and '(' not in code) or
            (code.startswith('from ') and 'import' not in code) or
            len(code.strip().split()) <= 3
        )
        if not is_single_command and 10 < len(code) < 3000 and len(lines) >= 1:
            code_examples.append(code)
    
    # Extract inline code blocks (if substantial)
    inline_code_regex = r'`([^`]{30,})`'
    for match in re.finditer(inline_code_regex, content):
        code = match.group(1).strip()
        if 30 < len(code) < 800 and re.search(
            r'(?:function|def|class|const|let|var|import|export|return|if|for|while|=>|\(|\)|{|})',
            code
        ):
            code_examples.append(code)
    
    # Remove duplicates and limit
    unique_examples = list(dict.fromkeys(code_examples))
    return unique_examples[:15]


class QuizGenerationAgent(BaseAgent):
    """Agent for generating quiz questions from content using OpenAI Agents SDK"""
    
    def __init__(self):
        super().__init__(
            name="QuizGenerator",
            instructions="""You are a quiz generation agent. Your job is to create high-quality quiz questions based on provided content.
            Generate questions that test understanding, application, and knowledge of the content.
            Questions should be clear, unambiguous, and educationally valuable.
            Each question must have exactly 4 options with one correct answer.
            Provide explanations for the correct answers when possible.
            Use the detect_code_in_content and extract_code_examples tools to identify code in content.
            When code is detected, create a significant portion of questions (40-60%) about code.""",
            tools=[detect_code_in_content, extract_code_examples]
        )
    
    async def run(self, context: AgentContext) -> AgentResult:
        """Generate quiz questions"""
        input_data = context.input
        content = input_data.get("content")
        difficulty = input_data.get("difficulty", "medium")
        number_of_questions = input_data.get("numberOfQuestions", 10)
        
        if not content:
            raise ValueError("Content is required for quiz generation")
        
        if difficulty not in ["easy", "medium", "hard"]:
            raise ValueError("Difficulty must be easy, medium, or hard")
        
        max_questions = min(number_of_questions or 100, 100)
        questions = await self._generate_questions(content, difficulty, max_questions, context)
        
        return AgentResult(
            output={
                "questions": questions,
                "count": len(questions),
                "difficulty": difficulty,
                "generatedAt": datetime.utcnow().isoformat() + "Z"
            },
            metadata={
                "requestedQuestions": number_of_questions,
                "generatedQuestions": len(questions)
            }
        )
    
    async def _generate_questions(
        self,
        content: str,
        difficulty: DifficultyLevel,
        count: int,
        context: AgentContext
    ) -> List[Dict[str, Any]]:
        """Generate questions with retry mechanism"""
        difficulty_mapping = {
            "easy": "Easy",
            "medium": "Normal",
            "hard": "Hard"
        }
        mapped_difficulty = difficulty_mapping[difficulty]
        
        prompt = self._build_quiz_generation_prompt(content, difficulty, count)
        
        try:
            questions: List[Dict[str, Any]] = []
            
            # Generate questions using agent
            generated_text = await self._call_agent(prompt, context.metadata)
            
            # Parse questions
            if isinstance(generated_text, str):
                questions = self._parse_questions(generated_text, mapped_difficulty)
            elif isinstance(generated_text, list):
                questions = self._parse_questions_from_list(generated_text, mapped_difficulty)
            else:
                # Try to convert to string and parse
                questions = self._parse_questions(str(generated_text), mapped_difficulty)
            
            print(f"📊 Parsed {len(questions)} questions from AI response (requested: {count})")
            
            # Validate code-based questions if content has code
            has_code = self._detect_code_in_content(content)
            if has_code:
                code_questions = [q for q in questions if q.get("codeSnippet") and q["codeSnippet"].strip()]
                expected_code_questions = math.ceil(
                    len(questions) * (0.4 if difficulty == "easy" else 0.5 if difficulty == "medium" else 0.6)
                )
                
                if len(code_questions) < expected_code_questions:
                    print(
                        f"⚠️ WARNING: Only {len(code_questions)} code-based questions generated, "
                        f"expected at least {expected_code_questions} out of {len(questions)} total questions."
                    )
            
            # Retry mechanism: keep generating until we have enough questions
            attempts = 0
            max_attempts = 10
            
            while len(questions) < count and attempts < max_attempts:
                needed = count - len(questions)
                print(
                    f"⚠️ Only {len(questions)} questions generated, need {count}. "
                    f"Generating {needed} additional questions... (Attempt {attempts + 1}/{max_attempts})"
                )
                
                additional_questions = await self._generate_additional_questions(
                    content, difficulty, needed, questions, context
                )
                
                if additional_questions:
                    questions.extend(additional_questions)
                    print(f"✓ Added {len(additional_questions)} questions. Total now: {len(questions)}/{count}")
                else:
                    print(f"⚠️ No additional questions generated in attempt {attempts + 1}")
                
                attempts += 1
                
                if len(questions) >= count:
                    break
            
            if len(questions) < count:
                print(f"❌ ERROR: Failed to generate enough questions after {attempts} attempts. "
                      f"Got {len(questions)}, needed {count}")
                print(f"⚠️ Returning {len(questions)} questions instead of {count}")
            else:
                print(f"✅ Successfully generated {len(questions)} questions (requested: {count})")
            
            return questions[:count]
        except Exception as e:
            raise Exception(f"Failed to generate questions: {str(e)}")
    
    def _detect_code_in_content(self, content: str) -> bool:
        """Detect if content contains code"""
        return detect_code_in_content(content)
    
    def _extract_code_examples(self, content: str) -> List[str]:
        """Extract code examples from content"""
        return extract_code_examples(content)
    
    def _build_quiz_generation_prompt(
        self,
        content: str,
        difficulty: DifficultyLevel,
        count: int
    ) -> str:
        """Build the quiz generation prompt"""
        difficulty_instructions = get_quiz_instructions(difficulty)
        has_code = self._detect_code_in_content(content)
        code_examples = self._extract_code_examples(content) if has_code else []
        
        prompt = f"""🚨🚨🚨 ABSOLUTELY CRITICAL - READ THIS FIRST 🚨🚨🚨

YOU MUST GENERATE EXACTLY {count} QUIZ QUESTIONS. NOT {count - 1}, NOT {count + 1}, EXACTLY {count}.

THIS IS MANDATORY. IF YOU GENERATE FEWER THAN {count} QUESTIONS, THE QUIZ WILL FAIL.

BEFORE SUBMITTING YOUR RESPONSE:
1. Count the questions in your JSON array
2. Ensure the array contains EXACTLY {count} question objects
3. If you have fewer than {count}, generate more until you have exactly {count}
4. If you have more than {count}, remove the extra ones until you have exactly {count}

Generate exactly {count} quiz questions based on the following content. The difficulty level is {difficulty}.

{difficulty_instructions}

{CODE_BASED_QUESTION_INSTRUCTIONS if has_code else ''}

{GENERAL_QUIZ_REQUIREMENTS.replace('EXACTLY the requested number', f'EXACTLY {count}').replace('the requested number', f'{count}')}

{ANSWER_VERIFICATION_INSTRUCTIONS}

{code_examples and len(code_examples) > 0 and f'''
=== CODE EXAMPLES FROM CONTENT ===
The following code examples were extracted from the content. **YOU MUST USE THESE** when creating code-based questions:
{chr(10).join([f'--- Example {i + 1} ---{chr(10)}{code[:1500]}{chr(10)}... (truncated)' if len(code) > 1500 else f'--- Example {i + 1} ---{chr(10)}{code}' for i, code in enumerate(code_examples[:10])])}

**CRITICAL INSTRUCTIONS FOR CODE QUESTIONS**:
- You MUST create at least {math.ceil(count * (0.4 if difficulty == 'easy' else 0.5 if difficulty == 'medium' else 0.6))} code-based questions out of {count} total questions
- For each code-based question, you MUST include actual executable code (2-6 lines minimum) in the "codeSnippet" field
- Code snippets MUST be proper multi-line code blocks with logic, NOT single commands or one-liners
- Use the code examples above - extract meaningful code blocks (2-6 lines) and use them for questions
''' or ''}

Format your response as a valid JSON array with this exact structure (NO trailing commas, NO comments):

**EXAMPLE FOR CODE-BASED QUESTION**:
[
  {{
    "text": "Will this code run successfully or produce an error?",
    "options": ["A) Code runs successfully", "B) SyntaxError", "C) NameError", "D) TypeError"],
    "correctAnswer": "A) Code runs successfully",
    "explanation": "The code imports required modules, creates an Agent, runs it, and prints the output. All syntax is correct.",
    "codeSnippet": "from agents import Agent, Runner\\n\\nagent = Agent(name=\\"Assistant\\", instructions=\\"You are helpful\\")\\nresult = Runner.run_sync(agent, \\"Write a haiku\\")\\nprint(result.final_output)",
    "imageReference": null
  }}
]

**EXAMPLE FOR THEORY QUESTION**:
[
  {{
    "text": "What is the purpose of the Agent class?",
    "options": ["A) To create AI agents with instructions", "B) To run code", "C) To install packages", "D) To format text"],
    "correctAnswer": "A) To create AI agents with instructions",
    "explanation": "The Agent class is used to create AI agents with specific instructions and behavior.",
    "codeSnippet": null,
    "imageReference": null
  }}
]

IMPORTANT: 
- Return ONLY valid JSON - no markdown, no code blocks, no extra text
- Ensure all strings are properly quoted
- NO trailing commas after the last element in arrays or objects
- Make sure the JSON is complete and well-formed

Content:
{content[:30000]}{'... (content truncated)' if len(content) > 30000 else ''}

{FINAL_REMINDER_INSTRUCTIONS.replace('the requested number', f'{count}').replace('question N', f'question {count}')}"""
        
        return prompt
    
    def _parse_questions(
        self,
        generated_text: str,
        difficulty: Literal["Easy", "Normal", "Hard", "Master"]
    ) -> List[Dict[str, Any]]:
        """Parse questions from generated text"""
        try:
            # Clean the text - remove markdown code blocks
            cleaned_text = generated_text.strip()
            if cleaned_text.startswith("```"):
                cleaned_text = re.sub(r'^```(?:json)?\s*', '', cleaned_text, flags=re.IGNORECASE)
                cleaned_text = re.sub(r'\s*```$', '', cleaned_text)
            
            # Try to find JSON array
            array_match = re.search(r'\[[\s\S]*', cleaned_text)
            if array_match:
                json_candidate = array_match.group(0)
                
                # Try to find complete array
                complete_array = self._find_complete_array(json_candidate)
                
                if complete_array:
                    try:
                        # Clean JSON
                        complete_array = self._clean_json_string(complete_array)
                        parsed = json.loads(complete_array)
                        
                        if isinstance(parsed, list) and len(parsed) > 0:
                            print(f"✅ Successfully parsed {len(parsed)} questions from JSON array")
                            filtered = [q for q in parsed if q and (q.get("text") or q.get("question"))]
                            print(f"📋 After filtering: {len(filtered)} valid questions")
                            
                            questions = []
                            for i, q in enumerate(filtered):
                                question_text = q.get("text") or q.get("question", "")
                                code_snippet = q.get("codeSnippet")
                                
                                # Validate: if question mentions code but no codeSnippet, log warning
                                code_mentions = re.search(
                                    r'code snippet|given the code|analyze the code|review the code|what does this code|the code below|the code above|following code',
                                    question_text,
                                    re.IGNORECASE
                                )
                                if code_mentions and not code_snippet:
                                    print(
                                        f"Question {i + 1} mentions code but has no codeSnippet: "
                                        f'"{question_text[:100]}..."'
                                    )
                                
                                questions.append({
                                    "id": f"q-{int(datetime.now().timestamp() * 1000)}-{i}",
                                    "text": question_text,
                                    "options": (q.get("options") or [])[:4],
                                    "correctAnswer": q.get("correctAnswer") or q.get("answer", ""),
                                    "difficulty": difficulty,
                                    "explanation": q.get("explanation"),
                                    "codeSnippet": code_snippet,
                                    "imageReference": q.get("imageReference")
                                })
                            
                            return questions
                    except json.JSONDecodeError as e:
                        print(f"JSON parse failed: {e}")
                        # Try aggressive cleaning
                        try:
                            aggressive_cleaned = self._aggressive_json_clean(json_candidate)
                            parsed = json.loads(aggressive_cleaned)
                            if isinstance(parsed, list) and len(parsed) > 0:
                                return self._parse_questions_from_list(parsed, difficulty)
                        except:
                            pass
            
            # Fallback: try text parsing
            return self._parse_questions_from_text(generated_text, difficulty)
        except Exception as e:
            print(f"Failed to parse questions: {e}")
            return []
    
    def _parse_questions_from_list(
        self,
        parsed_list: List[Dict],
        difficulty: Literal["Easy", "Normal", "Hard", "Master"]
    ) -> List[Dict[str, Any]]:
        """Parse questions from already parsed list"""
        questions = []
        for i, q in enumerate(parsed_list):
            if q and (q.get("text") or q.get("question")):
                question_text = q.get("text") or q.get("question", "")
                code_snippet = q.get("codeSnippet")
                
                questions.append({
                    "id": f"q-{int(datetime.now().timestamp() * 1000)}-{i}",
                    "text": question_text,
                    "options": (q.get("options") or [])[:4],
                    "correctAnswer": q.get("correctAnswer") or q.get("answer", ""),
                    "difficulty": difficulty,
                    "explanation": q.get("explanation"),
                    "codeSnippet": code_snippet,
                    "imageReference": q.get("imageReference")
                })
        return questions
    
    def _find_complete_array(self, text: str) -> Optional[str]:
        """Find complete JSON array in text"""
        bracket_count = 0
        brace_count = 0
        in_string = False
        escape_next = False
        
        for i, char in enumerate(text):
            if escape_next:
                escape_next = False
                continue
            
            if char == '\\':
                escape_next = True
                continue
            
            if char == '"' and not escape_next:
                in_string = not in_string
                continue
            
            if not in_string:
                if char == '[':
                    bracket_count += 1
                elif char == ']':
                    bracket_count -= 1
                elif char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                
                if bracket_count == 0 and brace_count == 0 and i > 0:
                    return text[:i + 1]
        
        return None
    
    def _clean_json_string(self, json_str: str) -> str:
        """Clean JSON string"""
        cleaned = json_str
        # Remove trailing commas
        cleaned = re.sub(r',(\s*[\]}])', r'\1', cleaned)
        # Fix double commas
        cleaned = re.sub(r',,+', ',', cleaned)
        return cleaned
    
    def _aggressive_json_clean(self, json_str: str) -> str:
        """Aggressively clean JSON string"""
        try:
            first_brace = json_str.find('[')
            last_brace = json_str.rfind(']')
            
            if first_brace == -1 or last_brace == -1 or first_brace >= last_brace:
                raise ValueError("No valid array structure found")
            
            cleaned = json_str[first_brace:last_brace + 1]
            cleaned = self._clean_json_string(cleaned)
            return cleaned
        except Exception as e:
            print(f"Aggressive JSON clean failed: {e}")
            return json_str
    
    def _parse_questions_from_text(
        self,
        text: str,
        difficulty: Literal["Easy", "Normal", "Hard", "Master"]
    ) -> List[Dict[str, Any]]:
        """Parse questions from text format (fallback)"""
        questions = []
        question_blocks = re.split(r'\n\s*(?=\d+\.|\*\*|\#)', text)
        
        for index, block in enumerate(question_blocks):
            lines = [line.strip() for line in block.split('\n') if line.strip()]
            if len(lines) < 3:
                continue
            
            question_text = re.sub(r'^\d+\.\s*', '', lines[0]).replace('**', '').strip()
            options = []
            correct_answer = ""
            explanation = ""
            
            for line in lines[1:]:
                line = line.strip()
                if re.match(r'^[A-D][\.\)]\s*', line):
                    option = re.sub(r'^[A-D][\.\)]\s*', '', line).strip()
                    options.append(option)
                    if '*' in line or 'correct' in line.lower():
                        correct_answer = option.replace('*', '').strip()
                elif 'answer:' in line.lower() or 'correct:' in line.lower():
                    match = re.search(r'(?:answer|correct):\s*(.+)', line, re.IGNORECASE)
                    if match:
                        correct_answer = match.group(1).strip()
                elif 'explanation:' in line.lower():
                    explanation = re.sub(r'explanation:\s*', '', line, flags=re.IGNORECASE).strip()
            
            if question_text and len(options) >= 2 and correct_answer:
                # Ensure we have 4 options
                while len(options) < 4:
                    options.append(f"Option {chr(68 + len(options))}")
                
                questions.append({
                    "id": f"q-{int(datetime.now().timestamp() * 1000)}-{index}",
                    "text": question_text,
                    "options": options[:4],
                    "correctAnswer": correct_answer or options[0],
                    "difficulty": difficulty,
                    "explanation": explanation or None,
                    "codeSnippet": None,
                    "imageReference": None
                })
        
        return questions
    
    async def _generate_additional_questions(
        self,
        content: str,
        difficulty: DifficultyLevel,
        count: int,
        existing_questions: List[Dict],
        context: AgentContext
    ) -> List[Dict[str, Any]]:
        """Generate additional questions"""
        existing_texts = "\n".join([f"{i + 1}. {q.get('text', '')}" for i, q in enumerate(existing_questions)])
        prompt = self._build_quiz_generation_prompt(content, difficulty, count)
        
        enhanced_prompt = f"""{prompt}

🚨 CRITICAL: You have already generated {len(existing_questions)} questions. You MUST now generate EXACTLY {count} ADDITIONAL, UNIQUE questions that are DIFFERENT from these existing ones.

Existing questions (DO NOT REPEAT THESE):
{existing_texts}

**MANDATORY REQUIREMENTS**: 
- Generate EXACTLY {count} questions - no more, no less
- Do NOT repeat or rephrase the existing questions above
- Generate {count} completely NEW questions covering different aspects
- Ensure all {count} questions are unique and different from the existing ones
- Follow the same format and difficulty level ({difficulty})
- Count your questions before submitting - you MUST submit exactly {count} questions

{ANSWER_VERIFICATION_INSTRUCTIONS}"""
        
        try:
            print(f"🔄 Generating {count} additional questions...")
            generated_text = await self._call_agent(enhanced_prompt, context.metadata)
            
            difficulty_mapping = {"easy": "Easy", "medium": "Normal", "hard": "Hard"}
            mapped_difficulty = difficulty_mapping.get(difficulty, "Normal")
            
            additional_questions = []
            if isinstance(generated_text, str):
                additional_questions = self._parse_questions(generated_text, mapped_difficulty)
            elif isinstance(generated_text, list):
                additional_questions = self._parse_questions_from_list(generated_text, mapped_difficulty)
            
            # Filter out duplicates by checking question text similarity
            unique_questions = []
            for new_q in additional_questions:
                is_duplicate = False
                for existing_q in existing_questions:
                    similarity = self._calculate_text_similarity(new_q.get("text", ""), existing_q.get("text", ""))
                    if similarity > 0.8:
                        is_duplicate = True
                        break
                if not is_duplicate:
                    unique_questions.append(new_q)
            
            print(f"✅ Generated {len(additional_questions)} additional questions, {len(unique_questions)} are unique")
            return unique_questions
        except Exception as e:
            print(f"❌ Failed to generate additional questions: {e}")
            return []
    
    def _calculate_text_similarity(self, text1: str, text2: str) -> float:
        """Calculate text similarity"""
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        intersection = words1 & words2
        union = words1 | words2
        
        return len(intersection) / len(union) if union else 0.0
