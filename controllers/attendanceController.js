const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Batch = require('../models/Batch');

/**
 * Mark attendance for multiple students (auto-save on click)
 * Supports updating existing attendance or creating new
 */
exports.markAttendance = async (req, res) => {
  try {
    const { coachId } = req;
    const { batchId, date, attendance } = req.body;

    // Verify batch belongs to coach
    const batch = await Batch.findOne({ _id: batchId, coachId });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found',
      });
    }

    // Check if all students belong to the batch
    const studentIds = attendance.map((a) => a.studentId);
    const validStudents = await Student.find({
      _id: { $in: studentIds },
      coachId,
      batchIds: batchId,
    });

    if (validStudents.length !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message:
          'One or more students do not belong to this batch or coaching',
      });
    }

    // Format date to YYYY-MM-DD at 00:00:00
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists
    let attendanceRecord = await Attendance.findOne({
      coachId,
      batchId,
      date: attendanceDate,
    });

    if (attendanceRecord) {
      // Update existing attendance records
      const attendanceMap = new Map(
        attendance.map((a) => [a.studentId.toString(), a.status])
      );

      attendanceRecord.attendance = attendanceRecord.attendance.map((a) => {
        const newStatus = attendanceMap.get(a.studentId.toString());
        if (newStatus) {
          a.status = newStatus;
        }
        return a;
      });

      attendanceRecord.isHoliday = false;
      attendanceRecord.holidayReason = null;
      attendanceRecord.markedBy = coachId;
      await attendanceRecord.save();
    } else {
      // Create new attendance record
      attendanceRecord = new Attendance({
        coachId,
        batchId,
        date: attendanceDate,
        attendance: attendance.map((a) => ({
          studentId: a.studentId,
          status: a.status,
        })),
        markedBy: coachId,
        isHoliday: false,
      });

      await attendanceRecord.save();
    }

    // Populate student details for response
    await attendanceRecord.populate('attendance.studentId', 'studentId firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      attendance: {
        _id: attendanceRecord._id,
        batchId: attendanceRecord.batchId,
        date: attendanceRecord.date,
        records: attendanceRecord.attendance,
        markedAt: attendanceRecord.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message,
    });
  }
};

/**
 * Mark entire batch as holiday
 * Sets all students' status to 'holiday'
 */
exports.markHoliday = async (req, res) => {
  try {
    const { coachId } = req;
    const { batchId, date, holidayReason } = req.body;

    // Verify batch belongs to coach
    const batch = await Batch.findOne({ _id: batchId, coachId });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found',
      });
    }

    // Get all active students in the batch
    const batchStudents = await Student.find({
      coachId,
      batchIds: batchId,
      status: 'active',
    });

    if (batchStudents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active students found in this batch',
      });
    }

    // Format date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Create or update attendance record with holiday status
    let attendanceRecord = await Attendance.findOne({
      coachId,
      batchId,
      date: attendanceDate,
    });

    const holidayAttendance = batchStudents.map((student) => ({
      studentId: student._id,
      status: 'holiday',
    }));

    if (attendanceRecord) {
      attendanceRecord.attendance = holidayAttendance;
      attendanceRecord.isHoliday = true;
      attendanceRecord.holidayReason = holidayReason || null;
      attendanceRecord.markedBy = coachId;
      await attendanceRecord.save();
    } else {
      attendanceRecord = new Attendance({
        coachId,
        batchId,
        date: attendanceDate,
        attendance: holidayAttendance,
        isHoliday: true,
        holidayReason: holidayReason || null,
        markedBy: coachId,
      });

      await attendanceRecord.save();
    }

    // Populate student details for response
    await attendanceRecord.populate('attendance.studentId', 'studentId firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Holiday marked for entire batch',
      attendance: {
        _id: attendanceRecord._id,
        batchId: attendanceRecord.batchId,
        date: attendanceRecord.date,
        isHoliday: true,
        holidayReason: attendanceRecord.holidayReason,
        studentsMarked: attendanceRecord.attendance.length,
        markedAt: attendanceRecord.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error marking holiday:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking holiday',
      error: error.message,
    });
  }
};

/**
 * Get attendance for a specific date
 * Paginated to support 8-10 students per screen
 */
exports.getDateAttendance = async (req, res) => {
  try {
    const { coachId } = req;
    const { batchId, date } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Format date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Get attendance record
    let attendanceRecord = await Attendance.findOne({
      coachId,
      batchId,
      date: attendanceDate,
    }).populate('batchId', 'batchName');

    if (!attendanceRecord) {
      // Return empty attendance with all active students from batch
      const students = await Student.find(
        {
          coachId,
          batchIds: batchId,
          status: 'active',
        },
        'studentId firstName lastName mobileNumber'
      )
        .skip(skip)
        .limit(limit);

      const totalStudents = await Student.countDocuments({
        coachId,
        batchIds: batchId,
        status: 'active',
      });

      return res.status(200).json({
        success: true,
        date: attendanceDate,
        batchId,
        totalStudents,
        attendance: students.map((s) => ({
          studentId: s._id,
          studentCode: s.studentId,
          firstName: s.firstName,
          lastName: s.lastName,
          mobileNumber: s.mobileNumber,
          status: 'absent', // Default to absent if no record
        })),
        page,
        limit,
        totalPages: Math.ceil(totalStudents / limit),
        message: 'No attendance marked yet. Displaying all active students.',
      });
    }

    // Paginate the attendance records
    const paginatedAttendance = attendanceRecord.attendance.slice(skip, skip + limit);

    // Populate student details
    await attendanceRecord.populate('attendance.studentId', 'studentId firstName lastName mobileNumber');

    const enrichedAttendance = paginatedAttendance.map((a) => {
      const student = attendanceRecord.attendance.find(
        (x) => x.studentId._id.toString() === a.studentId.toString()
      );
      return {
        studentId: student?.studentId?._id,
        studentCode: student?.studentId?.studentId,
        firstName: student?.studentId?.firstName,
        lastName: student?.studentId?.lastName,
        mobileNumber: student?.studentId?.mobileNumber,
        status: a.status,
      };
    });

    res.status(200).json({
      success: true,
      date: attendanceDate,
      batchId,
      isHoliday: attendanceRecord.isHoliday,
      holidayReason: attendanceRecord.holidayReason,
      totalStudents: attendanceRecord.attendance.length,
      attendance: enrichedAttendance,
      page,
      limit,
      totalPages: Math.ceil(attendanceRecord.attendance.length / limit),
      markedAt: attendanceRecord.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message,
    });
  }
};

/**
 * Get absent students list for a specific date
 */
exports.getAbsentStudents = async (req, res) => {
  try {
    const { coachId } = req;
    const { batchId, date } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Format date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Get attendance record
    const attendanceRecord = await Attendance.findOne({
      coachId,
      batchId,
      date: attendanceDate,
    });

    if (!attendanceRecord) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found for this date',
      });
    }

    // Filter absent students
    const absentRecords = attendanceRecord.attendance.filter(
      (a) => a.status === 'absent'
    );

    if (absentRecords.length === 0) {
      return res.status(200).json({
        success: true,
        date: attendanceDate,
        batchId,
        totalAbsent: 0,
        absentStudents: [],
        message: 'No absent students for this date',
      });
    }

    // Get student details for absent students
    const absentStudentIds = absentRecords.map((a) => a.studentId);
    const studentDetails = await Student.find(
      { _id: { $in: absentStudentIds }, coachId },
      'studentId firstName lastName mobileNumber fatherMobileNumber'
    )
      .skip(skip)
      .limit(limit);

    // Map with status
    const enrichedAbsentList = studentDetails.map((student) => ({
      studentId: student._id,
      studentCode: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      mobileNumber: student.mobileNumber,
      fatherMobileNumber: student.fatherMobileNumber,
    }));

    res.status(200).json({
      success: true,
      date: attendanceDate,
      batchId,
      totalAbsent: absentRecords.length,
      absentStudents: enrichedAbsentList,
      page,
      limit,
      totalPages: Math.ceil(absentRecords.length / limit),
    });
  } catch (error) {
    console.error('Error fetching absent students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching absent students',
      error: error.message,
    });
  }
};

/**
 * Get monthly absent count for a student
 */
exports.getMonthlyAbsentCount = async (req, res) => {
  try {
    const { coachId } = req;
    const { studentId, year, month } = req.query;

    // Verify student belongs to coach
    const student = await Student.findOne({ _id: studentId, coachId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);

    // Find all attendance records for this student in the month
    const attendanceRecords = await Attendance.find({
      coachId,
      'attendance.studentId': studentId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    // Calculate absent count
    let absentCount = 0;
    let presentCount = 0;
    let holidayCount = 0;
    const absentDates = [];

    attendanceRecords.forEach((record) => {
      const studentAttendance = record.attendance.find(
        (a) => a.studentId.toString() === studentId
      );
      if (studentAttendance) {
        if (studentAttendance.status === 'absent') {
          absentCount++;
          absentDates.push(new Date(record.date));
        } else if (studentAttendance.status === 'present') {
          presentCount++;
        } else if (studentAttendance.status === 'holiday') {
          holidayCount++;
        }
      }
    });

    const totalDays = attendanceRecords.length;
    const attendancePercentage =
      totalDays > 0 ? ((presentCount / totalDays) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      student: {
        studentId: student._id,
        studentCode: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
      },
      month: `${year}-${String(month).padStart(2, '0')}`,
      statistics: {
        totalDays,
        presentDays: presentCount,
        absentDays: absentCount,
        holidayDays: holidayCount,
        attendancePercentage: parseFloat(attendancePercentage),
      },
      absentDates: absentDates.map((d) => d.toISOString().split('T')[0]),
    });
  } catch (error) {
    console.error('Error calculating monthly absent count:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating absent count',
      error: error.message,
    });
  }
};

/**
 * Get monthly attendance report for a batch
 * Includes statistics and absent students list
 */
exports.getMonthlyReport = async (req, res) => {
  try {
    const { coachId } = req;
    const { batchId, year, month } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Verify batch belongs to coach
    const batch = await Batch.findOne({ _id: batchId, coachId });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found',
      });
    }

    // Calculate date range
    const startDate = new Date(year, month - 1, 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);

    // Get all attendance records for this batch in the month
    const attendanceRecords = await Attendance.find({
      coachId,
      batchId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    // Get all active students in batch
    const students = await Student.find({
      coachId,
      batchIds: batchId,
      status: 'active',
    });

    // Calculate statistics for each student
    const studentStats = students.map((student) => {
      let absentDays = 0;
      let presentDays = 0;
      let holidayDays = 0;
      const absentDates = [];

      attendanceRecords.forEach((record) => {
        const attendance = record.attendance.find(
          (a) => a.studentId.toString() === student._id.toString()
        );
        if (attendance) {
          if (attendance.status === 'absent') {
            absentDays++;
            absentDates.push(new Date(record.date).toISOString().split('T')[0]);
          } else if (attendance.status === 'present') {
            presentDays++;
          } else if (attendance.status === 'holiday') {
            holidayDays++;
          }
        }
      });

      const totalDays = absentDays + presentDays + holidayDays;
      const attendancePercentage =
        totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

      return {
        studentId: student._id,
        studentCode: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        mobileNumber: student.mobileNumber,
        absentDays,
        presentDays,
        holidayDays,
        totalDays,
        attendancePercentage: parseFloat(attendancePercentage),
        absentDates,
      };
    });

    // Sort by absent days (descending) to show worst first
    const sortedStats = studentStats.sort((a, b) => b.absentDays - a.absentDays);

    // Get students with low attendance (threshold: < 75%)
    const lowAttendanceStudents = sortedStats.filter(
      (s) => parseFloat(s.attendancePercentage) < 75
    );

    // Paginate the list
    const paginatedStats = sortedStats.slice(skip, skip + limit);

    // Calculate batch-wide statistics
    const batchStats = {
      totalStudents: students.length,
      totalDays: Math.max(...students.map((s) => {
        let count = 0;
        attendanceRecords.forEach((record) => {
          if (record.attendance.some((a) => a.studentId.toString() === s._id.toString())) {
            count++;
          }
        });
        return count;
      }), 0),
      totalPresent: sortedStats.reduce((sum, s) => sum + s.presentDays, 0),
      totalAbsent: sortedStats.reduce((sum, s) => sum + s.absentDays, 0),
      averageAttendancePercentage: (
        sortedStats.reduce((sum, s) => sum + parseFloat(s.attendancePercentage), 0) /
        students.length
      ).toFixed(2),
      lowAttendanceCount: lowAttendanceStudents.length,
    };

    res.status(200).json({
      success: true,
      batch: {
        batchId: batch._id,
        batchName: batch.batchName,
      },
      month: `${year}-${String(month).padStart(2, '0')}`,
      batchStatistics: batchStats,
      studentAttendance: paginatedStats,
      lowAttendanceStudents: lowAttendanceStudents.slice(0, 10),
      page,
      limit,
      totalPages: Math.ceil(sortedStats.length / limit),
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: error.message,
    });
  }
};

/**
 * Get attendance records for a date range
 * Useful for viewing past attendance data
 */
exports.getAttendanceRange = async (req, res) => {
  try {
    const { coachId } = req;
    const { batchId, startDate, endDate } = req.query;

    // Parse dates
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date',
      });
    }

    // Get all attendance records in date range
    const attendanceRecords = await Attendance.find({
      coachId,
      batchId,
      date: {
        $gte: start,
        $lte: end,
      },
    })
      .sort({ date: -1 })
      .populate('batchId', 'batchName');

    res.status(200).json({
      success: true,
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      },
      batchId,
      totalRecords: attendanceRecords.length,
      records: attendanceRecords.map((r) => ({
        _id: r._id,
        date: r.date,
        isHoliday: r.isHoliday,
        holidayReason: r.holidayReason,
        totalStudents: r.attendance.length,
        markedAt: r.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching attendance range:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message,
    });
  }
};
