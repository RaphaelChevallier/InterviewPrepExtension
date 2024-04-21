let assistantContainer = null;
let toggleHandle = null;
let closeButton = null;
let settingsButton = null; // Declare the settings button
let webcamVideo = null;
let stream = null;  // This will hold the stream object
let transcriptBox = null;
let micButton = null;
let audioStream = null;
let micControl = null;

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

    // Settings button
    settingsButton = document.createElement('div');
    settingsButton.innerHTML = '&#9881;'; // HTML entity for the cog symbol
    settingsButton.style.cssText = `
        position: absolute;
        top: 0px;
        left: 10px;
        font-size: 20px;
        cursor: pointer;
        color: black;
        display: flex;
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
            // Toggle the settings visibility if already loaded
            toggleSettings(settingsInterface.style.display === 'none');
        }
    };


    assistantContainer.appendChild(settingsButton);

    // Image box
    let imageBox = document.createElement('div');
    imageBox.style.cssText = `
        width: 100%;
        height: 120px;
        background-color: #000000;
        margin-top: 25px;
        margin-bottom: 10px;
    `;
    assistantContainer.appendChild(imageBox);

    // Webcam box and video element
    let webcamBox = document.createElement('div');
    webcamBox.id = 'webcam-box';
    webcamBox.style.cssText = `
        width: 100%;
        height: 120px;
        background-color: #ddd;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        margin-top: 10px;
        margin-bottom: 15px;
    `;
    webcamVideo = document.createElement('video');
    webcamVideo.style.cssText = `
        width: 100%;
        height: auto;
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
            webcamBox.style.backgroundImage = "url('no-webcam.png')";
            webcamBox.style.backgroundRepeat = 'no-repeat';
            webcamBox.style.backgroundPosition = 'center';
            webcamBox.style.backgroundSize = 'cover';
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
                })
                .catch(function(error) {
                    console.error("Error accessing the webcam: ", error);
                });
        }
    };
    webcamBox.appendChild(toggleWebcamButton);

    // Create the microphone control bar
    micControl = document.createElement('div');
    micControl.id = 'micControl';
    micControl.style.cssText = `
        width: 100%;
        height: 30px;
        background-color: #6495ED;
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
    micControl.textContent = 'Open Mic'; // Initial text
    micControl.onclick = function() {
        if (audioStream) {
            // Turn off the microphone
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
            this.style.backgroundColor = '#6495ED'; // Grey when off
            this.textContent = 'Open Mic';
        } else {
            // Turn on the microphone
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(function(newStream) {
                    audioStream = newStream;
                    micControl.style.backgroundColor = 'red'; // Red when on
                    micControl.textContent = 'Mute Mic';
                })
                .catch(function(error) {
                    console.error("Error accessing the microphone: ", error);
                });
        }
    };
    assistantContainer.appendChild(micControl); // Append it somewhere in the sidebar

    let transcriptBox = document.createElement('div');
    transcriptBox.id = 'transcript-box';
    transcriptBox.style.cssText = `
        width: 100%;
        height: 150px;  // Set a fixed height
        background-color: #f0f0f0;  // Light grey background for visibility
        overflow-y: scroll;  // Enable vertical scrolling
        box-sizing: border-box;
        border: 1px solid #ccc;  // Add a subtle border
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
    
    // Content area below the header for actual transcript text
    let transcriptContent = document.createElement('div');
    transcriptContent.style.cssText = `
        height: calc(100% - 33px);  // Subtract the height of the header
        overflow-y: auto;
        padding: 8px;
        font-size: 14px;
    `;
    transcriptContent.textContent = '';  // Initially empty
    
    // Append the content area to the transcript box
    transcriptBox.appendChild(transcriptContent);
    
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
                toggleSettings(false); // Setup close button on first use
            };
        }
        settingsInterface.style.display = displayStatus ? 'block' : 'none';
    }

    function toggleAssistantContainer() {
        if (assistantContainer.style.left === '-225px') {
            // Slide in the sidebar
            assistantContainer.style.left = '0px';
            document.body.style.paddingLeft = '225px';
            toggleHandle.style.display = 'none';
            // Do not automatically turn on the webcam when the sidebar slides in
        } else {
            // Slide out the sidebar
            assistantContainer.style.left = '-225px';
            document.body.style.paddingLeft = '0';
            toggleHandle.style.display = 'block';
            // Automatically turn off the webcam when the sidebar slides out
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
            if (audioStream) {
                // Turn off the microphone
                audioStream.getTracks().forEach(track => track.stop());
                audioStream = null;
                micControl.style.backgroundColor = '#6495ED'; // Grey when off
                micControl.textContent = 'Open Mic';
            }
        }
    }
    
};
