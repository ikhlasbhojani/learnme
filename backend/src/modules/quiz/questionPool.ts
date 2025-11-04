import { randomUUID } from 'crypto'
import type { IQuizQuestion, QuizDifficulty } from './quiz.model'

type QuestionPool = Record<QuizDifficulty, IQuizQuestion[]>

export const QUESTION_POOL: QuestionPool = {
  Easy: [
    {
      id: 'easy-1',
      text: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 'Paris',
      difficulty: 'Easy',
      explanation: null,
    },
    {
      id: 'easy-2',
      text: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      difficulty: 'Easy',
      explanation: null,
    },
    {
      id: 'easy-3',
      text: 'Which planet is closest to the Sun?',
      options: ['Venus', 'Mercury', 'Earth', 'Mars'],
      correctAnswer: 'Mercury',
      difficulty: 'Easy',
      explanation: null,
    },
    {
      id: 'easy-4',
      text: 'What is the largest ocean on Earth?',
      options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
      correctAnswer: 'Pacific',
      difficulty: 'Easy',
      explanation: null,
    },
    {
      id: 'easy-5',
      text: 'How many continents are there?',
      options: ['5', '6', '7', '8'],
      correctAnswer: '7',
      difficulty: 'Easy',
      explanation: null,
    },
  ],
  Normal: [
    {
      id: 'normal-1',
      text: 'What is the chemical symbol for gold?',
      options: ['Go', 'Gd', 'Au', 'Ag'],
      correctAnswer: 'Au',
      difficulty: 'Normal',
      explanation: null,
    },
    {
      id: 'normal-2',
      text: 'Who wrote "Romeo and Juliet"?',
      options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
      correctAnswer: 'William Shakespeare',
      difficulty: 'Normal',
      explanation: null,
    },
    {
      id: 'normal-3',
      text: 'What is the speed of light in vacuum (approximately)?',
      options: ['300,000 km/s', '150,000 km/s', '450,000 km/s', '600,000 km/s'],
      correctAnswer: '300,000 km/s',
      difficulty: 'Normal',
      explanation: null,
    },
    {
      id: 'normal-4',
      text: 'Which programming language is known for web development?',
      options: ['Python', 'JavaScript', 'C++', 'Java'],
      correctAnswer: 'JavaScript',
      difficulty: 'Normal',
      explanation: null,
    },
    {
      id: 'normal-5',
      text: 'What is the largest mammal in the world?',
      options: ['Elephant', 'Blue Whale', 'Giraffe', 'Polar Bear'],
      correctAnswer: 'Blue Whale',
      difficulty: 'Normal',
      explanation: null,
    },
  ],
  Hard: [
    {
      id: 'hard-1',
      text: 'What is the time complexity of binary search?',
      options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
      correctAnswer: 'O(log n)',
      difficulty: 'Hard',
      explanation: null,
    },
    {
      id: 'hard-2',
      text: 'What is the primary function of the mitochondria?',
      options: ['Protein synthesis', 'Energy production (ATP)', 'DNA replication', 'Waste removal'],
      correctAnswer: 'Energy production (ATP)',
      difficulty: 'Hard',
      explanation: null,
    },
    {
      id: 'hard-3',
      text: 'Which algorithm is used for finding the shortest path in a graph?',
      options: ['BFS', "Dijkstra's", 'DFS', 'A*'],
      correctAnswer: "Dijkstra's",
      difficulty: 'Hard',
      explanation: null,
    },
    {
      id: 'hard-4',
      text: 'What is the Heisenberg Uncertainty Principle?',
      options: [
        'Energy cannot be created or destroyed',
        'Position and momentum cannot be precisely measured simultaneously',
        'Light behaves as both wave and particle',
        'Matter and energy are equivalent',
      ],
      correctAnswer: 'Position and momentum cannot be precisely measured simultaneously',
      difficulty: 'Hard',
      explanation: null,
    },
    {
      id: 'hard-5',
      text: 'What is the derivative of e^x?',
      options: ['x * e^x', 'e^x', 'ln(x)', '1/x'],
      correctAnswer: 'e^x',
      difficulty: 'Hard',
      explanation: null,
    },
  ],
  Master: [
    {
      id: 'master-1',
      text: 'What is the time complexity of matrix multiplication using Strassen algorithm?',
      options: ['O(n^3)', 'O(n^2.81)', 'O(n^2)', 'O(n log n)'],
      correctAnswer: 'O(n^2.81)',
      difficulty: 'Master',
      explanation: null,
    },
    {
      id: 'master-2',
      text: 'What is the Riemann Hypothesis about?',
      options: [
        'Prime number distribution',
        'Zeros of the Riemann zeta function',
        "Fermat's Last Theorem",
        'Goldbach Conjecture',
      ],
      correctAnswer: 'Zeros of the Riemann zeta function',
      difficulty: 'Master',
      explanation: null,
    },
    {
      id: 'master-3',
      text: 'What is quantum entanglement?',
      options: [
        'Particles sharing the same quantum state regardless of distance',
        'Particles colliding at high speeds',
        'Particles decaying into smaller particles',
        'Particles absorbing photons',
      ],
      correctAnswer: 'Particles sharing the same quantum state regardless of distance',
      difficulty: 'Master',
      explanation: null,
    },
    {
      id: 'master-4',
      text: 'What is the P vs NP problem?',
      options: [
        'Whether polynomial time equals non-deterministic polynomial time',
        'Whether parallel computing equals sequential computing',
        'Whether quantum computing equals classical computing',
        'Whether distributed computing equals centralized computing',
      ],
      correctAnswer: 'Whether polynomial time equals non-deterministic polynomial time',
      difficulty: 'Master',
      explanation: null,
    },
    {
      id: 'master-5',
      text: 'What is the concept of "dark matter" in cosmology?',
      options: [
        'Matter that emits no light but affects gravitational forces',
        'Matter that absorbs all light',
        'Matter that exists in parallel dimensions',
        'Matter that is composed entirely of photons',
      ],
      correctAnswer: 'Matter that emits no light but affects gravitational forces',
      difficulty: 'Master',
      explanation: null,
    },
  ],
}

export function pickQuestions(
  difficulty: QuizDifficulty,
  numberOfQuestions: number
): IQuizQuestion[] {
  const pool = QUESTION_POOL[difficulty]
  const questions: IQuizQuestion[] = []

  for (let i = 0; i < numberOfQuestions; i += 1) {
    const question = pool[i % pool.length]
    questions.push({ ...question, id: `${question.id}-${randomUUID()}` })
  }

  return questions
}

