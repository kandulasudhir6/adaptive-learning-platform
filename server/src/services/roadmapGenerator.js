/**
 * AI-Powered Personalized Roadmap Generation Engine
 * Synthesizes customized multi-week milestones tailored to student's diagnostic test results
 */

export function generatePersonalizedRoadmap({ courseTitle, currentLevel, diagnosticScorePct, codingScorePct }) {
  const isStrongInCoding = codingScorePct >= 75;
  const isStrugglingInCoding = codingScorePct < 40;

  let roadmapTitle = '';
  let overview = '';
  let milestones = [];

  if (currentLevel === 'beginner') {
    roadmapTitle = `Foundational Engineering Acceleration Track (${courseTitle})`;
    overview = `Based on your diagnostic score (${diagnosticScorePct}%) and code evaluation (${codingScorePct}%), this track focuses on building rock-solid mental models for memory layout, Big-O complexity, and linear data structures before advancing to non-linear abstractions.`;

    milestones = [
      {
        week: 'Week 1',
        title: 'Algorithmic Complexity & Hardware Memory Models',
        description: 'Understand how code translates to machine instructions, stack frames vs heap allocations, and Big-O asymptotic limits.',
        modules: ['Module 1.1: Computational Complexity & Memory Basics'],
        deliverable: 'Analyze and optimize 5 algorithmic loops for runtime complexity.',
        estimatedHours: 8,
        status: 'in_progress',
      },
      {
        week: 'Week 2',
        title: 'Dynamic Vectors, Buffer Resizing & Amortized Costs',
        description: 'Implement dynamic array doubling mechanics and analyze geometric capacity growth.',
        modules: ['Module 1.2: Dynamic Arrays & String Processing'],
        deliverable: 'Mini-Project: Build a custom resizable array with amortized O(1) appends.',
        estimatedHours: 10,
        status: 'locked',
      },
      {
        week: 'Week 3',
        title: 'Two-Pointer Searching & Sorting Invariants',
        description: 'Master binary search midpoint overflow prevention, insertion sort, and in-place string manipulations.',
        modules: ['Module 1.3: Elementary Searching & Sorting'],
        deliverable: 'Solve 10 LeetCode-style two-pointer challenges on sorted streams.',
        estimatedHours: 10,
        status: 'locked',
      },
      {
        week: 'Week 4',
        title: 'Linear Abstract Data Types: Linked Nodes & Traversals',
        description: 'Transition from contiguous memory to node-pointer heap structures. Implement cycle detection with Floyd Tortoise/Hare.',
        modules: ['Module 2.1: Linked Lists, Pointers & Node Traversals'],
        deliverable: 'In-place linked list reversal and cycle detection without extra memory.',
        estimatedHours: 12,
        status: 'locked',
      },
      {
        week: 'Week 5',
        title: 'Evaluation Checkpoint & Mentor Review',
        description: 'Submit your code repository to your assigned faculty mentor for 1-on-1 code review and weekly test authorization.',
        modules: ['Periodic Evaluation Checkpoint 1'],
        deliverable: 'Pass Mentor-Authorized Periodic Examination with >=70% score.',
        estimatedHours: 6,
        status: 'locked',
      },
      {
        week: 'Week 6-8',
        title: 'Capstone: Integrated In-Memory Data Buffer System',
        description: 'Build a production-grade circular buffer with fast random access and LRU eviction.',
        modules: ['Module 2.2: Stacks, Queues & Monotonic Sequences'],
        deliverable: 'Complete Capstone Repository reviewed and graded by your faculty mentor.',
        estimatedHours: 16,
        status: 'locked',
      },
    ];
  } else if (currentLevel === 'intermediate') {
    roadmapTitle = `Core Systems & Algorithmic Optimization Track (${courseTitle})`;
    overview = `Your diagnostic placement (${diagnosticScorePct}%) demonstrates strong familiarity with fundamental primitives. Level 1 foundational topics have been bypassed. You start directly with advanced pointer rewiring, self-balancing BSTs, and monotonic stacks.`;

    milestones = [
      {
        week: 'Week 1',
        title: 'Deep Pointer Manipulation & Fast/Slow Convergence',
        description: 'Master doubly linked lists, sentinel nodes, and cycle detection algorithms with formal convergence proofs.',
        modules: ['Module 2.1: Linked Lists, Pointers & Node Traversals'],
        deliverable: 'Implement a doubly-linked LRU Cache structure with O(1) get and put.',
        estimatedHours: 10,
        status: 'in_progress',
      },
      {
        week: 'Week 2',
        title: 'Monotonic Stacks & Queue Scheduling Architectures',
        description: 'Utilize monotonic decreasing stacks to solve Next Greater Element and histogram area problems in O(N).',
        modules: ['Module 2.2: Stacks, Queues & Monotonic Sequences'],
        deliverable: 'Build an AST mathematical expression parser handling nested parenthesis.',
        estimatedHours: 12,
        status: 'locked',
      },
      {
        week: 'Week 3',
        title: 'Self-Balancing Binary Trees (AVL & Tree Rotations)',
        description: 'Maintain O(log N) height guarantees through Left-Left, Right-Right, and double tree rotations.',
        modules: ['Module 2.3: Binary Search Trees & Tree Balances'],
        deliverable: 'Complete verified AVL Tree with automatic rotation upon node insertions.',
        estimatedHours: 14,
        status: 'locked',
      },
      {
        week: 'Week 4',
        title: 'Intermediate Mastery Test & Faculty Sign-off',
        description: 'Sit for the periodic evaluation approved by your faculty mentor to unlock advanced distributed curricula.',
        modules: ['Intermediate Periodic Benchmark'],
        deliverable: 'Achieve >= 80% on faculty-reviewed periodic evaluation.',
        estimatedHours: 8,
        status: 'locked',
      },
      {
        week: 'Week 5-6',
        title: 'Advanced Dynamic Programming & Graph Transitions',
        description: 'Formulate 2D tabulation states and optimal substructures for knapsack and shortest path networks.',
        modules: ['Module 3.1: Dynamic Programming', 'Module 3.2: Advanced Graphs'],
        deliverable: 'Solve 15 competitive programming graph and DP problems.',
        estimatedHours: 18,
        status: 'locked',
      },
    ];
  } else {
    roadmapTitle = `Advanced Distributed Systems & High-Scale Algorithms (${courseTitle})`;
    overview = `Exceptional diagnostic performance (${diagnosticScorePct}%, Code: ${codingScorePct}%). Both Level 1 and Level 2 foundational tiers are bypassed. You are placed in the Advanced Research & Distributed Systems track.`;

    milestones = [
      {
        week: 'Week 1',
        title: 'Multi-Dimensional Dynamic Programming & Tabulation',
        description: 'Solve optimal substructure recurrences, bitmask DP, and space compression techniques.',
        modules: ['Module 3.1: Dynamic Programming & Optimal Substructure'],
        deliverable: 'Implement 0/1 Knapsack, Longest Common Subsequence, and Matrix Chain Multiplication.',
        estimatedHours: 12,
        status: 'in_progress',
      },
      {
        week: 'Week 2',
        title: 'Shortest Path Graph Optimization (Dijkstra, A*, Bellman-Ford)',
        description: 'Implement min-heap priority queues for single-source shortest paths and analyze negative-cycle detection.',
        modules: ['Module 3.2: Advanced Graphs: Shortest Paths & Flows'],
        deliverable: 'Build a geospatial road network routing engine using A* heuristic search.',
        estimatedHours: 14,
        status: 'locked',
      },
      {
        week: 'Week 3',
        title: 'Distributed Hashing Rings & High-Concurrency Primitives',
        description: 'Consistent hashing with virtual nodes, lock-free CAS, and Raft leader election consensus mechanics.',
        modules: ['Module 3.3: Distributed Algorithmic Systems'],
        deliverable: 'Build a mini distributed key-value cache cluster with virtual ring partitioning.',
        estimatedHours: 16,
        status: 'locked',
      },
      {
        week: 'Week 4-6',
        title: 'Faculty Mentored Research Capstone',
        description: 'Collaborate with your faculty mentor to publish or deploy a high-performance concurrent algorithmic service.',
        modules: ['Advanced Capstone Defense'],
        deliverable: 'Final system architecture review with faculty approval.',
        estimatedHours: 24,
        status: 'locked',
      },
    ];
  }

  // If student had low coding score, inject a special coding lab into Milestone 1
  if (isStrugglingInCoding) {
    milestones[0].description += ' Special emphasis: 5 guided interactive coding sandbox labs added to reinforce syntax execution.';
  }

  return {
    title: roadmapTitle,
    overview,
    milestones,
  };
}
