chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('isCalibrated', (res) => {
    if (!res.isCalibrated) {
      chrome.tabs.create({
        url: 'https://deenashek.github.io/studyshift-calibration/calibration.html'
      });
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && changeInfo.url.startsWith('https://studyshift-extension-close')) {
    chrome.storage.local.set({ isCalibrated: true }, () => {
      chrome.tabs.remove(tabId);
      console.log('✅ Calibration complete! Tab closed.');
    });
  }
});

chrome.commands.onCommand.addListener((command) => {
  const validCommands = {
    focus_mode: 'focus',
    help_mode: 'help',
    night_mode: 'night'
  };

  const mode = validCommands[command];
  if (mode) {
    console.log(`🎯 Keyboard shortcut triggered: ${mode}`);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { mode });
      }
    });
  }
});
