// background.js
chrome.action.onClicked.addListener(function(tab) {
    console.log("Extension icon clicked, sending message to tab id:", tab.id);
    chrome.tabs.sendMessage(tab.id, {action: "toggleAssistant"});
});
