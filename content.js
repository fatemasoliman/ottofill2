chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'autofill') {
    autofillInputs(request.params);
  } else if (request.action === 'manualAutofill') {
    chrome.runtime.sendMessage({ action: 'getTabUrl' }, (response) => {
      if (response && response.url) {
        const url = new URL(response.url);
        const params = Object.fromEntries(url.searchParams);
        autofillInputs(params);
      }
    });
  }
});

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
