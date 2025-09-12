// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const originalImage = document.getElementById('originalImage');
const resultImage = document.getElementById('resultImage');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');

// File handling
let currentFile = null;

// Initialize event listeners
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('dragleave', handleDragLeave);
dropZone.addEventListener('drop', handleDrop);
resetBtn.addEventListener('click', resetApp);
downloadBtn.addEventListener('click', downloadImage);

// Handle file selection
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

// Handle drag over
function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add('dragover');
}

// Handle drag leave
function handleDragLeave(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
}

// Handle file drop
function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

// Process uploaded file
function processFile(file) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showError('Please upload a valid image file (JPG, PNG, or WEBP)');
        return;
    }
    
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
        showError('File size must be less than 10MB');
        return;
    }
    
    currentFile = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        originalImage.src = e.target.result;
        showPreviewSection();
        transformImage(file);
    };
    reader.readAsDataURL(file);
}

// Show preview section
function showPreviewSection() {
    dropZone.style.display = 'none';
    previewSection.style.display = 'block';
    
    // Reset states
    resultImage.style.display = 'none';
    loadingSpinner.style.display = 'flex';
    errorMessage.style.display = 'none';
    downloadBtn.style.display = 'none';
}

// Transform image using API
async function transformImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const response = await fetch('/transform-headshot', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Show result image
            resultImage.src = data.image;
            resultImage.style.display = 'block';
            loadingSpinner.style.display = 'none';
            downloadBtn.style.display = 'inline-flex';
            
            // Store for download
            resultImage.dataset.mimeType = data.mimeType;
        } else {
            showError(data.error || 'Failed to generate headshot');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Network error. Please check your connection and try again.');
    }
}

// Show error message
function showError(message) {
    loadingSpinner.style.display = 'none';
    errorMessage.style.display = 'flex';
    errorText.textContent = message;
    resultImage.style.display = 'none';
    downloadBtn.style.display = 'none';
}

// Download generated image
function downloadImage() {
    if (!resultImage.src) return;
    
    // Extract base64 data
    const base64Data = resultImage.src.split(',')[1];
    const mimeType = resultImage.dataset.mimeType || 'image/jpeg';
    
    // Convert to blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const extension = mimeType.split('/')[1] || 'jpg';
    a.download = `professional-headshot-${timestamp}.${extension}`;
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Reset application
function resetApp() {
    // Reset UI
    dropZone.style.display = 'block';
    previewSection.style.display = 'none';
    
    // Clear images
    originalImage.src = '';
    resultImage.src = '';
    
    // Reset file input
    fileInput.value = '';
    currentFile = null;
    
    // Reset states
    loadingSpinner.style.display = 'flex';
    errorMessage.style.display = 'none';
    downloadBtn.style.display = 'none';
}

// Add paste support
document.addEventListener('paste', (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            processFile(file);
            break;
        }
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + V is handled by paste event
    // Escape to reset
    if (e.key === 'Escape' && previewSection.style.display === 'block') {
        resetApp();
    }
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's' && resultImage.src && downloadBtn.style.display !== 'none') {
        e.preventDefault();
        downloadImage();
    }
});
