// Function to handle the message from the background script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.definitions) {
    // Clear previous content
    const definitionsList = document.getElementById("definitions");
    definitionsList.innerHTML = "";
    // Display the definitions in the popup
    message.definitions.forEach((definition, index) => {
      const listItem = document.createElement("li");
      listItem.innerHTML = `<strong>${index + 1}. ${
        definition.word
      }</strong> (${definition.partOfSpeech}): ${definition.definition}`;
      definitionsList.appendChild(listItem);
    });
  } else if (message.error) {
    // Display the error in the popup
    document.getElementById("error").textContent = message.error;
  }
});

// Function to send a message to the background script to initiate the lookup
function handleLookup() {
  // Clear previous content
  document.getElementById("definitions").innerHTML = "";
  document.getElementById("error").textContent = "";

  // Get the word entered by the user
  let word = document.getElementById("word").value.trim();
  word = word.replace(/ /g, "-");
  // Send a message to the background script to initiate the lookup
  chrome.runtime.sendMessage({ word });
}

// Attach handleLookup function to the button click event
document.getElementById("lookupButton").addEventListener("click", handleLookup);
