const crypto = require('crypto');

/**
 * Sanitize user input before logging to prevent log injection attacks
 * @param {string} input - User input to sanitize
 * @returns {string} - Sanitized input safe for logging
 */
const sanitizeForLog = (input) => {
  if (typeof input !== 'string') {
    input = String(input);
  }
  
  // Remove or encode dangerous characters that could break log integrity
  return input
    .replace(/\r\n/g, '\\r\\n')  // Replace CRLF
    .replace(/\n/g, '\\n')      // Replace LF
    .replace(/\r/g, '\\r')      // Replace CR
    .replace(/\t/g, '\\t')      // Replace tabs
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .substring(0, 1000); // Limit length to prevent log flooding
};

/**
 * Validate and sanitize file paths to prevent path traversal
 * @param {string} filePath - File path to validate
 * @param {string} allowedDir - Allowed base directory
 * @returns {string|null} - Sanitized path or null if invalid
 */
const sanitizeFilePath = (filePath, allowedDir) => {
  const path = require('path');
  
  if (!filePath || typeof filePath !== 'string') {
    return null;
  }
  
  // Normalize the path to resolve .. and . segments
  const normalizedPath = path.normalize(filePath);
  const resolvedPath = path.resolve(allowedDir, normalizedPath);
  const resolvedAllowedDir = path.resolve(allowedDir);
  
  // Check if the resolved path is within the allowed directory
  if (!resolvedPath.startsWith(resolvedAllowedDir + path.sep) && resolvedPath !== resolvedAllowedDir) {
    return null;
  }
  
  return resolvedPath;
};

/**
 * Generate secure random token
 * @param {number} length - Token length in bytes
 * @returns {string} - Hex encoded token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash sensitive data for logging
 * @param {string} data - Data to hash
 * @returns {string} - SHA256 hash
 */
const hashForLog = (data) => {
  return crypto.createHash('sha256').update(String(data)).digest('hex').substring(0, 8);
};

module.exports = {
  sanitizeForLog,
  sanitizeFilePath,
  generateSecureToken,
  hashForLog
};