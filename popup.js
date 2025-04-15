document.getElementById('resetBtn').addEventListener('click', () => {
  chrome.storage.local.set({ calibrated: false }, () => {
    alert("Calibration has been reset. It will run again on next use.");
  });
});
