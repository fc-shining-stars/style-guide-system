/**
 * Run Tests and Fixes for Style Guide System
 * 
 * This script runs all tests and fixes for the style guide system.
 * It first runs the UI fixes, then the comprehensive tests.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  testResultsDir: path.join(__dirname, '../test-results'),
  uiFixReportPath: path.join(__dirname, '../ui-fix-report.html'),
  testReportPath: path.join(__dirname, '../test-results/report.html'),
  combinedReportPath: path.join(__dirname, '../test-results/combined-report.html')
};

// Main function
async function runTestsAndFixes() {
  console.log('Starting tests and fixes...');
  
  try {
    // Create test results directory if it doesn't exist
    if (!fs.existsSync(config.testResultsDir)) {
      fs.mkdirSync(config.testResultsDir, { recursive: true });
    }
    
    // Run UI fixes
    console.log('\n=== Running UI fixes ===\n');
    execSync('node scripts/fix-ui-issues.js', { stdio: 'inherit' });
    
    // Run comprehensive tests
    console.log('\n=== Running comprehensive tests ===\n');
    execSync('node scripts/comprehensive-test.js', { stdio: 'inherit' });
    
    // Generate combined report
    generateCombinedReport();
    
    console.log('\n=== All tests and fixes completed ===\n');
    console.log(`Combined report generated at: ${config.combinedReportPath}`);
  } catch (error) {
    console.error('Error running tests and fixes:', error);
  }
}

// Generate combined report
function generateCombinedReport() {
  console.log('Generating combined report...');
  
  try {
    // Check if both reports exist
    if (!fs.existsSync(config.uiFixReportPath) || !fs.existsSync(config.testReportPath)) {
      console.log('One or both reports do not exist, skipping combined report generation.');
      return;
    }
    
    // Read UI fix report
    const uiFixReport = fs.readFileSync(config.uiFixReportPath, 'utf8');
    
    // Read test report
    const testReport = fs.readFileSync(config.testReportPath, 'utf8');
    
    // Extract UI fix report content
    const uiFixContent = extractReportContent(uiFixReport);
    
    // Extract test report content
    const testContent = extractReportContent(testReport);
    
    // Generate combined report
    const combinedReport = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Style Guide System Combined Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    h1, h2 { color: #333; }
    .summary { display: flex; margin-bottom: 20px; }
    .summary-item { 
      padding: 15px; 
      margin-right: 15px; 
      border-radius: 5px; 
      color: white; 
      font-weight: bold;
    }
    .fixed, .passed { background-color: #4CAF50; }
    .skipped { background-color: #2196F3; }
    .errors, .failed { background-color: #F44336; }
    .warnings { background-color: #FF9800; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    tr:hover { background-color: #f5f5f5; }
    .type-created { color: #4CAF50; }
    .type-updated { color: #FF9800; }
    .type-skipped { color: #2196F3; }
    .type-error, .status-failed { color: #F44336; }
    .status-passed { color: #4CAF50; }
    .status-warning { color: #FF9800; }
    .details-toggle { cursor: pointer; color: blue; text-decoration: underline; }
    .details-content { display: none; white-space: pre-wrap; background-color: #f9f9f9; padding: 10px; }
    .report-section { margin-bottom: 40px; border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>Style Guide System Combined Report</h1>
  
  <div class="report-section">
    <h2>UI Fix Report</h2>
    ${uiFixContent}
  </div>
  
  <div class="report-section">
    <h2>Test Report</h2>
    ${testContent}
  </div>

  <script>
    function toggleDetails(element) {
      const content = element.nextElementSibling;
      if (content.style.display === 'block') {
        content.style.display = 'none';
        element.textContent = 'Show Details';
      } else {
        content.style.display = 'block';
        element.textContent = 'Hide Details';
      }
    }
  </script>
</body>
</html>
`;
    
    // Write combined report
    fs.writeFileSync(config.combinedReportPath, combinedReport);
    
    console.log(`Combined report generated at: ${config.combinedReportPath}`);
  } catch (error) {
    console.error('Error generating combined report:', error);
  }
}

// Extract report content
function extractReportContent(report) {
  // Simple extraction - get everything between the body tags
  const bodyMatch = report.match(/<body>([\s\S]*)<\/body>/);
  
  if (bodyMatch && bodyMatch[1]) {
    // Remove the h1 title
    return bodyMatch[1].replace(/<h1>.*<\/h1>/, '');
  }
  
  return 'Report content could not be extracted.';
}

// Run the script
runTestsAndFixes().catch(console.error);
