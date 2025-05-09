/**
 * UI Issue Fixer for Style Guide System
 * 
 * This script identifies and fixes common UI issues in the style guide system.
 * It checks for:
 * - Missing CSS styles
 * - Broken components
 * - Layout issues
 * - Responsive design problems
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  srcDir: path.join(__dirname, '../src'),
  componentsDir: path.join(__dirname, '../src/components'),
  pagesDir: path.join(__dirname, '../src/app'),
  stylesDir: path.join(__dirname, '../src/styles'),
  publicDir: path.join(__dirname, '../public'),
  fixes: {
    missingStyles: true,
    brokenComponents: true,
    layoutIssues: true,
    responsiveDesign: true
  }
};

// Main function
async function fixUiIssues() {
  console.log('Starting UI issue fixes...');
  
  // Create a results object to track changes
  const results = {
    fixed: 0,
    skipped: 0,
    errors: 0,
    details: []
  };
  
  try {
    // Check if global CSS file exists and has content
    await fixGlobalStyles(results);
    
    // Fix component styling issues
    await fixComponentStyles(results);
    
    // Fix layout issues
    await fixLayoutIssues(results);
    
    // Fix responsive design issues
    await fixResponsiveDesign(results);
    
    // Generate report
    generateReport(results);
    
    console.log('UI fixes completed.');
    console.log(`Fixed: ${results.fixed}, Skipped: ${results.skipped}, Errors: ${results.errors}`);
  } catch (error) {
    console.error('Error fixing UI issues:', error);
  }
}

// Fix global styles
async function fixGlobalStyles(results) {
  console.log('Checking global styles...');
  
  const globalCssPath = path.join(config.srcDir, 'app/globals.css');
  
  try {
    // Check if globals.css exists
    if (!fs.existsSync(globalCssPath)) {
      console.log('globals.css not found, creating it...');
      
      // Create a basic globals.css file with Tailwind directives
      const globalCssContent = `
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
  --primary-color: 111, 33, 150;
  --secondary-color: 45, 212, 191;
  --accent-color: 249, 115, 22;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-start-rgb));
}

/* Admin Panel Styles */
.admin-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  min-height: 100vh;
}

@media (max-width: 768px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }
}

.admin-sidebar {
  background-color: rgb(var(--primary-color));
  color: white;
  padding: 1rem;
}

.admin-content {
  padding: 2rem;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.admin-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Form Styles */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.25rem;
}

.form-button {
  padding: 0.5rem 1rem;
  background-color: rgb(var(--primary-color));
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}

.form-button:hover {
  opacity: 0.9;
}

/* Color Palette Styles */
.color-palette {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
}

.color-swatch {
  height: 100px;
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.color-swatch-info {
  background-color: rgba(255, 255, 255, 0.9);
  padding: 0.5rem;
  border-bottom-left-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
  font-size: 0.875rem;
}

/* Typography Styles */
.typography-examples h1 {
  font-size: 2.25rem;
  margin-bottom: 1rem;
}

.typography-examples h2 {
  font-size: 1.875rem;
  margin-bottom: 0.875rem;
}

.typography-examples h3 {
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
}

.typography-examples p {
  margin-bottom: 1rem;
  line-height: 1.5;
}

/* Component Preview Styles */
.component-preview {
  padding: 2rem;
  border: 1px dashed #e2e8f0;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

/* Settings Page Styles */
.settings-section {
  margin-bottom: 2rem;
}

.settings-section h3 {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

/* Image Gallery Styles */
.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.image-item {
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.image-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.image-item-info {
  padding: 0.5rem;
  background-color: white;
}
`;
      
      fs.writeFileSync(globalCssPath, globalCssContent);
      
      results.fixed++;
      results.details.push({
        file: 'globals.css',
        type: 'created',
        message: 'Created missing globals.css file with base styles'
      });
    } else {
      // Check if globals.css has content
      const content = fs.readFileSync(globalCssPath, 'utf8');
      
      if (content.trim().length === 0 || !content.includes('@tailwind')) {
        // File exists but is empty or missing Tailwind directives
        console.log('globals.css exists but is missing content, updating it...');
        
        // Add Tailwind directives and basic styles
        const updatedContent = `
@tailwind base;
@tailwind components;
@tailwind utilities;

${content}

/* Add missing styles */
:root {
  --primary-color: 111, 33, 150;
  --secondary-color: 45, 212, 191;
  --accent-color: 249, 115, 22;
}

/* Admin Panel Styles */
.admin-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  min-height: 100vh;
}

@media (max-width: 768px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }
}

.admin-sidebar {
  background-color: rgb(var(--primary-color));
  color: white;
  padding: 1rem;
}

.admin-content {
  padding: 2rem;
}
`;
        
        fs.writeFileSync(globalCssPath, updatedContent);
        
        results.fixed++;
        results.details.push({
          file: 'globals.css',
          type: 'updated',
          message: 'Updated globals.css with missing styles'
        });
      } else {
        console.log('globals.css exists and has content, skipping...');
        
        results.skipped++;
        results.details.push({
          file: 'globals.css',
          type: 'skipped',
          message: 'globals.css already exists and has content'
        });
      }
    }
  } catch (error) {
    console.error('Error fixing global styles:', error);
    
    results.errors++;
    results.details.push({
      file: 'globals.css',
      type: 'error',
      message: `Error fixing global styles: ${error.message}`
    });
  }
}

// Fix component styles (placeholder)
async function fixComponentStyles(results) {
  console.log('Checking component styles...');
  // Implementation would go here
  return results;
}

// Fix layout issues (placeholder)
async function fixLayoutIssues(results) {
  console.log('Checking layout issues...');
  // Implementation would go here
  return results;
}

// Fix responsive design issues (placeholder)
async function fixResponsiveDesign(results) {
  console.log('Checking responsive design issues...');
  // Implementation would go here
  return results;
}

// Generate HTML report
function generateReport(results) {
  const reportPath = path.join(__dirname, '../ui-fix-report.html');
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Style Guide System UI Fix Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    h1 { color: #333; }
    .summary { display: flex; margin-bottom: 20px; }
    .summary-item { 
      padding: 15px; 
      margin-right: 15px; 
      border-radius: 5px; 
      color: white; 
      font-weight: bold;
    }
    .fixed { background-color: #4CAF50; }
    .skipped { background-color: #2196F3; }
    .errors { background-color: #F44336; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    tr:hover { background-color: #f5f5f5; }
    .type-created { color: #4CAF50; }
    .type-updated { color: #FF9800; }
    .type-skipped { color: #2196F3; }
    .type-error { color: #F44336; }
  </style>
</head>
<body>
  <h1>Style Guide System UI Fix Report</h1>
  
  <div class="summary">
    <div class="summary-item fixed">Fixed: ${results.fixed}</div>
    <div class="summary-item skipped">Skipped: ${results.skipped}</div>
    <div class="summary-item errors">Errors: ${results.errors}</div>
  </div>
  
  <h2>Fix Details</h2>
  <table>
    <thead>
      <tr>
        <th>File</th>
        <th>Type</th>
        <th>Message</th>
      </tr>
    </thead>
    <tbody>
      ${results.details.map(detail => `
        <tr>
          <td>${detail.file}</td>
          <td class="type-${detail.type}">${detail.type}</td>
          <td>${detail.message}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
  `;
  
  fs.writeFileSync(reportPath, html);
  console.log(`Report generated at: ${reportPath}`);
}

// Run the script
fixUiIssues().catch(console.error);
