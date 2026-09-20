import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import os from 'node:os';

/**
 * Safely executes C code against test cases by compiling with gcc.
 * We expect the user to write a standard C program that takes space-separated
 * inputs from stdin and prints the result to stdout.
 */
export function executeCode(userCode, testCases = [], entryFunctionName = 'main') {
  const results = [];
  let passedCount = 0;
  
  // Create temp dir
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'c_runner_'));
  const sourcePath = path.join(tempDir, 'solution.c');
  let exePath = path.join(tempDir, 'solution');
  
  if (process.platform === 'win32') {
    exePath += '.exe';
  }

  fs.writeFileSync(sourcePath, userCode);

  let compilationError = null;
  try {
    // Compile the C code using gcc
    execSync(`gcc -O2 "${sourcePath}" -o "${exePath}"`, { stdio: 'pipe' });
  } catch (err) {
    compilationError = err.stderr ? err.stderr.toString() : err.message;
  }

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    let actualOutput = null;
    let executionError = null;
    const startTime = performance.now();
    let logs = '';

    if (compilationError) {
      executionError = "Compilation Error:\\n" + compilationError;
    } else {
      try {
        // Prepare input (convert array of args to string if necessary)
        const rawInput = tc.input;
        const inputStr = Array.isArray(rawInput) ? rawInput.join(' ') : String(rawInput);
        
        // Execute the binary with timeout
        const output = execSync(`"${exePath}"`, { 
          input: inputStr, 
          timeout: 2000,
          stdio: 'pipe' 
        });
        
        actualOutput = output.toString().trim();
      } catch (err) {
        if (err.code === 'ETIMEDOUT') {
          executionError = 'Execution Timeout (2000ms)';
        } else {
          executionError = err.stderr ? err.stderr.toString() : err.message;
        }
      }
    }

    const endTime = performance.now();
    const executionTimeMs = parseFloat((endTime - startTime).toFixed(2));

    // Simple string equality for C output comparison
    const expectedStr = Array.isArray(tc.expected) ? JSON.stringify(tc.expected).replace(/[\\[\\]]/g, '') : String(tc.expected).trim();
    
    let isPassed = false;
    if (!executionError) {
      if (actualOutput === expectedStr) {
         isPassed = true;
      } else {
         // Attempt loose matching (e.g. ignoring trailing newlines)
         if (actualOutput.trim() === expectedStr.trim()) {
            isPassed = true;
         }
      }
    }
    
    if (isPassed) passedCount++;

    results.push({
      id: tc.id || i + 1,
      input: tc.input,
      expected: tc.expected,
      actual: actualOutput,
      passed: isPassed,
      error: executionError,
      logs: logs,
      isHidden: Boolean(tc.isHidden),
      executionTimeMs,
    });
  }

  // Cleanup temp files safely
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {
    console.error("Cleanup error:", e);
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
