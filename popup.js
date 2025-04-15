function sendMessageToContent(mode) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      console.log("📤 Sending mode:", mode);
      chrome.tabs.sendMessage(tabs[0].id, { mode });
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("focus").addEventListener("click", () => {
    sendMessageToContent("focus");
  });

  document.getElementById("help").addEventListener("click", () => {
    sendMessageToContent("help");
  });

  document.getElementById("night").addEventListener("click", () => {
    sendMessageToContent("night");
  });

  document.getElementById("resetBtn")?.addEventListener("click", () => {
    chrome.storage.local.set({ isCalibrated: false }, () => {
      alert("Calibration has been reset. It will run again on next use.");
    });
  });
});
