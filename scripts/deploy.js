/**
 * Deploy script for Grifo Vistorias app
 * 
 * This script automates the deployment process for different environments
 * Usage: node scripts/deploy.js [environment] [platform]
 * 
 * Environment: preview, production (default: preview)
 * Platform: android, ios, all (default: all)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
const environment = args[0] || 'preview';
const platform = args[1] || 'all';

// Validate environment
if (!['preview', 'production'].includes(environment)) {
  console.error('Invalid environment. Must be one of: preview, production');
  process.exit(1);
}

// Validate platform
if (!['android', 'ios', 'all'].includes(platform)) {
  console.error('Invalid platform. Must be one of: android, ios, all');
  process.exit(1);
}

// Set environment file based on environment
const envFile = environment === 'preview' ? '.env.staging' : '.env.production';

// Check if environment file exists
if (!fs.existsSync(path.join(process.cwd(), envFile))) {
  console.error(`Environment file ${envFile} not found`);
  process.exit(1);
}

// Copy environment file to .env
// Setting up environment for deployment
fs.copyFileSync(path.join(process.cwd(), envFile), path.join(process.cwd(), '.env'));

// Deploy function
const deployApp = (deployPlatform) => {
  // Deploying to platform in environment
  try {
    // Build the app first
    execSync(`npm run build:${deployPlatform}:${environment}`, { stdio: 'inherit' });
    
    // Submit to store if in production environment
    if (environment === 'production') {
      // Submitting build to store
      execSync(`eas submit --platform ${deployPlatform} --profile ${environment}`, { stdio: 'inherit' });
    }
    
    // Deployment completed successfully
  } catch (error) {
    console.error(`❌ ${deployPlatform.toUpperCase()} deployment failed:`, error.message);
    process.exit(1);
  }
};

// Execute deployments
if (platform === 'all' || platform === 'android') {
  deployApp('android');
}

if (platform === 'all' || platform === 'ios') {
  deployApp('ios');
}

// Deployment process completed