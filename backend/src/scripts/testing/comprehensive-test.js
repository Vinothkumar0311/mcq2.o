const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

class TestRunner {
  constructor() {
    this.results = { passed: 0, failed: 0, errors: [] };
    this.tokens = {};
  }

  async log(message, type = 'info') {
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  async test(name, testFn) {
    try {
      await this.log(`Testing: ${name}`);
      await testFn();
      this.results.passed++;
      await this.log(`✅ PASSED: ${name}`, 'success');
    } catch (error) {
      this.results.failed++;
      this.results.errors.push({ test: name, error: error.message });
      await this.log(`❌ FAILED: ${name} - ${error.message}`, 'error');
    }
  }

  async makeRequest(method, endpoint, data = null, token = null) {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: { 'Content-Type': 'application/json' }
    };

    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (data) config.data = data;

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      throw new Error(`API Error: ${error.response?.data?.error || error.message}`);
    }
  }

  async testDatabaseConnection() {
    const response = await this.makeRequest('GET', '/health');
    if (response.status !== 'API is working') {
      throw new Error('Database connection failed');
    }
  }

  async runAllTests() {
    await this.log('🚀 Starting Test Suite');
    await this.test('Database Connection', () => this.testDatabaseConnection());
    
    const total = this.results.passed + this.results.failed;
    const successRate = total > 0 ? Math.round((this.results.passed / total) * 100) : 0;
    
    await this.log(`📈 Success Rate: ${successRate}% (${this.results.passed}/${total})`);
    return this.results;
  }
}

if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests().then(() => process.exit(runner.results.failed > 0 ? 1 : 0));
}

module.exports = TestRunner;