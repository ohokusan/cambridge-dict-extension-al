const buttonEl = document.getElementById("lookupButton");
const inputEl = document.getElementById("word");

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

  buttonEl.classList.add("active");
  setTimeout(() => {
    buttonEl.classList.remove("active");
  }, 200);

  // Send a message to the background script to initiate the lookup
  chrome.runtime.sendMessage({ word });
}

// Attach handleLookup function to the button click event
buttonEl.addEventListener("click", handleLookup);

// Execute a function when the user presses a key on the keyboard
inputEl.addEventListener("keypress", function (event) {
  // If the user presses the "Enter" key on the keyboard
  if (event.key === "Enter") {
    // Cancel the default action, if needed
    event.preventDefault();
    this.blur();
    // Trigger the button element with a click

    buttonEl.click();
  }
});
