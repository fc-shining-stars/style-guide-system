/**
 * Comprehensive Testing Script for Style Guide System
 *
 * This script tests all aspects of the style guide system:
 * - UI components
 * - Page rendering
 * - Database interactions
 * - Responsive design
 * - Functionality
 */

const { chromium } = require('playwright');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  baseUrl: 'http://localhost:3000',
  adminUrl: 'http://localhost:3000/admin',
  screenshotsDir: path.join(__dirname, '../test-results/screenshots'),
  viewports: [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 }
  ],
  pages: [
    { name: 'home', path: '/' },
    { name: 'admin', path: '/admin' },
    { name: 'admin-colors', path: '/admin/colors' },
    { name: 'admin-typography', path: '/admin/typography' },
    { name: 'admin-components', path: '/admin/components' },
    { name: 'admin-spacing', path: '/admin/spacing' },
    { name: 'admin-images', path: '/admin/images' },
    { name: 'admin-settings', path: '/admin/settings' }
  ]
};

// Ensure screenshots directory exists
if (!fs.existsSync(config.screenshotsDir)) {
  fs.mkdirSync(config.screenshotsDir, { recursive: true });
}

// Test runner
async function runTests() {
  console.log('Starting comprehensive tests...');
  // Use headless mode in CI environment, non-headless for local development
  const isCI = process.env.CI === 'true';
  const browser = await chromium.launch({
    headless: isCI || process.env.HEADLESS === 'true',
    // Slow down operations in non-headless mode for better visibility during debugging
    slowMo: isCI ? 0 : 50
  });
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
  };

  try {
    // Test each page at each viewport size
    for (const viewport of config.viewports) {
      console.log(`Testing at ${viewport.name} viewport (${viewport.width}x${viewport.height})`);
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height }
      });
      const page = await context.newPage();

      // Test each page
      for (const pageConfig of config.pages) {
        console.log(`Testing page: ${pageConfig.name}`);
        try {
          // Navigate to the page
          await page.goto(`${config.baseUrl}${pageConfig.path}`);
          await page.waitForLoadState('networkidle');

          // Take a screenshot
          const screenshotPath = path.join(
            config.screenshotsDir,
            `${pageConfig.name}-${viewport.name}.png`
          );
          await page.screenshot({ path: screenshotPath, fullPage: true });
          console.log(`Screenshot saved to: ${screenshotPath}`);

          // Run page-specific tests
          const pageTestResult = await testPage(page, pageConfig, viewport);
          results.passed += pageTestResult.passed;
          results.failed += pageTestResult.failed;
          results.warnings += pageTestResult.warnings;
          results.details.push(...pageTestResult.details);

        } catch (error) {
          console.error(`Error testing ${pageConfig.name}:`, error);
          results.failed++;
          results.details.push({
            test: `Page load: ${pageConfig.name}`,
            viewport: viewport.name,
            status: 'failed',
            error: error.message
          });
        }
      }

      await context.close();
    }

    // Test database interactions
    await testDatabaseInteractions(results);

  } catch (error) {
    console.error('Test runner error:', error);
    results.failed++;
    results.details.push({
      test: 'Test runner',
      status: 'failed',
      error: error.message
    });
  } finally {
    await browser.close();

    // Generate report
    generateReport(results);

    console.log('Tests completed.');
    console.log(`Passed: ${results.passed}, Failed: ${results.failed}, Warnings: ${results.warnings}`);

    if (results.failed > 0) {
      process.exit(1);
    }
  }
}

// Page-specific tests
async function testPage(page, pageConfig, viewport) {
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
  };

  // Common tests for all pages
  await testCommonElements(page, pageConfig, viewport, results);

  // Page-specific tests
  switch (pageConfig.name) {
    case 'home':
      await testHomePage(page, viewport, results);
      break;
    case 'admin':
      await testAdminDashboard(page, viewport, results);
      break;
    case 'admin-colors':
      await testColorsPage(page, viewport, results);
      break;
    case 'admin-typography':
      await testTypographyPage(page, viewport, results);
      break;
    case 'admin-components':
      await testComponentsPage(page, viewport, results);
      break;
    case 'admin-spacing':
      await testSpacingPage(page, viewport, results);
      break;
    case 'admin-images':
      await testImagesPage(page, viewport, results);
      break;
    case 'admin-settings':
      await testSettingsPage(page, viewport, results);
      break;
  }

  return results;
}

// Test common elements across all pages
async function testCommonElements(page, pageConfig, viewport, results) {
  // Check if page has a title
  const title = await page.title();
  if (title) {
    results.passed++;
    results.details.push({
      test: `Page title: ${pageConfig.name}`,
      viewport: viewport.name,
      status: 'passed',
      value: title
    });
  } else {
    results.warnings++;
    results.details.push({
      test: `Page title: ${pageConfig.name}`,
      viewport: viewport.name,
      status: 'warning',
      message: 'Page has no title'
    });
  }

  // Check for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.warnings++;
      results.details.push({
        test: `Console error: ${pageConfig.name}`,
        viewport: viewport.name,
        status: 'warning',
        message: msg.text()
      });
    }
  });

  // Check for broken images
  const brokenImages = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return images.filter(img => !img.complete || !img.naturalWidth).map(img => img.src);
  });

  if (brokenImages.length > 0) {
    results.warnings++;
    results.details.push({
      test: `Broken images: ${pageConfig.name}`,
      viewport: viewport.name,
      status: 'warning',
      message: `Found ${brokenImages.length} broken images`,
      details: brokenImages
    });
  }

  return results;
}

// Test the home page
async function testHomePage(page, viewport, results) {
  try {
    // Check if the main style guide preview is visible
    const styleGuidePreview = await page.$('.style-guide-preview');
    if (styleGuidePreview) {
      results.passed++;
      results.details.push({
        test: 'Home page: Style guide preview',
        viewport: viewport.name,
        status: 'passed'
      });
    } else {
      results.failed++;
      results.details.push({
        test: 'Home page: Style guide preview',
        viewport: viewport.name,
        status: 'failed',
        message: 'Style guide preview not found'
      });
    }

    // Check for navigation to admin
    const adminLink = await page.$('a[href="/admin"]');
    if (adminLink) {
      results.passed++;
      results.details.push({
        test: 'Home page: Admin link',
        viewport: viewport.name,
        status: 'passed'
      });
    } else {
      results.warnings++;
      results.details.push({
        test: 'Home page: Admin link',
        viewport: viewport.name,
        status: 'warning',
        message: 'Admin link not found'
      });
    }
  } catch (error) {
    results.failed++;
    results.details.push({
      test: 'Home page tests',
      viewport: viewport.name,
      status: 'failed',
      error: error.message
    });
  }

  return results;
}

// Test the admin dashboard
async function testAdminDashboard(page, viewport, results) {
  try {
    // Check if admin title is present
    const adminTitle = await page.textContent('h1');
    if (adminTitle && adminTitle.includes('Admin Dashboard')) {
      results.passed++;
      results.details.push({
        test: 'Admin Dashboard: Title',
        viewport: viewport.name,
        status: 'passed'
      });
    } else {
      results.warnings++;
      results.details.push({
        test: 'Admin Dashboard: Title',
        viewport: viewport.name,
        status: 'warning',
        message: 'Admin dashboard title not found or incorrect'
      });
    }

    // Check for navigation links
    const navLinks = await page.$$('nav a');
    if (navLinks.length > 0) {
      results.passed++;
      results.details.push({
        test: 'Admin Dashboard: Navigation links',
        viewport: viewport.name,
        status: 'passed',
        value: `Found ${navLinks.length} navigation links`
      });
    } else {
      results.failed++;
      results.details.push({
        test: 'Admin Dashboard: Navigation links',
        viewport: viewport.name,
        status: 'failed',
        message: 'No navigation links found'
      });
    }
  } catch (error) {
    results.failed++;
    results.details.push({
      test: 'Admin Dashboard tests',
      viewport: viewport.name,
      status: 'failed',
      error: error.message
    });
  }

  return results;
}

// Generate HTML report
function generateReport(results) {
  const reportDir = path.join(__dirname, '../test-results');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, 'report.html');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Style Guide System Test Report</title>
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
  <h1>Style Guide System Test Report</h1>

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
        <th>Viewport</th>
        <th>Status</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody>
      ${results.details.map(detail => `
        <tr>
          <td>${detail.test}</td>
          <td>${detail.viewport || 'N/A'}</td>
          <td class="status-${detail.status}">${detail.status.toUpperCase()}</td>
          <td>
            ${detail.message || detail.value || detail.error || ''}
            ${detail.details ? `
              <div class="details-toggle" onclick="toggleDetails(this)">Show Details</div>
              <div class="details-content">${JSON.stringify(detail.details, null, 2)}</div>
            ` : ''}
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

// Placeholder for database interaction tests
async function testDatabaseInteractions(results) {
  // This would be implemented to test database connections and operations
  console.log('Testing database interactions...');

  // For now, just add a placeholder result
  results.warnings++;
  results.details.push({
    test: 'Database interactions',
    status: 'warning',
    message: 'Database interaction tests not yet implemented'
  });

  return results;
}

// Placeholder functions for other page tests
async function testColorsPage(page, viewport, results) {
  // Implementation would go here
  return results;
}

async function testTypographyPage(page, viewport, results) {
  // Implementation would go here
  return results;
}

async function testComponentsPage(page, viewport, results) {
  // Implementation would go here
  return results;
}

async function testSpacingPage(page, viewport, results) {
  // Implementation would go here
  return results;
}

async function testImagesPage(page, viewport, results) {
  // Implementation would go here
  return results;
}

async function testSettingsPage(page, viewport, results) {
  // Implementation would go here
  return results;
}

// Run the tests
runTests().catch(console.error);
