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

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    // Check if the page has finished loading and if it matches a specific URL
    if (tab.url.includes('https://leetcode.com/problems/')) {
        // Request the content script to read text
        chrome.storage.local.get('isEnabled', function(data) {
            if (data.isEnabled) {
                chrome.tabs.sendMessage(tabId, {action: "readProblemStatementLeetcode"}, function(response) {
                    if (response && response.data) {
                        chrome.storage.local.set({currentProblem: response.data})
                        console.log('The current coding assesment the user is looking at:\n', response.data);
                    } else {
                        console.log('No response or no data available');
                    }
                });
        }
        })
    }
});

const tabUpdateIntervals = {};

function requestCurrentCode(tabId, selector) {
    chrome.tabs.sendMessage(tabId, {action: "fetchCurrentCode", selector: selector}, response => {
        if (response && response.text && response.language) {
            console.log('Received code:', response.text);
            chrome.storage.local.set({currentCode: response.text})
            console.log('Received language: ', response.language );
            chrome.storage.local.set({currentCodeLanguage: response.language})
        } else {
            console.log('Failed to fetch code or coding language or no data returned.');
        }
    });
}

chrome.runtime.onMessage.addListener(function(request, sender) {
    const tabId = sender.tab ? sender.tab.id : null;  // Correctly retrieving tabId from sender
    if (request.action === "startFetchingCode" && tabId) {
        fetchSessionID();
        // Ensure no duplicate intervals
        if (!tabUpdateIntervals[tabId]) {
            tabUpdateIntervals[tabId] = setInterval(() => {
                chrome.storage.local.get('isEnabled', function(data) {
                    if (data.isEnabled) {
                        const specificSelector = "#editor .view-lines.monaco-mouse-cursor-text"; // Update this selector as needed
                        requestCurrentCode(tabId, specificSelector);
                    }
                });
            }, 5000);  // Polling every 5 seconds
        }
    } else if (request.action === "stopFetchingCode" && tabId) {
        chrome.storage.local.get('sessionId', function(data) {
            if (data.sessionId) {
                endInterview(data.sessionId);
            }
        })
        // Clear interval when requested to stop fetching
        if (tabUpdateIntervals[tabId]) {
            clearInterval(tabUpdateIntervals[tabId]);
            delete tabUpdateIntervals[tabId];
        }
    }
});

// Clear interval when a tab is closed to avoid memory leaks
chrome.tabs.onRemoved.addListener(function(tabId) {
    chrome.storage.local.get('sessionId', function(data) {
        if (data.sessionId) {
            endInterview(data.sessionId);
        }})
    if (tabUpdateIntervals[tabId]) {
        clearInterval(tabUpdateIntervals[tabId]);
        delete tabUpdateIntervals[tabId];
    }
});

function fetchSessionID() {
    fetch('http://localhost:5001/ai/generateUUID', {
    method: 'GET',  // or 'POST' if applicable
    headers: {
        'Content-Type': 'application/json'
    }
})
.then(response => response.json())
.then(data => {chrome.storage.local.set({sessionId: data.sessionId}); startInterview(chrome.storage.local.get('codeLanguage'), chrome.storage.local.get('currentAssesmentDescription'), "raphaelchevallier@hotmail.com", data.sessionId)
.then(data => {
    // Handle data returned from the server
    if (data.startInterview) {
        console.log('Interview session has started successfully.');
    }
})
.catch(error => {
    // Handle any errors that occur during fetch
    console.log('Failed to start the interview:', error);
});})
.catch(error => console.error('Error:', error));
}

function startInterview(codeLanguage, currentAssesmentDescription, email, sessionId) {
    const url = 'http://localhost:5001/ai/startInterview';
    const postData = {
        codeLanguage: codeLanguage,
        currentAssesmentDescription: currentAssesmentDescription,
        email: email,
        sessionId: sessionId
    };

    return fetch(url, {
        method: 'POST',   // Specify the method
        headers: {
            'Content-Type': 'application/json'  // Set the headers content type
        },
        body: JSON.stringify(postData)  // Convert the JavaScript object to a JSON string
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();  // Parse JSON response into native JavaScript objects
    })
    .then(data => {
        console.log('Interview started:', data);
        return data;  // Return the data to be used by another function or variable
    })
    .catch(error => {
        console.error('Error starting interview:', error);
    });
}

function endInterview(sessionId) {
    const url = 'http://localhost:5001/ai/endInterview';
    const postData = {
        sessionId: sessionId
    };

    return fetch(url, {
        method: 'POST',   // Specify the method
        headers: {
            'Content-Type': 'application/json'  // Set the headers content type
        },
        body: JSON.stringify(postData)  // Convert the JavaScript object to a JSON string
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();  // Parse JSON response into native JavaScript objects
    })
    .then(data => {
        console.log('Interview ended:', data);
        return data;  // Return the data to be used by another function or variable
    })
    .catch(error => {
        console.error('Error ending interview:', error);
    });
}
