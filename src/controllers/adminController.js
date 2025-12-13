import TenantSettings from '../models/TenantSettings.js';

export const getFlags = async (req, res) => {
  try {
    const coachId = req.coachId;
    const settings = await TenantSettings.findOne({ coachId }).lean();
    if (!settings) {
      return res.status(200).json({ success: true, flags: { freeTrial: true, studentLimit: 10, exportsEnabled: false } });
    }
    return res.status(200).json({ success: true, flags: settings });
  } catch (error) {
    console.error('getFlags error', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateFlags = async (req, res) => {
  try {
    const coachId = req.coachId;
    const { freeTrial, studentLimit, exportsEnabled } = req.body;

    const update = {};
    if (typeof freeTrial === 'boolean') update.freeTrial = freeTrial;
    if (typeof studentLimit === 'number') update.studentLimit = studentLimit;
    if (typeof exportsEnabled === 'boolean') update.exportsEnabled = exportsEnabled;

    update.updatedBy = coachId;
    update.updatedAt = new Date();

    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
    const settings = await TenantSettings.findOneAndUpdate({ coachId }, update, opts).lean();

    return res.status(200).json({ success: true, flags: settings });
  } catch (error) {
    console.error('updateFlags error', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export default { getFlags, updateFlags };
