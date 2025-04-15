const dot = document.getElementById('dot');

// Positions for calibration (corners + center)
const positions = [
  [10, 10], [window.innerWidth - 30, 10],
  [10, window.innerHeight - 30], [window.innerWidth - 30, window.innerHeight - 30],
  [window.innerWidth / 2 - 10, window.innerHeight / 2 - 10]
];

let current = 0;

function moveDot() {
  const [x, y] = positions[current];
  dot.style.left = `${x}px`;
  dot.style.top = `${y}px`;

  current++;
  if (current >= positions.length) {
    // Done — mark as calibrated
    chrome.storage.local.set({ calibrated: true }, () => {
      alert("Calibration complete!");
      window.close(); // or redirect if needed
    });
  } else {
    setTimeout(moveDot, 2000);
  }
}

window.onload = () => {
  moveDot();
};
