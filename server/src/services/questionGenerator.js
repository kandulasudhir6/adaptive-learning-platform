import crypto from 'node:crypto';
import pool from '../config/db.js';

// ---------------------------------------------------------------------------
// STATIC FALLBACK QUESTION BANK (used when Gemini is unavailable)
// ---------------------------------------------------------------------------
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const staticGenerators = {
  beginner: [
    () => {
      const step = randomChoice([2, 3, 4]);
      return {
        questionText: `What is the time complexity of: for(let i=1; i<n; i*=${step}) { count++; }`,
        correct: `O(log n)`,
        distractors: ['O(n)', 'O(n²)', 'O(1)'],
      };
    },
    () => ({
      questionText: 'Which data structure uses LIFO (Last In, First Out) order?',
      correct: 'Stack',
      distractors: ['Queue', 'Linked List', 'Binary Tree'],
    }),
    () => ({
      questionText: 'What is the worst-case time complexity of Binary Search on a sorted array of n elements?',
      correct: 'O(log n)',
      distractors: ['O(n)', 'O(n log n)', 'O(1)'],
    }),
    () => {
      const size = randomChoice([16, 32, 64]);
      return {
        questionText: `In a sorted array of ${size} elements, what is the maximum number of comparisons Binary Search makes?`,
        correct: `${Math.ceil(Math.log2(size)) + 1}`,
        distractors: [`${size / 2}`, `${size}`, `${Math.ceil(Math.log2(size))}`],
      };
    },
    () => ({
      questionText: 'Which sorting algorithm has O(n log n) average-case complexity?',
      correct: 'Merge Sort',
      distractors: ['Bubble Sort', 'Insertion Sort', 'Selection Sort'],
    }),
    () => ({
      questionText: 'What does O(1) space complexity mean?',
      correct: 'The algorithm uses a fixed amount of memory regardless of input size',
      distractors: [
        'The algorithm runs in constant time',
        'The algorithm never allocates memory',
        'The algorithm uses O(n) memory in best case',
      ],
    }),
    () => ({
      questionText: 'In a Queue (FIFO), which operation removes an element?',
      correct: 'Dequeue (from front)',
      distractors: ['Pop (from top)', 'Delete (from back)', 'Shift (from tail)'],
    }),
  ],
  intermediate: [
    () => ({
      questionText: "Why does Floyd's Cycle Detection (Tortoise and Hare) work for detecting cycles in linked lists?",
      correct: 'The fast pointer catches up to the slow pointer within the cycle at rate of 1 node per step',
      distractors: [
        'The fast pointer hashes node addresses to a set',
        'Both pointers reset to head after C steps',
        'The slow pointer marks visited nodes with a flag',
      ],
    }),
    () => ({
      questionText: 'Which tree traversal produces a sorted sequence from a Binary Search Tree?',
      correct: 'In-Order (Left → Root → Right)',
      distractors: ['Pre-Order (Root → Left → Right)', 'Post-Order (Left → Right → Root)', 'Level-Order (BFS)'],
    }),
    () => {
      const leftH = randomInt(2, 4);
      const rightH = leftH + 2;
      return {
        questionText: `An AVL tree node has left subtree height ${leftH} and right subtree height ${rightH}. What is its balance factor and does it need rebalancing?`,
        correct: `Balance factor = ${leftH - rightH}; rotation required`,
        distractors: [
          `Balance factor = 0; no rotation`,
          `Balance factor = ${rightH - leftH}; no rotation`,
          `Balance factor = ${leftH - rightH}; no rotation`,
        ],
      };
    },
    () => ({
      questionText: 'Why is QuickSort typically preferred over MergeSort for arrays in practice?',
      correct: 'QuickSort has better cache locality and lower constant factors despite the same average O(n log n)',
      distractors: [
        'QuickSort is always O(n log n) even in the worst case',
        'MergeSort cannot handle duplicate elements',
        'QuickSort requires O(n) extra memory',
      ],
    }),
    () => {
      const idx = randomChoice([3, 4, 5]);
      return {
        questionText: `In a 0-indexed binary heap array, what are the parent and left child indices for node at index ${idx}?`,
        correct: `Parent: ${Math.floor((idx - 1) / 2)}, Left Child: ${2 * idx + 1}`,
        distractors: [
          `Parent: ${idx - 1}, Left Child: ${idx + 1}`,
          `Parent: ${Math.floor(idx / 2)}, Left Child: ${2 * idx}`,
          `Parent: ${Math.floor((idx - 1) / 2)}, Left Child: ${2 * idx + 2}`,
        ],
      };
    },
    () => ({
      questionText: 'What is the time complexity of inserting a key into a Hash Table with a good hash function (average case)?',
      correct: 'O(1)',
      distractors: ['O(log n)', 'O(n)', 'O(n log n)'],
    }),
  ],
  advanced: [
    () => ({
      questionText: 'Why does Dijkstra\'s algorithm fail on graphs with negative edge weights?',
      correct: "It assumes a node's shortest distance is finalized once extracted from the priority queue, which negative weights can invalidate",
      distractors: [
        'It converts negative weights to positive values causing overflow',
        'It only works on directed acyclic graphs',
        'Negative weights cause the priority queue to throw exceptions',
      ],
    }),
    () => {
      const capacity = randomInt(10, 30);
      return {
        questionText: `In the 0/1 Knapsack Problem with capacity W=${capacity}, what does dp[i][w] represent?`,
        correct: 'Maximum value achievable using the first i items with weight limit w',
        distractors: [
          'Minimum weight to achieve value i',
          'Number of permutations summing to w',
          'Greedy ratio of item i to weight w',
        ],
      };
    },
    () => ({
      questionText: 'What enables DSU (Disjoint Set Union) with path compression and union by rank to achieve O(α(n)) amortized per-operation?',
      correct: 'Path compression flattens tree depth and union by rank prevents tree skewing, keeping height nearly constant',
      distractors: [
        'It uses a balanced BST internally for set membership',
        'It stores all elements contiguously in L1 cache',
        'It hashes set identifiers for O(1) lookup',
      ],
    }),
    () => ({
      questionText: "In A* search, what happens if the heuristic function h(n) is NOT admissible (overestimates true cost)?",
      correct: 'A* is no longer guaranteed to find the optimal path',
      distractors: [
        'A* enters an infinite loop',
        'A* degenerates to BFS',
        'A* runs in O(n!) time',
      ],
    }),
    () => ({
      questionText: 'What is the ABA problem in lock-free concurrent programming with Compare-And-Swap (CAS)?',
      correct: 'A value changes A→B→A between a read and CAS, causing the CAS to succeed despite unobserved intermediate mutations',
      distractors: [
        'Two threads acquire the same mutex causing deadlock',
        'Unaligned memory access causes segmentation fault',
        'Memory addresses wrap around during allocation',
      ],
    }),
    () => ({
      questionText: 'In consistent hashing with N nodes, what fraction of keys must be remapped on average when 1 node is removed?',
      correct: '1/N of all keys',
      distractors: ['All keys (100%)', '50% of keys', '0 keys'],
    }),
  ],
};

// ---------------------------------------------------------------------------
// GEMINI AI QUESTION GENERATION
// ---------------------------------------------------------------------------
async function generateWithGemini(courseTitle, difficulty, count) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log('GEMINI_API_KEY not set, using static questions');
      return null;
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const difficultyGuide = {
      beginner: 'fundamental concepts, basic syntax, core principles, and introductory topics related to the course',
      intermediate: 'intermediate concepts, standard algorithms, memory management, object-oriented or functional patterns depending on the language/course, and practical problem-solving',
      advanced: 'advanced architecture, system-level concepts, concurrency, performance optimization, and highly complex language-specific or topic-specific features',
    };

    const prompt = `You are an expert computer science educator creating a ${difficulty}-level exam for a course on "${courseTitle}".

If the course is about C Programming, topics MUST strictly include: C syntax, control statements, functions, arrays, strings, pointers, dynamic memory management (malloc, calloc, realloc, free), structs, unions, preprocessors/macros, and file I/O.

Generate exactly ${count} multiple-choice questions about ${difficultyGuide[difficulty]}.

Requirements:
- Questions must be technical, specific, and unambiguous
- Each question must have exactly 4 options labeled A, B, C, D
- Exactly ONE correct answer per question
- Wrong answers (distractors) must be plausible but clearly incorrect
- No repeated questions
- Questions should vary in topic within the ${difficulty} tier
- IMPORTANT: Make these questions highly unique, cover niche areas, and be different from standard textbook questions. (Random Variation Seed: ${Math.random()})

Respond with ONLY a valid JSON array (no markdown, no explanation):
[
  {
    "questionText": "The full question text here",
    "optionA": "First option",
    "optionB": "Second option",
    "optionC": "Third option",
    "optionD": "Fourth option",
    "correctOption": "A"
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: { 
        temperature: 0.7, 
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    });

    const raw = response.text?.trim() || '';
    // Strip markdown code fences if present
    const jsonText = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(jsonText);

    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    return parsed.slice(0, count).map((q) => ({
      id: crypto.randomUUID(),
      difficulty,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: (q.correctOption || 'A').toUpperCase(),
    }));
  } catch (err) {
    console.error('Gemini question generation failed, falling back to static:', err.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// STATIC FALLBACK GENERATOR
// ---------------------------------------------------------------------------
function generateStaticQuestion(difficulty, courseId, moduleId = null) {
  const generators = staticGenerators[difficulty] || staticGenerators.beginner;
  const gen = randomChoice(generators);
  const { questionText, correct, distractors } = gen();

  const allOptions = shuffleArray([correct, ...distractors.slice(0, 3)]);
  const correctIndex = allOptions.indexOf(correct);
  const letters = ['A', 'B', 'C', 'D'];

  return {
    id: crypto.randomUUID(),
    courseId,
    moduleId,
    difficulty,
    questionText,
    optionA: allOptions[0],
    optionB: allOptions[1],
    optionC: allOptions[2],
    optionD: allOptions[3],
    correctOption: letters[correctIndex],
  };
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/**
 * Generate a single question (used for periodic exams)
 */
export function generateQuestion(difficulty, courseId, moduleId = null) {
  return generateStaticQuestion(difficulty, courseId, moduleId);
}

/**
 * Generate 15 dynamic questions for the Entrance Exam
 * Tries Gemini AI first, falls back to static generators
 */
export async function generateDynamicEntranceQuestions(courseId) {
  // Get course title for Gemini context
  let courseTitle = 'Computer Science and Data Structures';
  try {
    const courseRes = await pool.query('SELECT title FROM courses WHERE id = $1', [courseId]);
    if (courseRes.rows.length > 0) courseTitle = courseRes.rows[0].title;
  } catch (_) {}

  const tiers = [
    { difficulty: 'beginner', count: 5 },
    { difficulty: 'intermediate', count: 5 },
    { difficulty: 'advanced', count: 5 },
  ];

  const generated = [];

  for (const { difficulty, count } of tiers) {
    // Try AI generation first
    const aiQuestions = await generateWithGemini(courseTitle, difficulty, count);

    if (aiQuestions && aiQuestions.length >= count) {
      // AI generated — add courseId
      aiQuestions.slice(0, count).forEach((q) => {
        generated.push({ ...q, courseId, moduleId: null });
      });
      console.log(`✅ Gemini generated ${count} ${difficulty} questions for "${courseTitle}"`);
    } else {
      // Static fallback
      for (let i = 0; i < count; i++) {
        generated.push(generateStaticQuestion(difficulty, courseId));
      }
      console.log(`📚 Static fallback: ${count} ${difficulty} questions`);
    }
  }

  // Persist all 15 questions into question_bank
  for (const q of generated) {
    try {
      await pool.query(
        `INSERT INTO question_bank (id, course_id, module_id, difficulty, question_text, option_a, option_b, option_c, option_d, correct_option)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [q.id, q.courseId, q.moduleId, q.difficulty, q.questionText, q.optionA, q.optionB, q.optionC, q.optionD, q.correctOption]
      );
    } catch (err) {
      console.error('Failed to persist question:', err.message);
    }
  }

  return generated;
}

/**
 * Generate dynamic questions for periodic module evaluation
 */
export async function generateDynamicPeriodicQuestions(courseId, moduleId, difficulty, count = 5) {
  let courseTitle = 'Computer Science';
  try {
    const courseRes = await pool.query('SELECT title FROM courses WHERE id = $1', [courseId]);
    if (courseRes.rows.length > 0) courseTitle = courseRes.rows[0].title;
  } catch (_) {}

  const aiQuestions = await generateWithGemini(courseTitle, difficulty, count);
  const generated = [];

  if (aiQuestions && aiQuestions.length >= count) {
    aiQuestions.slice(0, count).forEach((q) => {
      generated.push({ ...q, courseId, moduleId });
    });
  } else {
    for (let i = 0; i < count; i++) {
      generated.push(generateStaticQuestion(difficulty, courseId, moduleId));
    }
  }

  for (const q of generated) {
    try {
      await pool.query(
        `INSERT INTO question_bank (id, course_id, module_id, difficulty, question_text, option_a, option_b, option_c, option_d, correct_option)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [q.id, q.courseId, q.moduleId, q.difficulty, q.questionText, q.optionA, q.optionB, q.optionC, q.optionD, q.correctOption]
      );
    } catch (err) {
      console.error('Failed to persist periodic question:', err.message);
    }
  }

  return generated;
}
