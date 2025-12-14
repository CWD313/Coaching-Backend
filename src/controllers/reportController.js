import PDFDocument from 'pdfkit';
import mongoose from 'mongoose';
import Student from '../models/Student.js';
import { Attendance } from '../models/Attendance.js';
import TestMarks from '../models/TestMarks.js';
import Test from '../models/Test.js';

const { Types } = mongoose;

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toISOString().slice(0, 10);
}

export const generateMonthlyReportPDF = async (req, res) => {
  try {
    // Enforce export permission via tenant flags
    if (req.flags && req.flags.freeTrial && !req.flags.exportsEnabled) {
      return res.status(403).json({ success: false, message: 'PDF export is disabled for free plan. Upgrade to enable.' });
    }
    const coachId = req.coachId;
    const { batchId, studentId, year, month } = req.query;

    if (!batchId || !year || !month) {
      return res.status(400).json({ success: false, message: 'batchId, year and month are required' });
    }

    const start = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    const end = new Date(parseInt(year, 10), parseInt(month, 10), 1);

    // get students in batch (or single student)
    let students = [];
    if (studentId) {
      const s = await Student.findOne({ _id: studentId, coachId }).lean();
      if (s) students = [s];
    } else {
      students = await Student.find({ coachId: coachId, batchIds: Types.ObjectId(batchId) }).lean();
    }

    // Setup PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="monthly-report-${year}-${month}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    // Header
    doc.fontSize(18).text('Monthly Student Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Batch: ${batchId}    Month: ${year}-${String(month).padStart(2, '0')}`, { align: 'center' });
    doc.moveDown(1);

    for (let i = 0; i < students.length; i += 1) {
      const s = students[i];

      // Attendance aggregation
      const attendanceAgg = [
        { $match: { coachId: Types.ObjectId(coachId), batchId: Types.ObjectId(batchId), date: { $gte: start, $lt: end } } },
        { $unwind: '$attendance' },
        { $match: { 'attendance.studentId': Types.ObjectId(s._id), 'attendance.status': { $ne: 'holiday' } } },
        { $group: { _id: null, totalDays: { $sum: 1 }, presentDays: { $sum: { $cond: [{ $eq: ['$attendance.status', 'present'] }, 1, 0] } }, absentDays: { $sum: { $cond: [{ $eq: ['$attendance.status', 'absent'] }, 1, 0] } } } },
      ];

      const attRes = await Attendance.aggregate(attendanceAgg).allowDiskUse(true);
      const att = attRes[0] || { totalDays: 0, presentDays: 0, absentDays: 0 };
      const attendancePct = att.totalDays > 0 ? ((att.presentDays / att.totalDays) * 100).toFixed(2) : '0.00';

      // Test marks aggregation - list tests in this month for student's batch
      const marksAgg = [
        { $match: { coachId: Types.ObjectId(coachId), studentId: Types.ObjectId(s._id) } },
        {
          $lookup: {
            from: 'tests',
            localField: 'testId',
            foreignField: '_id',
            as: 'test',
          },
        },
        { $unwind: '$test' },
        { $match: { 'test.batchId': Types.ObjectId(batchId), 'test.testDate': { $gte: start, $lt: end } } },
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
      ];

      const markRows = await TestMarks.aggregate(marksAgg).allowDiskUse(true);

      // Write student section
      doc.fontSize(12).fillColor('#111827').text(`${s.firstName} ${s.lastName} (${s.studentId || s._id})`, { continued: false });
      doc.fontSize(10).fillColor('#374151').text(`Mobile: ${s.mobileNumber || 'N/A'} | Father: ${s.fatherName || 'N/A'}`);

      doc.moveDown(0.3);
      doc.fontSize(10).text(`Attendance: ${attendancePct}%   (Present: ${att.presentDays} / Total: ${att.totalDays})   Absent days: ${att.absentDays}`);
      doc.moveDown(0.3);

      doc.fontSize(10).text('Tests:', { underline: true });
      if (!markRows || markRows.length === 0) {
        doc.fontSize(10).text('  No tests in this month.');
      } else {
        // table header
        doc.moveDown(0.2);
        markRows.forEach((r) => {
          const line = `  ${fmtDate(r.date)} | ${r.testName} | ${r.subject} | ${r.marksObtained}/${r.totalMarks} (${r.percentage != null ? r.percentage + '%' : 'N/A'})`;
          doc.fontSize(9).text(line);
        });
      }

      // Add page break if not last
      if (i < students.length - 1) {
        doc.addPage();
      }
    }

    doc.end();
  } catch (error) {
    console.error('generateMonthlyReportPDF error', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export default { generateMonthlyReportPDF };
