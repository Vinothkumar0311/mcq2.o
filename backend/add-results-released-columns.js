const mysql = require('mysql2');

async function addResultsReleasedColumns() {
  let connection;
  
  try {
    console.log('🔧 Adding resultsReleased columns to database...\n');

    // Create connection using backend config
    connection = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345',
      database: 'projectinforce1'
    }).promise();

    console.log('✅ Connected to database');

    // Add resultsReleased column to test_sessions table
    try {
      await connection.execute(`
        ALTER TABLE test_sessions 
        ADD COLUMN results_released BOOLEAN NOT NULL DEFAULT FALSE 
        COMMENT 'Whether admin has released results for viewing'
      `);
      console.log('✅ Added results_released column to test_sessions');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️  results_released already exists in test_sessions');
      } else {
        console.log('❌ Error adding column to test_sessions:', error.message);
      }
    }

    // Add resultsReleased column to students_results table
    try {
      await connection.execute(`
        ALTER TABLE students_results 
        ADD COLUMN results_released BOOLEAN NOT NULL DEFAULT FALSE 
        COMMENT 'Whether admin has released results for viewing'
      `);
      console.log('✅ Added results_released column to students_results');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️  results_released already exists in students_results');
      } else {
        console.log('❌ Error adding column to students_results:', error.message);
      }
    }

    // Add indexes for better performance
    try {
      await connection.execute(`ALTER TABLE test_sessions ADD INDEX idx_results_released (results_released)`);
      console.log('✅ Added index to test_sessions.results_released');
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('ℹ️  Index already exists on test_sessions.results_released');
      }
    }

    try {
      await connection.execute(`ALTER TABLE students_results ADD INDEX idx_results_released (results_released)`);
      console.log('✅ Added index to students_results.results_released');
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('ℹ️  Index already exists on students_results.results_released');
      }
    }

    console.log('\n🎉 Database migration completed successfully!');
    console.log('\n🔄 Please restart the backend server to reload the models');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addResultsReleasedColumns();