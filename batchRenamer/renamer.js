let selectedFiles = [];
let renamedFiles = [];

// Update preview when settings change
document.getElementById('prefixInput').addEventListener('input', updatePreview);
document.getElementById('numberingStyle').addEventListener('change', updatePreview);
document.getElementById('startNumber').addEventListener('input', updatePreview);
document.getElementById('separator').addEventListener('change', updatePreview);
document.getElementById('textCase').addEventListener('change', updatePreview);
document.getElementById('keepExtension').addEventListener('change', updatePreview);

// File input handler
document.getElementById('fileInput').addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    const MAX_FILES = 100;

    if (selectedFiles.length + files.length > MAX_FILES) {
        showStatus(`Maximum ${MAX_FILES} files allowed. Extra files were ignored.`, 'info');
        const remaining = MAX_FILES - selectedFiles.length;
        selectedFiles = selectedFiles.concat(files.slice(0, remaining));
    } else {
        selectedFiles = selectedFiles.concat(files);
    }

    displayFiles();
    document.getElementById('settingsSection').classList.add('active');
    document.getElementById('uploadArea').style.display = 'none';
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

// Display files with preview
function displayFiles() {
    const filesList = document.getElementById('filesList');
    const fileCount = document.getElementById('fileCount');
    
    fileCount.textContent = selectedFiles.length;
    filesList.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const newName = generateNewName(file.name, index);
        
        const row = document.createElement('div');
        row.className = 'file-row';
        row.innerHTML = `
            <div class="file-number">${index + 1}</div>
            <div class="file-info">
                <div class="file-original">${file.name}</div>
                <div>
                    <span class="file-arrow">→</span>
                    <span class="file-new">${newName}</span>
                </div>
            </div>
            <button class="remove-file-btn" onclick="removeFile(${index})">×</button>
        `;
        
        filesList.appendChild(row);
    });
}

// Generate new name based on settings
function generateNewName(originalName, index) {
    const prefix = document.getElementById('prefixInput').value.trim();
    const numberingStyle = document.getElementById('numberingStyle').value;
    const startNum = parseInt(document.getElementById('startNumber').value);
    const separator = document.getElementById('separator').value;
    const textCase = document.getElementById('textCase').value;
    const keepExtension = document.getElementById('keepExtension').checked;
    
    // Get extension
    const extension = originalName.includes('.') ? originalName.split('.').pop() : '';
    
    let newName = '';
    
    // Add prefix
    if (prefix) {
        newName = applyCase(prefix, textCase);
    }
    
    // Add numbering
    if (numberingStyle !== 'none') {
        const number = startNum + index;
        
        if (numberingStyle === 'padded') {
            const totalFiles = selectedFiles.length;
            const maxDigits = (startNum + totalFiles - 1).toString().length;
            const paddedNumber = number.toString().padStart(maxDigits, '0');
            
            if (newName) {
                newName += separator + paddedNumber;
            } else {
                newName = paddedNumber;
            }
        } else {
            if (newName) {
                newName += separator + number;
            } else {
                newName = number.toString();
            }
        }
    }
    
    // Add extension
    if (keepExtension && extension) {
        newName += '.' + extension;
    }
    
    return newName || originalName;
}

// Apply text case
function applyCase(text, caseType) {
    switch(caseType) {
        case 'lower':
            return text.toLowerCase();
        case 'upper':
            return text.toUpperCase();
        case 'title':
            return text.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
        default:
            return text;
    }
}

// Update preview
function updatePreview() {
    const previewName = document.getElementById('previewName');
    
    if (selectedFiles.length > 0) {
        const exampleName = generateNewName(selectedFiles[0].name, 0);
        previewName.textContent = exampleName;
        displayFiles(); // Update all file previews
    } else {
        // Show example with dummy file
        const exampleOriginal = 'example.jpg';
        const prefix = document.getElementById('prefixInput').value.trim() || 'file';
        const numberingStyle = document.getElementById('numberingStyle').value;
        const separator = document.getElementById('separator').value;
        
        let example = prefix;
        
        if (numberingStyle === 'padded') {
            example += separator + '001';
        } else if (numberingStyle === 'number') {
            example += separator + '1';
        }
        
        example += '.jpg';
        
        previewName.textContent = example;
    }
}

// Remove file
function removeFile(index) {
    selectedFiles.splice(index, 1);
    
    if (selectedFiles.length === 0) {
        resetRenamer();
    } else {
        displayFiles();
        updatePreview();
    }
}

// Add more files
function addMoreFiles() {
    document.getElementById('fileInput').click();
}

// Process rename
function processRename() {
    if (selectedFiles.length === 0) {
        showStatus('Please select files first.', 'error');
        return;
    }

    renamedFiles = [];

    selectedFiles.forEach((file, index) => {
        const newName = generateNewName(file.name, index);
        
        renamedFiles.push({
            originalFile: file,
            originalName: file.name,
            newName: newName
        });
    });

    displayResults();
}

// Display results
function displayResults() {
    const resultsSection = document.getElementById('resultsSection');
    const renamedFilesList = document.getElementById('renamedFilesList');
    const renamedCount = document.getElementById('renamedCount');
    
    renamedCount.textContent = renamedFiles.length;
    renamedFilesList.innerHTML = '';
    
    renamedFiles.forEach((fileData, index) => {
        const item = document.createElement('div');
        item.className = 'renamed-file-item';
        
        // Determine file icon based on type
        const fileType = fileData.originalName.split('.').pop().toLowerCase();
        let icon = '📄';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileType)) icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image-icon lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
        else if (['mp4', 'avi', 'mov', 'mkv'].includes(fileType)) icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clapperboard-icon lucide-clapperboard"><path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="m6.2 5.3 3.1 3.9"/><path d="m12.4 3.4 3.1 4"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>';
        else if (['mp3', 'wav', 'ogg', 'm4a'].includes(fileType)) icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-music-icon lucide-music"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
        else if (['pdf'].includes(fileType)) icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-icon lucide-file"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/></svg>';
        else if (['doc', 'docx', 'txt'].includes(fileType)) icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text-icon lucide-file-text"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>';
        else if (['zip', 'rar', '7z'].includes(fileType)) icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-archive-icon lucide-folder-archive"><circle cx="15" cy="19" r="2"/><path d="M20.9 19.8A2 2 0 0 0 22 18V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h5.1"/><path d="M15 11v-1"/><path d="M15 17v-2"/></svg>';
        
        item.innerHTML = `
            <div class="file-icon">${icon}</div>
            <div class="renamed-file-info">
                <div class="renamed-original-name">${fileData.originalName}</div>
                <div class="renamed-new-name">${fileData.newName}</div>
            </div>
            <button class="download-single-btn" onclick="downloadSingleRenamed(${index})">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download-icon lucide-download"><path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/></svg>
            </button>
        `;
        
        renamedFilesList.appendChild(item);
    });
    
    resultsSection.classList.add('active');
    document.getElementById('settingsSection').style.display = 'none';
    showStatus('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-check-icon lucide-check-check"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg> Files renamed successfully!', 'success');
}

// Download single renamed file
function downloadSingleRenamed(index) {
    const fileData = renamedFiles[index];
    const blob = new Blob([fileData.originalFile], { type: fileData.originalFile.type });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileData.newName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

// Download all renamed files
function downloadAllRenamed() {
    if (renamedFiles.length === 0) {
        showStatus('No files to download.', 'error');
        return;
    }

    renamedFiles.forEach((fileData, index) => {
        setTimeout(() => {
            downloadSingleRenamed(index);
        }, index * 300);
    });
    
    showStatus('📥 Downloading all files...', 'success');
}

// Reset renamer
function resetRenamer() {
    selectedFiles = [];
    renamedFiles = [];
    
    document.getElementById('fileInput').value = '';
    document.getElementById('settingsSection').classList.remove('active');
    document.getElementById('resultsSection').classList.remove('active');
    document.getElementById('uploadArea').style.display = 'block';
    
    document.getElementById('filesList').innerHTML = '';
    document.getElementById('fileCount').textContent = '0';
    
    // Reset to defaults
    document.getElementById('prefixInput').value = 'file';
    document.getElementById('numberingStyle').value = 'number';
    document.getElementById('startNumber').value = '1';
    document.getElementById('separator').value = '_';
    document.getElementById('textCase').value = 'original';
    document.getElementById('keepExtension').checked = true;
    
    updatePreview();
    
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

    const container = document.querySelector('.renamer-container');
    container.insertBefore(statusDiv, container.firstChild.nextSibling.nextSibling);

    if (type !== 'error') {
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.remove();
            }
        }, 5000);
    }
}

// Initialize preview
updatePreview();