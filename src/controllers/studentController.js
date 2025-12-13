import { Student } from '../models/Student.js';
import mongoose from 'mongoose';

/**
 * Add new student
 */
export const addStudent = async (req, res) => {
  try {
    const { firstName, lastName, mobileNumber, fatherName, fatherMobileNumber, email, address, city, state, pincode, dateOfBirth, batchIds, photo, remarks } = req.body;
    const coachId = req.coachId;

    // Enforce tenant student limit if in free trial
    try {
      if (req.flags && req.flags.freeTrial) {
        const limit = req.flags.studentLimit || 10;
        const current = await Student.countDocuments({ coachId });
        if (current >= limit) {
          return res.status(403).json({ success: false, message: `Free plan allows ${limit} students. Upgrade to add more.` });
        }
      }
    } catch (flagErr) {
      // If flags can't be read, allow operation but log
      console.warn('Could not enforce tenant flags', flagErr);
    }

    // Check if mobile number already exists for this coach
    const existingStudent = await Student.findOne({
      mobileNumber,
      coachId
    });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: 'Mobile number already registered for this coaching'
      });
    }

    // Check if email already exists for this coach (if provided)
    if (email) {
      const existingEmail = await Student.findOne({
        email,
        coachId
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered for this coaching'
        });
      }
    }

    // Create new student
    const student = new Student({
      coachId,
      firstName,
      lastName,
      mobileNumber,
      fatherName,
      fatherMobileNumber,
      email,
      address,
      city,
      state,
      pincode,
      dateOfBirth,
      batchIds: batchIds || [],
      photo,
      remarks,
      status: 'active'
    });

    await student.save();

    res.status(201).json({
      success: true,
      message: 'Student added successfully',
      student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all students for a coaching
 */
export const getStudents = async (req, res) => {
  try {
    const coachId = req.coachId;
    const { page = 1, limit = 10, status = 'active' } = req.query;

    const skip = (page - 1) * limit;

    const students = await Student.find({
      coachId,
      status
    })
      .select('-__v')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ enrollmentDate: -1 });

    const total = await Student.countDocuments({
      coachId,
      status
    });

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get student by ID
 */
export const getStudentById = async (req, res) => {
  try {
    const { studentId } = req.params;
    const coachId = req.coachId;

    // Check if studentId is valid ObjectId or studentId
    let student;

    if (mongoose.Types.ObjectId.isValid(studentId)) {
      student = await Student.findOne({
        _id: studentId,
        coachId
      })
        .populate('batchIds', 'batchName subject startDate endDate')
        .select('-__v');
    } else {
      student = await Student.findOne({
        studentId,
        coachId
      })
        .populate('batchIds', 'batchName subject startDate endDate')
        .select('-__v');
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update student
 */
export const updateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const coachId = req.coachId;
    const { firstName, lastName, mobileNumber, fatherName, fatherMobileNumber, email, address, city, state, pincode, dateOfBirth, status, remarks, photo, batchIds } = req.body;

    // Check if studentId is valid ObjectId or studentId
    let student;

    if (mongoose.Types.ObjectId.isValid(studentId)) {
      student = await Student.findOne({
        _id: studentId,
        coachId
      });
    } else {
      student = await Student.findOne({
        studentId,
        coachId
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if new mobile number is unique (if being changed)
    if (mobileNumber && mobileNumber !== student.mobileNumber) {
      const existingMobile = await Student.findOne({
        mobileNumber,
        coachId,
        _id: { $ne: student._id }
      });

      if (existingMobile) {
        return res.status(409).json({
          success: false,
          message: 'Mobile number already registered for another student'
        });
      }
    }

    // Check if new email is unique (if being changed)
    if (email && email !== student.email) {
      const existingEmail = await Student.findOne({
        email,
        coachId,
        _id: { $ne: student._id }
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered for another student'
        });
      }
    }

    // Update fields
    if (firstName) student.firstName = firstName;
    if (lastName) student.lastName = lastName;
    if (mobileNumber) student.mobileNumber = mobileNumber;
    if (fatherName) student.fatherName = fatherName;
    if (fatherMobileNumber) student.fatherMobileNumber = fatherMobileNumber;
    if (email) student.email = email;
    if (address) student.address = address;
    if (city) student.city = city;
    if (state) student.state = state;
    if (pincode) student.pincode = pincode;
    if (dateOfBirth) student.dateOfBirth = dateOfBirth;
    if (status) student.status = status;
    if (remarks) student.remarks = remarks;
    if (photo) student.photo = photo;
    if (batchIds) student.batchIds = batchIds;

    await student.save();

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete student (soft delete - set status to inactive)
 */
export const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const coachId = req.coachId;

    // Check if studentId is valid ObjectId or studentId
    let student;

    if (mongoose.Types.ObjectId.isValid(studentId)) {
      student = await Student.findOne({
        _id: studentId,
        coachId
      });
    } else {
      student = await Student.findOne({
        studentId,
        coachId
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Soft delete - set status to inactive
    student.status = 'inactive';
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Student removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Permanently delete student
 */
export const permanentlyDeleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const coachId = req.coachId;

    // Check if studentId is valid ObjectId or studentId
    let result;

    if (mongoose.Types.ObjectId.isValid(studentId)) {
      result = await Student.findOneAndDelete({
        _id: studentId,
        coachId
      });
    } else {
      result = await Student.findOneAndDelete({
        studentId,
        coachId
      });
    }

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student permanently deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Assign batch to student
 */
export const assignBatch = async (req, res) => {
  try {
    const { studentId } = req.params;
    const coachId = req.coachId;
    const { batchIds } = req.body;

    // Check if studentId is valid ObjectId or studentId
    let student;

    if (mongoose.Types.ObjectId.isValid(studentId)) {
      student = await Student.findOne({
        _id: studentId,
        coachId
      });
    } else {
      student = await Student.findOne({
        studentId,
        coachId
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Add new batch IDs (avoid duplicates)
    const existingBatchIds = student.batchIds.map(id => id.toString());
    const newBatchIds = batchIds.filter(id => !existingBatchIds.includes(id));

    student.batchIds = [...student.batchIds, ...newBatchIds];
    await student.save();

    // Populate batch details
    await student.populate('batchIds', 'batchName subject startDate endDate');

    res.status(200).json({
      success: true,
      message: 'Batch assigned successfully',
      student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Remove batch from student
 */
export const removeBatch = async (req, res) => {
  try {
    const { studentId, batchId } = req.params;
    const coachId = req.coachId;

    // Check if studentId is valid ObjectId or studentId
    let student;

    if (mongoose.Types.ObjectId.isValid(studentId)) {
      student = await Student.findOne({
        _id: studentId,
        coachId
      });
    } else {
      student = await Student.findOne({
        studentId,
        coachId
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Remove batch
    student.batchIds = student.batchIds.filter(id => id.toString() !== batchId);
    await student.save();

    // Populate batch details
    await student.populate('batchIds', 'batchName subject startDate endDate');

    res.status(200).json({
      success: true,
      message: 'Batch removed successfully',
      student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Search students by name, father name, mobile, or studentId
 */
export const searchStudents = async (req, res) => {
  try {
    const coachId = req.coachId;
    const { query, page = 1, limit = 10, status = 'active' } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const skip = (page - 1) * limit;

    // Build search filter
    const searchFilter = {
      coachId,
      status,
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { fatherName: { $regex: query, $options: 'i' } },
        { mobileNumber: { $regex: query, $options: 'i' } },
        { studentId: { $regex: query, $options: 'i' } }
      ]
    };

    const students = await Student.find(searchFilter)
      .select('-__v')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ enrollmentDate: -1 });

    const total = await Student.countDocuments(searchFilter);

    res.status(200).json({
      success: true,
      query,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get students by batch
 */
export const getStudentsByBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const coachId = req.coachId;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const students = await Student.find({
      coachId,
      batchIds: batchId,
      status: 'active'
    })
      .select('-__v')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ firstName: 1 });

    const total = await Student.countDocuments({
      coachId,
      batchIds: batchId,
      status: 'active'
    });

    res.status(200).json({
      success: true,
      batchId,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get student statistics for coaching
 */
export const getStudentStats = async (req, res) => {
  try {
    const coachId = req.coachId;

    const totalStudents = await Student.countDocuments({ coachId });
    const activeStudents = await Student.countDocuments({ coachId, status: 'active' });
    const inactiveStudents = await Student.countDocuments({ coachId, status: 'inactive' });
    const suspendedStudents = await Student.countDocuments({ coachId, status: 'suspended' });

    res.status(200).json({
      success: true,
      statistics: {
        totalStudents,
        activeStudents,
        inactiveStudents,
        suspendedStudents
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
