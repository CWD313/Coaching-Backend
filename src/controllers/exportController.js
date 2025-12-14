import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import { Student } } from '../models/Student.js';
import { Attendance } from '../models/Attendance.js';
import TestMarks from '../models/TestMarks.js';
import Test from '../models/Test.js';

const { Types } = mongoose;

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toISOString().slice(0, 10);
}

export const exportMonthlyExcel = async (req, res) => {
  try {
    // Enforce export permission via tenant flags
    if (req.flags && req.flags.freeTrial && !req.flags.exportsEnabled) {
      return res.status(403).json({ success: false, message: 'Excel export is disabled for free plan. Upgrade to enable.' });
    }
    const coachId = req.coachId;
    const { batchId, studentId, year, month } = req.query;

    if (!batchId || !year || !month) {
      return res.status(400).json({ success: false, message: 'batchId, year and month are required' });
    }

    const start = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    const end = new Date(parseInt(year, 10), parseInt(month, 10), 1);

    // Fetch students (single or batch)
    let students = [];
    if (studentId) {
      const s = await Student.findOne({ _id: studentId, coachId }).lean();
      if (s) students = [s];
    } else {
      students = await Student.find({ coachId: coachId, batchIds: Types.ObjectId(batchId) }).lean();
    }

    // Attendance aggregation across students for the month
    const attendanceAgg = [
      { $match: { coachId: Types.ObjectId(coachId), batchId: Types.ObjectId(batchId), date: { $gte: start, $lt: end } } },
      { $unwind: '$attendance' },
      { $match: { 'attendance.status': { $ne: 'holiday' } } },
      { $group: { _id: '$attendance.studentId', totalDays: { $sum: 1 }, presentDays: { $sum: { $cond: [{ $eq: ['$attendance.status', 'present'] }, 1, 0] } }, absentDays: { $sum: { $cond: [{ $eq: ['$attendance.status', 'absent'] }, 1, 0] } } } },
    ];

    const attResults = await Attendance.aggregate(attendanceAgg).allowDiskUse(true);
    const attMap = new Map(attResults.map((r) => [String(r._id), r]));

    // Test marks rows for month across batch
    const marksAgg = [
      { $match: { coachId: Types.ObjectId(coachId) } },
      { $lookup: { from: 'tests', localField: 'testId', foreignField: '_id', as: 'test' } },
      { $unwind: '$test' },
      { $match: { 'test.batchId': Types.ObjectId(batchId), 'test.testDate': { $gte: start, $lt: end } } },
      { $project: { studentId: 1, marksObtained: 1, totalMarks: '$test.totalMarks', testName: '$test.testName', subject: '$test.subject', date: '$test.testDate' } },
      { $sort: { studentId: 1, date: 1 } },
    ];

    const marksRows = await TestMarks.aggregate(marksAgg).allowDiskUse(true);

    // Create workbook and sheets
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CoachingApp';
    workbook.created = new Date();

    const attSheet = workbook.addWorksheet('Attendance');
    attSheet.columns = [
      { header: 'Student ID', key: 'studentId', width: 20 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'Total Days', key: 'totalDays', width: 12 },
      { header: 'Present Days', key: 'presentDays', width: 12 },
      { header: 'Absent Days', key: 'absentDays', width: 12 },
      { header: 'Attendance %', key: 'attendancePct', width: 12 },
    ];

    for (const s of students) {
      const stats = attMap.get(String(s._id)) || { totalDays: 0, presentDays: 0, absentDays: 0 };
      const pct = stats.totalDays > 0 ? ((stats.presentDays / stats.totalDays) * 100).toFixed(2) : '0.00';
      attSheet.addRow({ studentId: s.studentId || String(s._id), name: `${s.firstName} ${s.lastName}`, mobile: s.mobileNumber || '', totalDays: stats.totalDays, presentDays: stats.presentDays, absentDays: stats.absentDays, attendancePct: pct });
    }

    const marksSheet = workbook.addWorksheet('Test Marks');
    marksSheet.columns = [
      { header: 'Student ID', key: 'studentId', width: 20 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Test Name', key: 'testName', width: 30 },
      { header: 'Subject', key: 'subject', width: 20 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Marks Obtained', key: 'marksObtained', width: 15 },
      { header: 'Total Marks', key: 'totalMarks', width: 12 },
      { header: 'Percentage', key: 'percentage', width: 12 },
    ];

    // Map student id to name for lookups
    const studentNameMap = new Map(students.map((s) => [String(s._id), `${s.firstName} ${s.lastName}`]));

    for (const r of marksRows) {
      const sid = String(r.studentId);
      const name = studentNameMap.get(sid) || '';
      const pct = r.totalMarks ? ((r.marksObtained / r.totalMarks) * 100).toFixed(2) : '';
      marksSheet.addRow({ studentId: sid, name, testName: r.testName || '', subject: r.subject || '', date: fmtDate(r.date), marksObtained: r.marksObtained, totalMarks: r.totalMarks, percentage: pct });
    }

    // Stream workbook to response
    const filename = `monthly-export-${year}-${String(month).padStart(2, '0')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('exportMonthlyExcel error', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export default { exportMonthlyExcel };
