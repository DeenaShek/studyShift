// Initialize WebGazer in sandbox iframe
webgazer.setRegression('ridge')
  .setTracker('TFFacemesh')
  .saveDataAcrossSessions(true)
  .showPredictionPoints(true)
  .begin()
  .then(() => {
    console.log('WebGazer initialized in sandbox');
  })
  .catch((err) => {
    console.error('WebGazer failed to start:', err);
  });

// (Optional) Debug-only function to clear calibration
function resetCalibration() {
  localStorage.removeItem('webgazerGlobalData');
  localStorage.removeItem('webgazerVideoFeedback');
  location.reload();
}
