let assistantContainer = null;
let toggleHandle = null;
let closeButton = null;
let settingsButton = null; // Declare the settings button
let webcamVideo = null;
let stream = null;  // This will hold the stream object
let transcriptBox = null;
let micButton = null;
let audioStream = null;
let interviewing = false;
let micControl = null;
let startInterview = null;
let aiMuted = false;
let recognition = null;


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

    const logoImage = chrome.runtime.getURL('images/favicon-16x16.png');
    // Toggle handle
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
        background-size: 70%;
        background-position: center;
        background-repeat: no-repeat;
        cursor: pointer;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        transform: rotate(180deg);
        z-index: 1000;
    `;
    assistantContainer.appendChild(toggleHandle);

    // Close button
    closeButton = document.createElement('div');
    closeButton.innerText = 'X';
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
    closeButton.onclick = function() {
        toggleAssistantContainer();
    };
    assistantContainer.appendChild(closeButton);

    const settingImage = chrome.runtime.getURL('images/setting.png');

    // Settings button
    settingsButton = document.createElement('div');
    settingsButton.style.cssText = `
        position: absolute;
        top: 0px;
        left: 10px;
        font-size: 20px;
        cursor: pointer;
        color: black;
        display: flex;
        width: 30px;
        height: 30px;
        background-image: url('${settingImage}');
        background-size: 70%;
        background-position: center;
        background-repeat: no-repeat;
        align-items: center;
        justify-content: center;
        transition: transform 0.3s ease; 
    `;

    settingsButton.onmouseover = function() {
        this.style.transform = 'scale(1.2)';  // Enlarge by 5% on hover
    };
    settingsButton.onmouseout = function() {
        this.style.transform = 'scale(1)';  // Return to normal size when not hovering
    };
    settingsButton.onclick = function() {
        console.log('Settings clicked');
    };
    let settingsInterface = null; // This will hold the loaded settings interface

    settingsButton.onclick = function() {
        if (!settingsInterface) {
            import(chrome.runtime.getURL('settings.js'))
                .then((module) => {
                    showAllComponents(false);
                    // First time setup, create and append the settings UI
                    settingsInterface = module.setupSettingsUI();
                    assistantContainer.appendChild(settingsInterface);

                    // Setup the close button within the settings
                    document.getElementById('close-settings').onclick = function() {
                        toggleSettings(false); // Hide settings
                    };

                    toggleSettings(true); // Initially show settings
                })
                .catch(error => console.error('Error loading the settings module:', error));
        } else {
            showAllComponents(true);
            // Toggle the settings visibility if already loaded
            toggleSettings(settingsInterface.style.display === 'none');
        }
    };


    assistantContainer.appendChild(settingsButton);
    const robotImageURL = chrome.runtime.getURL('images/friendly_robot_head.webp');
    let imageBox = document.createElement('div');
    imageBox.id = "aiImageBox"
    imageBox.style.cssText = `
        width: 100%;
        height: 12vh;
        background-color: #000000; 
        margin-top: 25px;
        position: relative;
        margin-bottom: 10px;
        background-size: contain; 
        background-position: center;
        background-repeat: no-repeat;
    `;
    
    // Append the imageBox to the assistantContainer
    assistantContainer.appendChild(imageBox);

    const mutedImageURL = chrome.runtime.getURL('images/muteSpeaker.png');
    const unmutedImageURL = chrome.runtime.getURL('images/speaker-filled-audio-tool.png');
    
    let toggleAiMuteButton = document.createElement('button');
    toggleAiMuteButton.id = 'toggleAiMuteButton';
    toggleAiMuteButton.style.cssText = `
        position: absolute;
        bottom: 10px;
        right: 10px;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        background-size: 50%;
        background-repeat: no-repeat;
        background-position: center;
    `;
    let currentUtterance = null; 
    // Initialize the button with the appropriate image and background color
    function updateMuteButton() {
        if (aiMuted) {
            toggleAiMuteButton.style.backgroundColor = 'red'; // Red indicates muted
            toggleAiMuteButton.style.backgroundImage = `url('${mutedImageURL}')`;
        } else {
            toggleAiMuteButton.style.backgroundColor = 'green'; // Green indicates unmuted
            toggleAiMuteButton.style.backgroundImage = `url('${unmutedImageURL}')`;
        }
    
        // If already speaking, restart with a portion of text to simulate resuming
        if (window.speechSynthesis.speaking) {
            utteranceText = getResumeText(); // Get the approximate resume text
            speakText(utteranceText);
        }
    }
    
    // Mute/unmute via the toggle button
    toggleAiMuteButton.onclick = function () {
        aiMuted = !aiMuted;
        pausedDuration = Date.now() - startTime; // Record the elapsed time up to this point
        updateMuteButton();
    };
    
    // Update the button initially
    updateMuteButton();
    
    // Append the button to the imageBox
    imageBox.appendChild(toggleAiMuteButton);

    const webcamOnImageURL = chrome.runtime.getURL('images/webcam_on.png');
    const webcamOffImageURL = chrome.runtime.getURL('images/no-webcam.png');
    // Webcam box and video element
    let webcamBox = document.createElement('div');
    webcamBox.id = 'webcam-box';
    webcamBox.style.cssText = `
        width: 100%;
        height: 12vh;
        background-color: #ddd;
        display: flex;
        justify-content: center;
        align-items: center;
        background-image: url('${webcamOffImageURL}');
        background-size: 50%;
        background-position: center;
        background-repeat: no-repeat;
        position: relative;
        margin-top: 10px;
        margin-bottom: 15px;
    `;
    webcamVideo = document.createElement('video');
    webcamVideo.style.cssText = `
        width: 100%;
        height: 100%;
        margin-top: 10px;
        margin-bottom: 10px;
    `;
    webcamBox.appendChild(webcamVideo);
    assistantContainer.appendChild(webcamBox);

    // Toggle webcam button
    let toggleWebcamButton = document.createElement('button');
    toggleWebcamButton.id = 'toggleWebcamButton';
    toggleWebcamButton.style.cssText = `
        position: absolute;
        bottom: 10px;
        right: 10px;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background-image: url('${webcamOnImageURL}');
        background-size: 50%;
        background-position: center;
        background-repeat: no-repeat;
        background-color: green;
        border: none;
        cursor: pointer;
    `;
    toggleWebcamButton.onclick = function() {
        if (stream) {
            // Turn off the webcam
            stream.getTracks().forEach(track => track.stop());
            stream = null;
            webcamVideo.srcObject = null;
            webcamVideo.style.display = 'none';
            this.style.backgroundColor = 'green';
            webcamBox.style.backgroundImage = `url('${webcamOffImageURL}')`;
            webcamBox.style.backgroundRepeat = 'no-repeat';
            webcamBox.style.backgroundPosition = 'center';
            webcamBox.style.backgroundSize = 'cover';
            this.style.backgroundImage = `url('${webcamOffImageURL}')`;
        } else {
            // Turn on the webcam
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(function(newStream) {
                    stream = newStream;
                    webcamVideo.srcObject = stream;
                    webcamVideo.play();
                    webcamVideo.style.display = 'block';
                    webcamBox.style.backgroundImage = 'none';
                    toggleWebcamButton.style.backgroundColor = 'red';
                    toggleWebcamButton.style.backgroundImage = `url('${webcamOnImageURL}')`;
                })
                .catch(function(error) {
                    console.error("Error accessing the webcam: ", error);
                });
        }
    };
    webcamBox.appendChild(toggleWebcamButton);

    // Create the interview control bar
    startInterview = document.createElement('div');
    startInterview.id = 'startInterview';
    startInterview.style.cssText = `
        width: 100%;
        height: 25px;
        background-color: #90EE90;
        color: black;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border-radius: 5px;
        margin-top: 20px;
        margin-bottom: 10px;
        font-size: 14px;
        transition: background-color 0.3s;
    `;
    startInterview.textContent = 'Start Interview - 1 Hour'; // Initial text
    let interviewTimer = null;
    let remainingTime = 3600; // in seconds

startInterview.onclick = function() {
    if (!interviewing) {
        const messages = document.querySelectorAll('.transcript-message');
        messages.forEach(msg => msg.remove());
        chrome.runtime.sendMessage({action: "startFetchingCode"});
        interviewing = true;
        micControl.style.display = 'flex';
        micControl.style.backgroundColor = '#6495ED'; // Red when on
        micControl.textContent = 'Open Mic';
        startInterview.style.backgroundColor = 'grey'; // Grey when on
        startInterview.textContent = 'End Interview - Time: ' + formatTime(remainingTime);
        interviewTimer = setInterval(function() {
            remainingTime--;
            startInterview.textContent = 'End Interview - Time: ' + formatTime(remainingTime);
            if (remainingTime <= 0) {
                clearInterval(interviewTimer);
                endInterview();
            }
        }, 1000);
        imageBox.style.backgroundImage = `url('${robotImageURL}')`;
    } else {
        endInterview();
    }
};

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = seconds % 60;
    return [h, m > 9 ? m : (h ? '0' + m : m || '0'), s > 9 ? s : '0' + s].filter(Boolean).join(':');
}

function endInterview() {
    // Turn off the microphone
    chrome.runtime.sendMessage({action: "stopFetchingCode"});

    interviewing = false;
    if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        audioStream = null;
    }
    startInterview.style.backgroundColor = '#90EE90'; // Light green when off
    startInterview.textContent = 'Start Interview - 1 Hour';
    micControl.style.display = 'none';
    micControl.style.backgroundColor = '#6495ED'; // Grey when off
    micControl.textContent = 'Open Mic';
    clearInterval(interviewTimer);
    remainingTime = 3600; // reset timer
    imageBox.style.backgroundImage = 'none';
    imageBox.style.backgroundColor = '#000000';
    imageBox.style.border = "none";
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
    }
}
    assistantContainer.appendChild(startInterview); // Append it somewhere in the sidebar

    // Create the microphone control bar
    micControl = document.createElement('div');
    micControl.id = 'micControl';
    micControl.style.cssText = `
        width: 100%;
        height: 30px;
        background-color: #6495ED;
        color: black;
        display: none;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border-radius: 5px;
        margin-bottom: 10px;
        font-size: 14px;
        transition: background-color 0.3s;
    `;
    micControl.textContent = 'Open Mic'; // Initial text
    let micTimer = null;
    micControl.onclick = function () {
        if (audioStream) {
            // Turn off the microphone
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
            this.style.backgroundColor = '#6495ED'; // Grey when off
            this.textContent = 'Open Mic';
            clearTimeout(micTimer); // Stop the timer if mic is manually turned off
            if (recognition) recognition.stop(); // Stop recognition when mic is manually turned off
        } else {
            // Turn on the microphone
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(function (newStream) {
                    audioStream = newStream;
                    micControl.style.backgroundColor = 'red'; // Red when on
                    micControl.textContent = 'Mute Mic';
    
                    // Cancel speech synthesis if it's speaking
                    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
                        window.speechSynthesis.cancel();
                        imageBox.style.border = "none";
                    }
    
                    // Start speech recognition
                    if (recognition) recognition.start();
    
                    // Set a 10-second timer to automatically mute the mic
                    micTimer = setTimeout(function () {
                        if (audioStream) {
                            audioStream.getTracks().forEach(track => track.stop());
                            audioStream = null;
                            micControl.style.backgroundColor = '#6495ED'; // Grey when off
                            micControl.textContent = 'Open Mic';
                        }
                        if (recognition) recognition.stop(); // Stop recognition after the timer ends
                    }, 10000); // 10,000 milliseconds = 10 seconds
                })
                .catch(function (error) {
                    console.error("Error accessing the microphone: ", error);
                });
        }
    };
    
    assistantContainer.appendChild(micControl); // Append it somewhere in the sidebar

    // Main container for the transcript box
let transcriptBox = document.createElement('div');
transcriptBox.id = 'transcript-box';
transcriptBox.style.cssText = `
    width: 100%;
    background-color: #f0f0f0;
    box-sizing: border-box;
    border: 1px solid #ccc;
    margin-top: 10px;
`;

// Header for the transcript box
let transcriptHeader = document.createElement('div');
transcriptHeader.style.cssText = `
    padding: 5px 10px;
    font-size: 16px;
    font-weight: bold;
    border-bottom: 1px solid #ccc;
    color: #333;
`;
transcriptHeader.textContent = 'Transcript';

// Append the header to the transcript box
transcriptBox.appendChild(transcriptHeader);

// Scrollable container for messages
let scrollableContainer = document.createElement('div');
scrollableContainer.style.cssText = `
    width: 100%;
    max-height: 58vh;
    height: 55vh;
    overflow-y: scroll;
    box-sizing: border-box;
`;

// Append the scrollable container to the transcript box
transcriptBox.appendChild(scrollableContainer);

let resizeHandle = document.createElement('div');
resizeHandle.style.cssText = `
    position: absolute;
    right: 0;
    top: 0;
    width: 2px;
    height: 100%;
    cursor: ew-resize;
    background-color: #aaa; // Give it a slight visibility
`;
assistantContainer.appendChild(resizeHandle);

let isResizing = false;
let lastDownX = 0;

resizeHandle.addEventListener('mousedown', function(e) {
    isResizing = true;
    lastDownX = e.clientX;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
});

function onMouseMove(e) {
    if (!isResizing) return;

    let offsetRight = document.body.clientWidth - (e.clientX - assistantContainer.getBoundingClientRect().left);
    let newWidth = document.body.clientWidth - offsetRight;
    let maxWidth = window.innerWidth / 4;  // Calculate 1/4th of the screen width

    // Respect the minimum width and dynamic maximum width boundaries
    if (newWidth < 225) newWidth = 225;
    if (newWidth > maxWidth) newWidth = maxWidth;

    assistantContainer.style.width = newWidth + 'px';
    document.body.style.paddingLeft = newWidth + 'px';  // Adjust body padding to avoid content overlap
}

window.addEventListener('resize', function() {
    let currentWidth = parseInt(assistantContainer.style.width, 10);
    let maxWidth = window.innerWidth / 4;

    if (currentWidth > maxWidth) {
        assistantContainer.style.width = maxWidth + 'px';
        document.body.style.paddingLeft = maxWidth + 'px';
    }
});

function onMouseUp(e) {
    // Stop resizing when the user releases the mouse button
    isResizing = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
}

// Listening to messages and adding content to the scrollable container
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === "displayTranscript" && message.transcript) {
        addTranscriptMessage(message.transcript)
        speakText(message.transcript);
    }
});

function addTranscriptMessage(text) {
    const transcriptContent = document.createElement('div');
    transcriptContent.className = 'transcript-message';
    transcriptContent.style.cssText = `
        font-size: 10px;
        color: #000;
        margin-bottom: 2px;
    `;
    transcriptContent.textContent = text;
    scrollableContainer.appendChild(transcriptContent);
}

    
    // Add the transcript box to the sidebar
    assistantContainer.appendChild(transcriptBox);

    document.body.style.transition = 'padding-left 0.5s';
    document.body.style.overflowX = 'hidden';

    toggleHandle.addEventListener('click', function() {
        toggleAssistantContainer();
    });

    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.action === "toggleAssistant") {
            toggleAssistantContainer();
        }
    });

    function toggleSettings(displayStatus) {
        if (!settingsInterface) {
            settingsInterface = setupSettingsUI();
            assistantContainer.appendChild(settingsInterface);
            document.getElementById('close-settings').onclick = function() {
                showAllComponents(true);
                toggleSettings(false); // Setup close button on first use
            };
        }
        settingsInterface.style.display = displayStatus ? 'block' : 'none';
    }

    function readCodeAssesmentFromPageLeetcode() {
        let header = document.querySelector("div.flex.w-full.flex-1.flex-col.gap-4.overflow-y-auto.px-4.py-5 > div.flex.items-start.justify-between.gap-4").innerText;  // Simple example to get all text
        let mainProblem = document.querySelector("div.flex.w-full.flex-1.flex-col.gap-4.overflow-y-auto.px-4.py-5 > div.elfjS").innerText;
        let possibleUsefulDataStructuresAndAlgorithms = document.querySelector("div.flex.w-full.flex-1.flex-col.gap-4.overflow-y-auto.px-4.py-5 > div.mt-6.flex.flex-col.gap-3 > div:nth-child(5) > div > div.overflow-hidden.transition-all > div").innerText;
        let similarQuestions = document.querySelector("div.flex.w-full.flex-1.flex-col.gap-4.overflow-y-auto.px-4.py-5 > div.mt-6.flex.flex-col.gap-3 > div.flex.flex-col > div.overflow-hidden.transition-all").innerText;
        return header + "\n\nMain Problem Desicription:\n" + mainProblem + "\n\nPossible Topics Used to Solve:\n" + possibleUsefulDataStructuresAndAlgorithms + "\n\nSimilar Questions:\n" + similarQuestions;
    }

    function readCodeLanguageForAssesment(){
        const button = document.querySelector("#headlessui-popover-button-\\:r1d\\: > div > button");
        return button.innerText;
    }

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === "readProblemStatementLeetcode") {
            observeChangesLeetcode(sendResponse);
            return true;
        }
    });

    function fetchCurrentCode(selector) {
        console.log(selector)
        const elements = Array.from(document.querySelectorAll(selector + '> div'));
        if (elements.length === 0) {
            return 'Element not found or no content.';
        }
        
        // Extracting the top value and sorting by it
        const sortedElements = elements.map(element => {
            const style = window.getComputedStyle(element);
            const top = parseInt(style.top, 10);
            return { element, top };
        }).sort((a, b) => a.top - b.top);
    
        // Concatenating sorted text content
        const text = sortedElements.map(item => item.element.innerText).join('\n');
        return text;
    }
    
    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === "fetchCurrentCode") {
            const code = fetchCurrentCode(request.selector);
            const codeLanguage = readCodeLanguageForAssesment();
            sendResponse({text: code, language: codeLanguage});
            return true;  // Indicates that you wish to send a response asynchronously
        }
    });
    
    function observeChangesLeetcode(sendResponse) {
        const targetNode = document.querySelector("div.flex.w-full.flex-1.flex-col.gap-4.overflow-y-auto.px-4.py-5");
        const config = { childList: true, subtree: true };
    
        const observer = new MutationObserver((mutationsList, observer) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    let text = readCodeAssesmentFromPageLeetcode();
                    if (text) {
                        observer.disconnect(); // Stop observing once the element is available
                        sendResponse({data: text});
                    }
                }
            }
        });
    
        observer.observe(targetNode, config);
    }

    function showAllComponents(show) {
        const displayStyle = show ? 'block' : 'none';
        toggleHandle.style.display = displayStyle;
        closeButton.style.display = displayStyle;
        webcamBox.style.display = displayStyle;
        micControl.style.display = show ? 'flex' : 'none'; // because micControl uses flex
        transcriptBox.style.display = displayStyle;
        imageBox.style.display = displayStyle;
        settingsButton.style.display = show ? 'flex' : 'none'; // Keep settings button visible only when settings are not visible
    }
    
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.action === "toggleExtension") {
            closeToggleAssistantVisibility(message.enabled);
        }
    });
    
    function closeToggleAssistantVisibility(isEnabled) {
        if (isEnabled) {
            assistantContainer.style.display = 'block'; // Show the assistant
            toggleHandle.style.display = 'block'
        } else {
            assistantContainer.style.display = 'none'; // Hide the assistant
            document.body.style.paddingLeft = '0';
            assistantContainer.style.left = '-225px';
            toggleHandle.style.display = 'none';
            // Ensure to turn off any active streams or interactions
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
                webcamVideo.srcObject = null;
                webcamVideo.style.display = 'none';
                if (document.querySelector('#toggleWebcamButton')) {
                    document.querySelector('#toggleWebcamButton').style.backgroundColor = 'green';
                }
            }
            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
                audioStream = null;
                if (micControl) {
                    micControl.style.backgroundColor = '#6495ED'; // Grey when off
                    micControl.textContent = 'Open Mic';
                }
            }
        }
    }

    function getResumeText() {
        const elapsedTime = Date.now() - startTime + pausedDuration; // Time passed since the utterance started
        const wordsPerSecond = 2.5; // Approximate words per second, adjust this value for accuracy
        const wordsElapsed = Math.floor(wordsPerSecond * (elapsedTime / 1000)); // Approximate words spoken so far
    
        // Split text by spaces to count the words
        const words = utteranceText.split(' ');
    
        // Handle cases where it tries to resume beyond the available text
        return words.slice(wordsElapsed).join(' ') || utteranceText;
    }
    function speakText(text) {
        const imageBox = document.getElementById('aiImageBox');
        utteranceText = text; // Store the text for possible restart
        startTime = Date.now(); // Mark the starting time
    
        if ('speechSynthesis' in window) {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel(); // Stop ongoing speech
            }
    
            // Create a new utterance object
            currentUtterance = new SpeechSynthesisUtterance(utteranceText);
            currentUtterance.voice = speechSynthesis.getVoices().find(voice => voice.lang === "en-US");
            currentUtterance.pitch = 1;
            currentUtterance.rate = 1;
            currentUtterance.volume = aiMuted ? 0 : 1;
    
            // Add a green border when speech starts
            currentUtterance.onstart = function () {
                imageBox.style.border = "3px solid green";
            };
    
            // Remove the border after speech ends
            currentUtterance.onend = function () {
                imageBox.style.border = "none";
            };
    
            // Speak the current utterance
            window.speechSynthesis.speak(currentUtterance);
        } else {
            console.log("Sorry, your browser does not support text-to-speech!");
        }
    }
    
    function initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            recognition = new webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = "en-US";
    
            recognition.onresult = function (event) {
                const transcriptText = event.results[0][0].transcript;
                console.log("Recognized text:", transcriptText);
                addTranscriptMessage(transcriptText);
            };
    
            recognition.onerror = function (event) {
                console.error("Speech recognition error:", event.error, event.message || '');
            };
    
            recognition.onstart = function () {
                console.log("Speech recognition started");
            };
    
            recognition.onend = function () {
                console.log("Speech recognition stopped");
            };
        } else {
            console.log("Speech recognition not supported in this browser.");
        }
    }
    
    
    initializeSpeechRecognition();

    function toggleAssistantContainer() {
        let currentWidth = assistantContainer.offsetWidth; // Get the current width of the sidebar
    
        // Check if the sidebar is hidden (considering it might be the initial state or closed)
        if (assistantContainer.style.left === '-225px' || assistantContainer.style.left === '' || parseInt(assistantContainer.style.left, 10) < 0) {
            // Slide in the sidebar
            assistantContainer.style.left = '0px'; // Bring the sidebar into view
            document.body.style.paddingLeft = currentWidth + 'px'; // Adjust the padding of the body
            toggleHandle.style.display = 'none'; // Hide the toggle handle
        } else {
            // Slide out the sidebar
            assistantContainer.style.left = '-' + currentWidth + 'px'; // Slide out using the current width
            document.body.style.paddingLeft = '0'; // Reset the body padding
            toggleHandle.style.display = 'block'; // Show the toggle handle
    
            // Turn off the webcam when the sidebar slides out
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
                webcamVideo.srcObject = null;
                webcamVideo.style.display = 'none';
                webcamBox.style.backgroundImage = "url('no-webcam.png')";
                webcamBox.style.backgroundRepeat = 'no-repeat';
                webcamBox.style.backgroundPosition = 'center';
                webcamBox.style.backgroundSize = 'cover';
                document.querySelector('#toggleWebcamButton').style.backgroundColor = 'green';
            }
    
            // Turn off the microphone
            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
                audioStream = null;
                micControl.style.backgroundColor = '#6495ED'; // Set to grey when off
                micControl.textContent = 'Open Mic';
            }
        }
    }
    
    
    
};
