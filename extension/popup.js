document.addEventListener("DOMContentLoaded", function () {
  const loadingContainer = document.querySelector(".loading-container");
  const urlDisplay = document.querySelector("#url-display");
  const copyButton = document.querySelector("#copy-button");
  const content = document.querySelector(".content");

  // Function to copy text to clipboard with visual feedback
  const copyToClipboard = async (text) => {
    try {
      // Use modern clipboard API
      await navigator.clipboard.writeText(text);

      // Add visual feedback
      copyButton.classList.add("copied");

      // Update button content
      const originalContent = copyButton.innerHTML;
      copyButton.innerHTML = `
        <svg class="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Copied!
      `;

      // Revert after 2 seconds
      setTimeout(function () {
        copyButton.classList.remove("copied");
        copyButton.innerHTML = originalContent;
      }, 2000);
    } catch (err) {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);

      copyButton.classList.add("copied");
      const originalText = copyButton.textContent;
      copyButton.textContent = "Copied!";

      setTimeout(function () {
        copyButton.classList.remove("copied");
        copyButton.textContent = originalText;
      }, 2000);
    }
  };

  // Function to make the API request and handle the response
  const getShortURL = async (longURL) => {
    try {
      const response = await fetch("https://shorturl.life/shorten", {
        method: "POST",
        body: JSON.stringify({ long_link: longURL }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  // Get the current tab's URL and display it
  chrome.tabs.query(
    { active: true, currentWindow: true },
    async function (tabs) {
      const url = tabs[0].url;

      // Show loading state
      content.style.display = "none";
      loadingContainer.style.display = "flex";

      // Make the API request to shorten the URL
      const shortURL = await getShortURL(url);

      // Hide the loading indicator and show content
      loadingContainer.style.display = "none";
      content.style.display = "flex";

      if (shortURL) {
        // Create a clickable element for the short URL
        const shortURLLink = document.createElement("a");
        shortURLLink.href = "#";
        shortURLLink.textContent = shortURL;
        shortURLLink.style.cursor = "pointer";

        // Copy URL when clicked instead of opening
        shortURLLink.addEventListener("click", async function (e) {
          e.preventDefault();
          await copyToClipboard(shortURL);
        });

        // Clear and append the anchor element to the display container
        urlDisplay.innerHTML = "";
        urlDisplay.appendChild(shortURLLink);

        // Show copy button with animation
        copyButton.style.display = "flex";

        // Copy the short URL to the clipboard when the button is clicked
        copyButton.addEventListener("click", async function () {
          await copyToClipboard(shortURL);
        });
      } else {
        // Show error state
        urlDisplay.innerHTML = "";
        urlDisplay.textContent = "Failed to shorten URL. Please try again.";
        urlDisplay.classList.add("error");
        copyButton.style.display = "none";
      }

      // Handle validation error message
      if (typeof shortURL === 'string' && shortURL.includes("Please enter a valid long URL")) {
        urlDisplay.innerHTML = "";
        urlDisplay.textContent = shortURL;
        urlDisplay.classList.add("error");
        urlDisplay.style.cursor = "default";
        copyButton.style.display = "none";
      }
    }
  );
});
