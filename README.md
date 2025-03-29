# Ghibli Image Scraper

A Chrome extension that automatically identifies and downloads images in Studio Ghibli art style from X.com (formerly Twitter).

## Overview

Ghibli Image Scraper uses Google's Gemini AI to analyze images on X.com in real-time and identify those that match the distinctive Studio Ghibli art style. When a matching image is found, it's automatically downloaded to your specified folder.

## Features

- Real-time image detection on X.com
- AI-powered Studio Ghibli style recognition
- Customizable confidence threshold for detection accuracy
- Statistics tracking for processed and downloaded images
- Configurable download path

## Installation

### From Source

1. Clone this repository or download the source code:

   ```bash
   git clone https://github.com/saarthakkj/ghibli-image-scraper.git
   ```bash

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" by toggling the switch in the top right corner

4. Click "Load unpacked" and select the directory containing the extension files

5. The extension should now be installed and visible in your Chrome toolbar

## Configuration

Before using the extension, you need to configure it with your Gemini API key:

1. Click on the extension icon in your Chrome toolbar
2. Go to the "Settings" tab
3. Enter your Gemini API key
4. (Optional) Adjust other settings:
- API Base URL: The base URL for the Gemini API
- Download Path: Where images will be saved (relative to your Downloads folder)
- Confidence Threshold: Minimum confidence level for image classification (0.0-1.0)
5. Click "Save Settings"

## Usage

1. Navigate to X.com (or Twitter.com)
2. The extension will automatically start scanning images as you browse
3. Images identified as Studio Ghibli style will be downloaded to your specified folder
4. You can view statistics about processed and downloaded images in the extension popup

## How It Works

1. The extension uses a MutationObserver to detect images as they appear on X.com
2. Each image is sent to the Gemini API for analysis
3. The API determines if the image matches Studio Ghibli art style
4. If the confidence level exceeds your threshold, the image is downloaded

## Technical Details

- Built with JavaScript using Chrome Extension Manifest V3
- Uses Google's Gemini API for image analysis
- Implements efficient image processing to avoid duplicates
- Respects user privacy by only processing image data

## Requirements

- Google Chrome browser
- Gemini API key (obtain from [Google AI Studio](https://ai.google.dev/))
- Active internet connection

## License

[MIT License](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Disclaimer

This extension is not affiliated with Studio Ghibli or X.com. It is intended for personal use only. Please respect copyright and terms of service when using downloaded images.