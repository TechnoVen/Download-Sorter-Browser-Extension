// scripts/export-rules.js

require('dotenv').config({ path: `.env.${process.env.BUILD_ENV || 'dev'}` });

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const chromeExtensionSync = require('chrome-extension-sync-mock');

const {
  RULE_VERSION = 'v1',
  INCLUDE_DISABLED_RULES = 'true',
  INCLUDE_LOGGING_STATE = 'true',
  ANONYMIZE_EXPORT = 'false',
  DIFF_LOG_ENABLED = 'true',
  DIFF_LOG_PATH = 'logs/cli.diff.log',
  BUILD_ENV = 'dev'
} = process.env;

const outputDir = path.resolve('exports');
const logFile = path.resolve(DIFF_LOG_PATH);

if (!fs.existsSync('logs')) fs.mkdirSync('logs', { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

chromeExtensionSync.get(['customRules', 'disabledRules', 'loggingEnabled'], (data) => {
  const { customRules = {}, disabledRules = [], loggingEnabled = false } = data;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `rules.${RULE_VERSION}.${BUILD_ENV}.${timestamp}.json`;
  const fullPath = path.join(outputDir, fileName);

  let exportData = {};

  // 🔐 Strip MIME keys if anonymizing
  if (ANONYMIZE_EXPORT === 'true') {
    Object.entries(customRules).forEach(([_, value], index) => {
      exportData[`rule-${index + 1}`] = {
        category: value.category,
        subtype: value.subtype,
        extensions: value.extensions
      };
    });
  } else {
    exportData = { ...customRules };
  }

  if (INCLUDE_DISABLED_RULES === 'true') {
    exportData._disabledRules = disabledRules;
  }

  if (INCLUDE_LOGGING_STATE === 'true') {
    exportData._loggingEnabled = loggingEnabled;
  }

  fs.writeFileSync(fullPath, JSON.stringify(exportData, null, 2));
  console.log(chalk.green(`✅ Exported rules to ${fileName}`));

  if (DIFF_LOG_ENABLED === 'true') {
    const diffEntry = `[${new Date().toISOString()}] Exported ${Object.keys(customRules).length} rules → ${fileName}\n`;
    fs.appendFileSync(logFile, diffEntry);
    console.log(chalk.cyan(`📄 Diff log updated: ${logFile}`));
  }

  // ✅ Summary Table
  console.table({
    Exported: Object.keys(customRules).length,
    Anonymized: ANONYMIZE_EXPORT === 'true',
    DisabledRules: disabledRules.length,
    LoggingState: loggingEnabled
  });
});
