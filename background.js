// Function to extract the definitions and parts of speech from the page
async function extractDefinitions(tabId) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        function: () => {
          let entries = Array.from(
            document.querySelectorAll(".entry-body__el")
          );
          return entries.map((entry) => {
            const word =
              entry.querySelector(".di-title")?.innerText.trim() || "";
            const partOfSpeech =
              entry.querySelector(".pos.dpos")?.innerText.trim() || "";
            const definition =
              entry.querySelector(".ddef_h")?.innerText.trim() || "";
            return { word, partOfSpeech, definition };
          });
        },
      },
      (results) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          const definitions = results[0]?.result;

          if (Array.isArray(definitions)) {
            resolve(definitions);
          } else {
            reject(new Error("Definitions not found"));
          }
        }
      }
    );
  });
}

// Function to handle the message from the popup script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  const word = message.word;

  try {
    redirectLink(`https://dictionary.cambridge.org/dictionary/english/${word}`)
      .then(function (link) {
        // Open a new tab in the background with the Cambridge Dictionary page for the entered word

        // chrome.runtime.sendMessage({ error: link });

        chrome.tabs.create(
          {
            url: link,
            active: false,
          },
          function (tab) {
            // Listen for tab updates
            chrome.tabs.onUpdated.addListener(function onUpdated(
              tabId,
              changeInfo,
              updatedTab
            ) {
              if (
                updatedTab.id === tab.id &&
                changeInfo.status === "complete"
              ) {
                // Remove the listener to avoid multiple executions
                chrome.tabs.onUpdated.removeListener(onUpdated);

                // Extract the definitions from the page
                extractDefinitions(tabId)
                  .then((definitions) => {
                    // Send the definitions back to the popup script
                    chrome.runtime.sendMessage({ definitions });
                  })
                  .catch((error) => {
                    console.error("Error extracting definitions:", error);
                    // Send an error message to the popup script
                    chrome.runtime.sendMessage({
                      error:
                        "Failed to extract definitions " +
                        JSON.stringify(error),
                    });
                  })
                  .finally(() => {
                    // Close the tab
                    chrome.tabs.remove(tabId);
                  });
              }
            });
          }
        );
      })
      .catch(function (error) {
        console.error("Error opening tab:", error);
        alert("Failed to open tab");
      });
  } catch (error) {
    console.error("Error opening tab:", error);
    chrome.runtime.sendMessage({
      error: "Failed to extract definitions " + link,
    });
  }
});

async function redirectLink(link) {
  // Final URL with the redirect-checker API
  const finalUrl = `https://api.redirect-checker.net/?url=${link}`;

  try {
    // Use fetch to make a request to the redirect-checker API
    const response = await fetch(finalUrl);
    const data = await response.json();
    // const redirectedUrl = JSON.stringify(
    //   data.data[0].response.info.redirect_url
    // );

    // Check if the API call was successful
    if (data && data.success) {
      const redirectedUrl = data.data[0].response.info.redirect_url.replace(
        /"/g,
        ""
      );
      return redirectedUrl;
      // Extract the redirected URL from the API response
    } else {
      // If the API call was not successful, return the original link
      return link;
    }
  } catch (error) {
    // Handle fetch errors
    console.error("Error fetching redirected URL:", error);
    // Return the original link in case of error
    return link;
  }
}
