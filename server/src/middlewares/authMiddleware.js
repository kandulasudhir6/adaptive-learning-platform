import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'adaptive_learning_secret_super_key_2026';

/**
 * Middleware to verify JWT token and extract user context
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

/**
 * Middleware to enforce role-based access control
 * Accepts single or multiple allowed roles: requireRole('student') or requireRole('mentor', 'faculty')
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Unauthorized user context.' });
    }

    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({
        error: `Forbidden. Requires one of roles: [${allowedRoles.join(', ')}]. Current: ${req.user.role}`
      });
    }

    next();
  };
};

export { JWT_SECRET };
