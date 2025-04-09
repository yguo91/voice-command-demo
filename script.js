// 检查浏览器支持
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
  alert("你的浏览器不支持 SpeechRecognition，请使用 Chrome"+"Your browser doesn't support SpeechRecognition. Please use Chrome.");
}

const resultSpan = document.getElementById('result');
const statusSpan = document.getElementById('status');

// global variables
let currentLang = 'zh-CN'; // 默认中文，可切换为 'en-US'
let commands = [];
let voices = [];
let isAwake = false;
let wakeWords = [];
let conversationTimeout; // 用于设置对话超时

// 🔄 Load available voices for speech synthesis
window.speechSynthesis.onvoiceschanged = () => {
  voices = window.speechSynthesis.getVoices();
};

// 🌐 Wake word listener setup
const wakeRecognition = new SpeechRecognition();
wakeRecognition.continuous = true;
wakeRecognition.interimResults = false;
wakeRecognition.lang = 'zh-CN'; // 语言设置为中文

wakeRecognition.onresult = (event) => {
  const text = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
  console.log("[DEBUG] Wake heard:", text);

  // Check if the recognized text matches any of the wake words
  const escapedWords = wakeWords.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
  const wakePattern = new RegExp(`(${escapedWords.join('|')})`, 'i');
  
  if (wakePattern.test(text)) {
    console.log("[DEBUG] Wake word successfully recognized");
    isAwake = true;
    updateStatus("🟢 Awake");
    resetConversationTimeout();
    
    wakeRecognition.stop();
    speak(currentLang === 'zh-CN' ? "请说" : "Please speak").then(() => {
      recognition.lang = currentLang; // 动态设置主识别器语言
      recognition.start();
    });
  }
};

wakeRecognition.onerror = (e) => {
  console.warn("Wake error:", e.error);
  if (e.error === 'not-allowed') {
    speak(currentLang === 'zh-CN' ? "需要麦克风权限" : "Microphone access required");
  }
  setTimeout(() => wakeRecognition.start(), 2000);
};

wakeRecognition.onend = () => {
  if (!isAwake) {
    updateStatus("💤 Sleep");
    setTimeout(() => wakeRecognition.start(), 500);
  }
};

// 🎙️ Main recognizer for actual commands
const recognition = new SpeechRecognition();
// 关键配置项
recognition.continuous = false;    // 单次识别模式（必须设置）
recognition.interimResults = false; // 不返回临时结果
recognition.maxAlternatives = 1;   // 只返回1个识别结果
recognition.lang = currentLang;    // 动态语言设置（重要！）

recognition.onresult = (event) => {
  clearTimeout(conversationTimeout);
  const text = event.results[0][0].transcript.trim();
  resultSpan.textContent = text;
  matchCommand(text);
  resetConversationTimeout();
};

// 在主识别器中添加状态跟踪
recognition.onstart = () => {
  console.log('[主识别器] 开始工作');
  isAwake = true;
};

recognition.onend = () => {
  console.log('[主识别器] 结束工作');
  if (isAwake) {
    // speak(currentLang === 'zh-CN' ? "等待下一个指令" : "Waiting for next command").then(() => {
      speak("").then(() => {
      isAwake = false;
      updateStatus("💤 Sleep");
      wakeRecognition.start();
    });
  }
};

recognition.onerror = (event) => {
  // console.warn('Recognition error:', event.error);
  console.error('[主识别器] 错误:', event.error);
  resultSpan.textContent = '识别出错/Error: ' + event.error;
  if (event.error === 'no-speech') {
    speak(currentLang === 'zh-CN' ? "没有检测到语音" : "No speech detected");
  }
  isAwake = false;
  wakeRecognition.start();
};

// 🌐 Load commands.json
fetch('commands.json')
  .then(res => {
    if (!res.ok) throw new Error('Network error');
    return res.json();
  })
  .then(data => {
    commands = data;
    populateCommandList();
    const wakeItem = commands.find(cmd => cmd.action === 'wake');
    if (wakeItem) wakeWords = wakeItem.trigger.map(t => t.toLowerCase());
  })
  .catch(err => {
    console.error('无法加载命令列表:', err);
    speak(currentLang === 'zh-CN' ? "命令列表加载失败" : "Failed to load commands");
});

// 📌 Manual control buttons
document.getElementById('langSwitch').onclick = () => {
  currentLang = currentLang === 'zh-CN' ? 'en-US' : 'zh-CN';
  recognition.lang = currentLang;
  alert("当前语言已切换为：" + currentLang);
};

// document.getElementById('startBtn').onclick = () => {
//   if (wakeRecognition) wakeRecognition.stop();
//   // wakeRecognition.continuous = false; // Stop continuous listening
//   updateStatus("🟢 Awake (manual)");
//   recognition.start();
// };

// 修改按钮点击事件处理
document.getElementById('startBtn').onclick = async () => {
  
  try {
    // 停止所有正在进行的识别
    window.speechSynthesis.cancel();
    if (wakeRecognition) {
      wakeRecognition.stop();
      await new Promise(resolve => setTimeout(resolve, 3000)); // 等待3s确保完全停止
    }
    if (recognition) {
      recognition.stop();
    }

    // 初始化识别器状态
    recognition.continuous = false;
    recognition.lang = currentLang;

    // 设置短延时保证识别器完全停止
    await new Promise(resolve => setTimeout(resolve, 50));
    // 初始化状态
    isAwake = true;
    updateStatus("🟢 Awake (manual)");
    
    // 启动主识别器
    console.log('[手动模式] 启动语音识别');
    recognition.start();
    
    // 优化超时检测机制
    const timeoutId = setTimeout(() => {
      if (isAwake) {
        console.log('[手动模式] 主动结束识别');
        recognition.stop();
        updateStatus("💤 Sleep");
      }
    }, 5000); // 5秒无输入自动停止

    // 添加识别结束清理
    recognition.onend = () => {
      clearTimeout(timeoutId);
      if (isAwake) {
        console.log('[手动模式] 正常结束');
        isAwake = false;
        wakeRecognition.start();
      }
    };
    
  } catch (error) {
    console.error('手动启动失败:', error);
    speak(currentLang === 'zh-CN' ? "启动失败，请重试" : "Start failed, please try again");
  }
};

document.getElementById('toggleHelpBtn').onclick = () => {
  const section = document.getElementById('helpSection');
  section.style.display = section.style.display === 'none' ? 'block' : 'none';
};

// 🛠️ 功能函数
// resetConversationTimeout
function resetConversationTimeout() {
  clearTimeout(conversationTimeout);
  conversationTimeout = setTimeout(() => {
    if (isAwake) {
      speak(currentLang === 'zh-CN' ? "您还在吗？" : "Are you still there?");
      resetConversationTimeout();
    }
  }, 10000);
}

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

function updateStatus(text) {
  statusSpan.textContent = text;
}

// 🔎 Command Matching
function matchCommand(input) {
  const lower = input.toLowerCase();
  let matched = false;

  for (let cmd of commands) {
    const patterns = cmd.trigger.map(t => {
      const escaped = t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      return new RegExp(escaped, 'i');
    });
    
    if (patterns.some(p => p.test(lower))) {
      runAction(cmd);
      matched = true;
      break;
    }
  }

  if (!matched && isAwake) {
    // const response = currentLang === 'zh-CN' 
    //   ? `没有找到「${input}」相关指令` 
    //   : `No command found for "${input}"`;
    speak(response);
  }
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

    case "sleep":
      isAwake = false;
      recognition.stop();
      wakeRecognition.start();
      break;
  }
  // 其他动作可以在这里添加
  speak(reply || "命令已执行");
}

// 🔊 Speak function
function speak(text) {
  return new Promise(resolve => {
    // 停止当前正在播放的语音
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = currentLang;
    const selectedVoice = voices.find(v => v.lang === currentLang);
    if (selectedVoice) msg.voice = selectedVoice;
    msg.onend = () => {
      // console.log("[DEBUG] 语音合成完成");
      resolve();
    };
    window.speechSynthesis.speak(msg);
  });
}

// 🚀 Start system
window.onload = () => {
  updateStatus("💤 Sleep");
  wakeRecognition.start();
};
