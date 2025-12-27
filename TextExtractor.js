let selectedFile = null;
let extractedTextContent = '';
let processedImage = null;

// File input handler
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showStatus('Please select a valid image file.', 'error');
        return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
        showStatus('File size must be less than 10MB.', 'error');
        return;
    }

    selectedFile = file;
    displayPreview(file);
});

// Drag and drop functionality
const uploadArea = document.getElementById('uploadArea');

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#e74c3c';
    uploadArea.style.background = '#f8f9fa';
});

uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#3498db';
    uploadArea.style.background = 'white';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#3498db';
    uploadArea.style.background = 'white';
    
    const file = e.dataTransfer.files[0];
    
    if (file && file.type.startsWith('image/')) {
        selectedFile = file;
        document.getElementById('fileInput').files = e.dataTransfer.files;
        displayPreview(file);
    } else {
        showStatus('Please drop a valid image file.', 'error');
    }
});

// Display image preview
function displayPreview(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const previewSection = document.getElementById('previewSection');
        const imagePreview = document.getElementById('imagePreview');
        const selectedFileDiv = document.getElementById('selectedFile');
        
        imagePreview.src = e.target.result;
        
        selectedFileDiv.innerHTML = `
            <div class="file-info">
                <span style="font-size: 1.5rem;">📄</span>
                <div>
                    <strong>${file.name}</strong><br>
                    <small style="color: #636e72;">${formatFileSize(file.size)}</small>
                </div>
            </div>
        `;
        
        previewSection.classList.add('active');
        document.getElementById('resultSection').classList.remove('active');
        
        // Hide upload area
        document.getElementById('uploadArea').style.display = 'none';
    };
    
    reader.readAsDataURL(file);
}

// Preprocess image for better OCR accuracy
function preprocessImage(image) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to image size
        canvas.width = image.width;
        canvas.height = image.height;
        
        // Draw original image
        ctx.drawImage(image, 0, 0);
        
        // Get image data
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let data = imageData.data;
        
        // Apply grayscale conversion
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg;     // Red
            data[i + 1] = avg; // Green
            data[i + 2] = avg; // Blue
        }
        
        // Apply contrast enhancement
        const factor = 1.5; // Contrast factor
        const intercept = 128 * (1 - factor);
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = data[i] * factor + intercept;
            data[i + 1] = data[i + 1] * factor + intercept;
            data[i + 2] = data[i + 2] * factor + intercept;
        }
        
        // Apply simple threshold (binarization)
        const threshold = 128;
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const val = avg > threshold ? 255 : 0;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
        }
        
        // Put processed image back
        ctx.putImageData(imageData, 0, 0);
        
        resolve(canvas.toDataURL());
    });
}

// Extract text using Tesseract.js with improved settings
async function extractText() {
    if (!selectedFile) {
        showStatus('Please select an image first.', 'error');
        return;
    }

    const extractBtn = document.getElementById('extractBtn');
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    
    extractBtn.disabled = true;
    progressBar.classList.add('active');
    progressFill.style.width = '0%';
    progressFill.textContent = 'Preprocessing image...';

    try {
        // Load image for preprocessing
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            img.src = e.target.result;
            
            img.onload = async function() {
                // Preprocess image
                processedImage = await preprocessImage(img);
                
                progressFill.textContent = 'Extracting text...';
                
                // Perform OCR with improved settings
                const { data: { text } } = await Tesseract.recognize(
                    processedImage,
                    'eng', // You can change to 'eng+fra' for multiple languages
                    {
                        logger: m => {
                            if (m.status === 'recognizing text') {
                                const progress = Math.round(m.progress * 100);
                                progressFill.style.width = progress + '%';
                                progressFill.textContent = progress + '%';
                            }
                        },
                        // Improved Tesseract configuration
                        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
                        tessedit_char_whitelist: '', // Leave empty to allow all characters
                        preserve_interword_spaces: '1',
                    }
                );

                extractedTextContent = text.trim();
                
                if (extractedTextContent) {
                    // Clean up the text
                    extractedTextContent = cleanText(extractedTextContent);
                    document.getElementById('extractedText').textContent = extractedTextContent;
                    
                    // Show the original image in comparison view
                    document.getElementById('comparisonImage').src = e.target.result;
                    
                    document.getElementById('resultSection').classList.add('active');
                    showStatus('Text extracted successfully!', 'success');
                } else {
                    showStatus('No text found in the image. Please try another image with clearer text.', 'error');
                }

                extractBtn.disabled = false;
                progressBar.classList.remove('active');
            };
        };
        
        reader.readAsDataURL(selectedFile);

    } catch (error) {
        console.error('OCR Error:', error);
        showStatus('An error occurred while extracting text. Please try again.', 'error');
        extractBtn.disabled = false;
        progressBar.classList.remove('active');
    }
}

// Clean extracted text
function cleanText(text) {
    // Remove excessive whitespace
    text = text.replace(/[ \t]+/g, ' ');
    
    // Fix common OCR mistakes
    text = text.replace(/\|/g, 'I'); // Pipe to I
    text = text.replace(/0/g, 'O'); // Zero to O in words (be careful with this)
    
    // Remove multiple newlines but keep paragraph structure
    text = text.replace(/\n{3,}/g, '\n\n');
    
    return text.trim();
}

// Copy extracted text to clipboard
function copyText() {
    if (!extractedTextContent) {
        showStatus('No text to copy.', 'error');
        return;
    }

    navigator.clipboard.writeText(extractedTextContent)
        .then(() => {
            showStatus('Text copied to clipboard!', 'success');
        })
        .catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = extractedTextContent;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showStatus('Text copied to clipboard!', 'success');
            } catch (err) {
                showStatus('Failed to copy text.', 'error');
            }
            document.body.removeChild(textArea);
        });
}

// Download extracted text as TXT file
function downloadText() {
    if (!extractedTextContent) {
        showStatus('No text to download.', 'error');
        return;
    }

    const blob = new Blob([extractedTextContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = selectedFile ? selectedFile.name.replace(/\.[^/.]+$/, '') + '_extracted.txt' : 'extracted_text.txt';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    showStatus('Text file downloaded!', 'success');
}

// Reset OCR page
function resetOCR() {
    selectedFile = null;
    extractedTextContent = '';
    processedImage = null;
    
    document.getElementById('fileInput').value = '';
    document.getElementById('previewSection').classList.remove('active');
    document.getElementById('resultSection').classList.remove('active');
    document.getElementById('uploadArea').style.display = 'block';
    
    const statusMsg = document.querySelector('.status-message');
    if (statusMsg) statusMsg.remove();
}

// Show status message
function showStatus(message, type) {
    // Remove existing status message
    const existingStatus = document.querySelector('.status-message');
    if (existingStatus) existingStatus.remove();

    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message ${type}`;
    statusDiv.textContent = message;

    const container = document.querySelector('.ocr-container');
    container.insertBefore(statusDiv, container.firstChild.nextSibling.nextSibling);

    // Auto-remove after 5 seconds for success/info messages
    if (type !== 'error') {
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.remove();
            }
        }, 5000);
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}