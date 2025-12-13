import mongoose from 'mongoose';

const TenantSettingsSchema = new mongoose.Schema(
  {
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach', required: true, unique: true, index: true },
    freeTrial: { type: Boolean, default: true },
    studentLimit: { type: Number, default: 10 },
    exportsEnabled: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach' },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('TenantSettings', TenantSettingsSchema);
