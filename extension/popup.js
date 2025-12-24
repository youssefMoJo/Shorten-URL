// Main popup logic with authentication and history

let currentAuthState = null;
let isGuestMode = false;

document.addEventListener("DOMContentLoaded", async function () {
  // Initialize auth state
  currentAuthState = await auth.getAuthState();

  // Initialize UI based on auth state
  await initializeUI();

  // Setup event listeners
  setupEventListeners();

  // If authenticated or guest mode, proceed to shorten URL
  if (currentAuthState.isAuthenticated || isGuestMode) {
    await shortenCurrentTab();
  }
});

// Initialize UI based on authentication state
async function initializeUI() {
  const userProfile = document.getElementById("user-profile");
  const authForm = document.getElementById("auth-form");
  const dashboardLink = document.getElementById("dashboard-link");
  const historySection = document.getElementById("history-section");

  if (currentAuthState.isAuthenticated) {
    // Show user profile
    userProfile.style.display = "flex";
    document.getElementById("user-email").textContent = currentAuthState.user.email;

    // Show dashboard link
    dashboardLink.style.display = "flex";
    dashboardLink.href = CONFIG.website.dashboardUrl;

    // Hide auth form
    authForm.style.display = "none";

    // Load and display history
    await loadHistory();
    historySection.style.display = "block";
  } else {
    // Show auth form
    authForm.style.display = "block";
    userProfile.style.display = "none";
    dashboardLink.style.display = "none";
    historySection.style.display = "none";
  }
}

// Setup all event listeners
function setupEventListeners() {
  // Logout button
  document.getElementById("logout-button").addEventListener("click", handleLogout);

  // Login form
  document.getElementById("login-submit").addEventListener("click", handleLogin);
  document.getElementById("login-password").addEventListener("keypress", function(e) {
    if (e.key === "Enter") handleLogin();
  });

  // Signup form
  document.getElementById("signup-submit").addEventListener("click", handleSignup);
  document.getElementById("signup-password").addEventListener("keypress", function(e) {
    if (e.key === "Enter") handleSignup();
  });

  // Switch between login/signup
  document.getElementById("show-signup").addEventListener("click", function(e) {
    e.preventDefault();
    document.getElementById("login-view").style.display = "none";
    document.getElementById("signup-view").style.display = "block";
    clearErrors();
  });

  document.getElementById("show-login").addEventListener("click", function(e) {
    e.preventDefault();
    document.getElementById("signup-view").style.display = "none";
    document.getElementById("login-view").style.display = "block";
    clearErrors();
  });

  // Continue as guest
  document.getElementById("guest-continue").addEventListener("click", handleGuestMode);

  // Copy button
  document.getElementById("copy-button").addEventListener("click", async function() {
    const urlDisplay = document.getElementById("url-display");
    const shortURL = urlDisplay.textContent;
    await copyToClipboard(shortURL);
  });
}

// Handle login
async function handleLogin() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const errorDiv = document.getElementById("auth-error");
  const submitButton = document.getElementById("login-submit");

  // Validate inputs
  if (!email || !password) {
    showError(errorDiv, "Please enter both email and password");
    return;
  }

  // Disable button and show loading
  submitButton.disabled = true;
  submitButton.textContent = "Logging in...";

  try {
    await auth.login(email, password);

    // Update auth state
    currentAuthState = await auth.getAuthState();

    // Reinitialize UI
    await initializeUI();

    // Shorten current tab
    await shortenCurrentTab();
  } catch (error) {
    showError(errorDiv, error.message);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Login";
  }
}

// Handle signup
async function handleSignup() {
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const errorDiv = document.getElementById("signup-error");
  const successDiv = document.getElementById("signup-success");
  const submitButton = document.getElementById("signup-submit");

  // Validate inputs
  if (!email || !password) {
    showError(errorDiv, "Please enter both email and password");
    return;
  }

  if (password.length < 8) {
    showError(errorDiv, "Password must be at least 8 characters");
    return;
  }

  // Disable button and show loading
  submitButton.disabled = true;
  submitButton.textContent = "Signing up...";

  try {
    const result = await auth.signup(email, password);

    if (result.requiresVerification) {
      hideError(errorDiv);
      showSuccess(successDiv, "Account created! Please check your email to verify your account, then login.");

      // Clear form
      document.getElementById("signup-email").value = "";
      document.getElementById("signup-password").value = "";

      // Switch to login view after 3 seconds
      setTimeout(() => {
        document.getElementById("signup-view").style.display = "none";
        document.getElementById("login-view").style.display = "block";
        document.getElementById("login-email").value = email;
      }, 3000);
    }
  } catch (error) {
    showError(errorDiv, error.message);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Sign Up";
  }
}

// Handle guest mode
async function handleGuestMode() {
  isGuestMode = true;
  document.getElementById("auth-form").style.display = "none";
  await shortenCurrentTab();
}

// Handle logout
async function handleLogout() {
  await auth.logout();
  await clearHistory();

  // Reset state
  currentAuthState = await auth.getAuthState();
  isGuestMode = false;

  // Reset UI
  document.getElementById("user-profile").style.display = "none";
  document.getElementById("auth-form").style.display = "block";
  document.getElementById("login-view").style.display = "block";
  document.getElementById("signup-view").style.display = "none";
  document.getElementById("dashboard-link").style.display = "none";
  document.getElementById("history-section").style.display = "none";

  // Clear forms
  document.getElementById("login-email").value = "";
  document.getElementById("login-password").value = "";
  clearErrors();
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

    // Get ID token if authenticated
    let idToken = null;
    if (currentAuthState.isAuthenticated) {
      idToken = await auth.getIdToken();
    }

    // Make API request
    const shortURL = await getShortURL(url, idToken);

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

      // Save to history if authenticated
      if (currentAuthState.isAuthenticated) {
        await saveToHistory(url, shortURL);
        await loadHistory();
      }
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
async function getShortURL(longURL, idToken) {
  try {
    const headers = {
      "Content-Type": "application/json",
    };

    if (idToken) {
      headers["Authorization"] = `Bearer ${idToken}`;
    }

    const response = await fetch(`${CONFIG.api.baseUrl}${CONFIG.api.endpoints.shorten}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ long_link: longURL }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.short_url;
    } else if (response.status === 401 && idToken) {
      // Token expired, logout
      await auth.logout();
      showError(document.getElementById("auth-error"), "Session expired. Please login again.");
      await handleLogout();
      return null;
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

// History management
async function saveToHistory(originalURL, shortURL) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['linkHistory'], (data) => {
      let history = data.linkHistory || [];

      // Add new link to beginning
      history.unshift({
        originalURL,
        shortURL,
        timestamp: Date.now()
      });

      // Keep only last 10 items
      history = history.slice(0, CONFIG.maxHistoryItems);

      chrome.storage.local.set({ linkHistory: history }, resolve);
    });
  });
}

async function loadHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['linkHistory'], (data) => {
      const history = data.linkHistory || [];
      const historyList = document.getElementById("history-list");

      historyList.innerHTML = "";

      if (history.length === 0) {
        resolve();
        return;
      }

      history.forEach((item) => {
        const historyItem = document.createElement("div");
        historyItem.className = "history-item";

        const urlInfo = document.createElement("div");
        urlInfo.className = "history-url-info";

        const shortURLSpan = document.createElement("span");
        shortURLSpan.className = "history-short-url";
        shortURLSpan.textContent = item.shortURL;

        const originalURLSpan = document.createElement("span");
        originalURLSpan.className = "history-original-url";
        originalURLSpan.textContent = truncateURL(item.originalURL, 40);

        urlInfo.appendChild(shortURLSpan);
        urlInfo.appendChild(originalURLSpan);

        const copyBtn = document.createElement("button");
        copyBtn.className = "history-copy-btn";
        copyBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2"/>
          </svg>
        `;
        copyBtn.title = "Copy";
        copyBtn.addEventListener("click", async () => {
          await navigator.clipboard.writeText(item.shortURL);
          copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2"/></svg>`;
          setTimeout(() => {
            copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2"/></svg>`;
          }, 1000);
        });

        historyItem.appendChild(urlInfo);
        historyItem.appendChild(copyBtn);
        historyList.appendChild(historyItem);
      });

      resolve();
    });
  });
}

async function clearHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['linkHistory'], resolve);
  });
}

// Helper functions
function truncateURL(url, maxLength) {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength - 3) + "...";
}

function showError(errorDiv, message) {
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
}

function hideError(errorDiv) {
  errorDiv.textContent = "";
  errorDiv.style.display = "none";
}

function showSuccess(successDiv, message) {
  successDiv.textContent = message;
  successDiv.style.display = "block";
}

function clearErrors() {
  hideError(document.getElementById("auth-error"));
  hideError(document.getElementById("signup-error"));
  document.getElementById("signup-success").style.display = "none";
}
