#!/usr/bin/env node

require('dotenv').config({ path: `.env.${process.env.BUILD_ENV || 'dev'}` });
require('./validate-env');

const { execSync } = require('child_process');
const chalk = require('chalk');
const args = require('minimist')(process.argv.slice(2));

const run = (cmd) => {
  console.log(chalk.cyan(`➡️  Running: ${cmd}`));
  execSync(cmd, { stdio: 'inherit' });
};

// 🌐 ENV Switching
if (args.env) {
  process.env.BUILD_ENV = args.env;
  console.log(chalk.magenta(`🔁 Switched to environment: .env.${args.env}`));
}

// 🧭 Help Menu
if (args.help || Object.keys(args).length === 1) {
  console.log(`
🧩  Download Sorter Extension CLI

Usage:
  node cli.js --export           Export rules
  node cli.js --import=FILE      Import rules from file
  node cli.js --reset            Factory reset all settings
  node cli.js --env=dev|prod     Use alternate env file
  node cli.js --help             Show this menu
`);
  process.exit(0);
}

// 🚀 Route commands
if (args.export) run('npm run export:rules');
if (args.reset) run('npm run factory-reset');
if (args.import) run(`npm run import:rules -- ${args.import}`);
