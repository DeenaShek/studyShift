function createModeOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'studyshift-overlay';
  overlay.style.position = 'fixed';
  overlay.style.bottom = '20px';
  overlay.style.right = '20px';
  overlay.style.background = '#000a';
  overlay.style.color = '#fff';
  overlay.style.padding = '8px 12px';
  overlay.style.fontSize = '14px';
  overlay.style.borderRadius = '8px';
  overlay.style.zIndex = 999999;
  overlay.style.userSelect = 'none';
  overlay.style.cursor = 'move';
  overlay.textContent = 'Mode: Unknown';
  document.body.appendChild(overlay);

  // Make draggable
  let isDragging = false;
  overlay.addEventListener('mousedown', () => isDragging = true);
  document.addEventListener('mouseup', () => isDragging = false);
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      overlay.style.right = 'unset';
      overlay.style.bottom = 'unset';
      overlay.style.left = `${e.clientX}px`;
      overlay.style.top = `${e.clientY}px`;
    }
  });

  return overlay;
}

const modeOverlay = createModeOverlay();
let currentMode = null;
let modeCooldown = false;

function loadWebGazer(callback) {
  if (window.webgazer) return callback();

  const script = document.createElement('script');
  script.src = 'https://webgazer.cs.brown.edu/webgazer.js';
  script.onload = callback;
  document.head.appendChild(script);
}

function debounceModeChange(newMode) {
  if (modeCooldown || newMode === currentMode) return;

  currentMode = newMode;
  modeCooldown = true;
  chrome.storage.local.set({ mode: newMode });

  applyMode(newMode);

  setTimeout(() => {
    modeCooldown = false;
  }, 3000); // wait 3 sec before changing again
}

function applyMode(mode) {
  const body = document.body;
  body.style.transition = 'background 0.5s';
  if (modeOverlay) {
    modeOverlay.textContent = `Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
  }

  switch (mode) {
    case 'focus':
      body.style.backgroundColor = '#fff8e1';
      break;
    case 'help':
      body.style.backgroundColor = '#e3f2fd';
      break;
    case 'night':
      body.style.backgroundColor = '#263238';
      break;
  }
}

chrome.storage.local.get("calibrated", (data) => {
  if (!data.calibrated) return;

  loadWebGazer(() => {
    webgazer.setRegression('ridge') // or 'weightedRidge'
      .setGazeListener((data, elapsedTime) => {
        if (!data) return;

        const x = data.x;
        const y = data.y;
        const width = window.innerWidth;
        const height = window.innerHeight;

        if (y < height * 0.2 && x > width * 0.3 && x < width * 0.7) {
          debounceModeChange('focus');
        } else if (y > height * 0.8) {
          debounceModeChange('night');
        } else {
          debounceModeChange('help');
        }
      }).begin();

    webgazer.showVideo(false).showPredictionPoints(false).showFaceOverlay(false);
  });
});

document.addEventListener('keydown', (event) => {
  if (!event.ctrlKey) return;

  switch (event.key) {
    case '1':
      debounceModeChange('focus');
      break;
    case '2':
      debounceModeChange('help');
      break;
    case '3':
      debounceModeChange('night');
      break;
  }
});

