import { verifyToken } from '../utils/tokenUtils.js';

/**
 * Middleware to verify JWT token and protect routes
 */
// अब यह const declaration है, export नहीं
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please login first'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    req.coachId = decoded.coachId;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// ----------------------------------------------------
// ✅ FIX: Named Export (export const ...) को Default Export में बदला गया
// ----------------------------------------------------
export default authMiddleware;
