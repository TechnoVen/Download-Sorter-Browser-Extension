// scripts/import-rules.js

import { existsSync, readFileSync, appendFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { set } from 'chrome-extension-sync-mock';
import chalk from 'chalk';

const filePath = process.argv[2];
const logPath = resolve('logs/cli.log');

if (!existsSync('logs')) mkdirSync('logs', { recursive: true });

const log = (msg) => {
  const entry = `[${new Date().toISOString()}] ${msg}\n`;
  appendFileSync(logPath, entry);
  console.log(entry.trim());
};

if (!filePath) {
  console.error(chalk.red('❌ Usage: npm run import:rules <path/to/rules.json>'));
  process.exit(1);
}

const resolvedPath = resolve(filePath);

if (!existsSync(resolvedPath)) {
  console.error(chalk.red(`❌ File not found: ${resolvedPath}`));
  process.exit(1);
}

try {
  const rules = JSON.parse(readFileSync(resolvedPath, 'utf-8'));

  set({ customRules: rules }, () => {
    const count = Object.keys(rules).length;
    log(`✅ Imported ${count} rules from ${filePath}`);

    console.table({
      Imported: count,
      Source: resolvedPath,
      Time: new Date().toLocaleString()
    });
  });

} catch (err) {
  console.error(chalk.red(`💥 Failed to import rules: ${err.message}`));
  process.exit(1);
}
