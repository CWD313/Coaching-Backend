import mongoose from 'mongoose';

const TestMarksSchema = new mongoose.Schema(
  {
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coach',
      required: true,
      index: true,
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    // Marks obtained by student
    marksObtained: {
      type: Number,
      required: true,
      min: 0,
    },
    // Number of correct answers (optional)
    correctAnswers: {
      type: Number,
      default: null,
    },
    // Number of wrong answers (optional)
    wrongAnswers: {
      type: Number,
      default: null,
    },
    // Number of attempted questions
    attemptedQuestions: {
      type: Number,
      default: null,
    },
    // Test submission time
    submittedAt: {
      type: Date,
      required: true,
    },
    // Time taken to complete test (in minutes)
    timeTaken: {
      type: Number,
      default: null,
    },
    // Performance status
    status: {
      type: String,
      enum: ['passed', 'failed', 'absent'],
      default: 'passed',
    },
    // Percentile rank (calculated later)
    percentile: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    // Rank in batch for this test
    rank: {
      type: Number,
      default: null,
    },
    // Remarks or feedback
    remarks: {
      type: String,
      default: null,
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
    timestamps: false,
  }
);

// Compound unique index - one entry per student per test
TestMarksSchema.index({ coachId: 1, testId: 1, studentId: 1 }, { unique: true });

// Indexes for efficient querying
TestMarksSchema.index({ studentId: 1, testId: 1 });
TestMarksSchema.index({ testId: 1, marksObtained: -1 }); // For ranking
TestMarksSchema.index({ studentId: 1, createdAt: -1 }); // Test history
TestMarksSchema.index({ batchId: 1, testId: 1 }); // Batch test scores

// Pre-save middleware
TestMarksSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const TestMarks = mongoose.model('TestMarks', TestMarksSchema);
