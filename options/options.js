// ✅ CORRECT
import { mimeFriendlyNames as mimeMap } from './mime-map.js';

let defaultRules = {};

fetch(chrome.runtime.getURL("rules.json"))
  .then(res => res.json())
  .then(json => {
    defaultRules = json;
    init(); // ✅ Start once data is ready
  })
  .catch(err => {
    console.error("❌ Failed to load default rules:", err);
  });

const tableBody = document.getElementById("rulesTableBody");
const formSection = document.getElementById("newRuleFormSection");
const form = document.getElementById("ruleForm");
const addBtn = document.getElementById("addRuleBtn");
const cancelBtn = document.getElementById("cancelEditBtn");
const resetBtn = document.getElementById("resetDefaultsBtn");
const toggleMimeView = document.getElementById("toggleMimeView");

const mimeInput = document.getElementById("mimeTypeInput");
const categoryInput = document.getElementById("categoryInput");
const subtypeInput = document.getElementById("subtypeInput");
const extensionsInput = document.getElementById("extensionsInput");
const enabledInput = document.getElementById("enabledInput");

let friendlyMimeEnabled = toggleMimeView.checked;
let isEditing = false;
let editKey = null;

function renderRules(rules) {
  console.log('renderRules() called with:', rules);
  tableBody.innerHTML = "";

  const entries = Object.entries(rules).sort(([a], [b]) => a.localeCompare(b));
  for (const [mimeType, rule] of entries) {
    const row = document.createElement("tr");

    const mimeCell = document.createElement("td");
    mimeCell.textContent = friendlyMimeEnabled && mimeMap[mimeType] ? mimeMap[mimeType] : mimeType;
    mimeCell.title = mimeType;
    row.appendChild(mimeCell);

    const categoryCell = document.createElement("td");
    categoryCell.textContent = rule.category;
    row.appendChild(categoryCell);

    const subtypeCell = document.createElement("td");
    subtypeCell.textContent = rule.subtype;
    row.appendChild(subtypeCell);

    const extCell = document.createElement("td");
    extCell.textContent = rule.extensions.join(", ");
    row.appendChild(extCell);

    const enabledCell = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = rule.enabled;
    checkbox.disabled = true;
    enabledCell.appendChild(checkbox);
    row.appendChild(enabledCell);

    const actionsCell = document.createElement("td");
    actionsCell.innerHTML = `
      <button class="button edit" title="Edit" data-key="${mimeType}">✏️</button>
      <button class="button danger delete" title="Delete" data-key="${mimeType}">🗑️</button>
    `;
    row.appendChild(actionsCell);

    tableBody.appendChild(row);
  }
}

function showForm(editing = false) {
  formSection.classList.remove("hidden");
  if (!editing) {
    form.reset();
    enabledInput.checked = true;
    editKey = null;
    isEditing = false;
  }
}

function hideForm() {
  form.reset();
  formSection.classList.add("hidden");
  isEditing = false;
  editKey = null;
}

function loadRules() {
  console.log('loadRules() called');
  chrome.storage.sync.get(["customRules"], (res) => {
    console.log('chrome.storage.sync.get result:', res);
    const custom = res.customRules || {};
    const combined = { ...defaultRules, ...custom };
    renderRules(combined);
  });
}

function saveRules(rules) {
  chrome.storage.sync.set({ customRules: rules }, loadRules);
}

function getCustomRules(callback) {
  chrome.storage.sync.get(["customRules"], (res) => {
    callback(res.customRules || {});
  });
}

function handleFormSubmit(e) {
  e.preventDefault();
  const mime = mimeInput.value.trim();
  const category = categoryInput.value.trim();
  const subtype = subtypeInput.value.trim();
  const extStr = extensionsInput.value.trim();
  const enabled = enabledInput.checked;

  if (!mime || !category || !subtype || !extStr) return;

  const extensions = extStr.split(",").map(e => e.trim()).filter(Boolean);

  getCustomRules((rules) => {
    if (isEditing && editKey && editKey !== mime) {
      delete rules[editKey];
    }
    rules[mime] = { category, subtype, extensions, enabled };
    saveRules(rules);
    hideForm();
  });
}

function handleTableClick(e) {
  const key = e.target.dataset.key;
  if (!key) return;

  if (e.target.classList.contains("edit")) {
    getCustomRules((rules) => {
      const rule = rules[key] || defaultRules[key];
      if (!rule) return;

      mimeInput.value = key;
      categoryInput.value = rule.category;
      subtypeInput.value = rule.subtype;
      extensionsInput.value = rule.extensions.join(", ");
      enabledInput.checked = rule.enabled;

      showForm(true);
      isEditing = true;
      editKey = key;
    });
  }

  if (e.target.classList.contains("delete")) {
    getCustomRules((rules) => {
      delete rules[key];
      saveRules(rules);
    });
  }
}

function init() {
  loadRules();

  toggleMimeView.addEventListener("change", () => {
    friendlyMimeEnabled = toggleMimeView.checked;
    loadRules();
  });

  document.getElementById("themeSwitch").addEventListener("change", (e) => {
    document.body.classList.toggle("dark", e.target.checked);
  });

  cancelBtn.addEventListener("click", hideForm);
  addBtn.addEventListener("click", () => showForm(false));
  resetBtn.addEventListener("click", () => {
    chrome.storage.sync.remove(["customRules"], () => {
      loadRules();
      hideForm();
    });
  });

  form.addEventListener("submit", handleFormSubmit);
  tableBody.addEventListener("click", handleTableClick);
}

// INIT
fetch(chrome.runtime.getURL("rules.json"))
  .then(res => res.json())
  .then(json => {
    defaultRules = json;
    init(); // ✅ Start once data is ready
  })
  .catch(err => {
    console.error("❌ Failed to load default rules:", err);
  });