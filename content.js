// StudyShift Content Script - Optimized v1.1
class StudyShiftUI {
  constructor() {
    this.currentMode = null;
    this.lastChange = 0;
    this.cooldown = 2000; // 2s between mode switches
    this.isTracking = false;
    
    // Create Shadow DOM host
    this.host = document.createElement('studyshift-host');
    document.body.appendChild(this.host);
    this.shadowRoot = this.host.attachShadow({ mode: 'open' });
    this.styleTag = document.createElement('style');
    this.shadowRoot.appendChild(this.styleTag);
    
    // Mode configurations (now with Shadow DOM-safe selectors)
    this.modes = {
      focus: `
        .studyshift-focus-dim {
          opacity: 0.1 !important;
          pointer-events: none !important;
        }
        body::after {
          content: "FOCUS MODE (Active)";
          position: fixed;
          top: 10px;
          right: 10px;
          background: #4CAF50;
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          z-index: 9999;
          font-family: sans-serif;
        }
      `,
      help: `
        .studyshift-help-highlight {
          background-color: rgba(255,255,0,0.2) !important;
        }
        body::after {
          content: "HELP MODE (Active)";
          position: fixed;
          top: 10px;
          right: 10px;
          background: #FFC107;
          color: black;
          padding: 5px 10px;
          border-radius: 4px;
          z-index: 9999;
          font-family: sans-serif;
        }
      `,
      night: `
        body.studyshift-night-mode {
          background-color: #121212 !important;
          color: #e0e0e0 !important;
          filter: brightness(0.8);
        }
        body::after {
          content: "NIGHT MODE (Active)";
          position: fixed;
          top: 10px;
          right: 10px;
          background: #673AB7;
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          z-index: 9999;
          font-family: sans-serif;
        }
      `
    };
    
    this.init();
  }

  async init() {
    try {
      // Check calibration status
      const { isCalibrated } = await chrome.storage.local.get('isCalibrated');
      
      if (isCalibrated && typeof webgazer !== 'undefined') {
        this.startEyeTracking();
      } else {
        console.warn('StudyShift: Eye tracking disabled - not calibrated');
        this.setupFallbackTriggers();
      }
    } catch (error) {
      console.error('StudyShift init failed:', error);
      this.setupFallbackTriggers();
    }
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
    const predictionInterval = setInterval(() => {
      if (!this.isTracking) {
        clearInterval(predictionInterval);
        return;
      }

      const prediction = webgazer.getCurrentPrediction();
      if (!prediction || !prediction.x) {
        return;
      }

      // Throttle rapid predictions
      if (lastPrediction && 
          Math.abs(prediction.x - lastPrediction.x) < 10 &&
          Math.abs(prediction.y - lastPrediction.y) < 10) {
        return;
      }
      lastPrediction = prediction;

      const { x, y } = prediction;
      const w = window.innerWidth;
      const h = window.innerHeight;

      if (Date.now() - this.lastChange < this.cooldown) return;

      // Zone detection
      if (x < w * 0.2) {
        this.applyMode('focus');
      } else if (x > w * 0.8) {
        this.applyMode('help');
      } else if (y > h * 0.9) {
        this.applyMode('night');
      }
    }, 300); // 300ms = balance between responsiveness and performance
  }

  applyMode(mode) {
    if (!this.modes[mode] || mode === this.currentMode) return;

    console.log(`StudyShift: Switching to ${mode} mode`);
    this.styleTag.textContent = this.modes[mode];
    this.currentMode = mode;
    this.lastChange = Date.now();

    // Apply class-based styling to avoid !important conflicts
    this.updatePageClasses(mode);

    chrome.runtime.sendMessage({
      type: 'modeChange',
      mode: mode,
      source: 'auto'
    });
  }

  updatePageClasses(mode) {
    // Remove all StudyShift classes first
    document.body.classList.remove(
      'studyshift-night-mode',
      'studyshift-focus-mode'
    );
    
    // Add relevant classes
    switch(mode) {
      case 'night':
        document.body.classList.add('studyshift-night-mode');
        break;
      case 'focus':
        this.markDistractions();
        break;
    }
  }

  markDistractions() {
    // Add dimming class to distracting elements
    const selectors = [
      '[href*="facebook.com"]',
      '[href*="twitter.com"]', 
      '[href*="instagram.com"]',
      '.sidebar',
      '.recommended-videos'
    ];
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.classList.add('studyshift-focus-dim');
      });
    });
  }

  setupFallbackTriggers() {
    // Manual mode listeners
    chrome.runtime.onMessage.addListener((request) => {
      if (request.mode && this.modes[request.mode]) {
        this.applyMode(request.mode);
      }
    });
    
    // Fallback: Auto-enable focus mode on known study sites
    if (window.location.hostname.match(/quizlet|khanacademy|edx/)) {
      this.applyMode('focus');
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new StudyShiftUI();
});

// Fallback for dynamic pages
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  new StudyShiftUI();
} else {
  window.addEventListener('load', () => new StudyShiftUI());
}