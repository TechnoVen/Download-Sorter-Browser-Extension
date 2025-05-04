// 🧠 Background service worker for Download Sorter

const EXTENSION_NAME = "Download Sorter";
const DISABLE_KEY = "sorting_disabled";
let isDevMode = true;

let defaultRules = {};

// 🗂️ Load default rules on extension startup
fetch(chrome.runtime.getURL("rules.json"))
  .then(res => res.json())
  .then(json => {
    defaultRules = json;
    log("✅ Default rules loaded", defaultRules);
  })
  .catch(err => {
    log("❌ Failed to load rules.json", err);
    chrome.storage.local.set({ [DISABLE_KEY]: true });
  });

// 🎯 Event: download started
chrome.downloads.onDeterminingFilename.addListener(async (item, suggest) => {
  const { filename, mime, id } = item;

  try {
    const sortingDisabled = await getSetting(DISABLE_KEY);
    if (sortingDisabled || !filename) {
      return;
    }

    const ext = getExtension(filename);
    const typeKey = mime || resolveMimeFromExt(ext);
    const allRules = await mergeRules();
    const disabledRules = await getSetting("disabledRules") || [];

    if (!allRules[typeKey] || disabledRules.includes(typeKey)) {
      log(`⚠️ No rule or rule disabled for: ${typeKey}`);
      return;
    }

    const rule = allRules[typeKey];
    const { category, subtype } = rule;

    if (!category || !subtype) {
      log(`⚠️ Rule missing category/subtype for: ${typeKey}`);
      return;
    }

    const newPath = `${category}/${subtype}/${filename}`;
    log(`📁 Sorting: ${filename} → ${newPath}`);
    suggest({ filename: newPath });

  } catch (err) {
    log("💥 Error during filename handling:", err);
    console.error("💥 Error during filename handling:", err); // Log to console as well
    chrome.storage.local.set({ [DISABLE_KEY]: true });
  }
});

function getExtension(filename) {
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.slice(idx).toLowerCase() : "";
}

function resolveMimeFromExt(ext) {
  for (const [mime, rule] of Object.entries(defaultRules)) {
    if (rule.extensions.includes(ext)) {
      return mime;
    }
  }
  return "";
}

function getSetting(key) {
  return new Promise(resolve => {
    chrome.storage.local.get([key], result => resolve(result[key]));
  });
}

function mergeRules() {
  return new Promise(resolve => {
    chrome.storage.sync.get(["customRules"], (res) => {
      const custom = res.customRules || {};
      resolve({ ...defaultRules, ...custom });
    });
  });
}

function log(...args) {
  if (isDevMode) console.log(`[${EXTENSION_NAME}]`, ...args);
}