import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const VERSION = JSON.parse(fs.readFileSync("./package.json")).version;
const ZIP_NAME = `download-sorter-v${VERSION}.zip`;
const OUT_DIR = "dist";
const STORE_DIR = "store/builds";

// Ensure dirs
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(STORE_DIR, { recursive: true });

// Run changelog update (assuming changelog CLI installed)
try {
  execSync("changelog", { stdio: "inherit" });
} catch (e) {
  console.warn("⚠️ changelog update skipped or failed");
}

// Create zip
execSync(`zip -r ${OUT_DIR}/${ZIP_NAME} . -x "node_modules/*" "dist/*" ".git/*" ".DS_Store"`, {
  stdio: "inherit"
});

// Copy to store
fs.copyFileSync(`${OUT_DIR}/${ZIP_NAME}`, `${STORE_DIR}/${ZIP_NAME}`);

console.log(`✅ Build complete: ${ZIP_NAME} → ${STORE_DIR}`);
