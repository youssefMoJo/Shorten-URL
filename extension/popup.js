// Simple popup logic for URL shortening

document.addEventListener("DOMContentLoaded", async function () {
  // Check if running in extension context
  if (typeof chrome === 'undefined' || !chrome.tabs) {
    console.error('This extension must be loaded in Chrome as an extension.');
    document.querySelector('.content').innerHTML = '<div style="padding: 20px; text-align: center; color: #dc2626;">Please load this as a Chrome extension.</div>';
    return;
  }

  // Setup event listeners
  setupEventListeners();

  // Always shorten URL on popup open
  await shortenCurrentTab();
});

// Setup all event listeners
function setupEventListeners() {
  // Copy button
  document.getElementById("copy-button").addEventListener("click", async function() {
    const urlDisplay = document.getElementById("url-display");
    const shortURL = urlDisplay.textContent;
    await copyToClipboard(shortURL);
  });
}

// Shorten the current tab's URL
async function shortenCurrentTab() {
  const loadingContainer = document.querySelector(".loading-container");
  const content = document.querySelector(".content");
  const urlDisplay = document.getElementById("url-display");
  const copyButton = document.getElementById("copy-button");

  try {
    // Get current tab URL
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tabs[0].url;

    // Show loading state
    content.style.display = "none";
    loadingContainer.style.display = "flex";

    // Make API request
    const shortURL = await getShortURL(url);

    // Hide loading
    loadingContainer.style.display = "none";
    content.style.display = "flex";

    if (shortURL) {
      // Display short URL
      urlDisplay.textContent = shortURL;
      urlDisplay.classList.remove("error");
      copyButton.style.display = "flex";

      // Auto-copy to clipboard
      await copyToClipboard(shortURL);
    } else {
      // Show error
      urlDisplay.textContent = "Failed to shorten URL. Please try again.";
      urlDisplay.classList.add("error");
      copyButton.style.display = "none";
    }
  } catch (error) {
    console.error("Error shortening URL:", error);
    loadingContainer.style.display = "none";
    content.style.display = "flex";
    urlDisplay.textContent = "An error occurred. Please try again.";
    urlDisplay.classList.add("error");
    copyButton.style.display = "none";
  }
}

// Make API request to shorten URL
async function getShortURL(longURL) {
  try {
    const response = await fetch(`${CONFIG.api.baseUrl}${CONFIG.api.endpoints.shorten}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ long_link: longURL }),
    });

    if (response.ok) {
      const data = await response.json();
      // Handle both string response and object response
      return typeof data === 'string' ? data : data.short_url;
    } else {
      return null;
    }
  } catch (error) {
    console.error("API error:", error);
    return null;
  }
}

// Copy to clipboard with visual feedback
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);

    const copyButton = document.getElementById("copy-button");
    const originalContent = copyButton.innerHTML;

    copyButton.classList.add("copied");
    copyButton.innerHTML = `
      <svg class="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Copied!
    `;

    setTimeout(() => {
      copyButton.classList.remove("copied");
      copyButton.innerHTML = originalContent;
    }, 2000);
  } catch (err) {
    console.error("Copy failed:", err);
  }
}
