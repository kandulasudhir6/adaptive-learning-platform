import crypto from 'node:crypto';
import pool from '../config/db.js';

// Random helper utilities
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

/**
 * Question generator templates across Beginner, Intermediate, and Advanced tiers
 */
const dynamicGenerators = {
  // ==========================================
  // BEGINNER TIER DYNAMIC QUESTION GENERATORS
  // ==========================================
  beginner: [
    // 1. Dynamic Loop Complexity
    () => {
      const step = randomChoice([2, 3, 4]);
      const varName = randomChoice(['i', 'k', 'idx']);
      const questionText = `Analyze the time complexity of the following code snippet:\n\`\`\`javascript\nlet count = 0;\nfor (let ${varName} = 1; ${varName} < n; ${varName} *= ${step}) {\n  count += ${varName};\n}\n\`\`\`\nWhat is the asymptotic Big-O execution time?`;
      const correct = `O(log_${step} n) or O(log n)`;
      const distractors = ['O(n)', 'O(n log n)', 'O(1)'];
      return { questionText, correct, distractors };
    },
    // 2. Nested Loop Complexity
    () => {
      const outerVar = 'i';
      const innerVar = 'j';
      const questionText = `What is the worst-case time complexity of this nested traversal?\n\`\`\`javascript\nfor (let ${outerVar} = 0; ${outerVar} < n; ${outerVar}++) {\n  for (let ${innerVar} = ${outerVar}; ${innerVar} < n; ${innerVar}++) {\n    performConstantWork(${outerVar}, ${innerVar});\n  }\n}\n\`\`\``;
      const correct = 'O(n^2)';
      const distractors = ['O(n)', 'O(n log n)', 'O(2^n)'];
      return { questionText, correct, distractors };
    },
    // 3. Dynamic Array Resizing Calculation
    () => {
      const initialCap = randomChoice([2, 4, 8]);
      const pushCount = initialCap * 3 + randomInt(1, 3);
      // Calculate capacity: doubles when full
      let cap = initialCap;
      while (cap < pushCount) {
        cap *= 2;
      }
      const questionText = `A dynamic array starts with an initial capacity of ${initialCap} and doubles its capacity whenever it is saturated. If you push ${pushCount} elements into an initially empty array, what is its final allocated capacity?`;
      const correct = `${cap}`;
      const distractors = [`${cap / 2}`, `${pushCount}`, `${cap * 2}`];
      return { questionText, correct, distractors };
    },
    // 4. Binary Search Step Calculation
    () => {
      const size = randomChoice([16, 32, 64, 128, 256]);
      const maxSteps = Math.ceil(Math.log2(size));
      const questionText = `In a sorted array containing exactly ${size} distinct elements, what is the maximum number of comparisons required by standard Binary Search in the worst case?`;
      const correct = `${maxSteps + 1} (or ${maxSteps} comparisons)`;
      const distractors = [`${size / 2}`, `${size}`, `${maxSteps * 2}`];
      return { questionText, correct, distractors };
    },
    // 5. Contiguous Memory vs Node References
    () => {
      const structure = randomChoice(['Array', 'Singly Linked List']);
      const isArray = structure === 'Array';
      const questionText = `Which of the following operations is O(1) in a standard ${structure}?`;
      const correct = isArray
        ? 'Direct element access by index (e.g., arr[i])'
        : 'Inserting a new node at the head pointer';
      const distractors = isArray
        ? [
            'Inserting an element at index 0 in an array of size n without pre-allocated buffer',
            'Searching for an arbitrary value in an unsorted array',
            'Deleting an element from the middle of the array without leaving gaps',
          ]
        : [
            'Accessing the k-th node by integer index from the head',
            'Binary search on the elements',
            'Deleting the last node with only a head pointer',
          ];
      return { questionText, correct, distractors };
    },
    // 6. Stack & Queue FIFO/LIFO Sequence
    () => {
      const nums = [randomInt(10, 20), randomInt(21, 30), randomInt(31, 40)];
      const questionText = `The values [${nums.join(', ')}] are pushed onto an empty Stack in that order. One element is popped, then value ${randomInt(50, 60)} is pushed. Finally, two elements are popped. Which element was popped FIRST?`;
      const correct = `${nums[2]}`;
      const distractors = [`${nums[0]}`, `${nums[1]}`, 'The stack is empty'];
      return { questionText, correct, distractors };
    },
    // 7. Amortized Analysis Concept
    () => {
      const questionText = `Why is the append (push) operation in a dynamic array classified as O(1) amortized, even though individual resizes require O(n) element copies?`;
      const correct = 'Expensive O(n) doubling operations occur so infrequently that the average cost per operation is constant';
      const distractors = [
        'Memory allocation hardware never performs physical copies',
        'Dynamic arrays use linked pointers under the hood',
        'The operating system ignores the time spent during heap reallocations',
      ];
      return { questionText, correct, distractors };
    },
  ],

  // ===============================================
  // INTERMEDIATE TIER DYNAMIC QUESTION GENERATORS
  // ===============================================
  intermediate: [
    // 1. Linked List Cycle Detection
    () => {
      const fastSpeed = 2;
      const slowSpeed = 1;
      const questionText = `In Floyd's Cycle-Finding Algorithm (Tortoise and Hare), the slow pointer advances 1 node per step while the fast pointer advances ${fastSpeed} nodes per step. If a linked list has a cycle of length C, what guarantees that the two pointers will meet?`;
      const correct = 'The distance between fast and slow decreases by 1 in modulo C at each step';
      const distractors = [
        'The fast pointer resets to the head whenever it reaches the cycle tail',
        'Both pointers hash node memory addresses into an auxiliary table',
        'The cycle length is always a prime number',
      ];
      return { questionText, correct, distractors };
    },
    // 2. Binary Search Tree In-Order & Height
    () => {
      const keys = [10, 5, 15, 2, 7, 12, 20].sort(() => Math.random() - 0.5);
      const questionText = `Suppose the following integer keys are inserted in order into an initially empty Binary Search Tree (BST): [${keys.join(', ')}]. Which traversal sequence is GUARANTEED to produce the keys in strictly increasing order?`;
      const correct = 'In-Order Traversal (Left -> Root -> Right)';
      const distractors = [
        'Pre-Order Traversal (Root -> Left -> Right)',
        'Post-Order Traversal (Left -> Right -> Root)',
        'Level-Order Traversal (BFS Breadth-First)',
      ];
      return { questionText, correct, distractors };
    },
    // 3. Monotonic Stack Next Greater Element
    () => {
      const arr = [2, 1, 5, 3, 6];
      const target = 5;
      const nextGreater = 6;
      const questionText = `Using a Monotonic Decreasing Stack on the sequence [${arr.join(', ')}], what is the "Next Greater Element" to the right for the number ${target}?`;
      const correct = `${nextGreater}`;
      const distractors = ['3', '2', '-1 (No greater element)'];
      return { questionText, correct, distractors };
    },
    // 4. AVL Tree Balance Factor Calculation
    () => {
      const leftH = randomInt(2, 4);
      const rightH = leftH + 2;
      const balanceFactor = leftH - rightH;
      const questionText = `In an AVL Tree node N, the height of the left subtree is ${leftH} and the height of the right subtree is ${rightH}. What is the balance factor of node N, and does it require rebalancing?`;
      const correct = `Balance Factor = ${balanceFactor}; Rebalancing (Rotation) is REQUIRED`;
      const distractors = [
        `Balance Factor = ${balanceFactor}; No rotation required (within [-1, 1])`,
        `Balance Factor = 0; The tree is perfectly balanced`,
        `Balance Factor = +${Math.abs(balanceFactor)}; Left rotation is prohibited`,
      ];
      return { questionText, correct, distractors };
    },
    // 5. MergeSort vs QuickSort Space/Time Invariant
    () => {
      const questionText = `Why is standard MergeSort preferred over standard QuickSort for sorting linked lists?`;
      const correct = 'MergeSort does not require random access memory indexing and can merge linked nodes with O(1) extra space';
      const distractors = [
        'QuickSort is asymptotically O(n^3) on linked lists',
        'MergeSort requires no pointer comparisons',
        'Linked lists cannot have pivot elements chosen',
      ];
      return { questionText, correct, distractors };
    },
    // 6. Heap Array Index Formula
    () => {
      const idx = randomChoice([3, 4, 5, 6]);
      const parentIdx = Math.floor((idx - 1) / 2);
      const leftChild = 2 * idx + 1;
      const rightChild = 2 * idx + 2;
      const questionText = `In a 0-indexed binary heap array representation, what are the parent and left child indices for a node residing at index ${idx}?`;
      const correct = `Parent: ${parentIdx}, Left Child: ${leftChild}`;
      const distractors = [
        `Parent: ${idx - 1}, Left Child: ${idx + 1}`,
        `Parent: ${Math.floor(idx / 2)}, Left Child: ${2 * idx}`,
        `Parent: ${parentIdx + 1}, Left Child: ${rightChild}`,
      ];
      return { questionText, correct, distractors };
    },
  ],

  // ===========================================
  // ADVANCED TIER DYNAMIC QUESTION GENERATORS
  // ===========================================
  advanced: [
    // 1. Dynamic Programming State Definition
    () => {
      const capacity = randomInt(10, 30);
      const items = randomInt(4, 8);
      const questionText = `In the classic 0/1 Knapsack Problem with ${items} items and total capacity W = ${capacity}, what does the table entry dp[i][w] represent?`;
      const correct = 'The maximum value achievable using a subset of the first i items with a maximum weight limit of w';
      const distractors = [
        'The exact number of permutations that sum up to capacity w',
        'The minimum weight required to achieve value i',
        'The greedy ratio of item i divided by weight w',
      ];
      return { questionText, correct, distractors };
    },
    // 2. Dijkstra vs Bellman-Ford Negative Weights
    () => {
      const questionText = `Why does Dijkstra’s algorithm fail when applied to graphs with negative edge weights, whereas the Bellman-Ford algorithm succeeds?`;
      const correct = 'Dijkstra assumes a vertex’s finalized distance can never decrease upon subsequent edge relaxations, which is violated by negative weights';
      const distractors = [
        'Dijkstra’s algorithm converts all negative numbers to positive NaN values',
        'Bellman-Ford operates exclusively on trees rather than general graphs',
        'Negative edges cause priority queues to throw hardware memory faults',
      ];
      return { questionText, correct, distractors };
    },
    // 3. Disjoint Set Union (DSU) Inverse Ackermann
    () => {
      const questionText = `What enables Disjoint Set Union (Union-Find) with path compression and union by rank to achieve an amortized per-operation complexity of O(α(n))?`;
      const correct = 'Path compression flattens tree depth directly to the root, while union by rank prevents tall tree skewing';
      const distractors = [
        'It converts trees into binary search heaps at each find query',
        'It stores all sets in contiguous L1 CPU cache lines',
        'It eliminates pointer traversals through hardware vectorization',
      ];
      return { questionText, correct, distractors };
    },
    // 4. Consistent Hashing Remapping Ratio
    () => {
      const totalNodes = randomChoice([10, 20, 50, 100]);
      const questionText = `In a distributed caching cluster utilizing Consistent Hashing with ${totalNodes} nodes, if 1 node fails or is removed, what fraction of keys K must be remapped across the remaining cluster on average?`;
      const correct = `Approximately 1/${totalNodes} of keys (K/${totalNodes})`;
      const distractors = [
        `All keys (100% of K)`,
        `Approximately 50% of all keys`,
        `Exactly zero keys`,
      ];
      return { questionText, correct, distractors };
    },
    // 5. A* Heuristic Admissibility & Consistency
    () => {
      const questionText = `In the A* search algorithm, what is the consequence if the heuristic function h(n) is NOT admissible (i.e., it overestimates the true cost to reach the goal)?`;
      const correct = 'The algorithm is no longer guaranteed to return the optimal (shortest) path';
      const distractors = [
        'The algorithm will enter an infinite cycle and fail to terminate',
        'Execution time increases exponentially to O(n!)',
        'The algorithm degenerates into Breadth-First Search (BFS)',
      ];
      return { questionText, correct, distractors };
    },
    // 6. Lock-Free CAS & ABA Problem
    () => {
      const questionText = `In concurrent lock-free programming, what is the "ABA Problem" encountered when using atomic Compare-And-Swap (CAS)?`;
      const correct = 'A memory location is read as value A, changed to B, and restored to A, causing a CAS operation to succeed despite unobserved intermediate state mutations';
      const distractors = [
        'Two threads attempt to acquire the same mutex simultaneously causing deadlock',
        'A thread reads an unaligned 64-bit integer causing memory segmentation faults',
        'Memory addresses wrap around zero during high-throughput allocation',
      ];
      return { questionText, correct, distractors };
    },
  ],
};

/**
 * Procedurally synthesizes a single dynamic question for a difficulty tier
 */
export function generateQuestion(difficulty, courseId, moduleId = null) {
  const tierGenerators = dynamicGenerators[difficulty] || dynamicGenerators.beginner;
  const generator = randomChoice(tierGenerators);
  const { questionText, correct, distractors } = generator();

  // Combine and shuffle options
  const optionLetters = ['A', 'B', 'C', 'D'];
  const allOptions = [correct, ...distractors.slice(0, 3)];
  const shuffledOptions = shuffleArray(allOptions);

  const correctIndex = shuffledOptions.indexOf(correct);
  const correctOptionLetter = optionLetters[correctIndex];

  return {
    id: crypto.randomUUID(),
    courseId,
    moduleId,
    difficulty,
    questionText,
    optionA: shuffledOptions[0],
    optionB: shuffledOptions[1],
    optionC: shuffledOptions[2],
    optionD: shuffledOptions[3],
    correctOption: correctOptionLetter,
  };
}

/**
 * Generate 15 dynamic questions for the Entrance Exam (5 Beginner, 5 Intermediate, 5 Advanced)
 * and persist them to the database question_bank
 */
export async function generateDynamicEntranceQuestions(courseId) {
  const generated = [];

  // Generate 5 Beginner
  for (let i = 0; i < 5; i++) {
    generated.push(generateQuestion('beginner', courseId));
  }
  // Generate 5 Intermediate
  for (let i = 0; i < 5; i++) {
    generated.push(generateQuestion('intermediate', courseId));
  }
  // Generate 5 Advanced
  for (let i = 0; i < 5; i++) {
    generated.push(generateQuestion('advanced', courseId));
  }

  // Persist all 15 generated questions into the question_bank
  for (const q of generated) {
    await pool.query(
      `INSERT INTO question_bank (id, course_id, module_id, difficulty, question_text, option_a, option_b, option_c, option_d, correct_option)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        q.id,
        q.courseId,
        q.moduleId,
        q.difficulty,
        q.questionText,
        q.optionA,
        q.optionB,
        q.optionC,
        q.optionD,
        q.correctOption,
      ]
    );
  }

  return generated;
}

/**
 * Generate dynamic questions for periodic module evaluation (5 questions matching the module difficulty)
 */
export async function generateDynamicPeriodicQuestions(courseId, moduleId, difficulty, count = 5) {
  const generated = [];
  for (let i = 0; i < count; i++) {
    generated.push(generateQuestion(difficulty, courseId, moduleId));
  }

  for (const q of generated) {
    await pool.query(
      `INSERT INTO question_bank (id, course_id, module_id, difficulty, question_text, option_a, option_b, option_c, option_d, correct_option)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        q.id,
        q.courseId,
        q.moduleId,
        q.difficulty,
        q.questionText,
        q.optionA,
        q.optionB,
        q.optionC,
        q.optionD,
        q.correctOption,
      ]
    );
  }

  return generated;
}
