// Declare assistantContainer globally to manage its state easily
let assistantContainer = null;
let toggleHandle = null;
let closeButton = null;  // Declare the close button

window.onload = function() {
    // Create the sidebar and insert it at the beginning of the body
    assistantContainer = document.createElement('div');
    assistantContainer.id = 'ai-assistant-container';
    assistantContainer.className = 'assistant-container';
    assistantContainer.style.cssText = `
        position: fixed;
        left: -225px;
        top: 0;
        width: 225px;
        height: 100vh !important;
        z-index: 1002;
        overflow-y: auto;
        border-right: 1px solid #ccc;
        padding: 10px;
        box-sizing: border-box;
        transition: left 0.5s;
        background-color: ${getComputedStyle(document.body).backgroundColor};
    `;
    document.body.prepend(assistantContainer);

    // Create a toggle handle
    toggleHandle = document.createElement('div');
    toggleHandle.id = 'ai-assistant-toggle-handle';
    toggleHandle.className = 'toggle-handle'; 
    toggleHandle.style.cssText = `
        position: fixed;
        top: 10px;
        left: 0px;
        width: 20px;
        height: 30px;
        background-color: #ccc;
        border-radius: 15px 0 0 15px;
        cursor: pointer;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        transform: rotate(180deg);
        z-index: 1000;
    `;
    assistantContainer.appendChild(toggleHandle);

    // Create a close button
    closeButton = document.createElement('div');
    closeButton.innerText = 'X';  // Text for the close button
    closeButton.style.cssText = `
        position: absolute;
        top: 5px;
        right: 10px;
        width: 20px;
        height: 20px;
        background-color: transparent;
        color: black;
        font-size: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    closeButton.onmouseover = function() {
        this.style.color = 'red';  // Change color to red on hover
    };
    closeButton.onmouseout = function() {
        this.style.color = 'black';  // Revert color when not hovering
    };
    closeButton.onclick = function() {
        toggleAssistantContainer();  // Function to close the sidebar
    };
    assistantContainer.appendChild(closeButton);  // Append the close button to the sidebar

    document.body.style.transition = 'padding-left 0.5s';
    document.body.style.overflowX = 'hidden';

    // Listen for toggle click, initially hidden
    toggleHandle.addEventListener('click', function() {
        toggleAssistantContainer();
    });

    // Background script message listener
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.action === "toggleAssistant") {
            toggleAssistantContainer();
        }
    });

    function toggleAssistantContainer() {
        if (assistantContainer.style.left === '-225px') {
            assistantContainer.style.left = '0px';  // Slide in the sidebar
            document.body.style.paddingLeft = '225px';
            toggleHandle.style.display = 'none';
        } else {
            assistantContainer.style.left = '-225px';  // Slide out the sidebar
            document.body.style.paddingLeft = '0';
            toggleHandle.style.display = 'block';
        }
    }

    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.action === "toggleExtension") {
            isEnabled = message.enabled; // Update local enabled state
            toggleExtension(); // Adjust visibility based on new state
        }
    });

    function toggleExtension() {
        if (isEnabled) {
            assistantContainer.style.display = 'block';
            toggleAssistantContainer()
        } else {
            assistantContainer.style.display = 'none';
            document.body.style.paddingLeft = '0';
        }
    }
};
