// src/models/Attendance.js (सुधारा गया)

// NOTE: 'require' को 'import' से बदला गया
import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema(
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
    date: {
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
    // Array of attendance records for each student
    attendance: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Student',
          required: true,
        },
        // Status: 'present', 'absent', 'holiday'
        status: {
          type: String,
          enum: ['present', 'absent', 'holiday'],
          default: 'absent',
        },
        _id: false, // Don't create separate IDs for array items
      },
    ],
    // Audit trail
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coach',
      required: true,
    },
    // Track if marked as holiday
    isHoliday: {
      type: Boolean,
      default: false,
    },
    // Holiday reason/name if applicable
    holidayReason: {
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
    timestamps: false, // We're managing createdAt/updatedAt manually
  }
);

// Compound unique index on coachId, batchId, date
AttendanceSchema.index({ coachId: 1, batchId: 1, date: 1 }, { unique: true });

// Index for querying by batch and date range
AttendanceSchema.index({ batchId: 1, date: -1 });

// Index for querying attendance by student and date range
AttendanceSchema.index({ 'attendance.studentId': 1, date: -1 });

// Pre-save middleware to update updatedAt
AttendanceSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// ✅ FIX: Named Export का उपयोग करें ताकि यह controller में आयात किया जा सके
export const Attendance = mongoose.model('Attendance', AttendanceSchema);
