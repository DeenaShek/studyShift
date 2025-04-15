const helpQuotes = [
  "Take a deep breath. You’ve got this!",
  "A small step today is still progress.",
  "Distraction is normal — focus returns with awareness.",
  "You're one decision away from momentum.",
  "Remember why you started."
];
function createFocusBar() {
  const barContainer = document.createElement('div');
  barContainer.id = 'focus-bar-container';
  barContainer.style.position = 'fixed';
  barContainer.style.top = '0';
  barContainer.style.left = '0';
  barContainer.style.width = '100%';
  barContainer.style.height = '6px';
  barContainer.style.backgroundColor = '#ddd';
  barContainer.style.zIndex = 999999;
  barContainer.style.display = 'none';

  const bar = document.createElement('div');
  bar.id = 'focus-progress-bar';
  bar.style.height = '100%';
  bar.style.width = '0%';
  bar.style.backgroundColor = '#fbc02d';
  bar.style.transition = 'width 1s linear';

  barContainer.appendChild(bar);
  document.body.appendChild(barContainer);
  return bar;
}

const focusProgressBar = createFocusBar();
let focusStartTime = null;
let focusTimerInterval = null;

function createHelpPopup() {
  const popup = document.createElement('div');
  popup.id = 'studyshift-help-popup';
  popup.style.position = 'fixed';
  popup.style.bottom = '80px';
  popup.style.right = '20px';
  popup.style.background = '#fff';
  popup.style.color = '#333';
  popup.style.padding = '10px 14px';
  popup.style.fontSize = '13px';
  popup.style.borderRadius = '8px';
  popup.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
  popup.style.zIndex = 999999;
  popup.style.maxWidth = '250px';
  popup.style.display = 'none';
  popup.style.transition = 'opacity 0.3s ease';
  document.body.appendChild(popup);
  return popup;
}

const helpPopup = createHelpPopup();

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

  if (helpPopup) helpPopup.style.display = 'none';

  switch (mode) {
    case 'focus':
      body.style.backgroundColor = '#fff8e1';
      startFocusTimer();
      break;

    case 'help':
      body.style.backgroundColor = '#e3f2fd';
      stopFocusTimer();
      const quote = helpQuotes[Math.floor(Math.random() * helpQuotes.length)];
      helpPopup.textContent = quote;
      helpPopup.style.display = 'block';
      break;

    case 'night':
      body.style.backgroundColor = '#263238';
      stopFocusTimer();
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
function startFocusTimer() {
  if (!focusProgressBar) return;
  document.getElementById('focus-bar-container').style.display = 'block';
  focusStartTime = Date.now();
  clearInterval(focusTimerInterval);

  focusTimerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - focusStartTime) / 1000);
    const percentage = Math.min((elapsed / 1500) * 100, 100);
    focusProgressBar.style.width = percentage + '%';

    if (percentage >= 100) {
      clearInterval(focusTimerInterval);
      alert("🎉 25 minutes of focus completed! Take a 5-min break.");
    }
  }, 1000);
}

function stopFocusTimer() {
  if (!focusProgressBar) return;
  clearInterval(focusTimerInterval);
  focusProgressBar.style.width = '0%';
  document.getElementById('focus-bar-container').style.display = 'none';
}


