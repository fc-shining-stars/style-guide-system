# Style Guide System Testing Framework

This document provides comprehensive information about the testing framework for the Style Guide System.

## Overview

The Style Guide System includes a robust testing framework that covers:

- UI components and pages
- Database interactions
- Responsive design
- Functionality
- Automated UI fixes

The testing framework is designed to be easy to use, with both command-line scripts and a user-friendly CLI interface.

## Testing Scripts

The following testing scripts are available:

### UI Testing

- `npm run test` - Runs comprehensive UI tests
- `npm run test:ui` - Runs UI component tests
- `npm run fix:ui` - Automatically fixes common UI issues
- `npm run fix:all` - Runs all fixes and tests, generating a combined report

### Database Testing

- `npm run db:test` - Runs basic database tests
- `npm run db:test:comprehensive` - Runs comprehensive database tests

### Combined Testing

- `npm run test:all` - Runs linting and all tests
- `npm run test:cli` - Launches the interactive testing CLI

## Testing CLI

The testing CLI provides a user-friendly interface for running tests and viewing reports. To use it, run:

```bash
npm run test:cli
```

This will open an interactive menu with the following options:

1. Run all tests and fixes
2. Run UI tests only
3. Run database tests only
4. Run UI fixes only
5. View test reports
6. Start development server
7. Exit

## Test Reports

All tests generate detailed HTML reports that can be viewed in a web browser. These reports include:

- Summary of passed, failed, and warning tests
- Detailed information about each test
- Screenshots of UI tests
- Error messages for failed tests

Reports are generated in the following locations:

- UI Test Report: `test-results/report.html`
- UI Fix Report: `ui-fix-report.html`
- Combined Report: `test-results/combined-report.html`
- Database Test Report: `db-test-results/report.html`

## Automated Testing with GitHub Actions

The repository includes GitHub Actions workflows that automatically run tests on:

- Every push to main/master
- Every pull request to main/master
- Daily at midnight
- Manual triggering

The workflow runs all tests and generates reports that are published to GitHub Pages. You can view the latest test reports at:

```
https://{your-github-username}.github.io/{repository-name}/
```

## UI Testing

UI tests use Playwright to test the application across different viewports:

- Mobile (375x667)
- Tablet (768x1024)
- Desktop (1280x800)

The tests check for:

- Page loading
- Component rendering
- Responsive design
- Console errors
- Broken images
- Accessibility issues

## Database Testing

Database tests check:

- Connection to Supabase
- Table existence and structure
- CRUD operations for all tables
- Data validation
- Error handling

## UI Fixes

The UI fix script automatically fixes common UI issues:

- Missing CSS styles
- Broken components
- Layout issues
- Responsive design problems

## Adding New Tests

### Adding UI Tests

To add a new UI test, edit the `scripts/comprehensive-test.js` file and add a new test function. For example:

```javascript
async function testNewFeature(page, viewport, results) {
  try {
    // Check if new feature is visible
    const newFeature = await page.$('.new-feature');
    if (newFeature) {
      results.passed++;
      results.details.push({
        test: 'New Feature: Visibility',
        viewport: viewport.name,
        status: 'passed'
      });
    } else {
      results.failed++;
      results.details.push({
        test: 'New Feature: Visibility',
        viewport: viewport.name,
        status: 'failed',
        message: 'New feature not found'
      });
    }
  } catch (error) {
    results.failed++;
    results.details.push({
      test: 'New Feature tests',
      viewport: viewport.name,
      status: 'failed',
      error: error.message
    });
  }

  return results;
}
```

Then add a call to your new test function in the `testPage` function.

### Adding Database Tests

To add a new database test, edit the `scripts/comprehensive-db-test.js` file and add a new test function. For example:

```javascript
async function testNewTable(results) {
  console.log('Testing new_table CRUD operations...');
  
  const testData = {
    name: 'Test Item',
    description: 'Test description',
    created_at: new Date().toISOString()
  };
  
  try {
    // Create
    const { data: createData, error: createError } = await supabase
      .from('new_table')
      .insert(testData)
      .select();
    
    if (createError) {
      results.failed++;
      results.details.push({
        test: 'CRUD: Create new_table',
        status: 'failed',
        error: createError.message
      });
      return results;
    }
    
    results.passed++;
    results.details.push({
      test: 'CRUD: Create new_table',
      status: 'passed',
      message: 'Successfully created new_table record'
    });
    
    // Add more CRUD tests here
  } catch (error) {
    results.failed++;
    results.details.push({
      test: 'CRUD: new_table',
      status: 'failed',
      error: error.message
    });
  }
  
  return results;
}
```

Then add a call to your new test function in the `testCrudOperations` function.

## Troubleshooting

### Tests Failing to Connect to the Development Server

Make sure the development server is running before running the tests:

```bash
npm run dev
```

### Database Tests Failing

Make sure your Supabase credentials are correctly set up in the `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### UI Tests Not Finding Elements

Check that the selectors in the test match the actual elements in your application. You may need to update the selectors if you've changed the HTML structure.

## Best Practices

1. **Run tests frequently** - Run tests after making significant changes to catch issues early.
2. **Keep tests up to date** - Update tests when you change the application.
3. **Fix UI issues automatically** - Use the UI fix script to automatically fix common issues.
4. **Review test reports** - Regularly review test reports to identify trends and recurring issues.
5. **Add tests for new features** - Always add tests for new features to ensure they work correctly.

## Contributing to the Testing Framework

When contributing to the testing framework, please follow these guidelines:

1. **Keep tests independent** - Each test should be independent and not rely on the state from other tests.
2. **Use descriptive test names** - Test names should clearly describe what is being tested.
3. **Add detailed error messages** - Error messages should provide enough information to diagnose the issue.
4. **Test across all viewports** - Make sure your tests run across all viewports (mobile, tablet, desktop).
5. **Document new tests** - Add documentation for new tests in this file.
