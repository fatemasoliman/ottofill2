// Add at the beginning of content.js
let drawerInitialized = false;

function toggleDrawer() {
  if (!drawerInitialized) {
    createDrawer();
    drawerInitialized = true;
  }
  const drawer = document.getElementById('ottofill-drawer');
  if (drawer.classList.contains('open')) {
    drawer.classList.remove('open');
  } else {
    drawer.classList.add('open');
  }
}

// Update the message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleDrawer') {
    toggleDrawer();
  } else if (request.action === 'autofill') {
    if (!drawerInitialized) {
      createDrawer();
      drawerInitialized = true;
    }
    const params = request.params;
    autofillInputs(params);
    
    // If messageId is present, fetch and display the email
    if (params.messageId) {
      chrome.runtime.sendMessage(
        { 
          action: 'getEmailContent', 
          messageId: params.messageId 
        }, 
        response => {
          if (response.error) {
            document.getElementById('email-content').innerHTML = `
              <p style="color: red;">Error loading email: ${response.error}</p>
            `;
          } else {
            displayEmail(response);
          }
        }
      );
    }
    
    document.getElementById('ottofill-drawer').classList.add('open');
  } else if (request.action === 'manualAutofill') {
    const url = new URL(window.location.href);
    const params = Object.fromEntries(url.searchParams);
    autofillInputs(params);
  }
});

// Update initializeDrawer function
function initializeDrawer() {
  const url = new URL(window.location.href);
  if (url.searchParams.get('triggerottofillextension') === 'true') {
    if (!drawerInitialized) {
      createDrawer();
      drawerInitialized = true;
    }
    const params = Object.fromEntries(url.searchParams);
    autofillInputs(params);
    
    if (params.messageId) {
      chrome.runtime.sendMessage(
        { 
          action: 'getEmailContent', 
          messageId: params.messageId 
        }, 
        response => {
          if (response.error) {
            document.getElementById('email-content').innerHTML = `
              <p style="color: red;">Error loading email: ${response.error}</p>
            `;
          } else {
            displayEmail(response);
          }
        }
      );
    }
    
    document.getElementById('ottofill-drawer').classList.add('open');
  }
}

// Make sure to call initializeDrawer when the page loads
document.addEventListener('DOMContentLoaded', initializeDrawer);
window.addEventListener('load', initializeDrawer);

function createDrawer() {
  const drawer = document.createElement('div');
  drawer.id = 'ottofill-drawer';
  drawer.innerHTML = `
    <div class="ottofill-content">
      <h2>OttoFill</h2>
      <div id="auth-section">
        <button id="authenticateGmail">Authenticate Gmail</button>
        <p id="auth-status"></p>
      </div>
      <button id="ottofill-trigger">Ottofill this page!</button>
      <p id="ottofill-status"></p>
      <div id="email-container">
        <h3>Email Content</h3>
        <iframe id="email-frame" sandbox="allow-same-origin allow-scripts"></iframe>
      </div>
    </div>
  `;
  document.body.appendChild(drawer);

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #ottofill-drawer {
      position: fixed;
      top: 0;
      right: -600px;
      width: 600px;
      height: 100%;
      background-color: #f0f0f0;
      box-shadow: -2px 0 5px rgba(0,0,0,0.3);
      transition: right 0.3s ease-in-out;
      z-index: 9999;
      overflow-y: auto;
    }
    #ottofill-drawer.open {
      right: 0;
    }
    .ottofill-content {
      padding: 20px;
    }
    #ottofill-trigger, #authenticateGmail {
      width: 100%;
      padding: 10px;
      margin-top: 10px;
      background-color: #4285f4;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    #ottofill-trigger:hover, #authenticateGmail:hover {
      background-color: #357abd;
    }
    #auth-section {
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #ddd;
    }
    #auth-status, #ottofill-status {
      margin-top: 10px;
      font-style: italic;
      color: #666;
    }
    #email-container {
      margin-top: 20px;
      border-top: 1px solid #ccc;
      padding-top: 20px;
    }
    #email-frame {
      width: 100%;
      height: 600px;
      border: none;
      background: white;
      border-radius: 4px;
    }
  `;
  document.head.appendChild(style);

  // Add event listeners
  document.getElementById('ottofill-trigger').addEventListener('click', () => {
    const url = new URL(window.location.href);
    const params = Object.fromEntries(url.searchParams);
    autofillInputs(params);
  });

  document.getElementById('authenticateGmail').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'authenticate' }, (response) => {
      const statusElement = document.getElementById('auth-status');
      if (response && response.error) {
        console.error('Authentication error:', response.error);
        statusElement.textContent = `Authentication failed: ${response.error}`;
        statusElement.style.color = '#dc3545';
      } else {
        statusElement.textContent = 'Authentication successful!';
        statusElement.style.color = '#28a745';
      }
    });
  });
}

function displayEmail(emailData) {
  const iframe = document.getElementById('email-frame');
  
  // Create the email HTML content
  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <base target="_blank">
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 15px;
          color: #333;
          direction: auto;
          zoom: 0.85; /* Zoom out the content */
          transform-origin: top left;
        }
        .email-header {
          border-bottom: 1px solid #eee;
          margin-bottom: 15px;
          padding-bottom: 10px;
        }
        .email-header p {
          margin: 3px 0;
          font-size: 13px;
        }
        .email-body {
          line-height: 1.4;
          font-size: 13px;
        }
        pre {
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: inherit;
          margin: 0;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 8px 0;
          table-layout: fixed;
          font-size: 12px;
        }
        table, th, td {
          border: 1px solid #ddd;
        }
        th, td {
          padding: 6px;
          text-align: left;
          overflow-wrap: break-word;
        }
        th {
          background-color: #f5f5f5;
        }
        img {
          max-width: 100%;
          height: auto;
        }
        * {
          font-family: Arial, sans-serif;
        }
      </style>
    </head>
    <body>
      <div class="email-header">
        <p><strong>From:</strong> ${emailData.from}</p>
        <p><strong>Subject:</strong> ${emailData.subject}</p>
        <p><strong>Date:</strong> ${new Date(emailData.date).toLocaleString()}</p>
      </div>
      <div class="email-body">
        ${emailData.contentType === 'text/html' ? 
          sanitizeAndFixHtml(emailData.body) : 
          `<pre>${emailData.body}</pre>`}
      </div>
    </body>
    </html>
  `;

  // Set the iframe content
  iframe.srcdoc = emailHTML;
}

function sanitizeAndFixHtml(html) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Fix table display
    const tables = doc.getElementsByTagName('table');
    for (let table of tables) {
      if (!table.style.width) {
        table.style.width = '100%';
      }
      if (!table.style.borderCollapse) {
        table.style.borderCollapse = 'collapse';
      }
    }

    // Ensure proper encoding for Arabic text
    const textNodes = document.evaluate(
      '//text()', 
      doc, 
      null, 
      XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, 
      null
    );

    for (let i = 0; i < textNodes.snapshotLength; i++) {
      const node = textNodes.snapshotItem(i);
      if (node.nodeValue) {
        node.nodeValue = node.nodeValue.normalize();
      }
    }

    return doc.body.innerHTML;
  } catch (error) {
    console.error('Error sanitizing HTML:', error);
    return html;
  }
}

function autofillInputs(params) {
  console.log('Autofilling with params:', params);
  const inputs = document.querySelectorAll('input, select, textarea');
  
  inputs.forEach(input => {
    const paramName = findMatchingParam(input, params);
    if (paramName) {
      console.log(`Filling input ${input.name || input.id} with value ${params[paramName]}`);
      fillInput(input, params[paramName]);
    } else {
      console.log(`No matching param found for input ${input.name || input.id}`);
    }
  });

  // Update status in the drawer
  const statusElement = document.getElementById('ottofill-status');
  if (statusElement) {
    statusElement.textContent = 'Autofill completed!';
  }
}

function findMatchingParam(input, params) {
  const inputName = input.name.toLowerCase();
  const inputId = input.id.toLowerCase();
  
  for (const [key, value] of Object.entries(params)) {
    const paramKey = key.toLowerCase();
    if (paramKey === inputName || paramKey === inputId) {
      return key;
    }
  }
  
  return null;
}

function fillInput(input, value) {
  if (input.tagName === 'SELECT') {
    console.log(`Filling SELECT input ${input.name || input.id}`);
    const option = Array.from(input.options).find(opt => 
      opt.value.toLowerCase() === value.toLowerCase() || 
      opt.text.toLowerCase() === value.toLowerCase()
    );
    if (option) {
      input.value = option.value;
      console.log(`Exact match found: ${option.value}`);
    } else {
      console.log(`No exact match found, searching for closest match`);
      const closestOption = findClosestMatch(value, Array.from(input.options));
      if (closestOption) {
        input.value = closestOption.value;
        console.log(`Closest match found: ${closestOption.value}`);
      } else {
        console.log(`No close match found`);
      }
    }
  } else if (input.type === 'checkbox' || input.type === 'radio') {
    input.checked = value.toLowerCase() === 'true' || value.toLowerCase() === 'on' || value === '1';
  } else {
    input.value = decodeURIComponent(value);
  }

  // Trigger change event
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function findClosestMatch(value, options) {
  let closestOption = null;
  let closestDistance = Infinity;

  options.forEach(option => {
    const distanceValue = levenshteinDistance(value.toLowerCase(), option.value.toLowerCase());
    const distanceText = levenshteinDistance(value.toLowerCase(), option.text.toLowerCase());
    const minDistance = Math.min(distanceValue, distanceText);
    
    if (minDistance < closestDistance) {
      closestDistance = minDistance;
      closestOption = option;
    }
  });

  return closestOption;
}

function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
