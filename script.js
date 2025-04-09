// 检查浏览器支持
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
  alert("你的浏览器不支持 SpeechRecognition，请使用 Chrome"+"Your browser doesn't support SpeechRecognition. Please use Chrome.");
}

const resultSpan = document.getElementById('result')
// const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
// recognition.lang = 'zh-CN'; // 默认中文，可切换为 'en-US'
// recognition.interimResults = false;
let currentLang = 'zh-CN'; // 默认中文，可切换为 'en-US'
let commands = [];
let voices = [];
let isAwake = false;
let wakeWords = [];

// 🔄 Load available voices for speech synthesis
window.speechSynthesis.onvoiceschanged = () => {
  voices = window.speechSynthesis.getVoices();
};

// 🌐 Wake word listener setup
const wakeRecognition = new SpeechRecognition();
wakeRecognition.continuous = true;
wakeRecognition.interimResults = false;
wakeRecognition.lang = 'en-US';

wakeRecognition.onresult = (event) => {
  const text = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
  console.log("Wake heard:", text);
  if (wakeWords.some(word => text.includes(word))) {
    isAwake = true;
    speak("I'm listening...");
    recognition.start();
  }
};

wakeRecognition.onerror = (e) => {
  console.warn("Wake error:", e.error);
  wakeRecognition.stop();
  setTimeout(() => wakeRecognition.start(), 1000);
};

wakeRecognition.onend = () => {
  if (!isAwake) setTimeout(() => wakeRecognition.start(), 500);
};

window.onload = () => wakeRecognition.start();

// 🎙️ Main recognizer for actual commands
const recognition = new SpeechRecognition();
recognition.lang = currentLang;
recognition.interimResults = false;

recognition.onerror = (event) => {
  console.warn('Recognition error:', event.error);
};

// 🌐 Load commands.json
fetch('commands.json')
  .then(res => res.json())
  .then(data => {
    commands = data;
    populateCommandList();
    const wakeItem = commands.find(cmd => cmd.action === 'wake');
    if (wakeItem) wakeWords = wakeItem.trigger.map(t => t.toLowerCase());
  });

// 📌 UI Event Listeners
document.getElementById('langSwitch').onclick = () => {
  currentLang = currentLang === 'zh-CN' ? 'en-US' : 'zh-CN';
  recognition.lang = currentLang;
  alert("当前语言已切换为：" + currentLang);
};

document.getElementById('startBtn').onclick = () => {
  recognition.start();
};

recognition.onresult = (event) => {
  const text = event.results[0][0].transcript.trim();
  document.getElementById('result').textContent = text;
  matchCommand(text);
};

document.getElementById('toggleHelpBtn').onclick = () => {
  const section = document.getElementById('helpSection');
  section.style.display = section.style.display === 'none' ? 'block' : 'none';
};

// 📜 Populate command list
function populateCommandList() {
  const ul = document.getElementById('commandList');
  ul.innerHTML = ''; // Clear previous entries

  commands.forEach(cmd => {
    if (cmd.action === 'wake') return; // Don't list wake command
    const zh = cmd.trigger.find(t => /[\u4e00-\u9fa5]/.test(t)) || '';
    const en = cmd.trigger.find(t => /^[a-zA-Z]/.test(t)) || '';

    const li = document.createElement('li');
    li.textContent = `${zh ? '☑️ ' + zh : ''} ${en ? '/ ' + en : ''}`;
    ul.appendChild(li);
  });
}

// 🔎 Command Matching
function matchCommand(input) {
  const lower = input.toLowerCase();

  for (let cmd of commands) {
    if (cmd.trigger.some(t => lower.includes(t))) {
      runAction(cmd);
      return;
    }
  }
  //speak("我还听不懂这个命令哦");
  speak(input); // 重复朗读识别的文本
}

function runAction(cmd) {
  const reply = typeof cmd.reply === 'string' ? cmd.reply : (cmd.reply[currentLang] || cmd.reply['zh-CN']);

  switch (cmd.action) {
    case "changeBackground":
      document.body.style.backgroundColor = cmd.params.color || "white";
      break;

    case "showMessage":
      const textParam = typeof cmd.params.text === 'string'
        ? cmd.params.text
        : (cmd.params.text[currentLang] || cmd.params.text['zh-CN']);
      document.getElementById("message").innerText = textParam || "";
      break;

    case "reset":
      document.body.style.backgroundColor = "white";
      document.getElementById("message").innerText = "";
      break;
  }
  // 其他动作可以在这里添加
  speak(reply || "命令已执行");
}

// 🔊 Speak function
function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = currentLang;
  const selectedVoice = voices.find(v => v.lang === currentLang);
  if (selectedVoice) msg.voice = selectedVoice;
  window.speechSynthesis.speak(msg);
}


recognition.onerror = (event) => {
  resultSpan.textContent = '识别出错/Error: ' + event.error;
};

