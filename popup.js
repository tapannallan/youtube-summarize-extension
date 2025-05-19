// DOM Elements
const apiKeyInput = document.getElementById('api-key');
const saveButton = document.getElementById('save-btn');
const editButton = document.getElementById('edit-btn');
const deleteButton = document.getElementById('delete-btn');
const statusDiv = document.getElementById('status');
const noKeySection = document.getElementById('no-key-section');
const hasKeySection = document.getElementById('has-key-section');
const maskedKeyElement = document.getElementById('masked-key');

// Load saved API key on popup open
document.addEventListener('DOMContentLoaded', () => {
  chrome.runtime.sendMessage({ action: 'getApiKey' }, (response) => {
    if (response && response.apiKey) {
      // Show the key exists view
      displayApiKeyExists(response.apiKey);
    } else {
      // Show the no key view
      displayNoApiKey();
    }
  });
});

// Save API key
saveButton.addEventListener('click', () => {
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    showStatus('Please enter an API key', 'error');
    return;
  }
  
  // Save API key to storage
  chrome.runtime.sendMessage(
    { action: 'saveApiKey', apiKey },
    (response) => {
      if (response && response.success) {
        showStatus('API key saved successfully!', 'success');
        displayApiKeyExists(apiKey);
      } else {
        showStatus('Failed to save API key', 'error');
      }
    }
  );
});

// Edit API key button
editButton.addEventListener('click', () => {
  // Get current API key
  chrome.runtime.sendMessage({ action: 'getApiKey' }, (response) => {
    if (response && response.apiKey) {
      // Switch to edit view and pre-fill the input
      apiKeyInput.value = response.apiKey;
      displayNoApiKey();
    }
  });
});

// Delete API key button
deleteButton.addEventListener('click', () => {
  if (confirm('Are you sure you want to delete your API key?')) {
    chrome.runtime.sendMessage({ action: 'deleteApiKey' }, (response) => {
      if (response && response.success) {
        showStatus('API key deleted successfully!', 'success');
        displayNoApiKey();
        apiKeyInput.value = '';
      } else {
        showStatus('Failed to delete API key', 'error');
      }
    });
  }
});

// Function to show status message
function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + type;
  
  // Clear status after 3 seconds
  setTimeout(() => {
    statusDiv.className = 'status';
  }, 3000);
}

// Function to display the "API key exists" view
function displayApiKeyExists(apiKey) {
  noKeySection.style.display = 'none';
  hasKeySection.style.display = 'block';
  
  // Show masked API key (first 4 chars and last 4 chars)
  if (apiKey.length > 8) {
    const firstFour = apiKey.substring(0, 4);
    const lastFour = apiKey.substring(apiKey.length - 4);
    const middleLength = apiKey.length - 8;
    const maskedMiddle = '•'.repeat(Math.min(middleLength, 10));
    maskedKeyElement.textContent = `${firstFour}${maskedMiddle}${lastFour}`;
  } else {
    maskedKeyElement.textContent = '••••••••';
  }
}

// Function to display the "No API key" view
function displayNoApiKey() {
  noKeySection.style.display = 'block';
  hasKeySection.style.display = 'none';
}