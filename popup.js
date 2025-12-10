document.addEventListener("DOMContentLoaded", function () {
  // Wait for the DOM to be fully loaded

  const loadingContainer = document.querySelector(".loading-container");
  const urlDisplay = document.querySelector("#url-display");
  const copyButton = document.querySelector("#copy-button");

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
      loadingContainer.style.display = "block";

      // Make the API request to shorten the URL
      const shortURL = await getShortURL(url);

      // Hide the loading indicator
      loadingContainer.style.display = "none";

      if (shortURL) {
        // Create an anchor element for the short URL
        const shortURLLink = document.createElement("a");
        shortURLLink.href = shortURL;
        shortURLLink.textContent = shortURL;
        shortURLLink.target = "_blank"; // Open in a new tab

        // Append the anchor element to the display container
        urlDisplay.appendChild(shortURLLink);

        // Add a signature element below the button
        const signature = document.createElement("div");
        signature.textContent = "by Youssef Mohamed";
        signature.classList.add("signature"); // Apply CSS class

        // Append the signature element below the "Copy Link" button
        copyButton.parentNode.insertBefore(signature, copyButton.nextSibling);

        copyButton.style.display = "block";

        // Copy the short URL to the clipboard when the button is clicked
        copyButton.addEventListener("click", function () {
          const input = document.createElement("input");
          input.value = shortURL;
          document.body.appendChild(input);
          input.select();
          document.execCommand("copy");
          document.body.removeChild(input);

          // Change the button text to "Copied" temporarily
          copyButton.textContent = "Copied";

          // Set a timeout to revert the button text to "Copy Link" after 3 seconds
          setTimeout(function () {
            copyButton.textContent = "Copy Link";
          }, 1000);
        });
      } else {
        urlDisplay.textContent = "Failed to shorten URL";
      }
    }
  );
});
