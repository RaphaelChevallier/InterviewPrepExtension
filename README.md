# AI Mock Interview Assistant (Chrome Extension)

## Overview
This Chrome Extension creates an AI-powered mock interviewer that helps you practice coding problems on platforms like LeetCode. It provides real-time feedback, code analysis, and interactive features to simulate a real technical interview experience.

## 🌟 Key Features

### 1. Interactive AI Assistant
- **Real-time Code Analysis**: Monitors your code as you type and provides feedback
- **Voice Interaction**: Supports both text-to-speech and speech-to-text for natural conversation
- **Adaptive Feedback**: The AI adjusts its responses based on your code and approach

### 2. User Interface
- **Collapsible Sidebar**: A sleek, resizable sidebar that can be toggled on/off
- **Webcam Support**: Optional webcam integration to simulate face-to-face interviews
- **Live Transcript**: Real-time display of the conversation between you and the AI

### 3. Session Management
- **Timed Sessions**: 1-hour interview sessions with countdown timer
- **Progress Tracking**: Maintains context of your coding session
- **Language Detection**: Automatically detects the programming language you're using

## 🔧 Technical Architecture

### Frontend (Chrome Extension)
- **Background Script** (`background.js`): Manages state, handles API calls, and coordinates between components
- **Content Script** (`content.js`): Interacts with the webpage, captures code changes, and manages UI
- **Settings** (`settings.js`): Handles user preferences and configuration
- **UI Components**: Custom-built sidebar with webcam, microphone, and transcript display

### Backend Integration
This extension works with the [Gemini_LLM_Backend](https://github.com/RaphaelChevallier/Gemini_LLM_Backend) repository, which:
- Processes code analysis requests
- Generates AI responses using Google's Gemini model
- Manages interview sessions and user data
- Provides RESTful API endpoints for the extension

## 🚀 How It Works

1. **Session Start**
   - User opens a LeetCode problem
   - Extension detects the problem and initializes an interview session
   - AI introduces itself and sets the context

2. **During Interview**
   - Extension monitors code changes every 5 seconds
   - AI provides feedback every 20 seconds (if needed)
   - User can toggle microphone for voice interaction
   - All conversation is transcribed in the sidebar

3. **AI Analysis**
   - Code is sent to backend for analysis
   - Problem description and context are considered
   - AI generates personalized feedback and hints
   - Responses are both displayed and spoken (if enabled)

## 🔌 API Endpoints Used

The extension communicates with these backend endpoints:
- `/ai/generateUUID`: Creates new session IDs
- `/ai/startInterview`: Initializes interview sessions
- `/ai/getAdvice`: Requests AI feedback on code
- `/ai/endInterview`: Closes interview sessions

## 🛠️ Setup and Installation

1. Clone this repository
2. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory

3. Ensure the [Gemini_LLM_Backend](https://github.com/RaphaelChevallier/Gemini_LLM_Backend) is running locally
   - Default backend URL: `http://localhost:5001`

## 💡 Usage Tips

- Click the extension icon to toggle the sidebar
- Use the microphone for voice interaction (10-second auto-shutoff)
- Resize the sidebar by dragging the right edge
- Settings can be accessed via the gear icon
- Green border around AI avatar indicates it's speaking

## 🔒 Privacy Note

The extension requires these permissions:
- `activeTab`: To read code from the editor
- `storage`: To save session data
- `audioCapture`: For voice interaction
- `videoCapture`: For webcam support
- `identity`: For user authentication