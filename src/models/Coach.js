import mongoose from 'mongoose';

const coachSchema = new mongoose.Schema(
  {
    coachingName: {
      type: String,
      required: [true, 'Coaching name is required'],
      trim: true
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true,
      match: [/^[0-9]{10}$/, 'Mobile number must be 10 digits']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false // Don't return password by default
    },
    address: String,
    city: String,
    state: String,
    country: String,
    pincode: String,
    gstNumber: String,
    logo: String,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Create indexes
coachSchema.index({ email: 1 }, { unique: true });
coachSchema.index({ mobileNumber: 1 }, { unique: true });
coachSchema.index({ createdAt: -1 });

export const Coach = mongoose.model('Coach', coachSchema);
