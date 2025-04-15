// DOM Elements
const dot = document.querySelector(".dot");
const statusEl = document.getElementById("status");
const progressBar = document.getElementById("progressBar");
const countdownEl = document.getElementById("countdown");

// Configuration
const CALIBRATION_DURATION = 10; // seconds per point
const DOT_MOVE_INTERVAL = 1000; // ms
const DOT_SIZE = 30; // px
const DOT_POSITIONS = [
  [0.2, 0.2], [0.8, 0.2],  // Top positions
  [0.2, 0.5], [0.8, 0.5],  // Middle positions
  [0.5, 0.5],              // Center
  [0.2, 0.8], [0.8, 0.8]   // Bottom positions
];

// State
let currentPosition = 0;
let elapsedSeconds = 0;
let calibrationInterval;
let dotAnimationFrame;
let isCalibrating = false;

// Initialize calibration
async function initCalibration() {
  try {
    // Verify webcam access first
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    
    // Setup WebGazer
    webgazer.setRegression('ridge')
      .setTracker('clmtrackr')
      .showPredictionPoints(true)
      .saveDataAcrossSessions(true);
    
    startCalibration();
  } catch (error) {
    handleError("Camera access denied or unavailable");
  }
}

function startCalibration() {
  isCalibrating = true;
  statusEl.textContent = "Follow the dot with your eyes";
  
  // Start dot movement
  moveDot();
  
  // Start calibration timer
  calibrationInterval = setInterval(updateCalibrationProgress, 1000);
  
  // Begin eye tracking
  webgazer.begin()
    .catch(err => handleError("Eye tracking failed to start"));
}

function moveDot() {
  if (!isCalibrating) return;
  
  const [xPercent, yPercent] = DOT_POSITIONS[currentPosition];
  const xPos = Math.round(xPercent * window.innerWidth) - DOT_SIZE/2;
  const yPos = Math.round(yPercent * window.innerHeight) - DOT_SIZE/2;
  
  dot.style.left = `${xPos}px`;
  dot.style.top = `${yPos}px`;
  dot.style.display = "block";
  
  // Move to next position after interval
  dotAnimationFrame = setTimeout(() => {
    currentPosition = (currentPosition + 1) % DOT_POSITIONS.length;
    moveDot();
  }, DOT_MOVE_INTERVAL);
}
let onProgressUpdate = null;
function updateCalibrationProgress() {
  elapsedSeconds++;
  
  // Update progress bar
  const progressPercent = (elapsedSeconds / CALIBRATION_DURATION) * 100;
  progressBar.style.width = `${progressPercent}%`;
  
  // Update countdown
  const remainingSeconds = CALIBRATION_DURATION - elapsedSeconds;
  countdownEl.textContent = formatCountdown(remainingSeconds);
  
  // Visual feedback for last 3 seconds
  if (remainingSeconds <= 3) {
    countdownEl.style.color = "#ff5252";
    countdownEl.style.fontWeight = "bold";
  }
  
  // Complete calibration after duration
  if (elapsedSeconds >= CALIBRATION_DURATION) {
    completeCalibration();
  }
}

if (onProgressUpdate) {
  onProgressUpdate({
    elapsed: elapsedSeconds,
    remaining: CALIBRATION_DURATION - elapsedSeconds,
    position: currentPosition
  });
}




function formatCountdown(seconds) {
  if (seconds > 5) return `${seconds} seconds remaining`;
  if (seconds > 1) return `${seconds} seconds left`;
  if (seconds === 1) return "1 second left";
  return "Calibrating...";
}

async function completeCalibration() {
  cleanup();
  
  try {
    // Save calibration data
    await chrome.storage.local.set({
      isCalibrated: true,
      calibratedAt: new Date().toISOString()
    });
    
    // UI feedback
    statusEl.textContent = "Calibration complete!";
    countdownEl.textContent = "You may now close this tab";
    dot.style.display = "none";
    
    // Optional: Redirect after delay
    setTimeout(() => {
      window.location.href = "https://studyshift-extension-close";
    }, 3000);
    
  } catch (error) {
    handleError("Failed to save calibration data");
  }
}

function handleError(message) {
  cleanup();
  statusEl.textContent = message;
  countdownEl.textContent = "Calibration failed";
  progressBar.style.backgroundColor = "#ff4d4d";
  dot.style.display = "none";
}

function cleanup() {
  isCalibrating = false;
  clearInterval(calibrationInterval);
  clearTimeout(dotAnimationFrame);
  webgazer.pause();
}

// Start calibration when DOM is ready
if (document.readyState === "complete") {
  initCalibration();
} else {
  window.addEventListener("load", initCalibration);
}


