// Store API key in extension storage
let apiKey = '';

// Constants
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Initialize
chrome.runtime.onInstalled.addListener(() => {
  loadApiKey();
});

// Also load API key when the service worker starts
loadApiKey();

// Function to load API key from sync storage
function loadApiKey() {
  chrome.storage.sync.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      apiKey = result.geminiApiKey;
      console.log('Loaded Gemini API key from sync storage');
    }
  });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarize') {
    summarizeVideo(request.videoUrl, request.videoTitle, sendResponse);
    return true; // Required for async sendResponse
  } else if (request.action === 'saveApiKey') {
    apiKey = request.apiKey;
    chrome.storage.sync.set({ geminiApiKey: apiKey });
    sendResponse({ success: true });
  } else if (request.action === 'getApiKey') {
    sendResponse({ apiKey });
  } else if (request.action === 'deleteApiKey') {
    apiKey = '';
    chrome.storage.sync.remove('geminiApiKey', () => {
      sendResponse({ success: true });
    });
    return true; // Required for async sendResponse
  }
});

// Function to summarize video using Gemini API
async function summarizeVideo(videoUrl, videoTitle, sendResponse) {
  try {
    // Check if API key is available
    if (!apiKey) {
      sendResponse({ 
        error: 'Gemini API key is not set. Please set it in the extension popup.'
      });
      return;
    }

    // Prepare the request to Gemini API
    const url = `${GEMINI_API_BASE_URL}?key=${apiKey}`;
    
    // Create prompt for video summarization
    const prompt = `summarize this YouTube video. 
Video URL: ${videoUrl}
Video Title: ${videoTitle}

Do not lose any important information. only remove any unnecessary details or filler content.
Make it concise and easy to understand. Try to keep it under 1500 words. If the summary crosses 1500 words, resummarize it to make it under 1500 words.`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 800
      }
    };

    // Make API request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    // Check for errors
    if (!response.ok) {
      const errorMessage = data.error?.message || 'Failed to generate summary';
      sendResponse({ error: errorMessage });
      return;
    }

    // Extract summary from response
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      
      const summaryText = data.candidates[0].content.parts[0].text;
      sendResponse({ summary: summaryText });
    } else {
      sendResponse({ error: 'Could not generate summary from API response' });
    }
  } catch (error) {
    console.error('Error summarizing video:', error);
    sendResponse({ error: 'Failed to generate summary: ' + error.message });
  }
}