/**
 * Version update script for Grifo Vistorias app
 */

const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
const newVersion = args[0];
let newBuildNumber = args[1];

// Validate version format
if (newVersion && !/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error('Invalid version format. Must be in semver format (e.g., 1.0.0)');
  process.exit(1);
}

// Read app.json
const appJsonPath = path.join(process.cwd(), 'app.json');
let appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

// Get current version and build numbers
const currentVersion = appJson.expo.version;
const currentIosBuildNumber = appJson.expo.ios.buildNumber;
const currentAndroidVersionCode = appJson.expo.android.versionCode;

if (!newVersion) {
  console.log(`Current version is ${currentVersion}`);
  process.exit(0);
}

// If no build number provided, increment current
if (!newBuildNumber) {
  newBuildNumber = Math.max(
    parseInt(currentIosBuildNumber, 10),
    currentAndroidVersionCode
  ) + 1;
} else {
  newBuildNumber = parseInt(newBuildNumber, 10);
}

// Update app.json
appJson.expo.version = newVersion;
appJson.expo.ios.buildNumber = String(newBuildNumber);
appJson.expo.android.versionCode = newBuildNumber;
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

// Update environment files
const updateEnvFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(
      /EXPO_PUBLIC_APP_VERSION=.*/,
      `EXPO_PUBLIC_APP_VERSION=${newVersion}`
    );
    fs.writeFileSync(filePath, content);
  }
};

updateEnvFile(path.join(process.cwd(), '.env.development'));
updateEnvFile(path.join(process.cwd(), '.env.staging'));
updateEnvFile(path.join(process.cwd(), '.env.production'));

console.log(`Version updated to ${newVersion} (build ${newBuildNumber})`);