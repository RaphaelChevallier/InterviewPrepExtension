// Declare assistantContainer globally to manage its state easily
let assistantContainer = null;

window.onload = function() {
    // Create the sidebar and insert it at the beginning of the body
    assistantContainer = document.createElement('div');
    assistantContainer.id = 'ai-assistant-container';
    assistantContainer.style.cssText = `
        position: fixed;
        left: -225px; // Start off-screen
        top: 0;
        width: 225px; // Set fixed width
        height: 100vh; // Ensure it covers the full viewport height
        background-color: #f4f4f4; // Ensure full background coverage
        z-index: 1001;
        overflow-y: auto;
        border-right: 1px solid #ccc;
        padding: 10px;
        box-sizing: border-box;
        transition: left 0.5s; // Smooth transition for sidebar movement
    `;
    assistantContainer.innerHTML = `
        <h1>AI Assistant</h1>
        <p>Interact with your AI helper here. Ask questions, get coding help, etc.</p>
    `;
    document.body.prepend(assistantContainer); // Prepend the sidebar to the body

    // Set up responsive padding on the body
    document.body.style.transition = 'padding-left 0.5s'; // Smooth transition for body padding
    document.body.style.overflowX = 'hidden'; // Prevent horizontal scrolling

    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.action === "toggleAssistant") {
            toggleAssistantContainer();
        }
    });

    function toggleAssistantContainer() {
        if (assistantContainer.style.left === '-225px') {
            assistantContainer.style.left = '0px'; // Slide in the sidebar
            document.body.style.paddingLeft = '225px'; // Make room for the sidebar by adding padding
        } else {
            assistantContainer.style.left = '-225px'; // Slide out the sidebar
            document.body.style.paddingLeft = '0'; // Remove padding when sidebar is hidden
        }
    }
};
