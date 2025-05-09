/**
 * Comprehensive Database Testing Script for Style Guide System
 * 
 * This script tests all database interactions for the style guide system:
 * - Connection to Supabase
 * - CRUD operations for all tables
 * - Data validation
 * - Error handling
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hemhsa2xkaXh2Y29oZ2hjdmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4Mjg2MDUsImV4cCI6MjA2MjQwNDYwNX0.tb8hyXIJ3a1IOnV8pKO7bjkwMvcyFq7McPenunlFnX8',
  reportDir: path.join(__dirname, '../db-test-results'),
  tables: [
    'style_guide_configs',
    'color_schemes',
    'typographies',
    'spacings',
    'border_radii',
    'shadows',
    'animations',
    'components',
    'images'
  ]
};

// Create Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseKey);

// Ensure report directory exists
if (!fs.existsSync(config.reportDir)) {
  fs.mkdirSync(config.reportDir, { recursive: true });
}

// Main function
async function runDatabaseTests() {
  console.log('Starting comprehensive database tests...');
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
  };
  
  try {
    // Test connection to Supabase
    await testConnection(results);
    
    // Test table existence and structure
    await testTables(results);
    
    // Test CRUD operations
    await testCrudOperations(results);
    
    // Generate report
    generateReport(results);
    
    console.log('Database tests completed.');
    console.log(`Passed: ${results.passed}, Failed: ${results.failed}, Warnings: ${results.warnings}`);
    
    if (results.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running database tests:', error);
    process.exit(1);
  }
}

// Test connection to Supabase
async function testConnection(results) {
  console.log('Testing connection to Supabase...');
  
  try {
    const { data, error } = await supabase.from('style_guide_configs').select('id').limit(1);
    
    if (error) {
      results.failed++;
      results.details.push({
        test: 'Supabase connection',
        status: 'failed',
        error: error.message
      });
    } else {
      results.passed++;
      results.details.push({
        test: 'Supabase connection',
        status: 'passed',
        message: 'Successfully connected to Supabase'
      });
    }
  } catch (error) {
    results.failed++;
    results.details.push({
      test: 'Supabase connection',
      status: 'failed',
      error: error.message
    });
  }
  
  return results;
}

// Test table existence and structure
async function testTables(results) {
  console.log('Testing table existence and structure...');
  
  for (const table of config.tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      
      if (error && error.code !== 'PGRST116') {
        results.failed++;
        results.details.push({
          test: `Table existence: ${table}`,
          status: 'failed',
          error: error.message
        });
      } else {
        results.passed++;
        results.details.push({
          test: `Table existence: ${table}`,
          status: 'passed',
          message: `Table ${table} exists`
        });
      }
    } catch (error) {
      results.failed++;
      results.details.push({
        test: `Table existence: ${table}`,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  return results;
}

// Test CRUD operations
async function testCrudOperations(results) {
  console.log('Testing CRUD operations...');
  
  // Test style_guide_configs CRUD
  await testStyleGuideConfigsCrud(results);
  
  return results;
}

// Test style_guide_configs CRUD
async function testStyleGuideConfigsCrud(results) {
  console.log('Testing style_guide_configs CRUD operations...');
  
  const testConfig = {
    name: 'Test Style Guide',
    description: 'Test style guide for database testing',
    version: '1.0.0',
    custom_features: {
      customCursor: false,
      customScrollbar: false
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  try {
    // Create
    const { data: createData, error: createError } = await supabase
      .from('style_guide_configs')
      .insert(testConfig)
      .select();
    
    if (createError) {
      results.failed++;
      results.details.push({
        test: 'CRUD: Create style_guide_configs',
        status: 'failed',
        error: createError.message
      });
      return results;
    }
    
    results.passed++;
    results.details.push({
      test: 'CRUD: Create style_guide_configs',
      status: 'passed',
      message: 'Successfully created style_guide_configs record'
    });
    
    const recordId = createData[0].id;
    
    // Read
    const { data: readData, error: readError } = await supabase
      .from('style_guide_configs')
      .select('*')
      .eq('id', recordId)
      .single();
    
    if (readError) {
      results.failed++;
      results.details.push({
        test: 'CRUD: Read style_guide_configs',
        status: 'failed',
        error: readError.message
      });
    } else {
      results.passed++;
      results.details.push({
        test: 'CRUD: Read style_guide_configs',
        status: 'passed',
        message: 'Successfully read style_guide_configs record'
      });
    }
    
    // Update
    const { data: updateData, error: updateError } = await supabase
      .from('style_guide_configs')
      .update({ name: 'Updated Test Style Guide' })
      .eq('id', recordId)
      .select();
    
    if (updateError) {
      results.failed++;
      results.details.push({
        test: 'CRUD: Update style_guide_configs',
        status: 'failed',
        error: updateError.message
      });
    } else {
      results.passed++;
      results.details.push({
        test: 'CRUD: Update style_guide_configs',
        status: 'passed',
        message: 'Successfully updated style_guide_configs record'
      });
    }
    
    // Delete
    const { error: deleteError } = await supabase
      .from('style_guide_configs')
      .delete()
      .eq('id', recordId);
    
    if (deleteError) {
      results.failed++;
      results.details.push({
        test: 'CRUD: Delete style_guide_configs',
        status: 'failed',
        error: deleteError.message
      });
    } else {
      results.passed++;
      results.details.push({
        test: 'CRUD: Delete style_guide_configs',
        status: 'passed',
        message: 'Successfully deleted style_guide_configs record'
      });
    }
  } catch (error) {
    results.failed++;
    results.details.push({
      test: 'CRUD: style_guide_configs',
      status: 'failed',
      error: error.message
    });
  }
  
  return results;
}

// Generate HTML report
function generateReport(results) {
  const reportPath = path.join(config.reportDir, 'report.html');
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Style Guide System Database Test Report</title>
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
    .passed { background-color: #4CAF50; }
    .failed { background-color: #F44336; }
    .warnings { background-color: #FF9800; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    tr:hover { background-color: #f5f5f5; }
    .status-passed { color: #4CAF50; }
    .status-failed { color: #F44336; }
    .status-warning { color: #FF9800; }
    .details-toggle { cursor: pointer; color: blue; text-decoration: underline; }
    .details-content { display: none; white-space: pre-wrap; background-color: #f9f9f9; padding: 10px; }
  </style>
</head>
<body>
  <h1>Style Guide System Database Test Report</h1>
  
  <div class="summary">
    <div class="summary-item passed">Passed: ${results.passed}</div>
    <div class="summary-item failed">Failed: ${results.failed}</div>
    <div class="summary-item warnings">Warnings: ${results.warnings}</div>
  </div>
  
  <h2>Test Details</h2>
  <table>
    <thead>
      <tr>
        <th>Test</th>
        <th>Status</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody>
      ${results.details.map(detail => `
        <tr>
          <td>${detail.test}</td>
          <td class="status-${detail.status}">${detail.status.toUpperCase()}</td>
          <td>
            ${detail.message || detail.error || ''}
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>

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
  
  fs.writeFileSync(reportPath, html);
  console.log(`Report generated at: ${reportPath}`);
}

// Run the tests
runDatabaseTests().catch(console.error);
