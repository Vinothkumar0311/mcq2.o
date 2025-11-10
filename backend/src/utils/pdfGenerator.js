const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a PDF report for a test
 * @param {Object} reportData - Test report data
 * @returns {Promise<Buffer>} PDF buffer
 */
const generatePDFReport = async (reportData) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('📄 Starting PDF generation...');
      console.log('📊 Report data validation:', {
        hasTest: !!reportData.test,
        testName: reportData.test?.name,
        studentsCount: reportData.students?.length || 0,
        sectionsCount: reportData.sections?.length || 0
      });
      
      // Validate required data
      if (!reportData || !reportData.test || !reportData.students) {
        throw new Error('Invalid report data: missing required fields');
      }
      
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      
      // Error handling for PDF document
      doc.on('error', (error) => {
        console.error('❌ PDF document error:', error);
        reject(error);
      });
      
      // Collect PDF data
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        try {
          const pdfData = Buffer.concat(buffers);
          console.log('✅ PDF generation completed, buffer size:', pdfData.length);
          resolve(pdfData);
        } catch (bufferError) {
          console.error('❌ Error concatenating PDF buffers:', bufferError);
          reject(bufferError);
        }
      });

      console.log('📝 Adding header...');
      addHeader(doc, reportData.test);
      
      console.log('📝 Adding test info...');
      addTestInfo(doc, reportData.test);
      
      console.log('📝 Adding statistics...');
      // Create basic statistics if not provided
      const stats = reportData.statistics || {
        totalStudents: reportData.students.length,
        averageScore: reportData.students.length > 0 ? 
          reportData.students.reduce((sum, s) => sum + (s.totalScore || 0), 0) / reportData.students.length : 0,
        highestScore: reportData.students.length > 0 ? 
          Math.max(...reportData.students.map(s => s.totalScore || 0)) : 0,
        lowestScore: reportData.students.length > 0 ? 
          Math.min(...reportData.students.map(s => s.totalScore || 0)) : 0,
        sectionStats: {
          1: {
            average: reportData.students.length > 0 ? 
              reportData.students.reduce((sum, s) => sum + (s.totalScore || 0), 0) / reportData.students.length : 0,
            highest: reportData.students.length > 0 ? 
              Math.max(...reportData.students.map(s => s.totalScore || 0)) : 0,
            lowest: reportData.students.length > 0 ? 
              Math.min(...reportData.students.map(s => s.totalScore || 0)) : 0
          }
        }
      };
      // addStatistics(doc, stats);
      
      console.log('📝 Adding student results...');
      addStudentResults(doc, reportData.students, reportData.sections || [{ id: 1, name: 'Overall Test' }]);
      
      console.log('📝 Adding footer...');
      addFooter(doc);
      
      console.log('📝 Finalizing PDF...');
      // Finalize the PDF
      doc.end();
      
    } catch (error) {
      console.error('❌ Error in PDF generation:', error);
      console.error('Stack trace:', error.stack);
      reject(error);
    }
  });
};

/**
 * Add header to the PDF
 * @param {PDFDocument} doc - PDF document instance
 * @param {Object} test - Test information
 */
function addHeader(doc, test) {
  try {
    // Logo (if available)
    const logoPath = path.join(__dirname, '../../public/logo.png');
    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, 50, 45, { width: 50 });
      } catch (logoError) {
        console.log('⚠️ Logo could not be loaded, skipping...');
      }
    }
    
    // Title
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('Test Report', 110, 50, { align: 'center' });
    
    // Test name
    doc
      .fontSize(14)
      .font('Helvetica')
      .text(test?.name || 'Unknown Test', 50, 100, { align: 'left' });
    
    // Date and time
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();
    
    doc
      .fontSize(10)
      .text(`Generated on: ${date} at ${time}`, 50, 120, { align: 'left' });
      
    // Add a line
    doc.moveTo(50, 140).lineTo(550, 140).stroke();
  } catch (error) {
    console.error('❌ Error in addHeader:', error);
    throw error;
  }
}

/**
 * Add test information to the PDF
 * @param {PDFDocument} doc - PDF document instance
 * @param {Object} test - Test information
 */
function addTestInfo(doc, test) {
  try {
    doc.moveDown(2);
    
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Test Information', 50, doc.y);
      
    doc.moveDown(0.5);
    
    // Test details in a table format
    const testDetails = [
      { label: 'Test ID', value: test?.id || 'N/A' },
      { label: 'Description', value: test?.description || 'N/A' },
      { label: 'Test Date', value: test?.testDate || 'N/A' },
      { label: 'Start Time', value: test?.startTime || 'N/A' },
      { label: 'Total Students', value: (test?.totalStudents || 0).toString() }
    ];
    
    // Draw test details
    const startY = doc.y;
    const col1 = 60;
    const col2 = 200;
    
    testDetails.forEach((detail, index) => {
      const y = startY + (index * 20);
      
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`${detail.label}:`, col1, y);
        
      doc
        .font('Helvetica')
        .text(detail.value, col2, y);
    });
    
    doc.moveDown(2);
  } catch (error) {
    console.error('❌ Error in addTestInfo:', error);
    throw error;
  }
}

/**
 * Add statistics to the PDF
 * @param {PDFDocument} doc - PDF document instance
 * @param {Object} stats - Statistics data
 */
function addStatistics(doc, stats) {
  try {
    doc.addPage();
    
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Overall Statistics', 50, 50);
      
    doc.moveDown(0.5);
    
    // Overall statistics with safe defaults
    const overallStats = [
      { label: 'Total Students', value: stats?.totalStudents || 0 },
      { label: 'Average Score', value: (stats?.averageScore || 0).toFixed(2) },
      { label: 'Highest Score', value: stats?.highestScore || 0 },
      { label: 'Lowest Score', value: stats?.lowestScore || 0 }
    ];
    
    // Draw overall statistics
    const startY = doc.y;
    const col1 = 60;
    const col2 = 200;
    
    overallStats.forEach((stat, index) => {
      const y = startY + (index * 20);
      
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`${stat.label}:`, col1, y);
        
      doc
        .font('Helvetica')
        .text(stat.value.toString(), col2, y);
    });
    
    doc.moveDown(2);
    
    // Add a line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);
    
    // Section statistics
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Section-wise Statistics');
      
    doc.moveDown(0.5);
    
    // Draw section statistics table header
    const sectionHeaderY = doc.y;
    
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Section', 60, sectionHeaderY)
      .text('Avg. Score', 300, sectionHeaderY, { width: 100, align: 'center' })
      .text('Highest', 400, sectionHeaderY, { width: 100, align: 'center' })
      .text('Lowest', 500, sectionHeaderY, { width: 100, align: 'center' });
      
    // Draw section statistics rows
    let currentY = sectionHeaderY + 20;
    
    const sectionStats = stats?.sectionStats || {};
    Object.entries(sectionStats).forEach(([sectionId, section]) => {
      doc
        .font('Helvetica')
        .text(`Section ${sectionId}`, 60, currentY)
        .text((section?.average || 0).toFixed(2), 300, currentY, { width: 100, align: 'center' })
        .text((section?.highest || 0).toString(), 400, currentY, { width: 100, align: 'center' })
        .text((section?.lowest || 0).toString(), 500, currentY, { width: 100, align: 'center' });
        
      currentY += 20;
    });
    
    doc.moveDown(2);
  } catch (error) {
    console.error('❌ Error in addStatistics:', error);
    throw error;
  }
}

// /**
//  * Add student results to the PDF
//  * @param {PDFDocument} doc - PDF document instance
//  * @param {Array} students - Array of student data
//  * @param {Array} sections - Array of section data
//  */
// function addStudentResults(doc, students, sections) {
//   try {
//     // Add a new page for student results
//     doc.addPage();
    
//     doc
//       .fontSize(14)
//       .font('Helvetica-Bold')
//       .text('Student Results', 50, 50);
      
//     doc.moveDown(0.5);
    
//     // Ensure we have valid data
//     const validStudents = students || [];
//     const validSections = sections || [{ id: 1, name: 'Overall Test' }];
    
//     if (validStudents.length === 0) {
//       doc
//         .fontSize(12)
//         .font('Helvetica')
//         .text('No student results available.', 50, doc.y);
//       return;
//     }
    
//     // Process students in chunks to handle pagination
//     const studentsPerPage = 20;
//     let currentPage = 0;
    
//     for (let i = 0; i < validStudents.length; i += studentsPerPage) {
//       if (i > 0) {
//         // Add a new page for each chunk of students
//         doc.addPage();
//         doc.y = 50;
//       }
      
//       const chunk = validStudents.slice(i, i + studentsPerPage);
      
//       // Draw student results table
//       drawStudentResultsTable(doc, chunk, validSections, i + 1);
      
//       // Add page number
//       currentPage++;
//       doc
//         .fontSize(8)
//         .text(`Page ${currentPage}`, 50, 750, { align: 'left' });
//     }
//   } catch (error) {
//     console.error('❌ Error in addStudentResults:', error);
//     throw error;
//   }
// }

/**
 * Add student results to the PDF
 * @param {PDFDocument} doc - PDF document instance
 * @param {Array} students - Array of student data
 * @param {Array} sections - Array of section data (no longer used by drawStudentResultsTable)
 */
function addStudentResults(doc, students, sections) {
  console.log('📝 addStudentResults called with', students)
  try {
    // Add a new page for student results
    doc.addPage();
    
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Student Results', 50, 50);
      
    doc.moveDown(0.5);
    
    // Ensure we have valid data
    const validStudents = students || [];
    
    if (validStudents.length === 0) {
      doc
        .fontSize(12)
        .font('Helvetica')
        .text('No student results available.', 50, doc.y);
      return;
    }
    
    // Process students in chunks to handle pagination
    const studentsPerPage = 20;
    let currentPage = 0;
    
    for (let i = 0; i < validStudents.length; i += studentsPerPage) {
      if (i > 0) {
        // Add a new page for each chunk of students
        doc.addPage();
        doc.y = 50;
      }
      
      const chunk = validStudents.slice(i, i + studentsPerPage);

      console.log(`📝 Drawing student results table for students ${i + 1} to ${i + chunk.length}...`);
      console.log('Chunk sample data:', chunk.slice(0, 2)); // Log first 2 students in the chunk
      
      // Draw student results table
      // --- MODIFIED ---
      // Removed 'validSections' from the call, as the new table function doesn't need it.
      drawStudentResultsTable(doc, chunk, i + 1);
      // --- END MODIFICATION ---
      
      // Add page number
      currentPage++;
      doc
        .fontSize(8)
        .text(`Page ${currentPage + 1}`, 50, 750, { align: 'left' }); // (Adjusted page logic slightly)
    }
  } catch (error) {
    console.error('❌ Error in addStudentResults:', error);
    throw error;
  }
}

// /**
//  * Draw student results table
//  * @param {PDFDocument} doc - PDF document instance
//  * @param {Array} students - Array of student data for current page
//  * @param {Array} sections - Array of section data
//  * @param {number} startIndex - Starting index for student numbering
//  */
// function drawStudentResultsTable(doc, students, sections, startIndex) {
//   try {
//     // Table header
//     const headerY = doc.y;
//     const colWidths = [40, 150, 80]; // Student number, name, total score
//     const sectionWidth = 50; // Width for each section column
    
//     // Draw table header background
//     doc
//       .rect(50, headerY, 520, 20)
//       .fillAndStroke('#f0f0f0', '#000000');
      
//     // Draw header cells
//     doc
//       .fontSize(9)
//       .font('Helvetica-Bold')
//       .fillColor('#000000')
//       .text('#', 55, headerY + 5, { width: colWidths[0] - 10, align: 'left' })
//       .text('Student Name', 55 + colWidths[0], headerY + 5, { width: colWidths[1] - 10, align: 'left' });
      
//     // Draw section headers
//     const validSections = sections || [];
//     validSections.forEach((section, index) => {
//       const x = 55 + colWidths[0] + colWidths[1] + (index * sectionWidth);
//       const sectionName = section?.name || `Section ${index + 1}`;
//       doc.text(sectionName.substring(0, 4), x, headerY + 5, { 
//         width: sectionWidth - 5, 
//         align: 'center' 
//       });
//     });
    
//     // Draw total header
//     doc.text('Total', 55 + colWidths[0] + colWidths[1] + (validSections.length * sectionWidth), headerY + 5, {
//       width: colWidths[2] - 5,
//       align: 'center'
//     });
    
//     // Draw student rows
//     let currentY = headerY + 20;
    
//     const validStudents = students || [];
//     validStudents.forEach((student, index) => {
//       // Alternate row background
//       if (index % 2 === 0) {
//         doc
//           .rect(50, currentY, 520, 20)
//           .fillAndStroke('#f9f9f9', '#e0e0e0');
//       }
      
//       // Student number
//       doc
//         .fontSize(9)
//         .font('Helvetica')
//         .fillColor('#000000')
//         .text(
//           (startIndex + index).toString(), 
//           55, 
//           currentY + 5, 
//           { width: colWidths[0] - 10, align: 'left' }
//         );
        
//       // Student name (truncate if too long)
//       const studentName = (student?.name || 'Unknown Student');
//       const truncatedName = studentName.length > 20 
//         ? studentName.substring(0, 17) + '...' 
//         : studentName;
        
//       doc.text(
//         truncatedName,
//         55 + colWidths[0],
//         currentY + 5,
//         { width: colWidths[1] - 10, align: 'left' }
//       );
      
//       // Section scores
//       validSections.forEach((section, secIndex) => {
//         const x = 55 + colWidths[0] + colWidths[1] + (secIndex * sectionWidth);
//         const sectionScores = student?.sectionScores || {};
//         const score = sectionScores[section?.id] || { marksObtained: 0 };
        
//         doc.text(
//           (score?.marksObtained || 0).toString(),
//           x,
//           currentY + 5,
//           { width: sectionWidth - 5, align: 'center' }
//         );
//       });
      
//       // Total score
//       doc.text(
//         (student?.totalScore || 0).toString(),
//         55 + colWidths[0] + colWidths[1] + (validSections.length * sectionWidth),
//         currentY + 5,
//         { width: colWidths[2] - 5, align: 'center' }
//       );
      
//       currentY += 20;
//     });
    
//     doc.y = currentY + 10;
//   } catch (error) {
//     console.error('❌ Error in drawStudentResultsTable:', error);
//     throw error;
//   }
// }

/**
 * Draw student results table
 * @param {PDFDocument} doc - PDF document instance
 * @param {Array} students - Array of student data for current page
 * @param {number} startIndex - Starting index for student numbering
 */
function drawStudentResultsTable(doc, students, startIndex) {
  try {
    // Table header
    const headerY = doc.y;

    // --- NEW COLUMN DEFINITIONS ---
    // S.No, Name, Sinno, Email, Marks
    const colWidths = [40, 130, 80, 170, 100];
    const headers = ['S.No', 'Name', 'Sinno', 'Email', 'Marks'];
    const totalTableWidth = colWidths.reduce((a, b) => a + b, 0); // 520
    const startX = 50;
    const padding = 5;
    // --- END NEW COLUMN DEFINITIONS ---
    
    // Draw table header background
    doc
      .rect(startX, headerY, totalTableWidth, 20)
      .fillAndStroke('#f0f0f0', '#000000');
      
    // Draw header cells
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#000000');

    let currentX = startX + padding;
    headers.forEach((header, index) => {
      doc.text(header, currentX, headerY + 5, {
        width: colWidths[index] - (padding * 2),
        align: header === 'Marks' ? 'center' : 'left'
      });
      currentX += colWidths[index];
    });
    
    // Draw student rows
    let currentY = headerY + 20;
    
    const validStudents = students || [];
    validStudents.forEach((student, index) => {
      // Alternate row background
      if (index % 2 === 0) {
        doc
          .rect(startX, currentY, totalTableWidth, 20)
          .fillAndStroke('#f9f9f9', '#e0e0e0');
      }
      
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#000000');

      currentX = startX + padding; // Reset X for each row
      
      // --- NEW ROW DATA ---

      // Column 1: S.No
      doc.text(
        (startIndex + index).toString(), 
        currentX, 
        currentY + 5, 
        { width: colWidths[0] - (padding * 2), align: 'left' }
      );
      currentX += colWidths[0];
        
      // Column 2: Name
      const studentName = (student?.name || 'Unknown Student');
      const truncatedName = studentName.length > 20 
        ? studentName.substring(0, 17) + '...' 
        : studentName;
      doc.text(
        truncatedName,
        currentX,
        currentY + 5,
        { width: colWidths[1] - (padding * 2), align: 'left' }
      );
      currentX += colWidths[1];

      // Column 3: Sinno
      const sinno = student?.id || 'N/A'; // Assumes 'sinno' property exists
      doc.text(
        sinno,
        currentX,
        currentY + 5,
        { width: colWidths[2] - (padding * 2), align: 'left' }
      );
      currentX += colWidths[2];

      // Column 4: Email
      const email = student?.email || 'N/A'; // Assumes 'email' property exists
      const truncatedEmail = email.length > 25 
        ? email.substring(0, 22) + '...' 
        : email;
      doc.text(
        truncatedEmail,
        currentX,
        currentY + 5,
        { width: colWidths[3] - (padding * 2), align: 'left' }
      );
      currentX += colWidths[3];
      
      // Column 5: Marks
      // (Using 'totalScore' from your original data structure for 'Marks')
      doc.text(
        (student?.totalScore || 0).toString(),
        currentX,
        currentY + 5,
        { width: colWidths[4] - (padding * 2), align: 'center' }
      );
      // --- END NEW ROW DATA ---
      
      currentY += 20;
    });
    
    doc.y = currentY + 10;
  } catch (error) {
    console.error('❌ Error in drawStudentResultsTable:', error);
    throw error;
  }
}

/**
 * Add footer to the PDF
 * @param {PDFDocument} doc - PDF document instance
 */
function addFooter(doc) {
  try {
    const footerY = 780;
    
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#666666')
      .text(
        'Generated by Test Platform',
        50,
        footerY,
        { align: 'left' }
      )
      .text(
        `Generated on ${new Date().toLocaleDateString()}`,
        0,
        footerY,
        { align: 'center' }
      )
      .text(
        new Date().toLocaleTimeString(),
        -50,
        footerY,
        { align: 'right' }
      );
  } catch (error) {
    console.error('❌ Error in addFooter:', error);
    // Don't throw error for footer issues, just log it
  }
}

module.exports = {
  generatePDFReport
};