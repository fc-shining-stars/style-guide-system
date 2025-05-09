#!/usr/bin/env node

/**
 * Make Test Files Executable
 * 
 * This script makes all test files executable.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  scriptsDir: path.join(__dirname),
  testFiles: [
    'comprehensive-test.js',
    'comprehensive-db-test.js',
    'fix-ui-issues.js',
    'run-tests-and-fixes.js',
    'test-cli.js'
  ]
};

// Main function
async function makeTestFilesExecutable() {
  console.log('Making test files executable...');
  
  try {
    // Check if running on Windows
    const isWindows = process.platform === 'win32';
    
    if (isWindows) {
      console.log('Running on Windows, skipping chmod...');
      return;
    }
    
    // Make each test file executable
    for (const testFile of config.testFiles) {
      const filePath = path.join(config.scriptsDir, testFile);
      
      if (fs.existsSync(filePath)) {
        console.log(`Making ${testFile} executable...`);
        execSync(`chmod +x ${filePath}`);
      } else {
        console.log(`File not found: ${testFile}`);
      }
    }
    
    console.log('All test files are now executable.');
  } catch (error) {
    console.error('Error making test files executable:', error);
  }
}

// Run the script
makeTestFilesExecutable().catch(console.error);
