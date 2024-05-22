// background.js
// Initialize or check current state when the extension loads
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get('isEnabled', function(data) {
        if (data.isEnabled === undefined) {
            // Set default state to enabled when first installed
            chrome.storage.local.set({isEnabled: true});
            console.log("Extension installed, setting isEnabled to true");
        } else {
            console.log("Extension installed, current isEnabled state:", data.isEnabled);
        }
    });
});

chrome.action.onClicked.addListener(function(tab) {
    chrome.storage.local.get('isEnabled', function(data) {
        // Toggle the enabled state
        var newState = !data.isEnabled;
        chrome.storage.local.set({isEnabled: newState}, function() {
            console.log("Toggled isEnabled to", newState);
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
    console.log('Requesting current code with selector:', selector);
    chrome.tabs.sendMessage(tabId, {action: "fetchCurrentCode", selector: selector}, response => {
        console.log(response)
        if (response) {
            if (response.text) {
                console.log('Received code:', response.text);
                chrome.storage.local.set({currentCode: response.text});
            }
            if (response.language) {
                console.log('Received language:', response.language);
                chrome.storage.local.set({currentCodeLanguage: response.language});
            }
            if (response.error) {
                console.error('Error response:', response.error);
            }
        } else {
            console.log('Failed to fetch code or coding language or no data returned.');
        }
    });
}

chrome.runtime.onMessage.addListener(function(request, sender) {
    const tabId = sender.tab ? sender.tab.id : null;
    if (request.action === "startFetchingCode" && tabId) {
        chrome.storage.local.get(['currentCodeLanguage', 'currentProblem'], async function(data) {
            console.log(data)
            if (data.currentCodeLanguage && data.currentProblem) {
                let response = await fetchSessionID(data.currentCodeLanguage, data.currentProblem);
                chrome.tabs.sendMessage(tabId, {action: "displayTranscript", transcript: response});
            }})
        // Initialize interval object for this tab if it doesn't exist
        if (!tabUpdateIntervals[tabId]) {
            tabUpdateIntervals[tabId] = {};
        }
        
        // First interval for fetching session ID and other details
        if (!tabUpdateIntervals[tabId].fetchSession) {
            tabUpdateIntervals[tabId].fetchSession = setInterval(() => {
                chrome.storage.local.get('isEnabled', function(data) {
                    if (data.isEnabled) { 
                        const specificSelector = "div.view-line"; // Update this selector as needed
                        requestCurrentCode(tabId, specificSelector);
                    }
                });
            }, 5000);  // Polling every 5 seconds
        }

        // Second interval for getting advice
        if (!tabUpdateIntervals[tabId].getAdvice) {
            tabUpdateIntervals[tabId].getAdvice = setInterval(async () => {
                chrome.storage.local.get(['isEnabled', 'sessionId', 'currentProblem', 'currentCode', 'currentCodeLanguage'], async function(data) {
                    if (data.isEnabled && data.sessionId) {
                        let response = await getAdvice(data.currentCodeLanguage, data.currentProblem, "raphaelchevallier@hotmail.com", data.currentCode, data.sessionId);
                        chrome.tabs.sendMessage(tabId, {action: "displayTranscript", transcript: response});
                    }
                });
            }, 200000);  // Polling every 20 seconds
        }
    } else if (request.action === "stopFetchingCode" && tabId) {
        // Clear specific intervals when requested to stop fetching
        if (tabUpdateIntervals[tabId]) {
            if (tabUpdateIntervals[tabId].fetchSession) {
                clearInterval(tabUpdateIntervals[tabId].fetchSession);
                delete tabUpdateIntervals[tabId].fetchSession;
            }
            if (tabUpdateIntervals[tabId].getAdvice) {
                clearInterval(tabUpdateIntervals[tabId].getAdvice);
                delete tabUpdateIntervals[tabId].getAdvice;
            }

            // If no more intervals are present, remove the tab from the object
            if (Object.keys(tabUpdateIntervals[tabId]).length === 0) {
                delete tabUpdateIntervals[tabId];
            }
        }
        chrome.storage.local.get('sessionId', function(data) {
            if (data.sessionId) {
                endInterview(data.sessionId);
            }})
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

async function fetchSessionID(codeLanguage, currentAssesmentDescription) {
    try {
        const response = await fetch('http://localhost:5001/ai/generateUUID', {
            method: 'GET',  // or 'POST' if applicable
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        await chrome.storage.local.set({sessionId: data.sessionId});
        const interviewResponse = await startInterview(codeLanguage, currentAssesmentDescription, "raphaelchevallier@hotmail.com", data.sessionId);

        if (interviewResponse.startInterview) {
            console.log('Interview session has started successfully.');
            return interviewResponse.AIMessage;
        } else {
            throw new Error('Interview session failed to start');
        }
    } catch (error) {
        console.error('Error in fetchSessionID:', error);
        throw error;  // Rethrow the error so it can be caught by the caller
    }
}

async function getAdvice(codeLanguage, currentAssesmentDescription, email, currentCode, sessionId) {
    const url = 'http://localhost:5001/ai/getAdvice';
    const postData = {
        codeLanguage: codeLanguage,
        currentAssesmentDescription: currentAssesmentDescription,
        currentCode: currentCode,
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
        return data.AIMessage;  // Return the data to be used by another function or variable
    })
    .catch(error => {
        console.error('Error starting interview:', error);
    });
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
