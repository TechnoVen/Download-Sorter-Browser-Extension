document.getElementById('openDiagnosticsBtn').addEventListener('click', () => {
    const modal = document.getElementById('diagnosticsModal');
    const output = document.getElementById('diagnosticsOutput');
    modal.classList.remove('hidden');
  
    chrome.storage.sync.get(['customRules', 'disabledRules', 'loggingEnabled'], (data) => {
      const rules = data.customRules || {};
      const disabled = data.disabledRules || [];
      const enabled = Object.keys(rules).filter(k => !disabled.includes(k));
  
      const unknownMimes = Object.entries(rules).filter(
        ([, rule]) => !rule.mimeType || rule.mimeType === 'undefined'
      );
  
      output.innerHTML = `
        <h3>Diagnostics Report</h3>
        <p><strong>Total Rules:</strong> ${Object.keys(rules).length}</p>
        <p><strong>Enabled:</strong> ${enabled.length}</p>
        <p><strong>Disabled:</strong> ${disabled.length}</p>
        <p><strong>Unknown MIME Entries:</strong> ${unknownMimes.length}</p>
        <pre style="margin-top:10px;background:#f8f8f8;padding:10px;border:1px solid #ccc;max-height:200px;overflow:auto;">${JSON.stringify(unknownMimes, null, 2)}</pre>
      `;
    });
  });
  
  document.getElementById('closeDiagnosticsBtn').addEventListener('click', () => {
    document.getElementById('diagnosticsModal').classList.add('hidden');
  });
  