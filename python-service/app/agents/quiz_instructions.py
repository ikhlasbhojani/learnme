"""Quiz generation instructions for different difficulty levels"""

from typing import Literal

DifficultyLevel = Literal["easy", "medium", "hard"]


GENERAL_QUIZ_REQUIREMENTS = """
**GENERAL REQUIREMENTS**:

📊 QUESTION COUNT:
- Generate EXACTLY the requested number of questions
- Count before submitting - array length MUST match request
- If fewer generated, quiz generation FAILS

📚 DOCUMENTATION-ONLY:
- Correct answers MUST be explicitly in the provided documentation
- NO made-up answers or external knowledge
- Verify each answer exists in the content before creating question
- If answer not in docs, create different question instead

📋 QUESTION FORMAT:
- Exactly 4 multiple-choice options (A, B, C, D)
- Clear correct answer from documentation
- Explanation based on docs content
- Diverse coverage, unambiguous, no trick questions
"""

ANSWER_VERIFICATION_INSTRUCTIONS = """
🚨🚨🚨 CRITICAL INSTRUCTION - ANSWER VERIFICATION 🚨🚨🚨

**BEFORE CREATING EACH QUESTION**:
1. Read the content/documentation above carefully
2. Identify the information you want to test
3. **VERIFY** that the correct answer for your question is EXPLICITLY mentioned or can be DIRECTLY derived from the content
4. **ONLY** create the question if the answer exists in the documentation
5. **DO NOT** create questions if you cannot find the answer in the provided content
6. **DO NOT** make assumptions or use external knowledge - use ONLY the content provided above

**REMEMBER**: 
- Every correct answer MUST be found in the content/documentation above
- If an answer is not in the content, DO NOT create that question
- Create alternative questions whose answers ARE in the content
- The quiz tests understanding of the provided documentation, not general knowledge
"""

CODE_BASED_QUESTION_INSTRUCTIONS = """
**CODE-BASED QUESTIONS - Documentation-Driven**:

🔧 REQUIREMENTS:
- Code snippets from documentation examples only (2-6 lines)
- Questions test practical understanding of documented features
- Answers based on documented behavior, NOT assumptions
- Code execution/output must match documentation specifications

📝 QUESTION TYPES:
- Code output analysis based on docs
- Error scenarios documented in the content
- Feature behavior verification
- Logic flow as described in documentation

❌ FORBIDDEN:
- Code not shown in documentation
- Answers contradicting documented behavior
- Made-up scenarios or hypothetical code
- Questions where correct answer isn't in the docs

⚠️ CRITICAL:
- Extract code DIRECTLY from provided documentation
- Correct answers MUST be verifiable from the docs
- No external knowledge or assumptions
- User analyzes code visually (no execution)

🔍 VALIDATION:
- Does this code appear in the documentation?
- Does the correct answer match documented behavior?
- Is this a real scenario from the docs, not hypothetical?

**Code Snippet Rules**:
- Include actual documented code in codeSnippet field
- Properly escape all special characters
- Complete runnable code from documentation
"""

FINAL_REMINDER_INSTRUCTIONS = """
🚨🚨🚨 FINAL ABSOLUTE REQUIREMENT - READ THIS BEFORE SUBMITTING 🚨🚨🚨

BEFORE YOU SUBMIT YOUR RESPONSE:
1. Look at your JSON array
2. Count the number of question objects in the array
3. The count MUST be exactly the requested number
4. If it's not the requested number, ADD or REMOVE questions until it is exactly correct
5. DO NOT submit until you have verified the count is exactly correct

YOUR JSON ARRAY MUST LOOK LIKE THIS:
[
  { question 1 },
  { question 2 },
  ...
  { question N }  ← This must be the Nth question
]

VERIFY YOUR COUNT: Your array.length MUST equal the requested number

Generate the questions now. Remember: EXACTLY the requested number of questions, no more, no less.
"""

EASY_QUIZ_INSTRUCTIONS = """
**EASY DIFFICULTY - Basic Level**

📌 50% Practical + 50% Theory Questions:

🔧 PRACTICAL (50%):
- Basic code (1-2 steps, 2-4 lines max)
- Simple syntax, direct output, basic operations
- Clear code execution questions
- Example: "What is the output of: let x = 5; console.log(x + 2);"

📖 THEORY (50%):
- Basic concepts from documentation only
- Simple definitions, direct explanations
- No complex reasoning required
- Example: "What is [feature] used for according to docs?"

🎯 REQUIREMENTS:
- Straightforward questions with clear answers
- One simple concept per question
- All answers directly from documentation
- No external knowledge or assumptions
- Fundamental understanding only

🚨 CRITICAL: Questions & answers ONLY from provided documentation.
"""

NORMAL_QUIZ_INSTRUCTIONS = """
**NORMAL DIFFICULTY - Proper Understanding Level**

📌 55% Practical + 45% Theory Questions (Slightly Challenging):

🔧 PRACTICAL (55%):
- Multi-step code logic (loops, conditionals, functions combined)
- Code behavior analysis requiring proper understanding
- Realistic scenarios that test feature implementation
- Code snippets: 4-8 lines with meaningful logic
- Questions that require analyzing how features work together

Example: "Analyze this code and determine the final output after execution:"
```
let result = [];
for (let i = 0; i < 3; i++) {
  if (i % 2 === 0) {
    result.push(i * 2);
  }
}
console.log(result);
```
Options test understanding of loop + conditional logic.

📖 THEORY (45%):
- Feature interaction and comparison questions
- "When to use X vs Y" scenarios
- Configuration and setup understanding
- Trade-offs between different approaches
- Real-world application scenarios

Example: "According to the documentation, when would you choose [Feature A] over [Feature B] for handling [specific scenario]?"

🎯 CHALLENGE LEVEL:
- Requires hands-on experience with the features
- Tests practical application, not just memorization
- Questions that make you think "how would I implement this?"
- Not too easy - needs proper feature understanding
- Normal users with experience can solve, beginners struggle
- Answers come directly from documentation context

🚨 CRITICAL: Questions should test if user has PROPERLY WORKED with features, not just read about them.
"""

HARD_QUIZ_INSTRUCTIONS = """
**HARD DIFFICULTY - Extreme Expert Level**

📌 65% Practical + 35% Theory (Out-of-Box Challenging):

🔧 PRACTICAL (65%):
- Complex workflows combining multiple advanced features
- Edge cases that only experienced developers encounter
- Subtle bugs requiring deep understanding
- Real-world problem-solving scenarios
- Code: 8-12 lines with complex logic, async, error handling

Example: "You implemented this workflow but getting intermittent failures. Based on the error pattern and documentation, what's the root cause?"

📖 THEORY (35%):
- Expert-level feature interactions and trade-offs
- "Why does this happen?" deep-dive questions
- Architecture decisions and performance implications
- Advanced configuration scenarios

Example: "Given these conflicting requirements, which combination of features would you choose and why?"

🎯 EXTREME EXPERT REQUIREMENTS:
- Requires building multiple different workflows and testing them
- Deep code analysis and understanding of internal mechanics
- Facing and solving numerous real-world errors
- IQ-level problem solving with documentation context
- Questions that make you think "I've been there, faced this exact issue"
- Answer hidden in documentation but requires expert insight
- No direct answers - requires connecting multiple concepts
- Only solvable by users who've extensively worked with all features

🎭 TRICKY OPTIONS:
- Create 4 options that look very similar to confuse expert users
- Only ONE correct answer based on documentation
- Wrong options should be plausible but incorrect interpretations
- Make experts double-think their understanding

📋 DOCUMENTATION COMPLIANCE:
- Code snippets from documentation examples only (8-12 lines)
- Questions test extreme understanding of documented features
- Answers based on documented behavior, NOT assumptions
- Code execution/output must match documentation specifications
- Extract code DIRECTLY from provided documentation
- Correct answers MUST be verifiable from the docs
- No external knowledge or made-up scenarios

🚨 CRITICAL: Tests if user has BUILT, BROKEN, FIXED, and MASTERED the features through extensive hands-on experience.
"""


def get_quiz_instructions(difficulty: DifficultyLevel) -> str:
    """Get difficulty-specific quiz instructions"""
    if difficulty == "easy":
        return EASY_QUIZ_INSTRUCTIONS
    elif difficulty == "medium":
        return NORMAL_QUIZ_INSTRUCTIONS
    elif difficulty == "hard":
        return HARD_QUIZ_INSTRUCTIONS
    else:
        return NORMAL_QUIZ_INSTRUCTIONS

