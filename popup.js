document.getElementById('triggerAutofill').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.tabs.sendMessage(tab.id, { action: 'manualAutofill' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      document.getElementById('status').textContent = 'Error: Could not autofill. Please refresh the page and try again.';
    } else {
      document.getElementById('status').textContent = 'Autofill completed!';
    }
  });
});
