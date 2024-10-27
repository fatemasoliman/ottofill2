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

document.getElementById('authenticateGmail').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'authenticate' }, (response) => {
    if (response && response.error) {
      console.error('Authentication error:', response.error);
      document.getElementById('emailStatus').textContent = `Authentication failed: ${response.error}`;
    } else {
      document.getElementById('emailStatus').textContent = 'Authentication successful!';
    }
  });
});

document.getElementById('getEmails').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'getEmails' }, (response) => {
    if (response && response.error) {
      console.error('Get emails error:', response.error);
      document.getElementById('emailStatus').textContent = `Failed to retrieve emails: ${response.error}`;
    } else {
      document.getElementById('emailStatus').textContent = `Retrieved ${response.length} recent emails.`;
      console.log(response); // You can process the emails as needed
    }
  });
});
