let accessToken = '';

// Check for stored token when the extension starts
chrome.storage.local.get(['gmailToken', 'tokenExpiry'], async (result) => {
  if (result.gmailToken && result.tokenExpiry) {
    if (Date.now() < result.tokenExpiry) {
      accessToken = result.gmailToken;
    } else {
      // Token expired, remove it
      chrome.storage.local.remove(['gmailToken', 'tokenExpiry']);
    }
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, {
    action: 'toggleDrawer'
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const url = new URL(tab.url);
    if (url.searchParams.get('triggerottofillextension') === 'true') {
      chrome.tabs.sendMessage(tabId, {
        action: 'autofill',
        params: Object.fromEntries(url.searchParams)
      });
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTabUrl') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        sendResponse({ url: tabs[0].url });
      }
    });
    return true;
  } else if (request.action === 'authenticate') {
    authenticate().then(sendResponse).catch(error => {
      console.error('Authentication error:', error);
      sendResponse({ error: error.message || 'Authentication failed' });
    });
    return true;
  } else if (request.action === 'getEmailContent') {
    getEmailContent(request.messageId)
      .then(sendResponse)
      .catch(error => {
        console.error('Get email error:', error);
        sendResponse({ error: error.message || 'Failed to retrieve email' });
      });
    return true;
  }
});

function authenticate() {
  return new Promise((resolve, reject) => {
    // First check if we have a valid stored token
    chrome.storage.local.get(['gmailToken', 'tokenExpiry'], async (result) => {
      if (result.gmailToken && result.tokenExpiry) {
        if (Date.now() < result.tokenExpiry) {
          accessToken = result.gmailToken;
          resolve(accessToken);
          return;
        } else {
          // Token expired, remove it
          chrome.storage.local.remove(['gmailToken', 'tokenExpiry']);
        }
      }

      // No valid token found, get a new one
      chrome.identity.getAuthToken({ interactive: true }, function(token) {
        if (chrome.runtime.lastError) {
          console.error('getAuthToken error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          accessToken = token;
          // Store the token with an expiry time (1 hour from now)
          const expiry = Date.now() + (60 * 60 * 1000); // 1 hour
          chrome.storage.local.set({
            gmailToken: token,
            tokenExpiry: expiry
          }, () => {
            if (chrome.runtime.lastError) {
              console.error('Error storing token:', chrome.runtime.lastError);
            }
          });
          resolve(token);
        }
      });
    });
  });
}

async function getEmailContent(messageId) {
  try {
    if (!accessToken) {
      await authenticate();
    }

    const response = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.status === 401) {
      accessToken = '';
      chrome.storage.local.remove(['gmailToken', 'tokenExpiry']);
      await authenticate();
      return getEmailContent(messageId);
    }

    if (!response.ok) {
      throw new Error('Failed to fetch email');
    }

    const data = await response.json();
    
    // Parse email data
    const headers = data.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
    const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
    const date = headers.find(h => h.name === 'Date')?.value;
    
    // Get email body with improved content handling
    let body = '';
    let htmlContent = '';
    let plainContent = '';

    function getBody(part) {
      if (part.body.data) {
        const content = decodeBase64(part.body.data);
        if (part.mimeType === 'text/html') {
          htmlContent = content;
        } else if (part.mimeType === 'text/plain') {
          plainContent = content;
        }
      }
      if (part.parts) {
        part.parts.forEach(getBody);
      }
    }

    getBody(data.payload);
    body = htmlContent || plainContent;

    return {
      subject,
      from,
      date,
      body,
      contentType: htmlContent ? 'text/html' : 'text/plain',
      raw: data // Include raw data for debugging
    };
  } catch (error) {
    console.error('Error in getEmailContent:', error);
    throw error;
  }
}

function decodeBase64(encoded) {
  try {
    // First, convert from URL-safe base64 to standard base64
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode base64 to bytes
    const rawData = atob(base64);
    
    // Convert bytes to UTF-8
    const decoder = new TextDecoder('utf-8');
    const arr = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
      arr[i] = rawData.charCodeAt(i);
    }
    
    return decoder.decode(arr);
  } catch (error) {
    console.error('Error decoding base64:', error);
    return '';
  }
}
