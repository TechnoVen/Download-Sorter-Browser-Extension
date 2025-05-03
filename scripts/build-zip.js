// scripts/build-zip.js

import { createWriteStream, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import archiver from 'archiver';
import { join } from 'path';
import { config } from 'dotenv';
config();

import { version } from '../package.json';
const includeVersionFile = process.env.INCLUDE_VERSION_FILE === 'true';

const output = createWriteStream('dist/download-sorter-extension.zip');
const archive = archiver('zip', { zlib: { level: 9 } });

const IGNORE = ['node_modules', 'dist', '.git', '.DS_Store', '.env', '.env.dev', '.env.prod'];
const VERSION_TXT = `VERSION: ${version}\nBUILD_ENV: ${process.env.BUILD_ENV || 'dev'}\n`;

if (!existsSync('dist')) mkdirSync('dist');

output.on('close', () => {
  console.log(`✅ Extension zipped (${archive.pointer()} bytes)`);
});

archive.on('error', err => { throw err; });

archive.pipe(output);

// Optional: Add VERSION.txt
if (includeVersionFile) {
  archive.append(VERSION_TXT, { name: 'VERSION.txt' });
}

// Add all files
function addDirToArchive(src, base = '') {
  const files = readdirSync(src);
  files.forEach((file) => {
    if (IGNORE.includes(file)) return;

    const fullPath = join(src, file);
    const relPath = join(base, file);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      addDirToArchive(fullPath, relPath);
    } else {
      archive.file(fullPath, { name: relPath });
    }
  });
}

addDirToArchive('.');
archive.finalize();
