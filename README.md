# 🎤 Multilingual Voice Command Web Demo

A browser-based voice assistant demo that supports both Chinese and English voice commands using the Web Speech API.

---

## 📦 Project Overview

This is a lightweight voice-controlled web application that uses **native browser APIs** to recognize speech and respond with speech synthesis.

Users can speak commands in either **Mandarin Chinese or English**, and the app responds with appropriate actions such as:

- Changing the background color
- Showing a welcome message
- Resetting the interface

Command definitions and spoken replies are managed externally via `commands.json`, making it easy to expand and customize.

---

## ✨ Features

- 🎙️ Voice Recognition (SpeechRecognition)
- 🗣️ Text-to-Speech (SpeechSynthesis)
- 🌐 Supports both English and Chinese
- 📁 Commands loaded from external JSON
- 📋 Expandable command list with toggle
- 💡 No backend required — runs in browser

---

## 🚀 How to Run

### Option 1: Open in Browser (for testing)

Just open `index.html` in a modern browser (preferably Chrome).  
⚠️ For microphone access, use `localhost` or a live server — `file://` access may cause permission dialogs every time.

### Option 2: Run with Live Server (recommended)

1. Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) in VS Code
2. Open the project folder in VS Code
3. Right-click `index.html` → **Open with Live Server**

---

## 📂 Project Structure
voice-command-demo/ <br />
  ├── index.html # Main page <br />
  ├── script.js # Speech logic <br />
  ├── commands.json # External command list <br />
  ├── README.md <br />
  └── .gitignore <br />

---

## 🗒️ Example Voice Commands

| Chinese | English |
|---------|---------|
| 变成蓝色 | Change background to blue |
| 显示欢迎 | Show welcome message |
| 重置 | Reset |

> You can say these phrases and the assistant will respond accordingly — in the correct language and with a spoken reply.

---

## 🔧 Configuration (commands.json)

Commands are defined in `commands.json` using the following structure:

```json
{
  "trigger": ["change background to blue", "变成蓝色"],
  "action": "changeBackground",
  "params": { "color": "#cce5ff" },
  "reply": {
    "en-US": "Background changed to blue",
    "zh-CN": "背景已变成蓝色"
  }
}
