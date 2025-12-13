import { Coach } from '../models/Coach.js';
import { hashPassword, comparePassword } from '../utils/passwordUtils.js';
import { generateToken } from '../utils/tokenUtils.js';
import { config } from '../config/config.js';

/**
 * Signup - Coaching owner registration with invite code
 */
export const signup = async (req, res) => {
  try {
    const { coachingName, ownerName, email, mobileNumber, password, inviteCode } = req.body;

    // Validate invite code
    if (inviteCode !== config.auth.adminInviteCode) {
      return res.status(401).json({
        success: false,
        message: 'Invalid invite code. Contact admin for access.'
      });
    }

    // Check if coach already exists
    const existingCoach = await Coach.findOne({
      $or: [{ email }, { mobileNumber }]
    });

    if (existingCoach) {
      return res.status(409).json({
        success: false,
        message: 'Email or mobile number already registered'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new coach
    const coach = new Coach({
      coachingName,
      ownerName,
      email,
      mobileNumber,
      password: hashedPassword,
      isActive: true
    });

    await coach.save();

    // Generate token
    const token = generateToken(coach._id);

    // Response without password
    const coachData = coach.toObject();
    delete coachData.password;

    res.status(201).json({
      success: true,
      message: 'Signup successful',
      token,
      coach: coachData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Login - Coaching owner login with mobile and password
 */
export const login = async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;

    // Validate inputs
    if (!mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and password are required'
      });
    }

    // Find coach by mobile number and include password field
    const coach = await Coach.findOne({ mobileNumber }).select('+password');

    if (!coach) {
      return res.status(401).json({
        success: false,
        message: 'Invalid mobile number or password'
      });
    }

    // Check if account is active
    if (!coach.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, coach.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid mobile number or password'
      });
    }

    // Generate token
    const token = generateToken(coach._id);

    // Response without password
    const coachData = coach.toObject();
    delete coachData.password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      coach: coachData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get current coach profile
 */
export const getProfile = async (req, res) => {
  try {
    const coach = await Coach.findById(req.coachId);

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    res.status(200).json({
      success: true,
      coach
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update coach profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { coachingName, ownerName, address, city, state, country, pincode, gstNumber, logo } = req.body;

    const coach = await Coach.findByIdAndUpdate(
      req.coachId,
      {
        coachingName,
        ownerName,
        address,
        city,
        state,
        country,
        pincode,
        gstNumber,
        logo
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      coach
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Change password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Get coach with password field
    const coach = await Coach.findById(req.coachId).select('+password');

    // Verify current password
    const isValid = await comparePassword(currentPassword, coach.password);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash and update new password
    const hashedPassword = await hashPassword(newPassword);
    coach.password = hashedPassword;
    await coach.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
