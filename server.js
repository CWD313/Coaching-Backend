import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './src/db/db.js';
import { config } from './src/config/config.js';
import authRoutes from './src/routes/authRoutes.js';
import studentRoutes from './src/routes/studentRoutes.js';
import attendanceRoutes from './src/routes/attendanceRoutes.js';
import marksRoutes from './src/routes/marksRoutes.js';
import performanceRoutes from './src/routes/performanceRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';
import exportRoutes from './src/routes/exportRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';

const app = express();

/**
 * Middleware
 */
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded requests

/**
 * Database Connection
 */
connectDB();

/**
 * Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/admin', adminRoutes);

/**
 * Health Check Endpoint
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

/**
 * Error Handler
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

/**
 * Start Server
 */
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API Docs: http://localhost:${PORT}/api/health\n`);
});

export default app;
