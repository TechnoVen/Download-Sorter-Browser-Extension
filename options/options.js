const rulesTableBody = document.getElementById('rulesTableBody');
const addRuleBtn = document.getElementById('addRuleBtn');
const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');
const loggingToggle = document.getElementById('loggingToggle');

const ruleFormSection = document.getElementById('newRuleFormSection');
const ruleForm = document.getElementById('ruleForm');

const mimeTypeInput = document.getElementById('mimeTypeInput');
const categoryInput = document.getElementById('categoryInput');
const subtypeInput = document.getElementById('subtypeInput');
const extensionsInput = document.getElementById('extensionsInput');
const enabledInput = document.getElementById('enabledInput');
const cancelEditBtn = document.getElementById('cancelEditBtn');

let editingMime = null;
let defaultRules = {};
let customRules = {};
let disabledRules = new Set();

// 🔄 Load default rules bundled in extension
fetch(chrome.runtime.getURL('../rules.json'))
  .then((res) => res.json())
  .then((defaults) => {
    defaultRules = defaults;
    loadRules();
  });

async function loadRules() {
  chrome.storage.sync.get(['customRules', 'disabledRules', 'loggingEnabled'], (data) => {
    customRules = data.customRules || {};
    disabledRules = new Set(data.disabledRules || []);
    loggingToggle.checked = !!data.loggingEnabled;

    renderRulesTable();
  });
}

function renderRulesTable() {
  rulesTableBody.innerHTML = '';
  const combined = { ...defaultRules, ...customRules };

  Object.entries(combined).forEach(([mime, rule]) => {
    const isCustom = !!customRules[mime];
    const isDisabled = disabledRules.has(mime);

    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${mime} ${isCustom ? '<span class="tag">Custom</span>' : ''}</td>
      <td>${rule.category}</td>
      <td>${rule.subtype}</td>
      <td>${rule.extensions.join(', ')}</td>
      <td><input type="checkbox" data-mime="${mime}" class="rule-toggle" ${isDisabled ? '' : 'checked'} /></td>
      <td>
        <button class="edit-btn" data-mime="${mime}" ${!isCustom ? 'disabled' : ''}>✏️</button>
        <button class="delete-btn" data-mime="${mime}" ${!isCustom ? 'disabled' : ''}>🗑️</button>
      </td>
    `;
    rulesTableBody.appendChild(row);
  });

  attachActionListeners();
}

function attachActionListeners() {
  document.querySelectorAll('.rule-toggle').forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      const mime = e.target.dataset.mime;
      if (!e.target.checked) {
        disabledRules.add(mime);
      } else {
        disabledRules.delete(mime);
      }
      chrome.storage.sync.set({ disabledRules: Array.from(disabledRules) });
    });
  });

  document.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mime = btn.dataset.mime;
      const rule = customRules[mime];
      if (!rule) return;

      editingMime = mime;
      mimeTypeInput.value = mime;
      mimeTypeInput.disabled = true;
      categoryInput.value = rule.category;
      subtypeInput.value = rule.subtype;
      extensionsInput.value = rule.extensions.join(', ');
      enabledInput.checked = !disabledRules.has(mime);

      ruleFormSection.classList.remove('hidden');
    });
  });

  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mime = btn.dataset.mime;
      delete customRules[mime];
      disabledRules.delete(mime);

      chrome.storage.sync.set({
        customRules,
        disabledRules: Array.from(disabledRules)
      }, loadRules);
    });
  });
}

addRuleBtn.addEventListener('click', () => {
  editingMime = null;
  ruleForm.reset();
  mimeTypeInput.disabled = false;
  ruleFormSection.classList.remove('hidden');
});

cancelEditBtn.addEventListener('click', () => {
  ruleForm.reset();
  ruleFormSection.classList.add('hidden');
  editingMime = null;
});

ruleForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const mime = mimeTypeInput.value.trim();
  const category = categoryInput.value.trim();
  const subtype = subtypeInput.value.trim();
  const extensions = extensionsInput.value.split(',').map(ext => ext.trim().toLowerCase()).filter(Boolean);
  const enabled = enabledInput.checked;

  if (!mime || !category || !subtype || extensions.length === 0) return;

  customRules[mime] = { category, subtype, extensions };

  if (!enabled) disabledRules.add(mime);
  else disabledRules.delete(mime);

  chrome.storage.sync.set({
    customRules,
    disabledRules: Array.from(disabledRules)
  }, () => {
    ruleForm.reset();
    ruleFormSection.classList.add('hidden');
    editingMime = null;
    loadRules();
  });
});

resetDefaultsBtn.addEventListener('click', () => {
  if (!confirm('This will remove all custom rules and reset to default. Continue?')) return;

  chrome.storage.sync.remove(['customRules', 'disabledRules'], loadRules);
});

loggingToggle.addEventListener('change', () => {
  chrome.storage.sync.set({
    loggingEnabled: loggingToggle.checked
  });
});
