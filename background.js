// background.js

// Initialize or check current state when the extension loads
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get('isEnabled', function(data) {
        if (data.isEnabled === undefined) {
            // Set default state to enabled when first installed
            chrome.storage.local.set({isEnabled: true});
        }
    });
});

chrome.action.onClicked.addListener(function(tab) {
    chrome.storage.local.get('isEnabled', function(data) {
        // Toggle the enabled state
        var newState = !data.isEnabled;
        chrome.storage.local.set({isEnabled: newState}, function() {
            // Send message to content script with the new state
            chrome.tabs.sendMessage(tab.id, {action: "toggleExtension", enabled: newState});
        });
    });
});
