const express = require('express');
const cors = require('cors');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 9000;

app.use(cors());
app.use(express.json());

const CONFIG_PATH = path.join(__dirname, 'config.json');
const PARENT_DIR = path.join(__dirname, '..');

// Ensure config exists
let config = { websiteTitle: 'ShipCost Optimizer' };
if (fs.existsSync(CONFIG_PATH)) {
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (e) {
    console.error('Error reading config.json, using defaults.');
  }
} else {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

let childProcess = null;
let lastMessage = '';

function startServer(title) {
  if (childProcess) return false;
  
  const env = { ...process.env, VITE_APP_TITLE: title || config.websiteTitle };
  
  // Windows compatibility: use shell: true for npm
  childProcess = spawn('npm', ['run', 'dev'], { 
    cwd: PARENT_DIR, 
    env, 
    shell: true 
  });
  
  childProcess.on('exit', (code) => {
    console.log(`Vite server exited with code ${code}`);
    childProcess = null;
  });
  
  childProcess.on('error', (err) => {
    console.error('Failed to start Vite server:', err);
    childProcess = null;
  });
  
  return true;
}

function stopServer(callback) {
  if (!childProcess) {
    if (callback) callback();
    return;
  }
  
  const pid = childProcess.pid;
  childProcess = null; // Mark as stopped immediately
  
  // Windows specific kill for tree
  exec(`taskkill /pid ${pid} /T /F`, (err) => {
    if (err) {
      console.error('Failed to kill process tree:', err);
    }
    if (callback) callback();
  });
}

app.get('/status', (req, res) => {
  res.json({
    running: !!childProcess,
    url: childProcess ? 'http://localhost:5173' : null,
    title: config.websiteTitle,
    message: lastMessage
  });
  // clear transient message after sending once
  if (lastMessage) lastMessage = '';
});

app.post('/start', (req, res) => {
  if (childProcess) {
    return res.json({ success: false, message: 'Already running' });
  }
  startServer();
  res.json({ success: true, message: 'Server started' });
});

app.post('/stop', (req, res) => {
  if (!childProcess) {
    return res.json({ success: false, message: 'Not running' });
  }
  stopServer(() => {
    res.json({ success: true, message: 'Server stopped' });
  });
});

app.post('/set-title', (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  
  config.websiteTitle = title;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  
  if (childProcess) {
    stopServer(() => {
      startServer(title);
      lastMessage = 'Server restarted with new title.';
      res.json({ success: true, message: 'Title updated and server restarted' });
    });
  } else {
    lastMessage = 'Title updated. Start the server to see changes.';
    res.json({ success: true, message: 'Title updated' });
  }
});

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <title>Server Manager | ShipCost Optimizer</title>
  <style>
    :root {
      --brand-500: #6366f1;
      --brand-600: #4f46e5;
      --bg-base: #0f172a; /* slate-900 */
      --bg-card: #1e293b; /* slate-800 */
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --border: #334155;
      --success: #22c55e;
      --danger: #ef4444;
    }
    body {
      margin: 0;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background-color: var(--bg-base);
      color: var(--text-main);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 1rem;
    }
    .card {
      background-color: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 2rem;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }
    h1 { margin: 0; font-size: 1.25rem; font-weight: 600; }
    .badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
    }
    .badge.online { background: rgba(34, 197, 94, 0.1); color: var(--success); }
    .badge.offline { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
    .badge-dot { width: 8px; height: 8px; border-radius: 50%; }
    .badge.online .badge-dot { background: var(--success); box-shadow: 0 0 8px var(--success); }
    .badge.offline .badge-dot { background: var(--danger); }
    
    .section { margin-bottom: 1.5rem; }
    label { display: block; font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.5rem; font-weight: 500; }
    
    .input-group { display: flex; gap: 0.5rem; }
    input[type="text"] {
      flex: 1;
      background: var(--bg-base);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text-main);
      padding: 0.5rem 0.75rem;
      font-family: inherit;
      outline: none;
    }
    input[type="text"]:focus { border-color: var(--brand-500); }
    
    button {
      border: none;
      border-radius: 6px;
      padding: 0.5rem 1rem;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      transition: opacity 0.2s;
    }
    button:hover { opacity: 0.9; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .btn-primary { background: var(--brand-500); color: white; }
    .btn-success { background: var(--success); color: white; }
    .btn-danger { background: var(--danger); color: white; }
    .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text-main); }
    .btn-outline:hover { background: var(--border); }
    
    .url-box {
      background: var(--bg-base);
      border: 1px dashed var(--border);
      border-radius: 6px;
      padding: 0.75rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: monospace;
      font-size: 0.9rem;
      color: var(--brand-500);
    }
    .actions { display: flex; gap: 1rem; margin-top: 2rem; }
    .actions button { flex: 1; padding: 0.75rem; font-size: 1rem; }
    
    #messageBox {
      margin-top: 1rem;
      font-size: 0.875rem;
      color: var(--brand-500);
      min-height: 1.25rem;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Server Manager</h1>
      <div id="statusBadge" class="badge offline">
        <div class="badge-dot"></div> <span id="statusText">Offline</span>
      </div>
    </div>
    
    <div class="section">
      <label>Website Title (VITE_APP_TITLE)</label>
      <div class="input-group">
        <input type="text" id="titleInput" value="${config.websiteTitle}">
        <button class="btn-primary" onclick="setTitle()">Save</button>
      </div>
      <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
        Saving will automatically restart the server.
      </div>
    </div>
    
    <div class="section" id="urlSection" style="display: none;">
      <label>Server URL</label>
      <div class="url-box">
        <span id="urlText">http://localhost:5173</span>
        <button class="btn-outline" onclick="copyUrl()" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Copy</button>
      </div>
    </div>
    
    <div class="actions">
      <button id="startBtn" class="btn-success" onclick="startServer()">Start Server</button>
      <button id="stopBtn" class="btn-danger" onclick="stopServer()" disabled>Stop Server</button>
    </div>
    
    <div id="messageBox"></div>
  </div>

  <script>
    let isRunning = false;

    async function fetchStatus() {
      try {
        const res = await fetch('/status');
        const data = await res.json();
        updateUI(data);
        if (data.message) showMessage(data.message);
      } catch (e) {}
    }

    function updateUI(data) {
      isRunning = data.running;
      
      const badge = document.getElementById('statusBadge');
      const statusText = document.getElementById('statusText');
      const startBtn = document.getElementById('startBtn');
      const stopBtn = document.getElementById('stopBtn');
      const urlSection = document.getElementById('urlSection');
      const titleInput = document.getElementById('titleInput');

      if (isRunning) {
        badge.className = 'badge online';
        statusText.innerText = 'Online';
        startBtn.disabled = true;
        stopBtn.disabled = false;
        urlSection.style.display = 'block';
      } else {
        badge.className = 'badge offline';
        statusText.innerText = 'Offline';
        startBtn.disabled = false;
        stopBtn.disabled = true;
        urlSection.style.display = 'none';
      }
      
      // Update title only if not currently focused
      if (document.activeElement !== titleInput && data.title) {
        titleInput.value = data.title;
      }
    }

    async function startServer() {
      startBtn.disabled = true;
      showMessage('Starting...');
      await fetch('/start', { method: 'POST' });
      fetchStatus();
    }

    async function stopServer() {
      stopBtn.disabled = true;
      showMessage('Stopping...');
      await fetch('/stop', { method: 'POST' });
      fetchStatus();
    }

    async function setTitle() {
      const newTitle = document.getElementById('titleInput').value;
      if (!newTitle) return;
      
      showMessage('Updating title...');
      await fetch('/set-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      fetchStatus();
    }

    function copyUrl() {
      navigator.clipboard.writeText(document.getElementById('urlText').innerText);
      showMessage('Copied!');
    }

    function showMessage(msg) {
      const el = document.getElementById('messageBox');
      el.innerText = msg;
      setTimeout(() => { if (el.innerText === msg) el.innerText = ''; }, 3000);
    }

    // Initial fetch and poll
    fetchStatus();
    setInterval(fetchStatus, 2000);
  </script>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server Manager running at http://localhost:${PORT}`);
});
