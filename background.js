// Function to extract the definitions and parts of speech from the page
async function extractDefinitions(tabId) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        function: () => {
          const entries = Array.from(
            document.querySelectorAll(".pr.entry-body__el")
          );
          return entries.map((entry) => {
            const word = entry.querySelector(".hw.dhw")?.innerText.trim() || "";
            const partOfSpeech =
              entry.querySelector(".pos.dpos")?.innerText.trim() || "";
            const definition =
              entry.querySelector(".def.ddef_d.db")?.innerText.trim() || "";
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
    // Open a new tab in the background with the Cambridge Dictionary page for the entered word
    chrome.tabs.create(
      {
        url: `https://dictionary.cambridge.org/dictionary/english/${word}`,
        active: false,
      },
      function (tab) {
        // Listen for tab updates
        chrome.tabs.onUpdated.addListener(function onUpdated(
          tabId,
          changeInfo,
          updatedTab
        ) {
          if (updatedTab.id === tab.id && changeInfo.status === "complete") {
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
                  error: "Failed to extract definitions",
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
  } catch (error) {
    console.error("Error opening tab:", error);
    alert("Failed to open tab");
  }
});
