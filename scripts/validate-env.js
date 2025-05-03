// scripts/validate-env.js

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const dotenv = require('dotenv');

const envPath = `.env.${process.env.BUILD_ENV || 'dev'}`;
const defaultEnvPath = path.resolve(envPath);

if (!fs.existsSync(defaultEnvPath)) {
  console.error(chalk.red(`❌ Missing required environment file: ${envPath}`));
  process.exit(1);
}

dotenv.config({ path: defaultEnvPath });

const REQUIRED_KEYS = [
  'LOG_LEVEL',
  'RULE_VERSION',
  'DIFF_LOG_ENABLED',
  'INCLUDE_VERSION_FILE',
  'BUILD_ENV',
  'LIVE_RELOAD_INTERVAL'
];

let missing = [];

REQUIRED_KEYS.forEach((key) => {
  if (!process.env[key]) missing.push(key);
});

if (missing.length) {
  console.error(chalk.red('❌ Missing required .env keys:'));
  missing.forEach((key) => console.log(chalk.yellow(`  - ${key}`)));
  process.exit(1);
} else {
  console.log(chalk.green(`✅ Environment check passed for: ${envPath}`));
}

// 🔁 Ensure required folders exist
['logs', 'exports', 'dist'].forEach((folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    console.log(chalk.blue(`📁 Created missing folder: ${folder}/`));
  }
});
