import mongoose from 'mongoose';
import TestMarks from '../models/TestMarks.js';
import Test from '../models/Test.js';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';

const { Types } = mongoose;

// 1) Attendance percentage for a given student for a month
export const getMonthlyAttendancePercentage = async (req, res) => {
  try {
    const coachId = req.coachId;
    const { studentId, year, month } = req.query;

    if (!studentId || !year || !month) {
      return res.status(400).json({ success: false, message: 'studentId, year and month are required' });
    }

    const start = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    const end = new Date(parseInt(year, 10), parseInt(month, 10), 1);

    const matchStage = {
      $match: {
        coachId: Types.ObjectId(coachId),
        date: { $gte: start, $lt: end },
        'attendance.studentId': Types.ObjectId(studentId),
      },
    };

    const pipeline = [
      matchStage,
      { $unwind: '$attendance' },
      { $match: { 'attendance.studentId': Types.ObjectId(studentId) } },
      // exclude holiday records
      { $match: { 'attendance.status': { $ne: 'holiday' } } },
      // Group by date to ensure one record per day
      {
        $group: {
          _id: '$date',
          status: { $first: '$attendance.status' },
        },
      },
      {
        $group: {
          _id: null,
          totalDays: { $sum: 1 },
          presentDays: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        },
      },
    ];

    const result = await Attendance.aggregate(pipeline).allowDiskUse(true);

    const stats = result[0] || { totalDays: 0, presentDays: 0 };
    const percentage = stats.totalDays > 0 ? +( (stats.presentDays / stats.totalDays) * 100 ).toFixed(2) : 0;

    return res.status(200).json({ success: true, totalDays: stats.totalDays, presentDays: stats.presentDays, percentage });
  } catch (error) {
    console.error('getMonthlyAttendancePercentage error', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 2) Marks vs time for a student (ordered by test date)
export const getMarksOverTime = async (req, res) => {
  try {
    const coachId = req.coachId;
    const { studentId, limit = 100 } = req.query;

    if (!studentId) return res.status(400).json({ success: false, message: 'studentId is required' });

    const pipeline = [
      { $match: { coachId: Types.ObjectId(coachId), studentId: Types.ObjectId(studentId) } },
      {
        $lookup: {
          from: 'tests',
          localField: 'testId',
          foreignField: '_id',
          as: 'test',
        },
      },
      { $unwind: '$test' },
      {
        $project: {
          _id: 0,
          testId: '$test._id',
          testName: '$test.testName',
          subject: '$test.subject',
          date: '$test.testDate',
          marksObtained: 1,
          totalMarks: '$test.totalMarks',
          percentage: { $cond: [{ $gt: ['$test.totalMarks', 0] }, { $round: [{ $multiply: [{ $divide: ['$marksObtained', '$test.totalMarks'] }, 100] }, 2] }, null] },
        },
      },
      { $sort: { date: 1 } },
      { $limit: parseInt(limit, 10) },
    ];

    const data = await TestMarks.aggregate(pipeline).allowDiskUse(true);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('getMarksOverTime error', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 3) Subject-wise marks summary for a student
export const getSubjectWiseMarks = async (req, res) => {
  try {
    const coachId = req.coachId;
    const { studentId } = req.query;

    if (!studentId) return res.status(400).json({ success: false, message: 'studentId is required' });

    const pipeline = [
      { $match: { coachId: Types.ObjectId(coachId), studentId: Types.ObjectId(studentId) } },
      {
        $lookup: {
          from: 'tests',
          localField: 'testId',
          foreignField: '_id',
          as: 'test',
        },
      },
      { $unwind: '$test' },
      {
        $group: {
          _id: '$test.subject',
          testsTaken: { $sum: 1 },
          averageMarks: { $avg: '$marksObtained' },
          averagePercentage: { $avg: { $multiply: [{ $divide: ['$marksObtained', '$test.totalMarks'] }, 100] } },
          bestScore: { $max: '$marksObtained' },
          worstScore: { $min: '$marksObtained' },
        },
      },
      {
        $project: {
          _id: 0,
          subject: '$_id',
          testsTaken: 1,
          averageMarks: { $round: ['$averageMarks', 2] },
          averagePercentage: { $round: ['$averagePercentage', 2] },
          bestScore: 1,
          worstScore: 1,
        },
      },
    ];

    const summary = await TestMarks.aggregate(pipeline).allowDiskUse(true);
    return res.status(200).json({ success: true, summary });
  } catch (error) {
    console.error('getSubjectWiseMarks error', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 4) Search students by name, father name, mobile or studentId (optimized)
export const searchStudents = async (req, res) => {
  try {
    const coachId = req.coachId;
    const { q = '', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Query param q is required' });
    }

    const isDigits = /^[0-9]{10}$/.test(q.trim());
    const isStudentCode = /^STU-/.test(q.trim());

    const baseQuery = { coachId: Types.ObjectId(coachId) };

    if (isDigits) {
      baseQuery.mobileNumber = q.trim();
    } else if (isStudentCode) {
      baseQuery.studentId = q.trim();
    } else {
      const re = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      baseQuery.$or = [
        { firstName: re },
        { lastName: re },
        { fatherName: re },
        { mobileNumber: re },
        { studentId: re },
      ];
    }

    const [total, students] = await Promise.all([
      Student.countDocuments(baseQuery),
      Student.find(baseQuery, { firstName: 1, lastName: 1, studentId: 1, mobileNumber: 1, fatherName: 1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
    ]);

    return res.status(200).json({ success: true, total, page: parseInt(page, 10), limit: parseInt(limit, 10), students });
  } catch (error) {
    console.error('searchStudents error', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export default {
  getMonthlyAttendancePercentage,
  getMarksOverTime,
  getSubjectWiseMarks,
  searchStudents,
};
