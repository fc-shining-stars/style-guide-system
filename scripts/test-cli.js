#!/usr/bin/env node

/**
 * Test CLI for Style Guide System
 * 
 * This script provides a command-line interface for running tests and fixes.
 * It allows users to run specific tests or all tests with a simple command.
 */

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

// Main menu
function showMainMenu() {
  console.clear();
  console.log(`${colors.bright}${colors.fg.magenta}Style Guide System Test CLI${colors.reset}\n`);
  console.log(`${colors.bright}Choose an option:${colors.reset}`);
  console.log(`${colors.fg.cyan}1.${colors.reset} Run all tests and fixes`);
  console.log(`${colors.fg.cyan}2.${colors.reset} Run UI tests only`);
  console.log(`${colors.fg.cyan}3.${colors.reset} Run database tests only`);
  console.log(`${colors.fg.cyan}4.${colors.reset} Run UI fixes only`);
  console.log(`${colors.fg.cyan}5.${colors.reset} View test reports`);
  console.log(`${colors.fg.cyan}6.${colors.reset} Start development server`);
  console.log(`${colors.fg.cyan}7.${colors.reset} Exit\n`);
  
  rl.question(`${colors.fg.yellow}Enter your choice (1-7): ${colors.reset}`, (answer) => {
    switch (answer.trim()) {
      case '1':
        runAllTestsAndFixes();
        break;
      case '2':
        runUITests();
        break;
      case '3':
        runDatabaseTests();
        break;
      case '4':
        runUIFixes();
        break;
      case '5':
        viewTestReports();
        break;
      case '6':
        startDevServer();
        break;
      case '7':
        console.log(`${colors.fg.green}Goodbye!${colors.reset}`);
        rl.close();
        break;
      default:
        console.log(`${colors.fg.red}Invalid choice. Please try again.${colors.reset}`);
        setTimeout(showMainMenu, 1500);
    }
  });
}

// Run all tests and fixes
function runAllTestsAndFixes() {
  console.clear();
  console.log(`${colors.bright}${colors.fg.magenta}Running all tests and fixes...${colors.reset}\n`);
  
  try {
    const child = spawn('node', ['scripts/run-tests-and-fixes.js'], { stdio: 'inherit' });
    
    child.on('close', (code) => {
      console.log(`\n${colors.fg.yellow}Process exited with code ${code}${colors.reset}`);
      console.log(`\n${colors.fg.cyan}Press Enter to return to the main menu...${colors.reset}`);
      
      // Wait for user to press Enter
      rl.question('', () => {
        showMainMenu();
      });
    });
  } catch (error) {
    console.error(`${colors.fg.red}Error running tests and fixes:${colors.reset}`, error);
    console.log(`\n${colors.fg.cyan}Press Enter to return to the main menu...${colors.reset}`);
    
    // Wait for user to press Enter
    rl.question('', () => {
      showMainMenu();
    });
  }
}

// Run UI tests only
function runUITests() {
  console.clear();
  console.log(`${colors.bright}${colors.fg.magenta}Running UI tests...${colors.reset}\n`);
  
  try {
    const child = spawn('node', ['scripts/comprehensive-test.js'], { stdio: 'inherit' });
    
    child.on('close', (code) => {
      console.log(`\n${colors.fg.yellow}Process exited with code ${code}${colors.reset}`);
      console.log(`\n${colors.fg.cyan}Press Enter to return to the main menu...${colors.reset}`);
      
      // Wait for user to press Enter
      rl.question('', () => {
        showMainMenu();
      });
    });
  } catch (error) {
    console.error(`${colors.fg.red}Error running UI tests:${colors.reset}`, error);
    console.log(`\n${colors.fg.cyan}Press Enter to return to the main menu...${colors.reset}`);
    
    // Wait for user to press Enter
    rl.question('', () => {
      showMainMenu();
    });
  }
}

// Run database tests only
function runDatabaseTests() {
  console.clear();
  console.log(`${colors.bright}${colors.fg.magenta}Running database tests...${colors.reset}\n`);
  
  try {
    const child = spawn('npm', ['run', 'db:test:comprehensive'], { stdio: 'inherit' });
    
    child.on('close', (code) => {
      console.log(`\n${colors.fg.yellow}Process exited with code ${code}${colors.reset}`);
      console.log(`\n${colors.fg.cyan}Press Enter to return to the main menu...${colors.reset}`);
      
      // Wait for user to press Enter
      rl.question('', () => {
        showMainMenu();
      });
    });
  } catch (error) {
    console.error(`${colors.fg.red}Error running database tests:${colors.reset}`, error);
    console.log(`\n${colors.fg.cyan}Press Enter to return to the main menu...${colors.reset}`);
    
    // Wait for user to press Enter
    rl.question('', () => {
      showMainMenu();
    });
  }
}

// Run UI fixes only
function runUIFixes() {
  console.clear();
  console.log(`${colors.bright}${colors.fg.magenta}Running UI fixes...${colors.reset}\n`);
  
  try {
    const child = spawn('node', ['scripts/fix-ui-issues.js'], { stdio: 'inherit' });
    
    child.on('close', (code) => {
      console.log(`\n${colors.fg.yellow}Process exited with code ${code}${colors.reset}`);
      console.log(`\n${colors.fg.cyan}Press Enter to return to the main menu...${colors.reset}`);
      
      // Wait for user to press Enter
      rl.question('', () => {
        showMainMenu();
      });
    });
  } catch (error) {
    console.error(`${colors.fg.red}Error running UI fixes:${colors.reset}`, error);
    console.log(`\n${colors.fg.cyan}Press Enter to return to the main menu...${colors.reset}`);
    
    // Wait for user to press Enter
    rl.question('', () => {
      showMainMenu();
    });
  }
}

// View test reports
function viewTestReports() {
  console.clear();
  console.log(`${colors.bright}${colors.fg.magenta}Test Reports${colors.reset}\n`);
  console.log(`${colors.bright}Choose a report to view:${colors.reset}`);
  console.log(`${colors.fg.cyan}1.${colors.reset} UI Test Report`);
  console.log(`${colors.fg.cyan}2.${colors.reset} UI Fix Report`);
  console.log(`${colors.fg.cyan}3.${colors.reset} Combined Report`);
  console.log(`${colors.fg.cyan}4.${colors.reset} Database Test Report`);
  console.log(`${colors.fg.cyan}5.${colors.reset} Back to main menu\n`);
  
  rl.question(`${colors.fg.yellow}Enter your choice (1-5): ${colors.reset}`, (answer) => {
    let reportPath;
    
    switch (answer.trim()) {
      case '1':
        reportPath = path.join(__dirname, '../test-results/report.html');
        openReport(reportPath, 'UI Test Report');
        break;
      case '2':
        reportPath = path.join(__dirname, '../ui-fix-report.html');
        openReport(reportPath, 'UI Fix Report');
        break;
      case '3':
        reportPath = path.join(__dirname, '../test-results/combined-report.html');
        openReport(reportPath, 'Combined Report');
        break;
      case '4':
        reportPath = path.join(__dirname, '../db-test-results/report.html');
        openReport(reportPath, 'Database Test Report');
        break;
      case '5':
        showMainMenu();
        break;
      default:
        console.log(`${colors.fg.red}Invalid choice. Please try again.${colors.reset}`);
        setTimeout(viewTestReports, 1500);
    }
  });
}

// Open a report in the default browser
function openReport(reportPath, reportName) {
  if (fs.existsSync(reportPath)) {
    console.log(`${colors.fg.green}Opening ${reportName}...${colors.reset}`);
    
    // Open the report in the default browser
    const command = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
    try {
      execSync(`${command} "${reportPath}"`);
    } catch (error) {
      console.error(`${colors.fg.red}Error opening report:${colors.reset}`, error);
    }
  } else {
    console.log(`${colors.fg.red}Report not found: ${reportPath}${colors.reset}`);
  }
  
  console.log(`\n${colors.fg.cyan}Press Enter to return to the reports menu...${colors.reset}`);
  
  // Wait for user to press Enter
  rl.question('', () => {
    viewTestReports();
  });
}

// Start development server
function startDevServer() {
  console.clear();
  console.log(`${colors.bright}${colors.fg.magenta}Starting development server...${colors.reset}\n`);
  
  try {
    const child = spawn('npm', ['run', 'dev'], { stdio: 'inherit' });
    
    console.log(`${colors.fg.yellow}Development server started. Press Ctrl+C to stop.${colors.reset}`);
    
    child.on('close', (code) => {
      console.log(`\n${colors.fg.yellow}Development server stopped with code ${code}${colors.reset}`);
      console.log(`\n${colors.fg.cyan}Press Enter to return to the main menu...${colors.reset}`);
      
      // Wait for user to press Enter
      rl.question('', () => {
        showMainMenu();
      });
    });
  } catch (error) {
    console.error(`${colors.fg.red}Error starting development server:${colors.reset}`, error);
    console.log(`\n${colors.fg.cyan}Press Enter to return to the main menu...${colors.reset}`);
    
    // Wait for user to press Enter
    rl.question('', () => {
      showMainMenu();
    });
  }
}

// Start the CLI
showMainMenu();
