# Professional Headshot Generator

Transform any photo into a professional corporate headshot using Google Gemini AI.

## Features

- 🎨 Beautiful drag-and-drop interface
- 📱 Mobile responsive design
- ⚡ Real-time image preview
- 💾 Download generated headshots
- 🔄 Loading states and error handling
- 📋 Paste image support (Ctrl+V)
- ⌨️ Keyboard shortcuts

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure API Key**
   - Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Open `.env` file
   - Replace `your_gemini_api_key_here` with your actual API key

3. **Run the Application**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   - Navigate to `http://localhost:3000`

## Usage

1. **Upload Image**: Drag and drop an image or click to browse
2. **Wait for Processing**: The AI will generate a professional headshot
3. **Download Result**: Click the download button to save your headshot

## Supported Formats

- JPG/JPEG
- PNG
- WEBP
- Maximum file size: 10MB

## Keyboard Shortcuts

- `Escape` - Reset and start over
- `Ctrl/Cmd + S` - Download generated headshot
- `Ctrl/Cmd + V` - Paste image from clipboard

## Technologies Used

- **Backend**: Node.js, Express
- **AI Model**: Google Gemini 2.5 Flash Image Preview
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **File Upload**: Multer

## Professional Headshot Specifications

The AI generates headshots with:
- Professional studio lighting
- Neutral gray background with subtle gradient
- Business attire (navy/charcoal suit with white/light-blue shirt)
- 85mm portrait lens simulation at f/2.8
- High-resolution output with shallow depth of field

## Troubleshooting

- **API Key Error**: Make sure your Gemini API key is correctly set in `.env`
- **Network Error**: Check your internet connection
- **File Too Large**: Ensure image is under 10MB
- **Invalid Format**: Use JPG, PNG, or WEBP images only
