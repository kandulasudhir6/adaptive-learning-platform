import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import cookieParser from 'cookie-parser';

// Routes
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import examRoutes from './routes/examRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import codeRoutes from './routes/codeRoutes.js';
import pool from './config/db.js';
import { seedDatabase } from './seed/seedData.js';
import { seedEnhancements } from './seed/seedEnhancements.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cookieParser());

// Enable CORS for frontend development and Mobile Network Origins
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow mobile webviews (often null origin) and any remote connection
      callback(null, origin || '*');
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Crucial for mobile session cookies
  })
);

app.use(express.json());

// Auto-seed check for missing courses
try {
  const courseCheck = await pool.query('SELECT COUNT(*) as cnt FROM courses');
  if (!courseCheck.rows[0] || courseCheck.rows[0].cnt === '0' || courseCheck.rows[0].cnt === 0) {
    console.log('dYO Critical tables empty! Force running seedData...');
    import('./seed/seedData.js').then(s => s.seedDatabase()).catch(console.error);
  }
} catch (err) {
  console.error('Error checking courses on startup:', err);
}

// Mount API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/exams', examRoutes);
app.use('/api/v1/tests', examRoutes); 
app.use('/api/v1/faculty', facultyRoutes);
app.use('/api/v1/code', codeRoutes);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve compiled frontend assets if available
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected internal server error occurred.',
  });
});

app.listen(PORT, () => {
  console.log(`dYs? Adaptive Learning Platform API Server running on port ${PORT}`);
  console.log(`dY" Health check available at http://localhost:${PORT}/api/v1/health`);
});
