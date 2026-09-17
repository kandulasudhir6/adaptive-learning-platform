import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import pool, { initSchema, rawDb } from '../config/db.js';

export async function seedDatabase() {
  console.log('🔄 Initializing database schema...');
  initSchema();

  // Check if already seeded
  const checkUsers = rawDb.prepare('SELECT COUNT(*) as cnt FROM users').get();
  const checkCourses = rawDb.prepare('SELECT COUNT(*) as cnt FROM courses').get();
  if (checkUsers && checkUsers.cnt > 0 && checkCourses && checkCourses.cnt > 0) {
    console.log('Database already contains records. Skipping initial seeding.');
    return;
  }


  console.log('🌱 Seeding initial data for Adaptive Learning Platform...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const users = [
    {
      id: crypto.randomUUID(),
      first_name: 'Sarah',
      last_name: 'Jenkins',
      email: 'prof.sarah@mentor.com',
      password_hash: passwordHash,
      role: 'mentor',
    },
    {
      id: crypto.randomUUID(),
      first_name: 'Robert',
      last_name: 'Vance',
      email: 'dr.jenkins@faculty.com',
      password_hash: passwordHash,
      role: 'faculty',
    },
    {
      id: crypto.randomUUID(),
      first_name: 'Alex',
      last_name: 'Rivera',
      email: 'alex@student.com',
      password_hash: passwordHash,
      role: 'student',
    },
    {
      id: crypto.randomUUID(),
      first_name: 'Maria',
      last_name: 'Chen',
      email: 'maria@student.com',
      password_hash: passwordHash,
      role: 'student',
    },
    {
      id: crypto.randomUUID(),
      first_name: 'Academy',
      last_name: 'Admin',
      email: 'admin@academy.com',
      password_hash: passwordHash,
      role: 'admin',
    },
  ];

  for (const u of users) {
    rawDb.prepare(`
      INSERT OR REPLACE INTO users (id, first_name, last_name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(u.id, u.first_name, u.last_name, u.email, u.password_hash, u.role);
  }

  const mentorId = users[0].id;
  const facultyId = users[1].id;
  const alexId = users[2].id;
  const mariaId = users[3].id;

  // 2. Student Profiles
  // Alex: Fresh student who hasn't taken Entrance Exam
  rawDb.prepare(`
    INSERT OR REPLACE INTO student_profiles (user_id, assigned_mentor_id, assigned_faculty_id, current_level, entrance_completed)
    VALUES (?, ?, ?, 'beginner', 0)
  `).run(alexId, mentorId, facultyId);

  // Maria: Has completed entrance exam, placed in Intermediate
  rawDb.prepare(`
    INSERT OR REPLACE INTO student_profiles (user_id, assigned_mentor_id, assigned_faculty_id, current_level, entrance_completed)
    VALUES (?, ?, ?, 'intermediate', 1)
  `).run(mariaId, mentorId, facultyId);

  // 3. Courses
  const courseCs101Id = crypto.randomUUID();
  const courseWeb201Id = crypto.randomUUID();

  rawDb.prepare(`
    INSERT OR REPLACE INTO courses (id, title, code, description)
    VALUES (?, ?, ?, ?)
  `).run(
    courseCs101Id,
    'C Programming Language: Zero to Hero',
    'C101',
    'Master the C language fundamentals including pointers, memory management, data types, and systems programming.'
  );

  rawDb.prepare(`
    INSERT OR REPLACE INTO courses (id, title, code, description)
    VALUES (?, ?, ?, ?)
  `).run(
    courseWeb201Id,
    'Web Architecture & Modern Full-Stack Systems',
    'WEB201',
    'From core HTTP protocols and DOM manipulation to reactive state architectures, high-concurrency microservices, and cloud caching.'
  );

  // 4. Modules for CS101
  const modules = [
    // Beginner Tier
    {
      id: crypto.randomUUID(),
      course_id: courseCs101Id,
      title: 'Module 1.1: Computational Complexity & Memory Basics',
      level: 'beginner',
      sequence_order: 1,
      study_time_recommended: 90,
      content_body: `# Computational Complexity & Memory Layout

## Understanding Big-O Notation
Big-O notation quantifies the performance of an algorithm as the input size ($n$) scales towards infinity. It establishes an upper bound on execution time and auxiliary space consumption.

### Common Complexity Classes:
1. **$O(1)$ Constant Time:** Operations like direct array indexing or pushing to a stack.
2. **$O(\\log n)$ Logarithmic Time:** Divide-and-conquer algorithms like Binary Search.
3. **$O(n)$ Linear Time:** Single traversals across arrays or lists.
4. **$O(n \\log n)$ Linearithmic:** Optimal comparison-based sorting (MergeSort, HeapSort).
5. **$O(n^2)$ Quadratic:** Nested loops such as Bubble Sort or brute-force matrix multiplication.

\`\`\`javascript
// Example of O(1) direct access vs O(n) linear search
const getFirst = (arr) => arr[0]; // O(1)

const findItem = (arr, target) => {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i; // O(n)
  }
  return -1;
};
\`\`\`

## Memory Allocations: Stack vs Heap
- **Stack Memory:** Fast, contiguous, LIFO execution context storing primitives and local stack frames.
- **Heap Memory:** Dynamically allocated memory managed at runtime; stores references, dynamic objects, and resizing arrays.
`,
    },
    {
      id: crypto.randomUUID(),
      course_id: courseCs101Id,
      title: 'Module 1.2: Dynamic Arrays & String Processing',
      level: 'beginner',
      sequence_order: 2,
      study_time_recommended: 120,
      content_body: `# Dynamic Arrays & String Algorithms

## How Dynamic Arrays Work
Standard static arrays require fixed sizing at allocation time. Dynamic arrays (like \`std::vector\` in C++, \`ArrayList\` in Java, or JavaScript Arrays) provide automatic doubling of capacity upon saturation.

### Amortized Time Complexity
When an array reaches full capacity $N$, it allocates a new block of size $2N$ and copies elements across:
- Unamortized worst-case append: $O(n)$
- Amortized append time: $O(1)$

\`\`\`javascript
class SimpleDynamicArray {
  constructor(capacity = 2) {
    this.capacity = capacity;
    this.length = 0;
    this.data = new Array(capacity);
  }

  push(item) {
    if (this.length === this.capacity) {
      this.resize();
    }
    this.data[this.length++] = item;
  }

  resize() {
    this.capacity *= 2;
    const next = new Array(this.capacity);
    for (let i = 0; i < this.length; i++) next[i] = this.data[i];
    this.data = next;
  }
}
\`\`\`

## Two-Pointer String Techniques
Palindromes, substring reversals, and anagram comparisons frequently utilize two converging pointers to avoid unnecessary auxiliary space ($O(1)$ auxiliary space).
`,
    },
    {
      id: crypto.randomUUID(),
      course_id: courseCs101Id,
      title: 'Module 1.3: Elementary Searching & Sorting',
      level: 'beginner',
      sequence_order: 3,
      study_time_recommended: 150,
      content_body: `# Elementary Searching & Sorting

## Binary Search Logic
Binary search operates on sorted collections by repeatedly bisecting the search interval. If the target is less than the midpoint, search shifts to the left partition; otherwise, it shifts right.

\`\`\`javascript
function binarySearch(sortedArr, target) {
  let low = 0;
  let high = sortedArr.length - 1;

  while (low <= high) {
    const mid = Math.floor(low + (high - low) / 2);
    if (sortedArr[mid] === target) return mid;
    if (sortedArr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}
\`\`\`

## Elementary Sorting Mechanics
- **Selection Sort:** Repeatedly finds minimum in unsorted portion ($O(n^2)$ time, $O(1)$ space).
- **Insertion Sort:** Builds sorted array one item at a time; very efficient for small or partially sorted datasets ($O(n)$ best case).
`,
    },

    // Intermediate Tier
    {
      id: crypto.randomUUID(),
      course_id: courseCs101Id,
      title: 'Module 2.1: Linked Lists, Pointers & Node Traversals',
      level: 'intermediate',
      sequence_order: 1,
      study_time_recommended: 180,
      content_body: `# Linked Lists and Pointer Manipulation

## Singly vs Doubly Linked Lists
Unlike contiguous arrays, linked lists consist of discrete nodes containing data and pointer references.

### Advantages:
- Constant time insertion/deletion ($O(1)$) at head/tail once pointer is identified.
- Dynamic size with no need for contiguous physical memory reallocation.

\`\`\`javascript
class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

function reverseLinkedList(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    const nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }
  return prev;
}
\`\`\`

## Fast and Slow Pointer Strategy (Floyd's Cycle Detection)
Using two pointers traversing at differing velocities ($1\\times$ and $2\\times$) enables cycle detection in linear time without extra hash table storage.
`,
    },
    {
      id: crypto.randomUUID(),
      course_id: courseCs101Id,
      title: 'Module 2.2: Stacks, Queues & Monotonic Sequences',
      level: 'intermediate',
      sequence_order: 2,
      study_time_recommended: 180,
      content_body: `# Stacks, Queues & Monotonic Structures

## LIFO & FIFO Implementations
- **Stack (Last-In, First-Out):** Essential for recursion backtracking, parsing balanced expressions, and AST evaluation.
- **Queue (First-In, First-Out):** Foundation for BFS graph traversal, task scheduling, and message buffering.

## Monotonic Stacks
A monotonic stack maintains elements in strictly ascending or descending order. Used for:
- Next Greater Element problems in $O(n)$ time.
- Largest Rectangle in Histogram.

\`\`\`javascript
// Next Greater Element using Monotonic Stack
function nextGreaterElements(nums) {
  const result = new Array(nums.length).fill(-1);
  const stack = []; // stores indices

  for (let i = 0; i < nums.length; i++) {
    while (stack.length > 0 && nums[stack[stack.length - 1]] < nums[i]) {
      const idx = stack.pop();
      result[idx] = nums[i];
    }
    stack.push(i);
  }
  return result;
}
\`\`\`
`,
    },
    {
      id: crypto.randomUUID(),
      course_id: courseCs101Id,
      title: 'Module 2.3: Binary Search Trees & Tree Balances',
      level: 'intermediate',
      sequence_order: 3,
      study_time_recommended: 210,
      content_body: `# Binary Search Trees & Self-Balancing Trees

## BST Invariant
For every node $N$:
- All nodes in left subtree have keys $< N.key$
- All nodes in right subtree have keys $> N.key$

In-order traversal of a BST yields keys in non-decreasing sorted order.

\`\`\`javascript
class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function searchBST(root, val) {
  if (!root || root.val === val) return root;
  return val < root.val ? searchBST(root.left, val) : searchBST(root.right, val);
}
\`\`\`

## Tree Balancing (AVL and Red-Black Trees)
Unbalanced BSTs degrade to linear chains ($O(n)$ search). Self-balancing trees guarantee $O(\\log n)$ height by performing left and right tree rotations during insertion/deletion.
`,
    },

    // Advanced Tier
    {
      id: crypto.randomUUID(),
      course_id: courseCs101Id,
      title: 'Module 3.1: Dynamic Programming & Optimal Substructure',
      level: 'advanced',
      sequence_order: 1,
      study_time_recommended: 240,
      content_body: `# Dynamic Programming & Memoization

## Identifying DP Problems
A problem is solvable by Dynamic Programming if it exhibits:
1. **Overlapping Subproblems:** Recursive tree solves the exact same parameter states repeatedly.
2. **Optimal Substructure:** An optimal solution to the problem incorporates optimal solutions to its subproblems.

## Top-Down (Memoization) vs Bottom-Up (Tabulation)
- **Top-Down:** Recursive recursion augmented with cache / hash map lookup.
- **Bottom-Up:** Iterative filling of table along dependency topological order.

\`\`\`javascript
// 0/1 Knapsack Problem - Bottom-Up DP
function knapsack(weights, values, W) {
  const n = weights.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let w = 1; w <= W; w++) {
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(
          values[i - 1] + dp[i - 1][w - weights[i - 1]],
          dp[i - 1][w]
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }
  return dp[n][W];
}
\`\`\`
`,
    },
    {
      id: crypto.randomUUID(),
      course_id: courseCs101Id,
      title: 'Module 3.2: Advanced Graphs: Shortest Paths & Flows',
      level: 'advanced',
      sequence_order: 2,
      study_time_recommended: 260,
      content_body: `# Advanced Graph Theory & Network Flows

## Dijkstra's Shortest Path Algorithm
Finds single-source shortest paths on weighted graphs with non-negative edge weights using a Min-Heap priority queue in $O((V + E) \\log V)$ time.

\`\`\`javascript
// Conceptual Dijkstra Loop
function dijkstra(graph, startNode) {
  const dist = {};
  const pq = new MinPriorityQueue();
  
  for (const node in graph) dist[node] = Infinity;
  dist[startNode] = 0;
  pq.enqueue(startNode, 0);

  while (!pq.isEmpty()) {
    const { element: u, priority: currentDist } = pq.dequeue();
    if (currentDist > dist[u]) continue;

    for (const edge of graph[u]) {
      const alt = dist[u] + edge.weight;
      if (alt < dist[edge.to]) {
        dist[edge.to] = alt;
        pq.enqueue(edge.to, alt);
      }
    }
  }
  return dist;
}
\`\`\`

## Minimum Spanning Trees (MST)
- **Kruskal's Algorithm:** Sorts all edges globally, incorporates edges using Disjoint-Set Union (Union-Find) with path compression.
- **Prim's Algorithm:** Grows a single cut greedily from a seed vertex.
`,
    },
    {
      id: crypto.randomUUID(),
      course_id: courseCs101Id,
      title: 'Module 3.3: Distributed Hashing & Concurrency Primitives',
      level: 'advanced',
      sequence_order: 3,
      study_time_recommended: 300,
      content_body: `# Distributed Algorithms & Concurrency

## Consistent Hashing
In large distributed caching systems, consistent hashing maps both servers and data keys to a circular ring hash space ($0 \\dots 2^{32}-1$). Adding or removing a node only redistributes $K/N$ keys on average, preventing massive cache stampedes.

## Locks, Semaphores & CAS (Compare-And-Swap)
- **Mutual Exclusion (Mutex):** Critical section guard preventing simultaneous execution.
- **Atomic CAS:** Non-blocking hardware primitive comparing memory location against expected value and swapping if equal.
- **Raft / Paxos Consensus:** Leader election, log replication, and Byzantine tolerance in distributed state machines.
`,
    },
  ];

  for (const mod of modules) {
    rawDb.prepare(`
      INSERT OR REPLACE INTO modules (id, course_id, title, level, sequence_order, study_time_recommended, content_body)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      mod.id,
      mod.course_id,
      mod.title,
      mod.level,
      mod.sequence_order,
      mod.study_time_recommended,
      mod.content_body
    );
  }

  // 5. Question Bank (At least 10 Beginner, 10 Intermediate, 10 Advanced for CS101)
  const questions = [
    // --- BEGINNER TIER (10 Questions) ---
    {
      course_id: courseCs101Id,
      difficulty: 'beginner',
      question_text: 'What is the worst-case time complexity of accessing an element by index in a contiguous array?',
      option_a: 'O(1)',
      option_b: 'O(n)',
      option_c: 'O(log n)',
      option_d: 'O(n^2)',
      correct_option: 'A',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'beginner',
      question_text: 'Which memory segment is automatically cleared when a function execution frame completes?',
      option_a: 'Heap Memory',
      option_b: 'Stack Memory',
      option_c: 'Virtual Page Table',
      option_d: 'Global BSS Segment',
      correct_option: 'B',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'beginner',
      question_text: 'What is the best-case time complexity of standard Insertion Sort when the input is already sorted?',
      option_a: 'O(n^2)',
      option_b: 'O(n log n)',
      option_c: 'O(n)',
      option_d: 'O(1)',
      correct_option: 'C',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'beginner',
      question_text: 'What data structure operates under the First-In, First-Out (FIFO) principle?',
      option_a: 'Stack',
      option_b: 'Binary Tree',
      option_c: 'Queue',
      option_d: 'Hash Map',
      correct_option: 'C',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'beginner',
      question_text: 'Binary Search requires which prerequisite condition on the input array?',
      option_a: 'Elements must be unique primes',
      option_b: 'Array must be sorted in monotonic order',
      option_c: 'Length must be a power of two',
      option_d: 'Elements must be non-negative integers',
      correct_option: 'B',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'beginner',
      question_text: 'When a dynamic array doubles its capacity upon reaching saturation, what is the amortized cost per append?',
      option_a: 'O(1)',
      option_b: 'O(log n)',
      option_c: 'O(n)',
      option_d: 'O(n^2)',
      correct_option: 'A',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'beginner',
      question_text: 'Which Big-O class represents the slowest growth rate among the following?',
      option_a: 'O(n log n)',
      option_b: 'O(log n)',
      option_c: 'O(n)',
      option_d: 'O(n^2)',
      correct_option: 'B',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'beginner',
      question_text: 'In standard linear search across an unsorted list of N elements, what is the average number of comparisons?',
      option_a: '1',
      option_b: 'log2(N)',
      option_c: 'N / 2',
      option_d: 'N^2',
      correct_option: 'C',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'beginner',
      question_text: 'Which operation on a singly linked list with only a head pointer takes O(n) time?',
      option_a: 'Insert at head',
      option_b: 'Delete head node',
      option_c: 'Delete the tail node',
      option_d: 'Check if head is null',
      correct_option: 'C',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'beginner',
      question_text: 'What is the auxiliary space complexity of an iterative binary search?',
      option_a: 'O(log n)',
      option_b: 'O(1)',
      option_c: 'O(n)',
      option_d: 'O(n log n)',
      correct_option: 'B',
    },

    // --- INTERMEDIATE TIER (10 Questions) ---
    {
      course_id: courseCs101Id,
      difficulty: 'intermediate',
      question_text: 'Which algorithm detects a cycle in a linked list using two pointers without extra memory?',
      option_a: "Dijkstra's Algorithm",
      option_b: "Floyd's Tortoise and Hare Algorithm",
      option_c: "Kruskal's Algorithm",
      option_d: "Tarjan's SCC Algorithm",
      correct_option: 'B',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'intermediate',
      question_text: 'In a balanced Binary Search Tree (AVL or Red-Black), what is the worst-case time to search for a key?',
      option_a: 'O(1)',
      option_b: 'O(log n)',
      option_c: 'O(n)',
      option_d: 'O(n log n)',
      correct_option: 'B',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'intermediate',
      question_text: 'Which tree traversal yields elements in non-decreasing sorted order for a valid BST?',
      option_a: 'Pre-order',
      option_b: 'Post-order',
      option_c: 'In-order',
      option_d: 'Level-order',
      correct_option: 'C',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'intermediate',
      question_text: 'What is the optimal data structure to implement a Breadth-First Search (BFS) graph traversal?',
      option_a: 'Stack',
      option_b: 'Queue',
      option_c: 'Binary Max-Heap',
      option_d: 'Skip List',
      correct_option: 'B',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'intermediate',
      question_text: 'What is the primary purpose of a Monotonic Stack in algorithmic problem solving?',
      option_a: 'To guarantee O(1) random access',
      option_b: 'To find next/previous greater or smaller elements in O(n) total time',
      option_c: 'To serialize binary trees into JSON strings',
      option_d: 'To balance AVL tree rotation factors',
      correct_option: 'B',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'intermediate',
      question_text: 'In a hash table with chaining, what causes lookup time to degrade from O(1) to O(n)?',
      option_a: 'Excessive memory cache hits',
      option_b: 'Poor hash function causing high collision clustering in a single bucket',
      option_c: 'Resizing capacity to a prime number',
      option_d: 'Using dynamic arrays instead of linked nodes',
      correct_option: 'B',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'intermediate',
      question_text: 'What is the balance factor threshold in an AVL tree that triggers a rotation?',
      option_a: 'When balance factor is exactly 0',
      option_b: 'When absolute difference between left and right subtree heights exceeds 1',
      option_c: 'When tree depth exceeds 1024',
      option_d: 'When number of leaves exceeds internal nodes',
      correct_option: 'B',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'intermediate',
      question_text: 'Which sorting algorithm is guaranteed to be stable and run in O(n log n) worst-case time?',
      option_a: 'QuickSort',
      option_b: 'MergeSort',
      option_c: 'HeapSort',
      option_d: 'Selection Sort',
      correct_option: 'B',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'intermediate',
      question_text: 'What is the maximum number of nodes on level L (0-indexed) of a binary tree?',
      option_a: '2 * L',
      option_b: '2^L',
      option_c: 'L^2',
      option_d: '2^(L + 1) - 1',
      correct_option: 'B',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'intermediate',
      question_text: 'What is the time complexity to build a Binary Heap from an arbitrary array of N elements (Heapify)?',
      option_a: 'O(n log n)',
      option_b: 'O(n)',
      option_c: 'O(n^2)',
      option_d: 'O(log n)',
      correct_option: 'B',
    },

    // --- ADVANCED TIER (10 Questions) ---
    {
      course_id: courseCs101Id,
      difficulty: 'advanced',
      question_text: 'Under what condition does Dijkstra’s shortest path algorithm fail to produce the correct minimum distance?',
      option_a: 'The graph contains directed cycles',
      option_b: 'The graph contains negative edge weights',
      option_c: 'The graph has disconnected sub-graphs',
      option_d: 'The graph is represented as an adjacency matrix',
      correct_option: 'B',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'advanced',
      question_text: 'What is the time complexity of the Bellman-Ford algorithm on a graph with V vertices and E edges?',
      option_a: 'O(V + E)',
      option_b: 'O((V + E) log V)',
      option_c: 'O(V * E)',
      option_d: 'O(V^3)',
      correct_option: 'C',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'advanced',
      question_text: 'In the Disjoint Set Union (DSU) data structure, what is the nearly constant amortized time per operation with union-by-rank and path compression?',
      option_a: 'O(log n)',
      option_b: 'O(α(n)) where α is the inverse Ackermann function',
      option_c: 'O(1/n)',
      option_d: 'O(sqrt(n))',
      correct_option: 'B',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'advanced',
      question_text: 'In Dynamic Programming, what two core properties are strictly required to guarantee optimality?',
      option_a: 'Greedy choice property and polynomial bounds',
      option_b: 'Optimal substructure and overlapping subproblems',
      option_c: 'Acyclic graphs and binary weights',
      option_d: 'Contiguous memory and associative operators',
      correct_option: 'B',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'advanced',
      question_text: 'How does Consistent Hashing minimize data movement when a caching cluster expands or shrinks?',
      option_a: 'By hashing keys across a circular ring space so only K/N keys are remapped',
      option_b: 'By replicating every key across all servers using Paxos',
      option_c: 'By storing all keys in an in-memory B+ Tree',
      option_d: 'By encrypting keys using SHA-256 before disk writes',
      correct_option: 'A',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'advanced',
      question_text: 'What is the worst-case time complexity to solve the 0/1 Knapsack Problem with N items and capacity W via dynamic programming?',
      option_a: 'O(N * W) (pseudo-polynomial)',
      option_b: 'O(2^N) strictly',
      option_c: 'O(N log W)',
      option_d: 'O(W log N)',
      correct_option: 'A',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'advanced',
      question_text: 'Which hardware primitive is fundamental to lock-free atomic concurrent data structures?',
      option_a: 'Branch Predictor Lookahead',
      option_b: 'Compare-And-Swap (CAS)',
      option_c: 'Direct Memory Access (DMA)',
      option_d: 'Translation Lookaside Buffer (TLB)',
      correct_option: 'B',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'advanced',
      question_text: 'What is the primary distinction between Kruskal’s and Prim’s algorithms for finding a Minimum Spanning Tree?',
      option_a: 'Kruskal processes edges globally sorted by weight; Prim grows a single tree cut greedily',
      option_b: 'Kruskal works only on directed graphs; Prim works on DAGs',
      option_c: 'Prim requires negative cycle detection; Kruskal uses Dijkstra',
      option_d: 'Kruskal requires O(V^3) time while Prim is O(log V)',
      correct_option: 'A',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'advanced',
      question_text: 'In the Floyd-Warshall all-pairs shortest paths algorithm, what is the asymptotic runtime?',
      option_a: 'O(V * E)',
      option_b: 'O(V^3)',
      option_c: 'O(V^2 log V)',
      option_d: 'O(E log V)',
      correct_option: 'B',
    },
    {
      course_id: courseCs101Id,
      difficulty: 'advanced',
      question_text: 'In A* graph search, what property must the heuristic h(n) satisfy to guarantee finding the shortest path?',
      option_a: 'It must overestimate the cost to the goal',
      option_b: 'It must be admissible (never overestimate true minimal cost) and consistent',
      option_c: 'It must be strictly zero for all nodes',
      option_d: 'It must be inversely proportional to node degree',
      correct_option: 'B',
    },
  ];

  for (const q of questions) {
    rawDb.prepare(`
      INSERT OR REPLACE INTO question_bank (id, course_id, difficulty, question_text, option_a, option_b, option_c, option_d, correct_option)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      q.course_id,
      q.difficulty,
      q.question_text,
      q.option_a,
      q.option_b,
      q.option_c,
      q.option_d,
      q.correct_option
    );
  }

  // 6. Seed sample progress and pending test request for Maria
  const mariaModule = modules[3]; // Module 2.1 Linked Lists
  rawDb.prepare(`
    INSERT OR REPLACE INTO student_module_progress (student_id, module_id, time_spent_minutes, is_completed)
    VALUES (?, ?, 195, 1)
  `).run(mariaId, mariaModule.id);

  rawDb.prepare(`
    INSERT OR REPLACE INTO test_requests (id, student_id, module_id, reviewer_id, status, time_spent_minutes)
    VALUES (?, ?, ?, ?, 'pending', 195)
  `).run(crypto.randomUUID(), mariaId, mariaModule.id, mentorId);

  console.log('✅ Database seeded successfully!');
  console.log(`- Users: ${users.length}`);
  console.log(`- Modules: ${modules.length}`);
  console.log(`- Questions: ${questions.length}`);
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seedData.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
