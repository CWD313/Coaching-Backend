import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const studentSchema = new mongoose.Schema(
  {
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coach',
      required: [true, 'Coach ID is required'],
      index: true
    },
    studentId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Mobile number must be 10 digits']
    },
    fatherName: {
      type: String,
      required: [true, 'Father name is required'],
      trim: true
    },
    fatherMobileNumber: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Father mobile number must be 10 digits']
    },
    address: String,
    city: String,
    state: String,
    pincode: String,
    dateOfBirth: Date,
    enrollmentDate: {
      type: Date,
      default: Date.now
    },
    batchIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch'
      }
    ],
    photo: String,
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    },
    remarks: String
  },
  {
    timestamps: true
  }
);

// Create indexes
studentSchema.index({ coachId: 1, status: 1 });
studentSchema.index({ coachId: 1, firstName: 'text', lastName: 'text', fatherName: 'text', mobileNumber: 'text', studentId: 'text' });
studentSchema.index({ mobileNumber: 1 }, { unique: true });
studentSchema.index({ coachId: 1, enrollmentDate: -1 });
studentSchema.index({ batchIds: 1 });

// Compound index for uniqueness within coach (email)
studentSchema.index({ coachId: 1, email: 1 }, { sparse: true });

// Middleware to auto-generate studentId before saving
studentSchema.pre('save', async function (next) {
  if (this.isNew && !this.studentId) {
    try {
      // Generate studentId format: STU-COACHID-TIMESTAMP-RANDOM
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      this.studentId = `STU-${timestamp}-${random}`;

      // Ensure uniqueness
      let exists = await mongoose.model('Student').findOne({ studentId: this.studentId });
      let counter = 1;

      while (exists) {
        const newRandom = (parseInt(random) + counter).toString().padStart(4, '0');
        this.studentId = `STU-${timestamp}-${newRandom}`;
        exists = await mongoose.model('Student').findOne({ studentId: this.studentId });
        counter++;
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

export const Student = mongoose.model('Student', studentSchema);
