import { executeCode } from '../services/codeRunner.js';
import pool from '../config/db.js';

/**
 * POST /api/v1/code/run
 * Execute user code against provided or stored test cases
 */
export const runCode = async (req, res) => {
  const userCode = req.body.userCode || req.body.code;
  const { challengeId, customTestCases, entryFunctionName = 'solution' } = req.body;

  if (!userCode) {
    return res.status(400).json({ error: 'Code content is required.' });
  }

  try {
    let testCasesToRun = customTestCases || [];

    // If challengeId provided, load from database
    if (challengeId && testCasesToRun.length === 0) {
      let challengeRes = await pool.query(
        `SELECT id, test_cases_json FROM coding_challenges WHERE id = $1`,
        [challengeId]
      );
      if (challengeRes.rows.length === 0) {
        challengeRes = await pool.query(
          `SELECT id, test_cases_json FROM coding_challenges WHERE title LIKE $1 LIMIT 1`,
          [`%${challengeId}%`]
        );
      }
      if (challengeRes.rows.length > 0) {
        try {
          testCasesToRun = JSON.parse(challengeRes.rows[0].test_cases_json);
        } catch (e) {
          testCasesToRun = [];
        }
      }
    }

    // Fallback to first available challenge if no test cases found
    if (testCasesToRun.length === 0) {
      const fallbackRes = await pool.query(`SELECT test_cases_json FROM coding_challenges LIMIT 1`);
      if (fallbackRes.rows.length > 0) {
        try {
          testCasesToRun = JSON.parse(fallbackRes.rows[0].test_cases_json);
        } catch (e) {
          testCasesToRun = [];
        }
      }
    }

    if (testCasesToRun.length === 0) {
      return res.status(400).json({ error: 'No test cases available to evaluate.' });
    }

    // Run execution in isolated VM
    const evaluation = executeCode(userCode, testCasesToRun, entryFunctionName);

    return res.status(200).json({
      success: true,
      ...evaluation,
    });
  } catch (err) {
    console.error('Error running code:', err);
    return res.status(500).json({ error: 'Execution environment error.' });
  }
};
