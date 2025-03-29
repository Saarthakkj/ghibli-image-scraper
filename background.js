// Background script for Ghibli Image Scraper
chrome.runtime.onInstalled.addListener(() => {
  // Initialize extension settings
  chrome.storage.local.set({
    enabled: true,
    imagesProcessed: 0,
    imagesDownloaded: 0,
    downloadPath: 'GhibliImages',
    apiKey: '', // Store Gemini API key
    apiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/', // Gemini API base URL
    confidenceThreshold: 0.7 // Default confidence threshold
  });
});

// Function to check if an image is in Ghibli style using Gemini API
async function checkGhibliStyle(imageUrl, metadata) {
  try {
    // Get API key and other settings from storage
    const data = await chrome.storage.local.get(['apiKey', 'apiBaseUrl', 'confidenceThreshold']);
    const apiKey = data.apiKey;
    const apiBaseUrl = data.apiBaseUrl || 'https://generativelanguage.googleapis.com/v1beta/models/';
    const confidenceThreshold = data.confidenceThreshold || 0.7;
    
    if (!apiKey) {
      console.error('API key not set. Please set your Gemini API key in the extension settings.');
      return { isGhibli: false, error: 'API key not set' };
    }
    
    // First, we need to fetch the image and convert it to a base64 string
    let imageBase64;
    let mimeType;
    try {
      const imgResponse = await fetch(imageUrl);
      const blob = await imgResponse.blob();
      mimeType = blob.type || 'image/jpeg';
      
      // Use a more reliable method to convert blob to base64
      imageBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Extract only the base64 part after the comma
          const base64Data = reader.result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      // Ensure the base64 string doesn't have any invalid characters
      imageBase64 = imageBase64.trim().replace(/\s/g, '');
      
      // Validate that it's a proper base64 string
      if (!/^[A-Za-z0-9+/=]+$/.test(imageBase64)) {
        console.error('Invalid base64 string generated');
        return { isGhibli: false, error: 'Invalid base64 encoding' };
      }
      
      // Log a small sample of the base64 string for debugging
      console.log('Base64 sample (first 50 chars):', imageBase64.substring(0, 50));
      
    } catch (error) {
      console.error('Error fetching image:', error);
      return { isGhibli: false, error: 'Failed to fetch image' };
    }
    
    // Create the endpoint URL with the API key as a query parameter
    const endpoint = `${apiBaseUrl}gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    // Prepare the request body according to Gemini API documentation
    // Note: Using inline_data instead of inlineData to match API expectations
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: "Is this image in Studio Ghibli art style? Answer only with 'true' or 'false'."
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64
              }
            }
          ]
        }
      ]
    };
    
    // Log the request details (with truncated base64 for readability)
    const logRequestBody = JSON.parse(JSON.stringify(requestBody));
    if (logRequestBody.contents && logRequestBody.contents[0] && 
        logRequestBody.contents[0].parts && logRequestBody.contents[0].parts[1] &&
        logRequestBody.contents[0].parts[1].inline_data) {
      const base64String = logRequestBody.contents[0].parts[1].inline_data.data;
      logRequestBody.contents[0].parts[1].inline_data.data = 
        base64String.substring(0, 50) + '...[truncated]...';
    }
    
    console.log('API Request URL:', endpoint);
    console.log('API Request Body:', JSON.stringify(logRequestBody, null, 2));
    
    // Make the API request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    // Log the response status
    console.log('API Response Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    // Log the successful response
    console.log('API Response:', JSON.stringify(result, null, 2));
    
    // Parse the response to extract true/false answer
    const responseContent = result.candidates && 
                           result.candidates[0] && 
                           result.candidates[0].content && 
                           result.candidates[0].content.parts && 
                           result.candidates[0].content.parts[0] && 
                           result.candidates[0].content.parts[0].text;
    
    const isGhibli = responseContent && responseContent.toLowerCase().includes('true');
    
    // For confidence, we could use some heuristics based on the response
    const confidence = isGhibli ? 0.8 : 0.2; // Simplified confidence estimation
    
    return { 
      isGhibli: isGhibli && confidence >= confidenceThreshold,
      confidence: confidence,
      rawResponse: responseContent
    };
  } catch (error) {
    console.error('Error checking Ghibli style:', error);
    return { isGhibli: false, error: error.message };
  }
}

// Helper function to convert Blob to base64
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Function to download an image
async function downloadGhibliImage(imageUrl, metadata) {
  try {
    const data = await chrome.storage.local.get(['downloadPath']);
    const downloadPath = data.downloadPath || 'GhibliImages';
    
    // Generate a filename based on the image URL
    const filename = `${downloadPath}/${Date.now()}_ghibli_image.jpg`;
    
    // Use Chrome's download API to save the image
    chrome.downloads.download({
      url: imageUrl,
      filename: filename,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download failed:', chrome.runtime.lastError);
      } else {
        // Update downloaded count
        chrome.storage.local.get(['imagesDownloaded'], function(data) {
          const newCount = (data.imagesDownloaded || 0) + 1;
          chrome.storage.local.set({ imagesDownloaded: newCount });
        });
      }
    });
    
    return { success: true, filename: filename };
  } catch (error) {
    console.error('Error downloading image:', error);
    return { success: false, error: error.message };
  }
}
// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'IMAGE_FOUND') {
    // Process the image
    console.log('Image found:', message.imageUrl);
    
    // Check if the image is in Ghibli style
    checkGhibliStyle(message.imageUrl, message.metadata)
      .then(result => {
        console.log('Ghibli check result:', result);
        
        // If it's a Ghibli style image, download it
        if (result.isGhibli) {
          return downloadGhibliImage(message.imageUrl, message.metadata);
        }
        return { success: false, reason: 'Not Ghibli style' };
      })
      .then(downloadResult => {
        console.log('Download result:', downloadResult);
        sendResponse({ 
          status: 'processed',
          isGhibli: downloadResult.success,
          downloadResult: downloadResult
        });
      })
      .catch(error => {
        console.error('Error processing image:', error);
        sendResponse({ 
          status: 'error',
          error: error.message
        });
      });
    
    return true; // Required for async response
  }
  
  // Handle API key updates
  if (message.type === 'UPDATE_SETTINGS') {
    chrome.storage.local.set(message.settings, () => {
      sendResponse({ status: 'settings_updated' });
    });
    return true;
  }
});
