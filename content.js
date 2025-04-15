class StudyShiftUI {
  constructor() {
    this.currentMode = null;
    this.lastChange = 0;
    this.cooldown = 2000;
    this.isTracking = false;

    this.init();
  }

  init() {
    chrome.storage.local.get('isCalibrated', (data) => {
      const isCalibrated = data.isCalibrated;
      if (isCalibrated) {
        this.loadWebGazer(() => this.startEyeTracking());
      } else {
        console.warn('StudyShift: Eye tracking disabled - not calibrated');
        this.setupFallbackTriggers();
      }
    });
  }

  loadWebGazer(callback) {
    if (window.webgazer) return callback();
    const script = document.createElement('script');
    script.src = 'https://webgazer.cs.brown.edu/webgazer.js';
    script.onload = callback;
    document.head.appendChild(script);
  }

  startEyeTracking() {
    webgazer
      .setRegression('ridge')
      .setTracker('clmtrackr')
      .showPredictionPoints(false)
      .saveDataAcrossSessions(true)
      .begin()
      .then(() => {
        console.log('StudyShift: Eye tracking active');
        this.isTracking = true;
        this.setupGazeListener();
      })
      .catch((err) => {
        console.error('StudyShift: Eye tracking failed', err);
        this.setupFallbackTriggers();
      });
  }

  setupGazeListener() {
    let lastPrediction = null;
    setInterval(() => {
      if (!this.isTracking) return;

      const prediction = webgazer.getCurrentPrediction();
      if (!prediction || !prediction.x) return;

      const { x, y } = prediction;
      const w = window.innerWidth;
      const h = window.innerHeight;

      if (Date.now() - this.lastChange < this.cooldown) return;

      if (x < w * 0.2) {
        this.applyMode('focus');
      } else if (x > w * 0.8) {
        this.applyMode('help');
      } else if (y > h * 0.9) {
        this.applyMode('night');
      }
    }, 300);
  }

  applyMode(mode) {
    if (mode === this.currentMode) return;
    this.currentMode = mode;
    this.lastChange = Date.now();
    document.body.setAttribute('data-mode', mode);
    console.log(`StudyShift: Mode switched to ${mode}`);
  }

  setupFallbackTriggers() {
    chrome.runtime.onMessage.addListener((request) => {
      if (request.mode) {
        this.applyMode(request.mode);
      }
    });
  }
}

// Initialize StudyShift
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  new StudyShiftUI();
} else {
  window.addEventListener('load', () => new StudyShiftUI());
}
chrome.runtime.onMessage.addListener((request) => {
  if (request.mode) {
    this.applyMode(request.mode); // or whatever your applyMode() logic is
  }
});
