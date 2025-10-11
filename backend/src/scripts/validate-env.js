require('dotenv').config();

const requiredEnvVars = [
  'DB_NAME',
  'DB_USER', 
  'DB_PASSWORD',
  'DB_HOST',
  'JWT_SECRET',
  'GOOGLE_CLIENT_ID'
];

const optionalEnvVars = [
  'DB_PORT',
  'ADMIN_EMAILS',
  'NODE_ENV'
];

console.log('🔍 Validating environment variables...\n');

let hasErrors = false;

// Check required variables
console.log('Required Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value || value.trim() === '') {
    console.log(`❌ ${varName}: MISSING`);
    hasErrors = true;
  } else {
    // Mask sensitive values
    const displayValue = ['JWT_SECRET', 'DB_PASSWORD'].includes(varName) 
      ? '*'.repeat(value.length) 
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  }
});

console.log('\nOptional Variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value || value.trim() === '') {
    console.log(`⚠️  ${varName}: NOT SET (using default)`);
  } else {
    const displayValue = ['JWT_SECRET', 'DB_PASSWORD'].includes(varName) 
      ? '*'.repeat(value.length) 
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  }
});

// Validate specific formats
console.log('\nValidation Checks:');

// JWT Secret strength
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.log('⚠️  JWT_SECRET should be at least 32 characters long for security');
}

// Google Client ID format
if (process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com')) {
  console.log('⚠️  GOOGLE_CLIENT_ID format may be incorrect');
}

// Database port
const dbPort = process.env.DB_PORT || '3306';
if (isNaN(parseInt(dbPort))) {
  console.log('❌ DB_PORT must be a valid number');
  hasErrors = true;
}

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('❌ Environment validation FAILED');
  console.log('Please fix the missing required variables in your .env file');
  process.exit(1);
} else {
  console.log('✅ Environment validation PASSED');
  console.log('All required environment variables are properly configured');
  process.exit(0);
}