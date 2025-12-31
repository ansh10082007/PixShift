let selectedFiles = [];
let compressedResults = [];

// Quality slider
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');

qualitySlider.addEventListener('input', function () {
    qualityValue.textContent = this.value;
});

// File input handler
document.getElementById('fileInput').addEventListener('change', function (e) {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    // Validation
    const MAX_FILES = 10;
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

        // Check max files
        if (validFiles.length >= MAX_FILES) {
            showStatus("⚠️ Maximum 10 files allowed.", 'info');
            break;
        }
    }

    if (validFiles.length > 0) {
        selectedFiles = validFiles;
        displaySelectedFiles();
        document.getElementById('settingsSection').classList.add('active');
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

// Display selected files
function displaySelectedFiles() {
    const container = document.getElementById('selectedFiles');
    container.innerHTML = '<h4 style="color: #2d3436; margin-bottom: 15px;">Selected Files:</h4>';

    selectedFiles.forEach((file, index) => {
        const div = document.createElement('div');
        div.className = 'file-item-compact';
        div.innerHTML = `
            <div class="file-info-compact">
                <span style="font-size: 1.5rem;">📷</span>
                <div>
                    <strong>${file.name}</strong><br>
                    <small style="color: #636e72;">${formatFileSize(file.size)}</small>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

// Compress images
async function compressImages() {
    if (selectedFiles.length === 0) {
        showStatus('Please select images first.', 'error');
        return;
    }

    const quality = parseInt(qualitySlider.value) / 100;
    const outputFormat = document.getElementById('outputFormat').value;

    const compressBtn = document.getElementById('compressBtn');
    compressBtn.disabled = true;
    compressBtn.textContent = '⏳ Compressing...';

    compressedResults = [];

    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        try {
            const result = await compressImage(file, quality, outputFormat);
            compressedResults.push(result);
        } catch (error) {
            console.error('Error compressing:', file.name, error);
            showStatus(`Error compressing ${file.name}`, 'error');
        }
    }

    // Display results
    displayResults();

    compressBtn.disabled = false;
    compressBtn.textContent = '🗜️ Compress Images';
}

// Compress single image
function compressImage(file, quality, outputFormat) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (e) {
            const img = new Image();

            img.onload = function () {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // Determine output format
                // Determine output format
                let mimeType;
                let extension;

                if (outputFormat === 'same') {
                    mimeType = file.type;
                    extension = file.name.split('.').pop();
                } else if (outputFormat === 'jpg') {
                    mimeType = 'image/jpeg';
                    extension = 'jpg';
                } else if (outputFormat === 'png') {
                    mimeType = 'image/png';
                    extension = 'png';
                } else if (outputFormat === 'webp') {
                    mimeType = 'image/webp';
                    extension = 'webp';
                }


                // Convert to blob
                canvas.toBlob(function (blob) {
                    const originalDataUrl = e.target.result;
                    const compressedDataUrl = URL.createObjectURL(blob);

                    const savingsPercent = ((file.size - blob.size) / file.size * 100).toFixed(1);

                    const result = {
                        originalName: file.name,
                        originalSize: file.size,
                        originalDataUrl: originalDataUrl,
                        compressedSize: blob.size,
                        compressedDataUrl: compressedDataUrl,
                        compressedBlob: blob,
                        extension: extension,
                        savings: savingsPercent,
                        isLarger: blob.size > file.size
                    };

                    resolve(result);
                }, mimeType, quality);
            };

            img.onerror = reject;
            img.src = e.target.result;
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Display results
function displayResults() {
    const resultsSection = document.getElementById('resultsSection');
    const resultsGrid = document.getElementById('resultsGrid');
    const summaryStats = document.getElementById('summaryStats');

    // Calculate total savings
    const totalOriginal = compressedResults.reduce((sum, r) => sum + r.originalSize, 0);
    const totalCompressed = compressedResults.reduce((sum, r) => sum + r.compressedSize, 0);
    const totalSavings = ((totalOriginal - totalCompressed) / totalOriginal * 100).toFixed(1);

    // Display summary
    summaryStats.innerHTML = `
        <h3 style="margin-bottom: 20px;">🎉 Compression Complete!</h3>
        <div class="stats-grid">
            <div class="stat-item">
                <span class="stat-value">${compressedResults.length}</span>
                <span class="stat-label">Images Compressed</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${formatFileSize(totalOriginal)}</span>
                <span class="stat-label">Original Size</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${formatFileSize(totalCompressed)}</span>
                <span class="stat-label">Compressed Size</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${totalSavings}%</span>
                <span class="stat-label">Total Savings</span>
            </div>
        </div>
    `;

    // Display individual results
    resultsGrid.innerHTML = '';

    compressedResults.forEach((result, index) => {
        const card = document.createElement('div');
        card.className = 'result-card';

        // Better savings calculation
        let savingsBadgeClass, savingsText, savingsIcon;

        if (result.isLarger) {
            savingsBadgeClass = 'larger';
            savingsText = `+${Math.abs(result.savings)}%`;
            savingsIcon = '⚠️';
        } else if (result.savings > 50) {
            savingsBadgeClass = 'high';
            savingsText = `-${result.savings}%`;
            savingsIcon = '🎉';
        } else if (result.savings > 20) {
            savingsBadgeClass = 'medium';
            savingsText = `-${result.savings}%`;
            savingsIcon = '✅';
        } else if (result.savings > 0) {
            savingsBadgeClass = 'low';
            savingsText = `-${result.savings}%`;
            savingsIcon = '📊';
        } else {
            savingsBadgeClass = 'larger';
            savingsText = `+${Math.abs(result.savings)}%`;
            savingsIcon = '⚠️';
        }

        card.innerHTML = `
            <div class="result-header">
                <span style="font-size: 1.5rem;">📷</span>
                <h4 title="${result.originalName}">${result.originalName}</h4>
            </div>
            
            <div class="comparison-images">
                <div class="comparison-item">
                    <img src="${result.originalDataUrl}" alt="Original">
                    <label>Original</label>
                </div>
                <div class="comparison-item">
                    <img src="${result.compressedDataUrl}" alt="Compressed">
                    <label>Compressed</label>
                </div>
            </div>
            
            <div class="size-comparison">
                <div class="size-row">
                    <span class="size-label">Original:</span>
                    <span class="size-value">${formatFileSize(result.originalSize)}</span>
                </div>
                <div class="size-row">
                    <span class="size-label">Compressed:</span>
                    <span class="size-value">${formatFileSize(result.compressedSize)}</span>
                </div>
                <div class="size-row">
                    <span class="size-label">${result.isLarger ? 'Size Increase:' : 'Savings:'}</span>
                    <span class="savings-badge ${savingsBadgeClass}">${savingsIcon} ${savingsText}</span>
                </div>
            </div>
            
            <button class="download-btn" onclick="downloadSingle(${index})">
                ⬇️ Download ${result.isLarger ? 'Original' : 'Compressed'}
            </button>
        `;

        resultsGrid.appendChild(card);
    });

    resultsSection.classList.add('active');
    document.getElementById('settingsSection').style.display = 'none';
    showStatus('Images compressed successfully!', 'success');
}

// Download single file
function downloadSingle(index) {
    const result = compressedResults[index];
    const link = document.createElement('a');

    // If compressed is larger, download original instead
    if (result.isLarger) {
        link.href = result.originalDataUrl;
        link.download = result.originalName;
    } else {
        link.href = result.compressedDataUrl;
        const baseName = result.originalName.replace(/\.[^/.]+$/, '');
        link.download = `${baseName}_compressed.${result.extension}`;
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Download all files
function downloadAll() {
    if (compressedResults.length === 0) {
        showStatus('No files to download.', 'error');
        return;
    }

    compressedResults.forEach((result, index) => {
        setTimeout(() => {
            downloadSingle(index);
        }, index * 300);
    });

    showStatus('Downloading all files...', 'success');
}

// Reset compressor
function resetCompressor() {
    selectedFiles = [];
    compressedResults = [];

    document.getElementById('fileInput').value = '';
    document.getElementById('settingsSection').classList.remove('active');
    document.getElementById('resultsSection').classList.remove('active');
    document.getElementById('uploadArea').style.display = 'block';

    document.getElementById('selectedFiles').innerHTML = '';
    document.getElementById('qualitySlider').value = 80;
    document.getElementById('qualityValue').textContent = '80';
    document.getElementById('outputFormat').value = 'same';

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

    const container = document.querySelector('.compressor-container');
    container.insertBefore(statusDiv, container.firstChild.nextSibling.nextSibling);

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