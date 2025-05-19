// Function to create and insert the summarize button
function insertSummarizeButton() {
  // Check if we're on a YouTube video page
  if (!window.location.href.includes('youtube.com/watch')) {
    return;
  }

  // Check if button already exists
  if (document.getElementById('yt-summarize-btn')) {
    return;
  }

  console.log('YouTube Summarizer: Attempting to insert button...');

  // Try to find the actions container - specifically looking for the ID "actions"
  const actionsContainer = document.getElementById('actions');
  
  if (actionsContainer) {
    console.log('YouTube Summarizer: Found actions container!');
    
    // Create summarize button
    const summarizeButton = document.createElement('button');
    summarizeButton.id = 'yt-summarize-btn';
    summarizeButton.className = 'yt-summarize-btn';
    summarizeButton.innerHTML = '<span>Summarize</span>';
    summarizeButton.title = 'Summarize this video';

    // Add click event listener
    summarizeButton.addEventListener('click', handleSummarizeClick);

    // Find the right place inside the actions container
    const likeButton = actionsContainer.querySelector('ytd-toggle-button-renderer') || 
                       actionsContainer.querySelector('button');
                       
    if (likeButton) {
      console.log('YouTube Summarizer: Found like button to position relative to');
      
      // Insert button as the first element in the actions container, before the like button
      if (likeButton.parentNode) {
        likeButton.parentNode.insertBefore(summarizeButton, likeButton);
        console.log('YouTube Summarizer: Button inserted successfully before like button');
        return;
      }
    }
    
    // If we couldn't find the like button, just prepend to the actions container
    actionsContainer.prepend(summarizeButton);
    console.log('YouTube Summarizer: Button inserted at the beginning of actions container');
    return;
  }
  
  console.log('YouTube Summarizer: Actions container not found, trying alternate methods...');
  
  // Try alternative selectors if the actions ID wasn't found
  const alternativeSelectors = [
    // Modern YouTube selectors
    '#top-level-buttons-computed',
    '#menu-container',
    // Older YouTube selectors
    'ytd-video-primary-info-renderer #container',
    'ytd-video-primary-info-renderer ytd-menu-renderer',
    // Very specific selectors
    '#actions.ytd-video-primary-info-renderer',
    'div[id="actions"]'
  ];

  // Try each alternative selector
  let targetElement = null;
  for (const selector of alternativeSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements && elements.length > 0) {
      targetElement = elements[0];
      console.log(`YouTube Summarizer: Found element with selector: ${selector}`);
      break;
    }
  }

  // If we still don't have a target, create a floating button
  if (!targetElement) {
    console.log('YouTube Summarizer: No suitable container found. Creating floating button instead...');
    createFloatingButton();
    return;
  }

  // Create summarize button
  const summarizeButton = document.createElement('button');
  summarizeButton.id = 'yt-summarize-btn';
  summarizeButton.className = 'yt-summarize-btn';
  summarizeButton.innerHTML = '<span>Summarize</span>';
  summarizeButton.title = 'Summarize this video';

  // Add click event listener
  summarizeButton.addEventListener('click', handleSummarizeClick);

  // Try to insert the button
  try {
    // First try inserting at the beginning of the target element
    if (targetElement.firstChild) {
      targetElement.insertBefore(summarizeButton, targetElement.firstChild);
      console.log('YouTube Summarizer: Button inserted successfully at beginning of container');
    } else {
      // Last resort, append to target
      targetElement.appendChild(summarizeButton);
      console.log('YouTube Summarizer: Button appended to container');
    }
  } catch (e) {
    console.error('YouTube Summarizer: Failed to insert button:', e);
    // Fall back to floating button
    createFloatingButton();
  }
}

// Function to handle summarize button click
function handleSummarizeClick(event) {
  // Get the button that was clicked (or find one of our buttons)
  let button = event.target.closest('button') || 
               document.getElementById('yt-summarize-btn') || 
               document.getElementById('yt-summarize-floating-btn');
  
  // Show loading state
  if (button) {
    button.classList.add('loading');
    button.innerHTML = '<span>Summarizing...</span>';
  }

  // Get current video URL
  const videoUrl = window.location.href;
  
  // Get video title
  const videoTitle = document.querySelector('h1.ytd-video-primary-info-renderer')?.textContent || 
                     document.querySelector('h1.title')?.textContent || 
                     document.title.replace(' - YouTube', '');

  // Create or find popup container
  let popupContainer = document.getElementById('yt-summary-popup');
  if (!popupContainer) {
    popupContainer = document.createElement('div');
    popupContainer.id = 'yt-summary-popup';
    popupContainer.className = 'yt-summary-popup';
    
    // Create popup content
    popupContainer.innerHTML = `
      <div class="yt-summary-popup-header">
        <h3>Video Summary</h3>
        <button id="yt-summary-close">×</button>
      </div>
      <div class="yt-summary-popup-content">
        <div id="yt-summary-loading">Generating summary...</div>
        <div id="yt-summary-result" style="display: none;"></div>
      </div>
    `;
    
    document.body.appendChild(popupContainer);
    
    // Add close button event listener
    document.getElementById('yt-summary-close').addEventListener('click', () => {
      popupContainer.classList.remove('show');
      // Reset all button states
      resetButtonStates();
    });
  } else {
    // Reset popup state
    document.getElementById('yt-summary-loading').style.display = 'block';
    document.getElementById('yt-summary-result').style.display = 'none';
    document.getElementById('yt-summary-result').textContent = '';
  }
  
  // Show popup
  popupContainer.classList.add('show');
  
  // Request summary from background script
  chrome.runtime.sendMessage(
    { action: 'summarize', videoUrl, videoTitle },
    (response) => {
      // Hide loading indicator
      document.getElementById('yt-summary-loading').style.display = 'none';
      
      // Show result
      const resultElement = document.getElementById('yt-summary-result');
      resultElement.style.display = 'block';
      
      if (response.error) {
        resultElement.innerHTML = `<p class="error">${response.error}</p>`;
      } else {
        // Convert markdown to HTML before displaying
        resultElement.innerHTML = markdownToHtml(response.summary);
      }
      
      // Reset all button states
      resetButtonStates();
    }
  );
}

// Function to reset all button states
function resetButtonStates() {
  // Find all our buttons and reset them
  const buttons = [
    document.getElementById('yt-summarize-btn'),
    document.getElementById('yt-summarize-floating-btn')
  ];
  
  buttons.forEach(button => {
    if (button) {
      button.classList.remove('loading');
      button.innerHTML = '<span>Summarize</span>';
    }
  });
}

// Function to create a floating button that doesn't rely on YouTube's UI structure
function createFloatingButton() {
  // Check if floating button already exists
  if (document.getElementById('yt-summarize-floating-btn')) {
    return;
  }
  
  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'yt-summarize-floating-container';
  buttonContainer.className = 'yt-summarize-floating-container';
  
  // Create the button
  const floatingButton = document.createElement('button');
  floatingButton.id = 'yt-summarize-floating-btn';
  floatingButton.className = 'yt-summarize-floating-btn';
  floatingButton.innerHTML = '<span>Summarize</span>';
  floatingButton.title = 'Summarize this video';
  
  // Add click event
  floatingButton.addEventListener('click', handleSummarizeClick);
  
  // Add button to container
  buttonContainer.appendChild(floatingButton);
  
  // Add container to the page
  document.body.appendChild(buttonContainer);
  
  console.log('YouTube Summarizer: Floating button created');
}

// Function to handle YouTube's dynamic loading
function waitForElement(selector, callback, checkFrequencyInMs, timeoutInMs) {
  let startTimeInMs = Date.now();
  
  (function loopSearch() {
    if (document.querySelector(selector) || document.getElementById(selector)) {
      callback();
      return;
    }
    else {
      setTimeout(function () {
        if (timeoutInMs && Date.now() - startTimeInMs > timeoutInMs) {
          return;
        }
        loopSearch();
      }, checkFrequencyInMs);
    }
  })();
}

// Try inserting at different times to catch when YouTube's UI is ready
function tryMultipleInsertions() {
  // First, try to wait for the actions container to be loaded
  waitForElement('actions', insertSummarizeButton, 500, 10000);
  
  // Also try immediate insertion
  insertSummarizeButton();
  
  // Then try after short, medium, and longer delays
  setTimeout(insertSummarizeButton, 1000);  // 1 second
  setTimeout(insertSummarizeButton, 3000);  // 3 seconds
  setTimeout(insertSummarizeButton, 5000);  // 5 seconds
}

// Run when page loads
tryMultipleInsertions();

// YouTube is a Single Page Application (SPA), so we need to check for navigation events
let lastUrl = window.location.href;
new MutationObserver(() => {
  if (lastUrl !== window.location.href) {
    console.log('YouTube Summarizer: URL changed, reinserting button');
    lastUrl = window.location.href;
    tryMultipleInsertions();
  }
}).observe(document.body, { subtree: true, childList: true });

// Also try inserting on DOM content loaded and when window is fully loaded
document.addEventListener('DOMContentLoaded', tryMultipleInsertions);
window.addEventListener('load', tryMultipleInsertions);