// Set to store processed image URLs to avoid duplicates
const processedImages = new Set();
let isEnabled = true;

// Initialize extension
function init() {
  // Check if extension is enabled
  chrome.storage.local.get(['enabled'], function(data) {
    isEnabled = data.enabled !== undefined ? data.enabled : true;
    
    if (isEnabled) {
      // Start observing the page for images
      setupImageObserver();
      // Process any images already on the page
      processExistingImages();
    }
  });
  
  // Listen for status toggle from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TOGGLE_STATUS') {
      isEnabled = message.enabled;
      
      if (isEnabled) {
        setupImageObserver();
        processExistingImages();
      }
      
      sendResponse({ status: 'updated' });
    }
    return true;
  });
}

// Process images that are already on the page
function processExistingImages() {
  if (!isEnabled) return;
  
  // Find all images on the page
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    processImage(img);
  });
}

// Set up MutationObserver to detect new images as they load
function setupImageObserver() {
  // Create an observer instance
  const observer = new MutationObserver((mutations) => {
    if (!isEnabled) return;
    
    mutations.forEach(mutation => {
      // Check for added nodes
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        for (let node of mutation.addedNodes) {
          // Check if the added node is an image
          if (node.nodeName === 'IMG') {
            processImage(node);
          }
          
          // Check if the added node contains images
          if (node.querySelectorAll) {
            const images = node.querySelectorAll('img');
            images.forEach(img => {
              processImage(img);
            });
          }
        }
      }
    });
  });
  
  // Start observing the document with the configured parameters
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
}

// Process an individual image
function processImage(imgElement) {
  if (!isEnabled) return;
  
  // Get the image URL
  const imageUrl = imgElement.src;
  
  // Skip if already processed or if it's a tiny image (likely an icon)
  if (processedImages.has(imageUrl) || 
      !imageUrl || 
      imageUrl.includes('profile_images') || 
      imgElement.width < 100 || 
      imgElement.height < 100) {
    return;
  }
  
  // Mark as processed
  processedImages.add(imageUrl);
  
  // Extract metadata
  const metadata = {
    width: imgElement.naturalWidth || imgElement.width,
    height: imgElement.naturalHeight || imgElement.height,
    alt: imgElement.alt || '',
    pageUrl: window.location.href
  };
  
  // Send the image URL to the background script
  chrome.runtime.sendMessage({
    type: 'IMAGE_FOUND',
    imageUrl: imageUrl,
    metadata: metadata
  }, response => {
    // Update processed count
    chrome.storage.local.get(['imagesProcessed'], function(data) {
      const newCount = (data.imagesProcessed || 0) + 1;
      chrome.storage.local.set({ imagesProcessed: newCount });
    });
  });
}

// Create a folder for icons
function createIconsFolder() {
  // This would be implemented in a real project
  // For this example, we'll just log a message
  console.log('Icon folder would be created here in a real implementation');
}

// Initialize when the page is loaded
window.addEventListener('load', init);

// Also run init immediately in case the page is already loaded
init();