document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey) {
    if (e.key.toLowerCase() === 'f') applyMode('focus');
    if (e.key.toLowerCase() === 'h') applyMode('help');
    if (e.key.toLowerCase() === 'n') applyMode('night');
  }
});

function applyMode(mode) {
  const body = document.body;
  body.style.transition = 'background 0.5s';
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
  chrome.storage.local.set({ mode });
}
