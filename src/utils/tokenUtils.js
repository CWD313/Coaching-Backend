import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

/**
 * Generate JWT token
 */
export const generateToken = (coachId) => {
  return jwt.sign(
    { coachId },
    config.jwt.secret,
    { expiresIn: config.jwt.expire }
  );
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};
