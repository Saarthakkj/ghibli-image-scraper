document.addEventListener('DOMContentLoaded', function() {
  // Tab navigation
  const mainTab = document.getElementById('mainTab');
  const settingsTab = document.getElementById('settingsTab');
  const mainContent = document.getElementById('mainContent');
  const settingsContent = document.getElementById('settingsContent');
  
  mainTab.addEventListener('click', function() {
    mainContent.style.display = 'block';
    settingsContent.style.display = 'none';
    mainTab.classList.add('active');
    settingsTab.classList.remove('active');
  });
  
  settingsTab.addEventListener('click', function() {
    mainContent.style.display = 'none';
    settingsContent.style.display = 'block';
    mainTab.classList.remove('active');
    settingsTab.classList.add('active');
  });
  
  // Main tab elements
  const enableToggle = document.getElementById('enableToggle');
  const processedCount = document.getElementById('processed');
  const downloadedCount = document.getElementById('downloaded');
  
  // Settings tab elements
  const apiKeyInput = document.getElementById('apiKey');
  const apiBaseUrlInput = document.getElementById('apiBaseUrl'); // Make sure this is defined
  const downloadPathInput = document.getElementById('downloadPath');
  const confidenceThresholdInput = document.getElementById('confidenceThreshold');
  const saveSettingsButton = document.getElementById('saveSettings');
  
  // Load current settings
  chrome.storage.local.get(
    ['enabled', 'imagesProcessed', 'imagesDownloaded', 'apiKey', 'apiBaseUrl', 'downloadPath', 'confidenceThreshold'], 
    function(data) {
      // Main tab settings
      enableToggle.checked = data.enabled !== undefined ? data.enabled : true;
      processedCount.textContent = data.imagesProcessed || 0;
      downloadedCount.textContent = data.imagesDownloaded || 0;
      
      // Settings tab
      apiKeyInput.value = data.apiKey || '';
      apiBaseUrlInput.value = data.apiBaseUrl || 'https://api.studio.nebius.com/v1/';
      downloadPathInput.value = data.downloadPath || 'GhibliImages';
      confidenceThresholdInput.value = data.confidenceThreshold || 0.7;
    }
  );
  
  // Toggle extension enabled/disabled
  enableToggle.addEventListener('change', function() {
    chrome.storage.local.set({ enabled: this.checked });
    
    // Notify content script about the status change
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          type: 'TOGGLE_STATUS', 
          enabled: enableToggle.checked 
        });
      }
    });
  });
  
  // Save settings
  saveSettingsButton.addEventListener('click', function() {
    const settings = {
      apiKey: apiKeyInput.value,
      apiBaseUrl: apiBaseUrlInput.value,
      downloadPath: downloadPathInput.value,
      confidenceThreshold: parseFloat(confidenceThresholdInput.value)
    };
    
    chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: settings
    }, function(response) {
      if (response && response.status === 'settings_updated') {
        // Show a success message or visual feedback
        saveSettingsButton.textContent = 'Saved!';
        setTimeout(() => {
          saveSettingsButton.textContent = 'Save Settings';
        }, 2000);
      }
    });
  });
  
  // Update stats in real-time
  setInterval(function() {
    chrome.storage.local.get(['imagesProcessed', 'imagesDownloaded'], function(data) {
      processedCount.textContent = data.imagesProcessed || 0;
      downloadedCount.textContent = data.imagesDownloaded || 0;
    });
  }, 1000);
});