#!/usr/bin/env node

/**
 * Verification script for Maputnik integration
 * Checks if all required files and configurations are in place
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

console.log('🔍 Verifying Maputnik Integration Setup...\n');

const checks = [];
let passedChecks = 0;
let totalChecks = 0;

function addCheck(name, condition, message) {
  totalChecks++;
  if (condition) {
    checks.push({ name, status: '✅', message: 'OK' });
    passedChecks++;
  } else {
    checks.push({ name, status: '❌', message });
  }
}

// Check required files exist
const requiredFiles = [
  'src/services/saveService.ts',
  'src/services/authService.ts',
  'src/stores/save.ts',
  'src/types/save.ts',
  'src/components/SaveStyleDialog.vue',
  'src/components/LoginModal.vue',
  'src/components/RegisterModal.vue',
  'src/components/MaputnikIntegration.vue',
  'api/auth/login.js',
  'api/auth/register.js',
  'api/styles/index.js',
  'api/styles/validate.js',
  'database/migrations/002_add_user_styles_table.sql',
  'src/test/integration/saveIntegration.spec.ts'
];

console.log('📁 Checking Required Files:');
requiredFiles.forEach(file => {
  const filePath = join(projectRoot, file);
  addCheck(
    `File: ${file}`,
    existsSync(filePath),
    `Missing required file: ${file}`
  );
});

// Check environment configuration
console.log('\n⚙️  Checking Environment Configuration:');
const envExamplePath = join(projectRoot, '.env.example');
if (existsSync(envExamplePath)) {
  const envContent = readFileSync(envExamplePath, 'utf8');
  
  const requiredEnvVars = [
    'VITE_API_BASE_URL',
    'VITE_JWT_SECRET',
    'VITE_MAX_STYLES_PER_USER',
    'VITE_CORS_ORIGINS'
  ];
  
  requiredEnvVars.forEach(envVar => {
    addCheck(
      `Env var: ${envVar}`,
      envContent.includes(envVar),
      `Missing environment variable in .env.example: ${envVar}`
    );
  });
} else {
  addCheck(
    'Environment config',
    false,
    'Missing .env.example file'
  );
}

// Check package.json dependencies
console.log('\n📦 Checking Dependencies:');
const packageJsonPath = join(projectRoot, 'package.json');
if (existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = [
    'pinia',
    'vue-router',
    'primevue',
    '@supabase/supabase-js',
    'jsonwebtoken',
    'bcryptjs',
    'cors'
  ];
  
  requiredDeps.forEach(dep => {
    addCheck(
      `Dependency: ${dep}`,
      deps[dep] !== undefined,
      `Missing dependency: ${dep}`
    );
  });
} else {
  addCheck(
    'Package.json',
    false,
    'Missing package.json file'
  );
}

// Check TypeScript types
console.log('\n🔤 Checking TypeScript Integration:');
const saveTypesPath = join(projectRoot, 'src/types/save.ts');
if (existsSync(saveTypesPath)) {
  const typesContent = readFileSync(saveTypesPath, 'utf8');
  const requiredTypes = [
    'interface MapStyle',
    'interface SaveResponse',
    'interface SaveState',
    'interface AuthToken'
  ];
  
  requiredTypes.forEach(type => {
    addCheck(
      `Type: ${type}`,
      typesContent.includes(type),
      `Missing TypeScript type: ${type}`
    );
  });
}

// Check Vue component structure
console.log('\n🖼️  Checking Vue Components:');
const maputnikIntegrationPath = join(projectRoot, 'src/components/MaputnikIntegration.vue');
if (existsSync(maputnikIntegrationPath)) {
  const componentContent = readFileSync(maputnikIntegrationPath, 'utf8');
  
  const requiredFeatures = [
    'Save to Map Config',
    'useSaveStore',
    'useAuthStore',
    'SaveStyleDialog',
    'LoginModal'
  ];
  
  requiredFeatures.forEach(feature => {
    addCheck(
      `Component feature: ${feature}`,
      componentContent.includes(feature),
      `Missing component feature: ${feature}`
    );
  });
}

// Check API endpoints
console.log('\n🌐 Checking API Structure:');
const apiFiles = [
  { file: 'api/auth/login.js', features: ['supabase', 'jwt', 'cors'] },
  { file: 'api/styles/index.js', features: ['validateMapboxStyle', 'verifyToken', 'user_styles'] },
  { file: 'api/styles/validate.js', features: ['validateMapboxStyle', 'version', 'sources', 'layers'] }
];

apiFiles.forEach(({ file, features }) => {
  const filePath = join(projectRoot, file);
  if (existsSync(filePath)) {
    const content = readFileSync(filePath, 'utf8');
    features.forEach(feature => {
      addCheck(
        `API ${file}: ${feature}`,
        content.includes(feature),
        `Missing API feature in ${file}: ${feature}`
      );
    });
  }
});

// Print results
console.log('\n📋 Verification Results:');
console.log('=' .repeat(60));

checks.forEach(check => {
  console.log(`${check.status} ${check.name.padEnd(40)} ${check.message}`);
});

console.log('=' .repeat(60));
console.log(`✅ Passed: ${passedChecks}/${totalChecks} checks`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 All checks passed! Your Maputnik integration is ready.');
  console.log('\nNext steps:');
  console.log('1. Copy .env.example to .env and configure your settings');
  console.log('2. Run database migrations');
  console.log('3. Start the development servers:');
  console.log('   npm run dev:all');
  console.log('4. Open the application and test the integration');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${totalChecks - passedChecks} issues found. Please fix the failed checks before proceeding.`);
  process.exit(1);
}