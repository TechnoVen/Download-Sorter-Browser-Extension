// scripts/factory-reset.js

import { existsSync, mkdirSync, appendFileSync } from 'fs';
import { resolve } from 'path';
import { remove, get } from 'chrome-extension-sync-mock';

const logFile = resolve('logs/cli.log');

if (!existsSync('logs')) mkdirSync('logs', { recursive: true });

const log = (msg) => {
  const entry = `[${new Date().toISOString()}] ${msg}\n`;
  appendFileSync(logFile, entry);
  console.log(entry.trim());
};

// 🚨 Reset keys in chrome.storage.sync
remove(['customRules', 'disabledRules', 'loggingEnabled'], () => {
  log('✅ Factory reset complete: customRules, disabledRules, loggingEnabled removed from sync storage.');
});

// 🔁 Confirm removal
get(['customRules', 'disabledRules', 'loggingEnabled'], (result) => {
  if (result.customRules || result.disabledRules || result.loggingEnabled) {
    log('❌ Factory reset failed: keys still exist in sync storage.');
  } else {
    log('✅ Factory reset verified: all keys cleared.');
  }
});
