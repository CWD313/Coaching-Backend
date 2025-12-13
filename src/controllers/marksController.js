import Test from '../models/Test.js';
import TestMarks from '../models/TestMarks.js';
import Student from '../models/Student.js';

/**
 * Add a new test
 */
export const addTest = async (req, res) => {
  try {
    const { coachId } = req;
    const {
      batchId,
      testName,
      subject,
      testDate,
      totalMarks,
      passingMarks,
      hasNegativeMarking,
      negativeMarkPerWrongAnswer,
      description,
    } = req.body;

    // Verify batch belongs to coach
    const batch = await Batch.findOne({ _id: batchId, coachId });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found',
      });
    }

    // Format test date
    const testDateObj = new Date(testDate);
    testDateObj.setHours(0, 0, 0, 0);

    // Create test
    const test = new Test({
      coachId,
      batchId,
      testName,
      subject,
      testDate: testDateObj,
      totalMarks,
      passingMarks: passingMarks || null,
      hasNegativeMarking,
      negativeMarkPerWrongAnswer: hasNegativeMarking ? negativeMarkPerWrongAnswer : null,
      description: description || null,
      createdBy: coachId,
    });

    await test.save();

    res.status(201).json({
      success: true,
      message: 'Test created successfully',
      test: {
        _id: test._id,
        testName: test.testName,
        subject: test.subject,
        testDate: test.testDate,
        totalMarks: test.totalMarks,
        batchId: test.batchId,
      },
    });
  } catch (error) {
    console.error('Error adding test:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding test',
      error: error.message,
    });
  }
};

/**
 * Add or update marks for a student in a test
 */
export const addMarks = async (req, res) => {
  try {
    const { coachId } = req;
    const {
      testId,
      studentId,
      marksObtained,
      correctAnswers,
      wrongAnswers,
      attemptedQuestions,
      timeTaken,
      status,
      remarks,
    } = req.body;

    // Verify test exists and belongs to coach
    const test = await Test.findOne({ _id: testId, coachId });
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found',
      });
    }

    // Verify student exists and belongs to coach
    const student = await Student.findOne({ _id: studentId, coachId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Verify marks don't exceed total marks
    if (marksObtained > test.totalMarks) {
      return res.status(400).json({
        success: false,
        message: `Marks obtained (${marksObtained}) cannot exceed total marks (${test.totalMarks})`,
      });
    }

    // Determine status if not provided
    let finalStatus = status || 'passed';
    if (test.passingMarks && marksObtained < test.passingMarks) {
      finalStatus = 'failed';
    }

    // Check if marks already exist
    let testMarks = await TestMarks.findOne({
      coachId,
      testId,
      studentId,
    });

    if (testMarks) {
      // Update existing marks
      testMarks.marksObtained = marksObtained;
      testMarks.correctAnswers = correctAnswers || null;
      testMarks.wrongAnswers = wrongAnswers || null;
      testMarks.attemptedQuestions = attemptedQuestions || null;
      testMarks.timeTaken = timeTaken || null;
      testMarks.status = finalStatus;
      testMarks.remarks = remarks || null;
      testMarks.submittedAt = new Date();
      await testMarks.save();
    } else {
      // Create new marks entry
      testMarks = new TestMarks({
        coachId,
        testId,
        studentId,
        batchId: test.batchId,
        marksObtained,
        correctAnswers: correctAnswers || null,
        wrongAnswers: wrongAnswers || null,
        attemptedQuestions: attemptedQuestions || null,
        timeTaken: timeTaken || null,
        status: finalStatus,
        remarks: remarks || null,
        submittedAt: new Date(),
      });

      await testMarks.save();
    }

    // Calculate percentage
    const percentage = ((marksObtained / test.totalMarks) * 100).toFixed(2);

    res.status(200).json({
      success: true,
      message: 'Marks saved successfully',
      marks: {
        _id: testMarks._id,
        testId,
        studentId,
        marksObtained,
        totalMarks: test.totalMarks,
        percentage: parseFloat(percentage),
        status: finalStatus,
        savedAt: testMarks.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error adding marks:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving marks',
      error: error.message,
    });
  }
};

/**
 * Get test history for a student
 */
export const getTestHistory = async (req, res) => {
  try {
    const { coachId } = req;
    const { studentId, subject } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Verify student exists and belongs to coach
    const student = await Student.findOne({ _id: studentId, coachId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Build query
    const query = { coachId, studentId };
    if (subject) {
      // Need to join with Test collection
      const tests = await Test.find({ coachId, subject }).select('_id');
      const testIds = tests.map((t) => t._id);
      query.testId = { $in: testIds };
    }

    // Get total count
    const totalRecords = await TestMarks.countDocuments(query);

    // Fetch test marks with test details
    const testMarks = await TestMarks.find(query)
      .populate('testId', 'testName subject testDate totalMarks passingMarks')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Enrich with percentage and pass/fail
    const enrichedMarks = testMarks.map((mark) => {
      const percentage = ((mark.marksObtained / mark.testId.totalMarks) * 100).toFixed(2);
      return {
        _id: mark._id,
        testId: mark.testId._id,
        testName: mark.testId.testName,
        subject: mark.testId.subject,
        testDate: mark.testId.testDate,
        marksObtained: mark.marksObtained,
        totalMarks: mark.testId.totalMarks,
        percentage: parseFloat(percentage),
        status: mark.status,
        rank: mark.rank,
        percentile: mark.percentile,
        remarks: mark.remarks,
      };
    });

    // Calculate subject-wise performance if available
    const subjectWise = {};
    enrichedMarks.forEach((mark) => {
      if (!subjectWise[mark.subject]) {
        subjectWise[mark.subject] = {
          testsTaken: 0,
          totalMarks: 0,
          marksObtained: 0,
          average: 0,
        };
      }
      subjectWise[mark.subject].testsTaken++;
      subjectWise[mark.subject].totalMarks += mark.totalMarks;
      subjectWise[mark.subject].marksObtained += mark.marksObtained;
    });

    // Calculate averages
    Object.keys(subjectWise).forEach((subject) => {
      const data = subjectWise[subject];
      data.average = (
        (data.marksObtained / data.totalMarks) * 100
      ).toFixed(2);
    });

    res.status(200).json({
      success: true,
      student: {
        studentId: student._id,
        studentCode: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
      },
      testHistory: enrichedMarks,
      subjectWisePerformance: subjectWise,
      page,
      limit,
      totalPages: Math.ceil(totalRecords / limit),
      totalTests: totalRecords,
    });
  } catch (error) {
    console.error('Error fetching test history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching test history',
      error: error.message,
    });
  }
};

/**
 * Get subject-wise performance for a student
 */
export const getSubjectPerformance = async (req, res) => {
  try {
    const { coachId } = req;
    const { studentId, subject } = req.query;

    // Verify student exists
    const student = await Student.findOne({ _id: studentId, coachId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Get all tests for this subject
    const tests = await Test.find({ coachId, subject }).select('_id testName testDate totalMarks');

    if (tests.length === 0) {
      return res.status(200).json({
        success: true,
        subject,
        message: 'No tests found for this subject',
        performance: {
          testsTaken: 0,
          averageMarks: 0,
          averagePercentage: 0,
          bestScore: 0,
          worstScore: 0,
          trend: [],
        },
      });
    }

    const testIds = tests.map((t) => t._id);

    // Get all marks for this student in these tests
    const marks = await TestMarks.find({
      coachId,
      studentId,
      testId: { $in: testIds },
    }).sort({ createdAt: 1 });

    if (marks.length === 0) {
      return res.status(200).json({
        success: true,
        subject,
        performance: {
          testsTaken: 0,
          averageMarks: 0,
          averagePercentage: 0,
          bestScore: 0,
          worstScore: 0,
          trend: [],
        },
      });
    }

    // Calculate statistics
    const totalMarks = marks.reduce((sum, m) => sum + m.marksObtained, 0);
    const totalTestMarks = marks.reduce((sum, m) => {
      const test = tests.find((t) => t._id.toString() === m.testId.toString());
      return sum + test.totalMarks;
    }, 0);

    const averageMarks = (totalMarks / marks.length).toFixed(2);
    const averagePercentage = ((totalMarks / totalTestMarks) * 100).toFixed(2);
    const bestScore = Math.max(...marks.map((m) => m.marksObtained));
    const worstScore = Math.min(...marks.map((m) => m.marksObtained));

    // Calculate trend (performance over time)
    const trend = marks.map((m) => {
      const test = tests.find((t) => t._id.toString() === m.testId.toString());
      return {
        testName: test.testName,
        marksObtained: m.marksObtained,
        totalMarks: test.totalMarks,
        percentage: ((m.marksObtained / test.totalMarks) * 100).toFixed(2),
        date: test.testDate,
      };
    });

    res.status(200).json({
      success: true,
      student: {
        studentId: student._id,
        studentCode: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
      },
      subject,
      performance: {
        testsTaken: marks.length,
        averageMarks: parseFloat(averageMarks),
        averagePercentage: parseFloat(averagePercentage),
        bestScore,
        worstScore,
        trend,
      },
    });
  } catch (error) {
    console.error('Error fetching subject performance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching performance',
      error: error.message,
    });
  }
};

/**
 * Get test details with all student results
 */
export const getTestById = async (req, res) => {
  try {
    const { coachId } = req;
    const { testId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Verify test exists and belongs to coach
    const test = await Test.findOne({ _id: testId, coachId });
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found',
      });
    }

    // Get all marks for this test with student details
    const totalRecords = await TestMarks.countDocuments({ coachId, testId });

    const marks = await TestMarks.find({ coachId, testId })
      .populate('studentId', 'studentId firstName lastName mobileNumber')
      .sort({ marksObtained: -1 }) // Rank by marks
      .skip(skip)
      .limit(limit);

    // Calculate statistics
    const allMarks = await TestMarks.find({ coachId, testId });
    const totalStudents = allMarks.length;
    const passedCount = allMarks.filter(
      (m) => m.status === 'passed' || (test.passingMarks && m.marksObtained >= test.passingMarks)
    ).length;
    const failedCount = totalStudents - passedCount;
    const averageMarks = (
      allMarks.reduce((sum, m) => sum + m.marksObtained, 0) / totalStudents
    ).toFixed(2);
    const highestScore = Math.max(...allMarks.map((m) => m.marksObtained));
    const lowestScore = Math.min(...allMarks.map((m) => m.marksObtained));

    // Enrich marks with student details and rank
    const enrichedMarks = marks.map((mark, index) => ({
      rank: skip + index + 1,
      studentId: mark.studentId._id,
      studentCode: mark.studentId.studentId,
      firstName: mark.studentId.firstName,
      lastName: mark.studentId.lastName,
      mobileNumber: mark.studentId.mobileNumber,
      marksObtained: mark.marksObtained,
      percentage: ((mark.marksObtained / test.totalMarks) * 100).toFixed(2),
      status: mark.status,
      timeTaken: mark.timeTaken,
      remarks: mark.remarks,
    }));

    res.status(200).json({
      success: true,
      test: {
        testId: test._id,
        testName: test.testName,
        subject: test.subject,
        testDate: test.testDate,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
      },
      statistics: {
        totalStudents,
        passedStudents: passedCount,
        failedStudents: failedCount,
        averageMarks: parseFloat(averageMarks),
        highestScore,
        lowestScore,
        passPercentage: ((passedCount / totalStudents) * 100).toFixed(2),
      },
      results: enrichedMarks,
      page,
      limit,
      totalPages: Math.ceil(totalRecords / limit),
    });
  } catch (error) {
    console.error('Error fetching test details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching test details',
      error: error.message,
    });
  }
};

/**
 * Get all tests for a batch
 */
export const getBatchTests = async (req, res) => {
  try {
    const { coachId } = req;
    const { batchId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Verify batch exists and belongs to coach
    const batch = await Batch.findOne({ _id: batchId, coachId });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found',
      });
    }

    const totalTests = await Test.countDocuments({ coachId, batchId });

    const tests = await Test.find({ coachId, batchId })
      .select('testName subject testDate totalMarks passingMarks status')
      .sort({ testDate: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      batch: {
        batchId: batch._id,
        batchName: batch.batchName,
      },
      tests,
      page,
      limit,
      totalPages: Math.ceil(totalTests / limit),
      totalTests,
    });
  } catch (error) {
    console.error('Error fetching batch tests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tests',
      error: error.message,
    });
  }
};

/**
 * Get batch test analysis (all students' scores for a test)
 */
export const getBatchTestAnalysis = async (req, res) => {
  try {
    const { coachId } = req;
    const { batchId, testId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Verify test and batch
    const test = await Test.findOne({ _id: testId, coachId, batchId });
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found for this batch',
      });
    }

    // Get marks with pagination
    const totalRecords = await TestMarks.countDocuments({
      coachId,
      testId,
      batchId,
    });

    const marks = await TestMarks.find({ coachId, testId, batchId })
      .populate('studentId', 'studentId firstName lastName mobileNumber')
      .sort({ marksObtained: -1 })
      .skip(skip)
      .limit(limit);

    // Get all marks for statistics
    const allMarks = await TestMarks.find({ coachId, testId, batchId });

    // Calculate detailed statistics
    const passedCount = allMarks.filter((m) => m.status === 'passed').length;
    const failedCount = allMarks.filter((m) => m.status === 'failed').length;
    const absentCount = allMarks.filter((m) => m.status === 'absent').length;

    const marks_array = allMarks.map((m) => m.marksObtained);
    const totalMarksSum = marks_array.reduce((a, b) => a + b, 0);
    const average = (totalMarksSum / allMarks.length).toFixed(2);
    const median = marks_array.sort((a, b) => a - b)[Math.floor(marks_array.length / 2)];
    const std_dev = Math.sqrt(
      marks_array.reduce((sq, n) => sq + Math.pow(n - average, 2), 0) / marks_array.length
    ).toFixed(2);

    const enrichedMarks = marks.map((mark, index) => ({
      rank: skip + index + 1,
      studentCode: mark.studentId.studentId,
      firstName: mark.studentId.firstName,
      lastName: mark.studentId.lastName,
      mobileNumber: mark.studentId.mobileNumber,
      marksObtained: mark.marksObtained,
      percentage: ((mark.marksObtained / test.totalMarks) * 100).toFixed(2),
      status: mark.status,
    }));

    res.status(200).json({
      success: true,
      test: {
        testName: test.testName,
        subject: test.subject,
        totalMarks: test.totalMarks,
        date: test.testDate,
      },
      statistics: {
        totalStudents: allMarks.length,
        passedStudents: passedCount,
        failedStudents: failedCount,
        absentStudents: absentCount,
        averageScore: parseFloat(average),
        medianScore: median,
        highestScore: Math.max(...marks_array),
        lowestScore: Math.min(...marks_array),
        standardDeviation: parseFloat(std_dev),
        passPercentage: ((passedCount / allMarks.length) * 100).toFixed(2),
      },
      results: enrichedMarks,
      page,
      limit,
      totalPages: Math.ceil(totalRecords / limit),
    });
  } catch (error) {
    console.error('Error fetching batch analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analysis',
      error: error.message,
    });
  }
};

/**
 * Get subject-wise performance for entire batch
 */
export const getSubjectAnalysis = async (req, res) => {
  try {
    const { coachId } = req;
    const { batchId, subject } = req.query;

    // Verify batch exists
    const batch = await Batch.findOne({ _id: batchId, coachId });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found',
      });
    }

    // Get all tests for this subject in this batch
    const tests = await Test.find({ coachId, batchId, subject }).select('_id testName testDate totalMarks');

    if (tests.length === 0) {
      return res.status(200).json({
        success: true,
        subject,
        batch: { batchId: batch._id, batchName: batch.batchName },
        message: 'No tests found for this subject',
        analysis: {
          testsCreated: 0,
          studentsTested: 0,
          averageScore: 0,
          averagePercentage: 0,
          highestScore: 0,
          lowestScore: 0,
          topStudents: [],
          bottomStudents: [],
        },
      });
    }

    const testIds = tests.map((t) => t._id);

    // Get all marks for these tests
    const allMarks = await TestMarks.find({
      coachId,
      testId: { $in: testIds },
    }).populate('studentId', 'studentId firstName lastName');

    // Group by student for analysis
    const studentPerformance = {};
    const totalMarksPerTest = {};

    tests.forEach((test) => {
      totalMarksPerTest[test._id.toString()] = test.totalMarks;
    });

    allMarks.forEach((mark) => {
      const key = mark.studentId._id.toString();
      if (!studentPerformance[key]) {
        studentPerformance[key] = {
          studentId: mark.studentId._id,
          studentCode: mark.studentId.studentId,
          firstName: mark.studentId.firstName,
          lastName: mark.studentId.lastName,
          testsTaken: 0,
          totalMarks: 0,
          marksObtained: 0,
          percentage: 0,
        };
      }
      studentPerformance[key].testsTaken++;
      studentPerformance[key].totalMarks += totalMarksPerTest[mark.testId.toString()];
      studentPerformance[key].marksObtained += mark.marksObtained;
    });

    // Calculate percentages
    Object.values(studentPerformance).forEach((student) => {
      student.percentage = (
        (student.marksObtained / student.totalMarks) * 100
      ).toFixed(2);
    });

    // Sort by percentage
    const sorted = Object.values(studentPerformance).sort(
      (a, b) => parseFloat(b.percentage) - parseFloat(a.percentage)
    );

    // Calculate batch statistics
    const allScores = allMarks.map((m) => m.marksObtained);
    const avgScore = allScores.length > 0
      ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2)
      : 0;
    const totalPossibleMarks = tests.reduce((sum, t) => sum + t.totalMarks, 0);
    const avgPercentage = allScores.length > 0
      ? ((allScores.reduce((a, b) => a + b, 0) / totalPossibleMarks) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      subject,
      batch: { batchId: batch._id, batchName: batch.batchName },
      analysis: {
        testsCreated: tests.length,
        studentsTested: Object.keys(studentPerformance).length,
        averageScore: parseFloat(avgScore),
        averagePercentage: parseFloat(avgPercentage),
        highestScore: Math.max(...allScores),
        lowestScore: Math.min(...allScores),
        topStudents: sorted.slice(0, 10),
        bottomStudents: sorted.slice(-10).reverse(),
      },
    });
  } catch (error) {
    console.error('Error fetching subject analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analysis',
      error: error.message,
    });
  }
};
