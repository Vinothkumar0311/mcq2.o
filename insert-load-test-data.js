const fs = require('fs');
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function insertLoadTestData() {
  try {
    // Find the most recent fallback data file
    const files = fs.readdirSync('.').filter(f => f.startsWith('load-test-fallback-data-'));
    
    if (files.length === 0) {
      console.log('❌ No fallback data files found. Run the load test first.');
      return;
    }
    
    // Get the most recent file
    const latestFile = files.sort().reverse()[0];
    console.log(`📂 Using data file: ${latestFile}`);
    
    // Read the data
    const data = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
    
    if (!Array.isArray(data) || data.length === 0) {
      console.log('❌ No data found in file');
      return;
    }
    
    console.log(`📊 Found ${data.length} test results to insert`);
    
    // Insert data via API
    const response = await axios.post(`${API_BASE_URL}/api/test-results/bulk-insert`, {
      testResults: data
    });
    
    if (response.data.success) {
      console.log(`✅ Successfully inserted ${response.data.inserted} test results`);
      console.log('🎯 You can now view the results in the admin panel!');
    } else {
      console.log('❌ Failed to insert data:', response.data.error);
    }
    
  } catch (error) {
    console.error('❌ Error inserting load test data:', error.message);
  }
}

if (require.main === module) {
  insertLoadTestData();
}

module.exports = { insertLoadTestData };