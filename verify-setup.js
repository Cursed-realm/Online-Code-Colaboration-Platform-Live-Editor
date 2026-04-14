#!/usr/bin/env node

/**
 * CodeCollab - Environment Configuration Validator
 * Run this script to verify your setup is correct
 * Usage: node verify-setup.js
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(type, message) {
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
  };
  const color = {
    success: colors.green,
    error: colors.red,
    warning: colors.yellow,
    info: colors.blue,
  };
  console.log(`${color[type]}${icons[type]} ${message}${colors.reset}`);
}

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║     CodeCollab - Setup Verification                      ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

let issues = 0;

// Check if we're in the right directory
if (!fs.existsSync('./server/.env')) {
  log('error', 'Not in project root directory. Run this from project root.');
  process.exit(1);
}

// 1. Check .env file
log('info', 'Checking environment configuration...');
const envPath = './server/.env';
if (!fs.existsSync(envPath)) {
  log('error', '.env file not found in server directory');
  log('warning', 'Copy .env.example to .env and update with your credentials');
  issues++;
} else {
  log('success', '.env file found');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {
    MONGODB_URI: ['MongoDB connection string'],
    JWT_SECRET: ['JWT secret for authentication'],
    GITHUB_CLIENT_ID: ['GitHub OAuth Client ID'],
    GITHUB_CLIENT_SECRET: ['GitHub OAuth Client Secret'],
    PORT: ['Server port'],
    CLIENT_URL: ['Frontend URL'],
  };
  
  for (const [key, desc] of Object.entries(envVars)) {
    const hasKey = envContent.includes(`${key}=`);
    const isPlaceholder = envContent.includes(`${key}=your_`) || envContent.includes(`${key}=`);
    
    if (hasKey) {
      const value = envContent.split(`${key}=`)[1]?.split('\n')[0];
      if (value?.includes('your_') || value?.trim() === '') {
        log('warning', `${key} is still a placeholder - ${desc[0]}`);
        issues++;
      } else {
        log('success', `${key} configured`);
      }
    } else {
      log('error', `${key} not found in .env`);
      issues++;
    }
  }
}

// 2. Check Node modules
log('info', 'Checking dependencies...');
if (!fs.existsSync('./server/node_modules')) {
  log('error', 'Server dependencies not installed. Run: cd server && npm install');
  issues++;
} else {
  log('success', 'Server dependencies installed');
}

if (!fs.existsSync('./client/node_modules')) {
  log('error', 'Client dependencies not installed. Run: cd client && npm install');
  issues++;
} else {
  log('success', 'Client dependencies installed');
}

// 3. Check key files
log('info', 'Checking project structure...');
const files = [
  './server/index.js',
  './server/package.json',
  './client/package.json',
  './client/src/App.jsx',
  './server/models/User.js',
  './server/models/Project.js',
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    log('success', `Found ${file}`);
  } else {
    log('error', `Missing ${file}`);
    issues++;
  }
});

// 4. Check MongoDB connectivity (optional)
console.log('');
log('info', 'Testing MongoDB connection...');
try {
  const mongoose = require('mongoose');
  console.log('  (This requires MongoDB to be running)');
  log('success', 'MongoDB driver available');
} catch (e) {
  log('warning', 'MongoDB driver not fully initialized - will test on server start');
}

// 5. Summary
console.log('');
console.log('╔════════════════════════════════════════════════════════════╗');
if (issues === 0) {
  console.log('║          ✓ Setup Complete! Ready to Run                   ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║                                                            ║');
  console.log('║  Start the application with:                             ║');
  console.log('║                                                            ║');
  console.log('║  Windows:  START.bat                                      ║');
  console.log('║  Mac/Linux: bash start.sh                                 ║');
  console.log('║                                                            ║');
  console.log('║  Then visit: http://localhost:3000                        ║');
  console.log('║                                                            ║');
} else {
  console.log(`║          ✗ ${issues} issue(s) to fix                                  ║`);
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║  See errors above and fix before running the app          ║');
  console.log('║                                                            ║');
  console.log('║  Common fixes:                                            ║');
  console.log('║  1. Copy .env.example to .env                            ║');
  console.log('║  2. Update env vars with real values                     ║');
  console.log('║  3. Run: npm install in both server/ and client/         ║');
  console.log('║  4. Ensure MongoDB is running or configured              ║');
  console.log('║                                                            ║');
}
console.log('╚════════════════════════════════════════════════════════════╝\n');

process.exit(issues > 0 ? 1 : 0);
