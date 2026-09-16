import vm from 'node:vm';

/**
 * Deep equality helper for comparing outputs (handles arrays, objects, primitives)
 */
function isDeepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isDeepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!isDeepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
}

/**
 * Safely executes user code against test cases in an isolated VM sandbox
 */
export function executeCode(userCode, testCases = [], entryFunctionName = 'solution') {
  const results = [];
  let passedCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const logs = [];
    let actualOutput = null;
    let executionError = null;
    const startTime = performance.now();

    try {
      // Sandbox environment with captured console
      const sandbox = {
        console: {
          log: (...args) => {
            logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
          },
          error: (...args) => {
            logs.push('[Error] ' + args.join(' '));
          },
        },
        Math,
        Number,
        String,
        Array,
        Object,
        Boolean,
        Map,
        Set,
        parseInt,
        parseFloat,
      };

      const context = vm.createContext(sandbox);

      // Parse test case input: either single value or array of arguments
      const rawInput = tc.input;
      const inputArgs = Array.isArray(rawInput) ? rawInput : [rawInput];

      // Build wrapper script
      const scriptCode = `
        ${userCode}

        // Locate entrypoint function
        let fn = null;
        if (typeof ${entryFunctionName} === 'function') {
          fn = ${entryFunctionName};
        } else if (typeof solve === 'function') {
          fn = solve;
        } else if (typeof twoSum === 'function') {
          fn = twoSum;
        } else if (typeof reverseString === 'function') {
          fn = reverseString;
        } else if (typeof lengthOfLongestSubstring === 'function') {
          fn = lengthOfLongestSubstring;
        } else if (typeof isValid === 'function') {
          fn = isValid;
        } else if (typeof knapsack === 'function') {
          fn = knapsack;
        } else {
          // Look for any declared function
          for (const key of Object.keys(this)) {
            if (typeof this[key] === 'function' && key !== 'parseInt' && key !== 'parseFloat') {
              fn = this[key];
              break;
            }
          }
        }

        if (!fn) {
          throw new Error('No executable function found in your submission.');
        }

        // Execute function with arguments
        __result = fn(...__args);
      `;

      sandbox.__args = inputArgs;
      sandbox.__result = undefined;

      const script = new vm.Script(scriptCode);
      script.runInContext(context, { timeout: 2000 }); // 2000ms execution timeout

      actualOutput = sandbox.__result;
    } catch (err) {
      executionError = err.message || String(err);
    }

    const endTime = performance.now();
    const executionTimeMs = parseFloat((endTime - startTime).toFixed(2));

    const isPassed = !executionError && isDeepEqual(actualOutput, tc.expected);
    if (isPassed) passedCount++;

    results.push({
      id: tc.id || i + 1,
      input: tc.input,
      expected: tc.expected,
      actual: actualOutput,
      passed: isPassed,
      error: executionError,
      logs: logs.join('\n'),
      isHidden: Boolean(tc.isHidden),
      executionTimeMs,
    });
  }

  return {
    success: true,
    totalCases: testCases.length,
    passedCases: passedCount,
    allPassed: passedCount === testCases.length,
    passRatePct: testCases.length > 0 ? parseFloat(((passedCount / testCases.length) * 100).toFixed(1)) : 0,
    results,
  };
}
