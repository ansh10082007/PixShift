let selectedImages = [];
let rotatedImages = [];

// File input handler
document.getElementById('fileInput').addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    // Validation
    const MAX_IMAGES = 50;
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    let validFiles = [];

    for (const file of files) {
        // Check if it's an image
        if (!file.type.startsWith('image/')) {
            showStatus(`❌ ${file.name} is not an image file.`, 'error');
            continue;
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            showStatus(`❌ ${file.name} is larger than 10MB.`, 'error');
            continue;
        }

        validFiles.push(file);

        // Check max images
        if (selectedImages.length + validFiles.length >= MAX_IMAGES) {
            showStatus("⚠️ Maximum 50 images allowed.", 'info');
            validFiles = validFiles.slice(0, MAX_IMAGES - selectedImages.length);
            break;
        }
    }

    if (validFiles.length > 0) {
        selectedImages = selectedImages.concat(validFiles.map(file => ({
            file: file,
            rotation: 0,
            flipH: false,
            flipV: false
        })));
        
        displayImages();
        document.getElementById('controlsSection').classList.add('active');
        document.getElementById('uploadArea').style.display = 'none';
    }
});

// Drag and drop
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
    
    const dt = e.dataTransfer;
    const files = dt.files;
    
    document.getElementById('fileInput').files = files;
    document.getElementById('fileInput').dispatchEvent(new Event('change'));
});

// Display images
function displayImages() {
    const grid = document.getElementById('imagesGrid');
    grid.innerHTML = '';
    
    selectedImages.forEach((imageData, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const card = document.createElement('div');
            card.className = 'image-card';
            
            const rotationText = getRotationText(imageData);
            
            card.innerHTML = `
                <img src="${e.target.result}" class="image-preview" id="preview-${index}" style="transform: rotate(${imageData.rotation}deg) scaleX(${imageData.flipH ? -1 : 1}) scaleY(${imageData.flipV ? -1 : 1});">
                <div class="image-name">${imageData.file.name}</div>
                <div class="rotation-status" id="status-${index}">${rotationText}</div>
                <div class="image-controls">
                    <button class="control-btn" onclick="rotateSingle(${index}, 90)">↻ 90°</button>
                    <button class="control-btn" onclick="rotateSingle(${index}, 270)">↺ 90°</button>
                    <button class="control-btn flip" onclick="flipSingle(${index}, 'horizontal')">⇆ Flip H</button>
                    <button class="control-btn flip" onclick="flipSingle(${index}, 'vertical')">⇅ Flip V</button>
                    <button class="control-btn reset-single" onclick="resetSingle(${index})">⟲ Reset</button>
                </div>
            `;
            
            grid.appendChild(card);
        };
        reader.readAsDataURL(imageData.file);
    });
}

// Get rotation text
function getRotationText(imageData) {
    let text = [];
    
    if (imageData.rotation !== 0) {
        text.push(`Rotated ${imageData.rotation}°`);
    }
    if (imageData.flipH) {
        text.push('Flipped Horizontally');
    }
    if (imageData.flipV) {
        text.push('Flipped Vertically');
    }
    
    return text.length > 0 ? text.join(' • ') : 'No rotation';
}

// Rotate single image
function rotateSingle(index, degrees) {
    selectedImages[index].rotation = (selectedImages[index].rotation + degrees) % 360;
    updateImagePreview(index);
}

// Flip single image
function flipSingle(index, direction) {
    if (direction === 'horizontal') {
        selectedImages[index].flipH = !selectedImages[index].flipH;
    } else {
        selectedImages[index].flipV = !selectedImages[index].flipV;
    }
    updateImagePreview(index);
}

// Reset single image
function resetSingle(index) {
    selectedImages[index].rotation = 0;
    selectedImages[index].flipH = false;
    selectedImages[index].flipV = false;
    updateImagePreview(index);
}

// Update image preview
function updateImagePreview(index) {
    const preview = document.getElementById(`preview-${index}`);
    const status = document.getElementById(`status-${index}`);
    const imageData = selectedImages[index];
    
    preview.style.transform = `rotate(${imageData.rotation}deg) scaleX(${imageData.flipH ? -1 : 1}) scaleY(${imageData.flipV ? -1 : 1})`;
    status.textContent = getRotationText(imageData);
}

// Rotate all images
function rotateAll(degrees) {
    selectedImages.forEach((imageData, index) => {
        imageData.rotation = (imageData.rotation + degrees) % 360;
        updateImagePreview(index);
    });
    showStatus(`✓ All images rotated ${degrees}°`, 'success');
}

// Flip all images
function flipAll(direction) {
    selectedImages.forEach((imageData, index) => {
        if (direction === 'horizontal') {
            imageData.flipH = !imageData.flipH;
        } else {
            imageData.flipV = !imageData.flipV;
        }
        updateImagePreview(index);
    });
    showStatus(`✓ All images flipped ${direction}ly`, 'success');
}

// Reset all rotations
function resetAllRotations() {
    selectedImages.forEach((imageData, index) => {
        imageData.rotation = 0;
        imageData.flipH = false;
        imageData.flipV = false;
        updateImagePreview(index);
    });
    showStatus('✓ All rotations reset', 'success');
}

// Add more images
function addMoreImages() {
    document.getElementById('fileInput').click();
}

// Process rotations
async function processRotations() {
    if (selectedImages.length === 0) {
        showStatus('Please select images first.', 'error');
        return;
    }

    showStatus('🔄 Processing rotations...', 'info');
    
    rotatedImages = [];

    for (let i = 0; i < selectedImages.length; i++) {
        try {
            const rotatedImage = await rotateImage(selectedImages[i]);
            rotatedImages.push(rotatedImage);
        } catch (error) {
            console.error('Error rotating:', selectedImages[i].file.name, error);
        }
    }

    displayResults();
}

// Rotate image using canvas
function rotateImage(imageData) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Calculate dimensions based on rotation
                const rotation = imageData.rotation;
                let width = img.width;
                let height = img.height;
                
                if (rotation === 90 || rotation === 270) {
                    canvas.width = height;
                    canvas.height = width;
                } else {
                    canvas.width = width;
                    canvas.height = height;
                }
                
                // Apply transformations
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate((rotation * Math.PI) / 180);
                
                // Apply flips
                let scaleX = imageData.flipH ? -1 : 1;
                let scaleY = imageData.flipV ? -1 : 1;
                ctx.scale(scaleX, scaleY);
                
                // Draw image
                ctx.drawImage(img, -width / 2, -height / 2, width, height);
                
                // Convert to blob
                canvas.toBlob((blob) => {
                    const result = {
                        name: imageData.file.name,
                        blob: blob,
                        url: URL.createObjectURL(blob),
                        rotation: imageData.rotation,
                        flipH: imageData.flipH,
                        flipV: imageData.flipV
                    };
                    resolve(result);
                }, imageData.file.type || 'image/png', 0.95);
            };
            
            img.onerror = reject;
            img.src = e.target.result;
        };
        
        reader.onerror = reject;
        reader.readAsDataURL(imageData.file);
    });
}

// Display results
function displayResults() {
    const resultsSection = document.getElementById('resultsSection');
    const rotatedImagesGrid = document.getElementById('rotatedImagesGrid');
    const rotatedCount = document.getElementById('rotatedCount');
    
    rotatedCount.textContent = rotatedImages.length;
    rotatedImagesGrid.innerHTML = '';
    
    rotatedImages.forEach((imageData, index) => {
        const card = document.createElement('div');
        card.className = 'rotated-card';
        
        const rotationText = getRotationTextFromData(imageData);
        
        card.innerHTML = `
            <img src="${imageData.url}" class="rotated-image" alt="${imageData.name}">
            <div class="rotated-info">
                <div class="rotated-name">${imageData.name}</div>
                <div class="rotation-applied">${rotationText}</div>
            </div>
            <button class="download-btn" onclick="downloadSingle(${index})">
                ⬇️ Download
            </button>
        `;
        
        rotatedImagesGrid.appendChild(card);
    });
    
    resultsSection.classList.add('active');
    document.getElementById('controlsSection').style.display = 'none';
    showStatus('✅ All images rotated successfully!', 'success');
}

// Get rotation text from processed data
function getRotationTextFromData(imageData) {
    let text = [];
    
    if (imageData.rotation !== 0) {
        text.push(`Rotated ${imageData.rotation}°`);
    }
    if (imageData.flipH) {
        text.push('Flipped H');
    }
    if (imageData.flipV) {
        text.push('Flipped V');
    }
    
    return text.length > 0 ? text.join(' • ') : 'Original';
}

// Download single image
function downloadSingle(index) {
    const imageData = rotatedImages[index];
    const link = document.createElement('a');
    link.href = imageData.url;
    link.download = imageData.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Download all rotated images
function downloadAllRotated() {
    if (rotatedImages.length === 0) {
        showStatus('No images to download.', 'error');
        return;
    }

    rotatedImages.forEach((imageData, index) => {
        setTimeout(() => {
            downloadSingle(index);
        }, index * 300);
    });
    
    showStatus('📥 Downloading all images...', 'success');
}

// Reset rotator
function resetRotator() {
    selectedImages = [];
    rotatedImages = [];
    
    document.getElementById('fileInput').value = '';
    document.getElementById('controlsSection').classList.remove('active');
    document.getElementById('resultsSection').classList.remove('active');
    document.getElementById('uploadArea').style.display = 'block';
    
    document.getElementById('imagesGrid').innerHTML = '';
    
    const statusMsg = document.querySelector('.status-message');
    if (statusMsg) statusMsg.remove();
}

// Show status message
function showStatus(message, type) {
    const existingStatus = document.querySelector('.status-message');
    if (existingStatus) existingStatus.remove();

    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message ${type}`;
    statusDiv.textContent = message;

    const container = document.querySelector('.rotator-container');
    container.insertBefore(statusDiv, container.firstChild.nextSibling.nextSibling);

    if (type !== 'error') {
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.remove();
            }
        }, 5000);
    }
}