# Coding Question Features

## Overview
The system now supports comprehensive coding question functionality with automatic code evaluation, dry run capabilities, and real-time feedback.

## Features Implemented

### 👨‍🏫 Admin Panel (Create Test Interface)

#### Coding Question Creation
- **Problem Statement**: Rich text area for writing coding problems
- **Sample Test Cases**: Add multiple input/output test case pairs
- **Allowed Languages**: Checkbox selection (Java, C++, C, Python)
- **Constraints**: Define input size limits and execution constraints
- **Marks**: Assign marks to each coding question
- **Time & Memory Limits**: Configurable execution limits

#### Test Management
- Create mixed tests with both MCQ and Coding questions
- Section-wise organization with different question types
- Bulk operations and question management

### 👨‍💻 Student Panel (Write & Submit Code)

#### Code Editor Interface
- **Language Selection**: Dropdown to choose from allowed languages
- **Syntax Highlighting**: Monospace font with proper formatting
- **Problem Display**: Clear problem statement with constraints
- **Sample Test Cases**: Visible input/output examples

#### Interactive Features
- **Dry Run**: Test code with sample test cases only
- **Submit**: Evaluate against all test cases (including hidden ones)
- **Real-time Feedback**: Immediate results and scoring
- **Progress Tracking**: Visual indicators for completed questions

#### Code Execution
- **Multi-language Support**: Java, Python, C++, C
- **Sandboxed Execution**: Safe code execution environment
- **Time Limits**: Configurable execution timeouts
- **Memory Management**: Resource usage monitoring

### 🧠 Backend Functionality

#### Code Execution Engine
- **Secure Execution**: Isolated execution environment
- **Multiple Languages**: Support for popular programming languages
- **Error Handling**: Comprehensive compilation and runtime error reporting
- **Performance Metrics**: Execution time and memory usage tracking

#### Evaluation System
- **Test Case Matching**: Exact output comparison
- **Scoring Algorithm**: Percentage-based scoring system
- **Result Storage**: Persistent submission history
- **Status Tracking**: Real-time execution status updates

## API Endpoints

### Coding Question Management
```
POST /api/coding/dry-run
POST /api/coding/submit
GET /api/coding/submission/:submissionId
GET /api/coding/submissions/:testId/:studentId
```

### Test Creation (Enhanced)
```
POST /api/test/create (now supports coding questions)
GET /api/test/:id (includes coding questions)
```

## Database Schema

### CodingQuestions Table
- `id`: Primary key
- `problemStatement`: Problem description
- `sampleTestCases`: JSON array of visible test cases
- `hiddenTestCases`: JSON array of hidden test cases
- `allowedLanguages`: JSON array of supported languages
- `constraints`: Problem constraints text
- `marks`: Question marks
- `timeLimit`: Execution time limit (ms)
- `memoryLimit`: Memory limit (MB)
- `sectionId`: Foreign key to sections

### CodeSubmissions Table
- `id`: Primary key
- `studentId`: Student identifier
- `codingQuestionId`: Foreign key to coding questions
- `testId`: Test identifier
- `code`: Submitted code
- `language`: Programming language used
- `status`: Execution status (pending/passed/failed/error)
- `testResults`: JSON array of test case results
- `score`: Calculated score
- `executionTime`: Time taken (ms)
- `memoryUsed`: Memory consumed (KB)
- `errorMessage`: Error details if any
- `isDryRun`: Boolean flag for dry runs

## Workflow Example

### Admin Creates Question
1. Navigate to Create Test page
2. Add a Coding section
3. Click "Add Coding Question"
4. Fill in problem statement: "Write a function to check if a number is prime"
5. Add sample test cases:
   - Input: `7`, Output: `true`
   - Input: `4`, Output: `false`
6. Select allowed languages: Python, Java
7. Set constraints: "1 ≤ n ≤ 10^6"
8. Assign marks: 10
9. Save question and test

### Student Takes Test
1. Access assigned test
2. Navigate to coding question
3. Read problem statement and constraints
4. Select programming language (Python)
5. Write solution code
6. Click "Dry Run" to test with sample cases
7. Review results and fix any issues
8. Click "Submit Code" for final evaluation
9. View detailed results with test case outcomes

## Technical Implementation

### Code Execution Flow
1. **Receive Code**: API receives code, language, and test cases
2. **Validation**: Check language support and code syntax
3. **File Creation**: Generate temporary source files
4. **Compilation**: Compile code if needed (Java, C++, C)
5. **Execution**: Run code with input data
6. **Output Capture**: Collect program output
7. **Comparison**: Match output with expected results
8. **Cleanup**: Remove temporary files
9. **Result Return**: Send evaluation results back

### Security Measures
- **Sandboxed Execution**: Isolated execution environment
- **Resource Limits**: CPU and memory constraints
- **Timeout Protection**: Prevent infinite loops
- **File System Isolation**: Restricted file access
- **Input Validation**: Sanitized code input

### Error Handling
- **Compilation Errors**: Detailed syntax error messages
- **Runtime Errors**: Exception handling and reporting
- **Timeout Errors**: Time limit exceeded notifications
- **Memory Errors**: Out of memory handling
- **System Errors**: Infrastructure failure recovery

## Performance Considerations

### Optimization Strategies
- **Concurrent Execution**: Multiple submissions processed simultaneously
- **Resource Pooling**: Efficient resource management
- **Caching**: Compiled code caching where applicable
- **Cleanup Automation**: Automatic temporary file removal

### Scalability Features
- **Load Balancing**: Distributed execution capability
- **Queue Management**: Submission queue handling
- **Resource Monitoring**: System resource tracking
- **Auto-scaling**: Dynamic resource allocation

## Future Enhancements

### Planned Features
- **Code Plagiarism Detection**: Similarity analysis
- **Advanced Test Cases**: Hidden test case management
- **Code Quality Metrics**: Style and efficiency scoring
- **Interactive Debugging**: Step-by-step execution
- **Collaborative Coding**: Pair programming support
- **Code Review System**: Peer review functionality

### Integration Possibilities
- **IDE Integration**: External IDE connectivity
- **Version Control**: Git integration for submissions
- **Analytics Dashboard**: Performance analytics
- **Machine Learning**: Automated difficulty assessment
- **Mobile Support**: Responsive mobile interface

## Troubleshooting

### Common Issues
1. **Compilation Failures**: Check syntax and language compatibility
2. **Timeout Errors**: Optimize algorithm efficiency
3. **Memory Issues**: Reduce memory usage in code
4. **Output Mismatch**: Verify exact output format
5. **Language Errors**: Ensure language is supported

### Debug Steps
1. Test with sample cases first
2. Check error messages carefully
3. Verify input/output format
4. Review time and memory limits
5. Contact administrator if issues persist

## System Requirements

### Server Requirements
- **Languages**: Java JDK, Python 3, GCC (C/C++)
- **Memory**: Minimum 4GB RAM
- **Storage**: SSD recommended for performance
- **CPU**: Multi-core processor for concurrent execution

### Client Requirements
- **Browser**: Modern web browser with JavaScript
- **Internet**: Stable internet connection
- **Screen**: Minimum 1024x768 resolution
- **Input**: Keyboard for code typing

This comprehensive coding question system provides a complete solution for programming assessments with professional-grade features and robust execution capabilities.