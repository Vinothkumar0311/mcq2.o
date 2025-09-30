const { User, LicensedUser } = require('../models');

/**
 * Find student by ID - handles both User (integer) and LicensedUser (UUID) IDs
 * @param {string|number} studentId - The student ID to lookup
 * @returns {Object|null} - Student object or null if not found
 */
async function findStudentById(studentId) {
  let student = null;
  
  // First try LicensedUser (UUID)
  try {
    student = await LicensedUser.findByPk(studentId);
    if (student) {
      return {
        ...student.toJSON(),
        userType: 'licensed',
        department: student.department || 'N/A'
      };
    }
  } catch (error) {
    // Not a valid UUID, continue to integer lookup
  }
  
  // If not found, try User (integer)
  if (!student) {
    try {
      const numericStudentId = parseInt(studentId);
      if (!isNaN(numericStudentId)) {
        student = await User.findByPk(numericStudentId);
        if (student) {
          return {
            ...student.toJSON(),
            userType: 'regular',
            department: 'N/A'
          };
        }
      }
    } catch (error) {
      // Failed to parse as integer
    }
  }
  
  return null;
}

/**
 * Get student name safely
 * @param {string|number} studentId - The student ID
 * @returns {string} - Student name or 'Unknown Student'
 */
async function getStudentName(studentId) {
  const student = await findStudentById(studentId);
  return student?.name || 'Unknown Student';
}

/**
 * Get student email safely
 * @param {string|number} studentId - The student ID
 * @returns {string} - Student email or 'N/A'
 */
async function getStudentEmail(studentId) {
  const student = await findStudentById(studentId);
  return student?.email || 'N/A';
}

module.exports = {
  findStudentById,
  getStudentName,
  getStudentEmail
};