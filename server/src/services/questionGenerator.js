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
    () => ({
      questionText: 'What is the correct syntax to declare a pointer to an integer in C?',
      correct: 'int *ptr;',
      distractors: ['int ptr*;', 'pointer int ptr;', 'int &ptr;'],
    }),
    () => ({
      questionText: 'Which function is used to allocate memory dynamically in C?',
      correct: 'malloc()',
      distractors: ['alloc()', 'memalloc()', 'new()'],
    }),
    () => ({
      questionText: 'What is the format specifier for a double data type in C?',
      correct: '%lf',
      distractors: ['%d', '%f', '%x'],
    }),
    () => ({
      questionText: 'How do you access the value stored at a pointer address?',
      correct: 'Using the * operator (*ptr)',
      distractors: ['Using the & operator (&ptr)', 'Using the -> operator', 'Using the @ operator'],
    }),
  ],
  intermediate: [
    () => ({
      questionText: 'What is the difference between malloc() and calloc()?',
      correct: 'calloc() initializes the allocated memory to zero, while malloc() does not.',
      distractors: [
        'malloc() allocates memory from the heap, calloc() from the stack',
        'malloc() takes two arguments, calloc() takes one',
        'There is no difference, they are aliases',
      ],
    }),
    () => ({
      questionText: 'What will happen if you free() a pointer twice in C?',
      correct: 'Undefined behavior, often resulting in a segmentation fault or memory corruption.',
      distractors: [
        'The second free() is ignored by the OS',
        'It returns a null pointer',
        'It reallocates the memory',
      ],
    }),
    () => ({
      questionText: 'Which operator is used to access members of a structure through a pointer?',
      correct: '-> (arrow operator)',
      distractors: ['. (dot operator)', '* (dereference operator)', '& (address operator)'],
    }),
  ],
  advanced: [
    () => ({
      questionText: 'What is the purpose of the restrict keyword in C99?',
      correct: 'It hints to the compiler that for the lifetime of the pointer, only it or a value directly derived from it will be used to access the object to which it points.',
      distractors: [
        'It prevents the pointer from being modified',
        'It restricts the pointer to memory within the current stack frame',
        'It prevents multiple threads from accessing the pointer concurrently',
      ],
    }),
    () => ({
      questionText: 'How is a union different from a struct in C?',
      correct: 'In a union, all members share the same memory location, while in a struct, each member has its own memory location.',
      distractors: [
        'Unions can only contain basic data types',
        'Structs are dynamically allocated, unions are statically allocated',
        'There is no difference, unions are just a typedef of structs',
      ],
    }),
    () => ({
      questionText: 'What is a memory leak in C?',
      correct: 'Failing to deallocate dynamically allocated memory using free() when it is no longer needed.',
      distractors: [
        'Writing past the bounds of an array',
        'Accessing memory that has already been freed',
        'A segmentation fault caused by a null pointer dereference',
      ],
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
      model: 'gemini-3.6-flash',
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
        `INSERT INTO question_bank (id, course_id, difficulty, question_text, option_a, option_b, option_c, option_d, correct_option)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [q.id, q.courseId, q.difficulty, q.questionText, q.optionA, q.optionB, q.optionC, q.optionD, q.correctOption]
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
        `INSERT INTO question_bank (id, course_id, difficulty, question_text, option_a, option_b, option_c, option_d, correct_option)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [q.id, q.courseId, q.difficulty, q.questionText, q.optionA, q.optionB, q.optionC, q.optionD, q.correctOption]
      );
    } catch (err) {
      console.error('Failed to persist periodic question:', err.message);
    }
  }

  return generated;
}
