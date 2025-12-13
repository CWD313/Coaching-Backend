import mongoose from 'mongoose';

const TestSchema = new mongoose.Schema(
  {
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coach',
      required: true,
      index: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    testName: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      // Examples: Mathematics, Physics, Chemistry, English, etc.
      index: true,
    },
    testDate: {
      type: Date,
      required: true,
      // Store as YYYY-MM-DD for consistency
      set: (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
      },
      index: true,
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 0,
      max: 1000,
    },
    passingMarks: {
      type: Number,
      default: null,
      min: 0,
    },
    // Negative marking details
    hasNegativeMarking: {
      type: Boolean,
      default: false,
    },
    negativeMarkPerWrongAnswer: {
      type: Number,
      default: null,
    },
    // Test description or instructions
    description: {
      type: String,
      default: null,
    },
    // Status of test
    status: {
      type: String,
      enum: ['active', 'archived', 'cancelled'],
      default: 'active',
    },
    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coach',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We're managing manually
  }
);

// Compound index for efficient querying
TestSchema.index({ coachId: 1, batchId: 1, testDate: -1 });
TestSchema.index({ coachId: 1, subject: 1, testDate: -1 });
TestSchema.index({ batchId: 1, testDate: -1 });

// Pre-save middleware
TestSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Test', TestSchema);
