import TenantSettings from '../models/TenantSettings.js';

// Middleware to load tenant feature flags into req.flags
export const loadTenantFlags = async (req, res, next) => {
  try {
    const coachId = req.coachId;
    if (!coachId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Find settings for coach
    const settings = await TenantSettings.findOne({ coachId }).lean();
    if (!settings) {
      // defaults
      req.flags = { freeTrial: true, studentLimit: 10, exportsEnabled: false };
    } else {
      req.flags = {
        freeTrial: settings.freeTrial,
        studentLimit: settings.studentLimit,
        exportsEnabled: settings.exportsEnabled,
        raw: settings
      };
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default loadTenantFlags;
