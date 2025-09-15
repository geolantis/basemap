#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Get version from environment or generate based on date/time
const getVersion = () => {
  // Check if version is provided via environment variable
  if (process.env.APP_VERSION) {
    return process.env.APP_VERSION;
  }

  // Check if this is a Vercel deployment
  if (process.env.VERCEL) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    // Generate version like "2.0.0-20241112.1430" for Nov 12, 2024 at 14:30
    // Try multiple environment variables for git commit
    const buildId = (
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.VERCEL_GITHUB_COMMIT_SHA ||
      process.env.GITHUB_SHA ||
      'build'
    ).substring(0, 7);
    return `2.0.0-${year}${month}${day}.${hours}${minutes}-${buildId}`;
  }

  // Default version for local development
  return '2.0.0-dev';
};

// Update package.json
const updatePackageJson = () => {
  const packagePath = resolve(process.cwd(), 'package.json');

  try {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    const newVersion = getVersion();

    // Update version
    packageJson.version = newVersion;

    // Write back to file
    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

    console.log(`✅ Updated package.json version to: ${newVersion}`);
    return newVersion;
  } catch (error) {
    console.error('❌ Failed to update package.json:', error.message);
    process.exit(1);
  }
};

// Create version file for runtime access
const createVersionFile = (version) => {
  const versionPath = resolve(process.cwd(), 'public/version.json');

  const versionInfo = {
    version,
    buildTime: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || 'development',
    gitCommit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_GITHUB_COMMIT_SHA || process.env.GITHUB_SHA || 'local',
    gitBranch: process.env.VERCEL_GIT_COMMIT_REF || process.env.VERCEL_GITHUB_COMMIT_REF || process.env.GITHUB_REF || 'local',
    deploymentUrl: process.env.VERCEL_URL || 'http://localhost:5173'
  };

  try {
    writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2) + '\n');
    console.log(`✅ Created version.json with build info`);
  } catch (error) {
    console.error('❌ Failed to create version.json:', error.message);
  }
};

// Main execution
console.log('🔄 Updating application version...\n');

const version = updatePackageJson();
createVersionFile(version);

console.log('\n📊 Version Information:');
console.log(`  Version: ${version}`);
console.log(`  Environment: ${process.env.VERCEL_ENV || 'development'}`);
console.log(`  Git Commit: ${process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_GITHUB_COMMIT_SHA || process.env.GITHUB_SHA || 'local'}`);
console.log(`  Git Branch: ${process.env.VERCEL_GIT_COMMIT_REF || process.env.VERCEL_GITHUB_COMMIT_REF || process.env.GITHUB_REF || 'local'}`);

// Debug: Show available Vercel env vars (only in non-production)
if (process.env.VERCEL && process.env.VERCEL_ENV !== 'production') {
  console.log('\n🔍 Available Vercel Environment Variables:');
  Object.keys(process.env).filter(key => key.startsWith('VERCEL') || key.startsWith('GITHUB')).forEach(key => {
    console.log(`  ${key}: ${process.env[key]?.substring(0, 50)}...`);
  });
}

console.log('\n✨ Version update complete!');