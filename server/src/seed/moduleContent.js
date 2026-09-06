/**
 * Exhaustive, detailed educational matter for all modules across Beginner, Intermediate, and Advanced tiers.
 */

export const detailedModuleContent = {
  // ==========================================
  // MODULE 1.1: Computational Complexity & Memory
  // ==========================================
  'm1_1': `# Module 1.1: Computational Complexity & Memory Layout

---

## 1. Executive Summary & Core Intuition
In computer science, software efficiency is never evaluated by physical clock seconds alone because hardware architectures, CPU clock speeds, background operating system interrupts, and memory buses vary drastically between machines.

Instead, we characterize algorithms using **Asymptotic Analysis**—measuring how execution time and auxiliary space scale mathematically as the input size ($n$) approaches infinity ($\infty$).

\`\`\`
Algorithm Efficiency Growth Rates:
Time / Operations
  ▲
  │                                     / O(2^n) Exponential
  │                                    /
  │                             /     /  O(n^2) Quadratic
  │                            /     /
  │                     /     /     /    O(n log n) Linearithmic
  │             /      /     /     /
  │      /     /      /     /     /      O(n) Linear
  │   /       /      /     /     /
  │───────────────────────────────────  O(log n) Logarithmic
  │───────────────────────────────────  O(1) Constant
  └─────────────────────────────────────► Input Size (n)
\`\`\`

---

## 2. Mathematical Foundations: Big-O, Big-Ω, and Big-Θ
- **Big-O ($O$): Asymptotic Upper Bound.** Formally, $f(n) = O(g(n))$ if and only if there exist positive constants $c > 0$ and $n_0 \ge 1$ such that:
  $$0 \le f(n) \le c \cdot g(n) \quad \forall n \ge n_0$$
  This guarantees the algorithm will **never** perform worse than this envelope for large inputs.
- **Big-Omega ($\Omega$): Asymptotic Lower Bound.** Formally:
  $$0 \le c \cdot g(n) \le f(n) \quad \forall n \ge n_0$$
  Represents the minimum resources required in the best-case scenario.
- **Big-Theta ($\Theta$): Asymptotic Tight Bound.** Holds when an algorithm is simultaneously $O(g(n))$ and $\Omega(g(n))$:
  $$c_1 \cdot g(n) \le f(n) \le c_2 \cdot g(n) \quad \forall n \ge n_0$$

---

## 3. Physical Architecture: Stack vs. Heap Memory Layout
To write optimal code, you must understand how data structures map onto physical RAM:

\`\`\`
+-------------------------------------------------------+
|                   HIGH MEMORY ADDRESS                  |
|-------------------------------------------------------|
|  STACK (Grows Downward ▼)                             |
|  - Fast, contiguous L1/L2 cache-friendly allocation   |
|  - Function call stack frames, return addresses       |
|  - Primitives and local scalar variables               |
|                                                       |
|                     ▲                                 |
|                     │ (Memory allocation collision)   |
|                     ▼                                 |
|                                                       |
|  HEAP (Grows Upward ▲)                                |
|  - Dynamic runtime allocation (malloc, new, objects)  |
|  - Managed via pointers / memory references           |
|  - Subject to garbage collection & fragmentation      |
|-------------------------------------------------------|
|  DATA / BSS SEGMENT (Global & static variables)       |
|-------------------------------------------------------|
|  TEXT SEGMENT (Compiled binary machine instructions)  |
|-------------------------------------------------------|
|                   LOW MEMORY ADDRESS                  |
+-------------------------------------------------------+
\`\`\`

### Key Distinctions:
1. **Stack Memory Allocation:**
   - Extremely rapid: pointer simply increments/decrements a CPU register (\`RSP\`).
   - Cleaned up automatically upon function return frame pop.
   - Limited in capacity (typically 1MB - 8MB; exceeding causes *Stack Overflow*).
2. **Heap Memory Allocation:**
   - Flexible sizing: can allocate gigabytes dynamically at runtime.
   - Slower allocation: memory allocator must scan free-lists or bins to locate unfragmented chunks.
   - Requires explicit garbage collection or manual deallocation (\`free\`).

---

## 4. Line-by-Line Code Breakdown

\`\`\`javascript
/**
 * Demonstrating O(1) direct access vs O(n) linear search vs O(log n) halving
 */

// 1. Constant Time O(1): Accessing an element via memory offset arithmetic
function getElementAtIndex(array, index) {
  // CPU computes: BaseAddress + (index * sizeof(ElementType))
  // This takes single machine instruction regardless of whether array has 10 or 10,000,000 items!
  return array[index];
}

// 2. Linear Time O(n): Unsorted search requires scanning sequentially
function linearSearch(array, target) {
  for (let i = 0; i < array.length; i++) {
    if (array[i] === target) {
      return i; // Best-case: Ω(1) if at index 0; Worst-case: O(n) if absent
    }
  }
  return -1;
}

// 3. Logarithmic Time O(log n): Halving search space
function countHalvingSteps(n) {
  let steps = 0;
  let current = n;
  while (current > 1) {
    current = Math.floor(current / 2);
    steps++;
  }
  return steps; // Ex: for n=1024, steps = 10; for n=1,048,576, steps = 20!
}
\`\`\`

---

## 5. Real-World Systems Application: CPU Cache Locality
Theoretical Big-O assumes all memory accesses cost the exact same amount of time. In modern computer hardware, this is false!
- **L1 CPU Cache Hit:** ~1 nanosecond (4 clock cycles)
- **Main RAM Access:** ~100 nanoseconds (~200+ clock cycles)

Because arrays store elements in contiguous physical memory, the CPU pre-fetches adjacent elements into the L1 cache line (typically 64 bytes). This means an $O(n)$ array traversal can execute up to **50 times faster** than an $O(n)$ linked list traversal where nodes are scattered across arbitrary heap memory addresses!
`,

  // ==========================================
  // MODULE 1.2: Dynamic Arrays & String Processing
  // ==========================================
  'm1_2': `# Module 1.2: Dynamic Arrays & String Processing Algorithms

---

## 1. Executive Summary & Core Intuition
Static arrays possess a fixed capacity defined at compile or initialization time. While this allows fast contiguous memory access, real-world systems rarely know data volume beforehand.

**Dynamic Arrays** (e.g., \`vector\` in C++, \`ArrayList\` in Java, and JavaScript native arrays) provide the illusion of infinite capacity by automatically managing dynamic heap buffer allocations behind the scenes.

\`\`\`
Dynamic Array Doubling Lifecycle:
State 1: Capacity = 2, Length = 2 [Full]
[ Value A | Value B ]

Push 'Value C' Triggers Doubling:
1. Allocate fresh contiguous memory block of size 4 (2 * 2)
2. Copy existing elements [Value A, Value B] to new block
3. Insert 'Value C' at index 2
4. Deallocate old memory block

State 2: Capacity = 4, Length = 3
[ Value A | Value B | Value C | (Empty) ]
\`\`\`

---

## 2. Mathematical Rigor: The Amortized Analysis Proof
A common misconception is that because resizing copies $N$ elements in $O(N)$ time, appending to a dynamic array is inefficient. We prove it is **$O(1)$ Amortized** using the **Accounting Method**.

### Proof by Potential Method / Aggregate Cost:
- Let the initial capacity be 1.
- Doubling occurs at insertions: $1, 2, 4, 8, 16, \\dots, 2^k$.
- Total elements copied across $N = 2^k$ insertions:
  $$\\text{Total Copies} = 1 + 2 + 4 + 8 + \\dots + \\frac{N}{2} = \\sum_{j=0}^{k-1} 2^j = 2^k - 1 = N - 1$$
- Total cost for $N$ appends:
  $$\\text{Cost} = \\underbrace{N}_{\\text{regular inserts}} + \\underbrace{(N - 1)}_{\\text{element copies}} = 2N - 1$$
- Dividing by $N$ operations:
  $$\\text{Average Cost per Operation} = \\frac{2N - 1}{N} \\approx 2 = O(1)$$

---

## 3. Production-Grade Implementation

\`\`\`javascript
class ResizableDynamicArray {
  constructor(initialCapacity = 2) {
    this.capacity = Math.max(1, initialCapacity);
    this.length = 0;
    this.buffer = new Array(this.capacity);
  }

  // O(1) Amortized Append
  push(element) {
    if (this.length === this.capacity) {
      this._resize(this.capacity * 2);
    }
    this.buffer[this.length++] = element;
  }

  // O(1) Random Access
  get(index) {
    if (index < 0 || index >= this.length) {
      throw new RangeError(\`Index \${index} out of bounds for length \${this.length}\`);
    }
    return this.buffer[index];
  }

  // Internal buffer reallocation
  _resize(newCapacity) {
    const newBuffer = new Array(newCapacity);
    for (let i = 0; i < this.length; i++) {
      newBuffer[i] = this.buffer[i];
    }
    this.buffer = newBuffer;
    this.capacity = newCapacity;
  }
}
\`\`\`

---

## 4. Two-Pointer String Techniques
In string manipulation, avoiding auxiliary string copies ($O(N)$ memory allocations) is critical for high-throughput network applications.

### Converging Two-Pointer Palindrome Checker:
\`\`\`javascript
function isPalindrome(str) {
  let left = 0;
  let right = str.length - 1;

  while (left < right) {
    // Skip non-alphanumeric characters in-place
    while (left < right && !/[a-zA-Z0-9]/.test(str[left])) left++;
    while (left < right && !/[a-zA-Z0-9]/.test(str[right])) right--;

    if (str[left].toLowerCase() !== str[right].toLowerCase()) {
      return false;
    }
    left++;
    right--;
  }
  return true;
}
\`\`\`
- **Time Complexity:** $O(n)$ where each character is examined at most twice.
- **Auxiliary Space:** $O(1)$ constant space with zero string allocations!
`,

  // ==========================================
  // MODULE 1.3: Elementary Searching & Sorting
  // ==========================================
  'm1_3': `# Module 1.3: Elementary Searching & Sorting Algorithms

---

## 1. Executive Summary & Core Intuition
Searching and sorting form the bedrock of database query execution plans, operating system schedulers, and file systems. Understanding when to use an elementary algorithm versus an advanced comparison sort is crucial.

\`\`\`
Binary Search Bisection:
Target: 45
Array: [ 10, 15, 23, 38, 45, 67, 89, 99 ]
Step 1: Low=0, High=7, Mid=3 (Val: 38). 45 > 38 -> Search Right Partition
Array: [ --, --, --, --, 45, 67, 89, 99 ]
Step 2: Low=4, High=7, Mid=5 (Val: 67). 45 < 67 -> Search Left Partition
Array: [ --, --, --, --, 45, --, --, -- ]
Step 3: Low=4, High=4, Mid=4 (Val: 45) -> MATCH FOUND in 3 steps!
\`\`\`

---

## 2. Binary Search: The Classical Overflow Bug
A subtle bug existed in standard binary search implementations in Java and C libraries for over 20 years:
\`\`\`java
// BUG: If low and high are large positive integers, their sum overflows 32-bit signed integer!
int mid = (low + high) / 2; // Result becomes negative!

// CORRECT: Safe midpoint calculation
int mid = low + (high - low) / 2;
\`\`\`

### Complete Verified Binary Search:
\`\`\`javascript
function binarySearch(sortedArray, target) {
  let low = 0;
  let high = sortedArray.length - 1;

  while (low <= high) {
    const mid = Math.floor(low + (high - low) / 2);
    const midVal = sortedArray[mid];

    if (midVal === target) {
      return mid; // Target found
    } else if (midVal < target) {
      low = mid + 1; // Discard left half
    } else {
      high = mid - 1; // Discard right half
    }
  }
  return -1; // Element absent
}
\`\`\`

---

## 3. Sorting Algorithms Comparison Matrix

| Algorithm | Best-Case Time | Average Time | Worst-Case Time | Space | Stable? | Best Used For |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Insertion Sort** | $O(n)$ | $O(n^2)$ | $O(n^2)$ | $O(1)$ | **Yes** | Small datasets ($n < 30$) or nearly-sorted streams |
| **Selection Sort** | $O(n^2)$ | $O(n^2)$ | $O(n^2)$ | $O(1)$ | **No** | Minimizing physical flash/EEPROM writes |
| **Merge Sort** | $O(n \\log n)$ | $O(n \\log n)$ | $O(n \\log n)$ | $O(n)$ | **Yes** | Guaranteed $O(n \\log n)$ and linked lists |
| **Quick Sort** | $O(n \\log n)$ | $O(n \\log n)$ | $O(n^2)$ | $O(\\log n)$| **No** | Fastest in-memory general sorting (cache friendly) |
`,

  // ==========================================
  // MODULE 2.1: Linked Lists & Pointers
  // ==========================================
  'm2_1': `# Module 2.1: Linked Lists, Pointers & Node Traversals

---

## 1. Executive Summary & Core Intuition
Unlike contiguous arrays, linked lists consist of distinct nodes allocated independently across heap memory, linked together via pointer memory addresses.

\`\`\`
Singly Linked List Structure:
[ HEAD: 0x1000 ]
      │
      ▼
+-----------+------+     +-----------+------+     +-----------+------+
| Data: 42  | Next |───► | Data: 87  | Next |───► | Data: 19  | NULL |
+-----------+------+     +-----------+------+     +-----------+------+
  Memory: 0x1000           Memory: 0x4800           Memory: 0x2400
\`\`\`

---

## 2. In-Place Linked List Reversal (Iterative & Pointer Rewiring)
Reversing a singly linked list in $O(1)$ space requires maintaining three pointer references simultaneously: \`prev\`, \`curr\`, and \`next\`.

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
    // 1. Temporarily store reference to remaining chain
    const nextTemp = curr.next;
    // 2. Reverse current node pointer to face backward
    curr.next = prev;
    // 3. Step forward
    prev = curr;
    curr = nextTemp;
  }

  // prev is now the new head of the reversed list
  return prev;
}
\`\`\`

---

## 3. Floyd’s Cycle Detection Algorithm (Tortoise & Hare)
Can you detect whether a linked list has an infinite circular loop using zero auxiliary memory?
- **Slow Pointer ($S$):** Advances 1 node per iteration.
- **Fast Pointer ($F$):** Advances 2 nodes per iteration.

\`\`\`
Mathematical Proof of Convergence:
Let non-cycle distance be K, and cycle circumference be C.
When Slow enters cycle, Fast is already inside cycle at position (K mod C).
Relative speed between Fast and Slow is: (2 - 1) = 1 node per tick.
The distance between them closes by 1 node at each step.
Therefore, Fast will overtake and collide with Slow in at most C steps!
\`\`\`

\`\`\`javascript
function hasCycle(head) {
  if (!head || !head.next) return false;

  let slow = head;
  let fast = head;

  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;

    if (slow === fast) {
      return true; // Cycle detected!
    }
  }
  return false; // Reached end of linear list
}
\`\`\`
`,

  // ==========================================
  // MODULE 2.2: Stacks, Queues & Monotonic Sequences
  // ==========================================
  'm2_2': `# Module 2.2: Stacks, Queues & Monotonic Sequences

---

## 1. Executive Summary & Core Intuition
- **Stack:** Last-In, First-Out (**LIFO**). Used for recursive call stacks, undo/redo buffers, and bracket syntax matching.
- **Queue:** First-In, First-Out (**FIFO**). Used for print job spoolers, message brokers (Kafka, RabbitMQ), and Breadth-First Search.

\`\`\`
LIFO vs FIFO Comparison:
STACK (LIFO)                        QUEUE (FIFO)
Push [A], [B], [C]                  Enqueue [A], [B], [C]
| [C] | <- TOP (Pop removes [C])    FRONT -> [A] [B] [C] <- BACK
| [B] |                                       │
| [A] |                                       ▼
+-----+                             Dequeue removes [A]
\`\`\`

---

## 2. Advanced Technique: Monotonic Stack
A Monotonic Stack maintains its elements in strictly ascending or descending order. It solves the **Next Greater Element** problem in $O(N)$ linear time instead of brute-force $O(N^2)$.

\`\`\`javascript
/**
 * Find the Next Greater Element for every item in array in O(n)
 * Example input:  [2, 1, 5, 3, 6]
 * Expected output: [5, 5, 6, 6, -1]
 */
function nextGreaterElement(nums) {
  const result = new Array(nums.length).fill(-1);
  const stack = []; // Stores indices of elements

  for (let i = 0; i < nums.length; i++) {
    const currentVal = nums[i];

    // While current element is greater than element at top index of stack
    while (stack.length > 0 && nums[stack[stack.length - 1]] < currentVal) {
      const topIndex = stack.pop();
      result[topIndex] = currentVal; // Current value is the next greater!
    }

    stack.push(i);
  }

  return result;
}
\`\`\`
- **Amortized Analysis:** Every element is pushed onto the stack exactly once and popped at most once. Hence, total operations = $2N = O(n)$!
`,

  // ==========================================
  // MODULE 2.3: Binary Search Trees & Tree Balances
  // ==========================================
  'm2_3': `# Module 2.3: Binary Search Trees & Self-Balancing Trees

---

## 1. Executive Summary & Core Intuition
A Binary Search Tree (BST) provides logarithmic $O(\\log n)$ insertion, deletion, and lookup by enforcing the **BST Invariant**:
- For any node $X$, all keys in the left subtree are $< X.key$.
- All keys in the right subtree are $> X.key$.

\`\`\`
Valid BST:                              Degenerate BST (Linear Chain):
        ( 20 )                                    ( 10 )
       /      \\                                      \\
    ( 10 )    ( 30 )                                 ( 20 )
    /    \\        \\                                     \\
  ( 5 )  ( 15 )   ( 40 )                                ( 30 )
Height = 3, Lookup = O(log n)               Height = 3, Lookup = O(n) (Degraded!)
\`\`\`

---

## 2. In-Order Traversal Invariant
An in-order traversal (Left $\\to$ Node $\\to$ Right) across any valid BST is guaranteed to output keys in strictly non-decreasing sorted order!

\`\`\`javascript
function inOrderTraversal(root, result = []) {
  if (!root) return result;
  inOrderTraversal(root.left, result);
  result.push(root.val);
  inOrderTraversal(root.right, result);
  return result;
}
\`\`\`

---

## 3. AVL Trees & Self-Balancing Rotations
When keys are inserted in sorted order, an ordinary BST degrades into an $O(N)$ linear list.
**AVL Trees** enforce that for every node, the height difference between left and right subtrees (Balance Factor) never exceeds $\\pm 1$:
$$\\text{Balance Factor } (BF) = \\text{Height}(\\text{left}) - \\text{Height}(\\text{right}) \\in \\{-1, 0, 1\\}$$

### The 4 Rebalancing Rotations:
1. **Left-Left (LL):** Single Right Rotation
2. **Right-Right (RR):** Single Left Rotation
3. **Left-Right (LR):** Left Rotation on child, then Right Rotation on node
4. **Right-Left (RL):** Right Rotation on child, then Left Rotation on node
`,

  // ==========================================
  // MODULE 3.1: Dynamic Programming
  // ==========================================
  'm3_1': `# Module 3.1: Dynamic Programming & Optimal Substructure

---

## 1. Executive Summary & Core Intuition
Dynamic Programming (DP) is an optimization technique that solves complex problems by breaking them down into simpler overlapping subproblems, solving each subproblem once, and storing their solutions in a lookup table.

\`\`\`
Recursive Fibonacci Call Tree (O(2^n) Catastrophic Redundancy):
                       fib(5)
                   /          \\
              fib(4)           fib(3)  <-- fib(3) recalculated twice!
             /      \\         /      \\
         fib(3)     fib(2)  fib(2)   fib(1)
        /      \\
     fib(2)    fib(1)

With Memoization: Every subproblem solved exactly once in O(n) time!
\`\`\`

---

## 2. The 0/1 Knapsack Problem (Tabulation)
Given weights $w_i$ and values $v_i$, maximize total value within weight capacity $W$:

### Recurrence Relation:
$$DP[i][w] = \\max\\Big( DP[i-1][w], \\; v_{i-1} + DP[i-1][w - w_{i-1}] \\Big) \\quad \\text{if } w_{i-1} \\le w$$

\`\`\`javascript
function knapsack01(weights, values, capacity) {
  const n = weights.length;
  // Initialize 2D DP Table of size (n+1) x (capacity+1)
  const dp = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const itemWeight = weights[i - 1];
    const itemValue = values[i - 1];

    for (let w = 0; w <= capacity; w++) {
      if (itemWeight <= w) {
        // Choose between excluding or including the item
        dp[i][w] = Math.max(dp[i - 1][w], itemValue + dp[i - 1][w - itemWeight]);
      } else {
        dp[i][w] = dp[i - 1][w]; // Exclude item
      }
    }
  }

  return dp[n][capacity];
}
\`\`\`
`,

  // ==========================================
  // MODULE 3.2: Advanced Graph Algorithms
  // ==========================================
  'm3_2': `# Module 3.2: Advanced Graphs: Shortest Paths & Flows

---

## 1. Dijkstra’s Algorithm (Greedy Single-Source Shortest Path)
Finds the shortest distance from a start node to all other nodes in a directed/undirected graph with **non-negative** edge weights.

\`\`\`
Dijkstra Execution Invariant:
1. Initialize dist[start] = 0, all other nodes = Infinity.
2. Maintain Min-Priority Queue of (distance, node).
3. At each step, extract unvisited node U with smallest tentative distance.
4. For each neighbor V of U, relax edge:
   if dist[U] + weight(U, V) < dist[V]:
     dist[V] = dist[U] + weight(U, V)
     priorityQueue.enqueue(dist[V], V)
\`\`\`

- **Time Complexity:** $O((V + E) \\log V)$ using binary min-heap.
- **Why Negative Weights Break Dijkstra:** Dijkstra marks a node as finalized once popped. A subsequent negative edge could reduce the path cost, invalidating the greedy choice assumption! For graphs with negative weights, use **Bellman-Ford** ($O(V \\cdot E)$).
`,

  // ==========================================
  // MODULE 3.3: Distributed Systems & Concurrency
  // ==========================================
  'm3_3': `# Module 3.3: Distributed Hashing & Concurrency Primitives

---

## 1. Consistent Hashing (Distributed Key Distribution)
In large-scale caching systems (Memcached, Redis clusters, DynamoDB), traditional modulo hashing (\`hash(key) % N\`) is disastrous when servers are added or removed because almost all keys get remapped ($99\\%$ cache misses!).

\`\`\`
Consistent Hashing Ring (0 to 2^32 - 1):
                [Server A (1000)]
              /                   \\
    Key 1 (800)                     [Server B (5000)]
           |                             |
           |   (Clockwise routing)       |
           |                             |
    [Server C (9000)] ───────────── Key 2 (6200)
\`\`\`
- Keys route clockwise to the first server hash encountered.
- When a server is added or removed, only $K / N$ keys are moved on average!
`,
};
