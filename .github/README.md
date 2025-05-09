# GitHub Actions for Style Guide System

This directory contains GitHub Actions workflows for automated testing and deployment of the Style Guide System.

## Workflows

### Automated Tests (`automated-tests.yml`)

This workflow runs comprehensive tests for the Style Guide System:

- **Trigger**: 
  - Push to main/master
  - Pull requests to main/master
  - Daily at midnight
  - Manual triggering

- **Jobs**:
  1. **UI Tests**:
     - Sets up Node.js environment
     - Installs dependencies
     - Installs Playwright browsers
     - Starts development server
     - Runs UI fixes
     - Runs UI tests
     - Uploads test results as artifacts

  2. **Database Tests**:
     - Sets up PostgreSQL service
     - Sets up Node.js environment
     - Installs dependencies
     - Creates test environment
     - Runs database tests
     - Uploads test results as artifacts

  3. **Deploy Reports**:
     - Runs after UI and database tests complete
     - Downloads test results
     - Creates an index page
     - Deploys reports to GitHub Pages

## Setting Up GitHub Actions

To use these workflows:

1. Make sure your repository is connected to GitHub
2. Push the `.github/workflows` directory to your repository
3. Go to the "Actions" tab in your GitHub repository
4. Enable workflows if they're not already enabled

## Viewing Test Reports

After the workflow runs, test reports are published to GitHub Pages:

```
https://{your-github-username}.github.io/{repository-name}/
```

## Customizing Workflows

To customize the workflows:

1. Edit the `.github/workflows/automated-tests.yml` file
2. Commit and push your changes
3. The updated workflow will be used for the next run

## Troubleshooting

If the workflow fails:

1. Check the workflow run logs in the GitHub Actions tab
2. Make sure all dependencies are correctly installed
3. Verify that the development server starts correctly
4. Check that the test scripts are working locally

## Manual Triggering

To manually trigger the workflow:

1. Go to the "Actions" tab in your GitHub repository
2. Select the "Automated Tests" workflow
3. Click "Run workflow"
4. Select the branch to run on
5. Click "Run workflow"
