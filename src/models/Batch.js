// src/models/Batch.js

import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema(
  {
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coach', // Coach मॉडल से लिंक
      required: true,
      index: true,
    },
    batchName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      // उदाहरण: Math, Physics, Hindi
    },
    timing: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      // उदाहरण: 7:00 AM - 8:30 AM
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['Active', 'Archived', 'Suspended'],
      default: 'Active',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null, // यदि बैच ओपन-एंडेड है
    },
  },
  {
    timestamps: true,
    collection: 'batches',
  }
);

// कंपाउंड इंडेक्स: एक कोच के लिए बैच का नाम यूनिक होना चाहिए
batchSchema.index({ coachId: 1, batchName: 1 }, { unique: true });

// ✅ Named Export का उपयोग करें, जैसा कि marksController.js में अपेक्षित है
export const Batch = mongoose.model('Batch', batchSchema);
