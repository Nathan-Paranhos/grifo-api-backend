/**
 * Build script for Grifo Vistorias app
 * 
 * This script automates the build process for different environments
 * Usage: node scripts/build.js [environment] [platform]
 * 
 * Environment: development, staging, production (default: production)
 * Platform: android, ios, all (default: all)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
const environment = args[0] || 'production';
const platform = args[1] || 'all';

// Validate environment
if (!['development', 'staging', 'production'].includes(environment)) {
  console.error('Invalid environment. Must be one of: development, staging, production');
  process.exit(1);
}

// Validate platform
if (!['android', 'ios', 'all'].includes(platform)) {
  console.error('Invalid platform. Must be one of: android, ios, all');
  process.exit(1);
}

// Set environment file
const envFile = `.env.${environment}`;

// Check if environment file exists
if (!fs.existsSync(path.join(process.cwd(), envFile))) {
  console.error(`Environment file ${envFile} not found`);
  process.exit(1);
}

// Copy environment file to .env
console.log(`Setting up environment: ${environment}`);
fs.copyFileSync(path.join(process.cwd(), envFile), path.join(process.cwd(), '.env'));

// Build function
const buildApp = (buildPlatform) => {
  console.log(`Building for ${buildPlatform} in ${environment} environment...`);
  try {
    execSync(`npm run build:${buildPlatform}:${environment}`, { stdio: 'inherit' });
    console.log(`✅ ${buildPlatform.toUpperCase()} build completed successfully!`);
  } catch (error) {
    console.error(`❌ ${buildPlatform.toUpperCase()} build failed:`, error.message);
    process.exit(1);
  }
};

// Execute builds
if (platform === 'all' || platform === 'android') {
  buildApp('android');
}

if (platform === 'all' || platform === 'ios') {
  buildApp('ios');
}

console.log('\n🎉 Build process completed!');