// Initialize with default color
let currentColor = '#3498db';
updateAllValues(currentColor);

// Color input change
document.getElementById('colorInput').addEventListener('input', function (e) {
    currentColor = e.target.value;
    updateAllValues(currentColor);
});

// Hex input change
document.getElementById('hexInput').addEventListener('input', function (e) {
    let hex = e.target.value;
    if (!hex.startsWith('#')) {
        hex = '#' + hex;
    }
    if (isValidHex(hex)) {
        currentColor = hex;
        updateAllValues(currentColor);
    }
});

// RGB Sliders
document.getElementById('rSlider').addEventListener('input', updateFromSliders);
document.getElementById('gSlider').addEventListener('input', updateFromSliders);
document.getElementById('bSlider').addEventListener('input', updateFromSliders);

// Image upload handler
document.getElementById('imageInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showStatus('Please upload a valid image file', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        loadImageToPicker(event.target.result);
    };
    reader.readAsDataURL(file);
});

// Load image to canvas
function loadImageToPicker(imageSrc) {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = function () {
        // Set canvas size
        const maxWidth = 600;
        const maxHeight = 400;
        let width = img.width;
        let height = img.height;

        // Scale down if too large
        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }
        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        // Show image picker section
        // Show image picker section (force visible)
        const picker = document.getElementById('imagePickerSection');
        picker.style.display = "block";
        picker.classList.add('active');


        showStatus('✓ Click on the image to pick a color!');
    };

    img.src = imageSrc;
}

// Canvas click handler to pick color
document.getElementById('imageCanvas').addEventListener('click', function (e) {
    const canvas = this;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    // Get click coordinates relative to canvas
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));

    // Get pixel data
    const imageData = ctx.getImageData(x, y, 1, 1);
    const pixel = imageData.data;

    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];

    const hex = rgbToHex(r, g, b);

    // Update picked color preview
    document.getElementById('pickedColorPreview').style.background = hex;
    document.getElementById('pickedColorHex').textContent = hex.toUpperCase();

    // Update main color
    currentColor = hex;
    updateAllValues(hex);

    showStatus('✓ Color picked from image!');
});

// Close image picker
function closeImagePicker() {
    document.getElementById('imagePickerSection').classList.remove('active');
    document.getElementById('imageInput').value = '';
}

function updateFromSliders() {
    const r = parseInt(document.getElementById('rSlider').value);
    const g = parseInt(document.getElementById('gSlider').value);
    const b = parseInt(document.getElementById('bSlider').value);

    document.getElementById('rValue').textContent = r;
    document.getElementById('gValue').textContent = g;
    document.getElementById('bValue').textContent = b;

    currentColor = rgbToHex(r, g, b);
    updateAllValues(currentColor);
}

// Update all color values and displays
function updateAllValues(hex) {
    // Update color preview
    document.getElementById('colorPreview').style.background = hex;

    // Update inputs
    document.getElementById('colorInput').value = hex;
    document.getElementById('hexInput').value = hex;

    // Convert to RGB
    const rgb = hexToRgb(hex);

    // Update sliders
    document.getElementById('rSlider').value = rgb.r;
    document.getElementById('gSlider').value = rgb.g;
    document.getElementById('bSlider').value = rgb.b;
    document.getElementById('rValue').textContent = rgb.r;
    document.getElementById('gValue').textContent = rgb.g;
    document.getElementById('bValue').textContent = rgb.b;

    // Convert to HSL
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    // Update value displays
    document.getElementById('hexValue').textContent = hex.toUpperCase();
    document.getElementById('rgbValue').textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    document.getElementById('rgbaValue').textContent = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`;
    document.getElementById('hslValue').textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

    // Update CSS code
    document.getElementById('cssBg').textContent = `background-color: ${hex};`;
    document.getElementById('cssText').textContent = `color: ${hex};`;
    document.getElementById('cssBorder').textContent = `border: 2px solid ${hex};`;
    document.getElementById('cssShadow').textContent = `box-shadow: 0 4px 10px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3);`;

    // Generate color palette
    generatePalette(hex);
}

// Generate color variations
function generatePalette(hex) {
    const paletteGrid = document.getElementById('paletteGrid');
    paletteGrid.innerHTML = '';

    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    // Create lighter shades
    for (let i = 4; i >= 1; i--) {
        const lightness = Math.min(hsl.l + (i * 10), 95);
        const color = hslToHex(hsl.h, hsl.s, lightness);
        createPaletteItem(color, `Lighter ${i}`);
    }

    // Original color
    createPaletteItem(hex, 'Original', true);

    // Create darker shades
    for (let i = 1; i <= 4; i++) {
        const lightness = Math.max(hsl.l - (i * 10), 5);
        const color = hslToHex(hsl.h, hsl.s, lightness);
        createPaletteItem(color, `Darker ${i}`);
    }
}

function createPaletteItem(color, label, isOriginal = false) {
    const paletteGrid = document.getElementById('paletteGrid');
    const item = document.createElement('div');
    item.className = 'palette-item';
    item.onclick = () => setColor(color);

    item.innerHTML = `
        <div class="palette-color" style="background: ${color};${isOriginal ? ' border: 3px solid #2d3436;' : ''}"></div>
        <div class="palette-label">${color.toUpperCase()}</div>
    `;

    paletteGrid.appendChild(item);
}

// Set color from preset or palette
function setColor(hex) {
    currentColor = hex;
    updateAllValues(hex);
}

// Copy value to clipboard
function copyValue(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;

    navigator.clipboard.writeText(text).then(() => {
        showStatus('✓ Copied to clipboard!');

        // Visual feedback on button
        const button = element.nextElementSibling;
        if (button && button.classList.contains('copy-btn')) {
            const originalText = button.textContent;
            button.textContent = '✓ Copied!';
            button.classList.add('copied');

            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('copied');
            }, 2000);
        }
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showStatus('✓ Copied to clipboard!');
        } catch (err) {
            showStatus('✗ Failed to copy', 'error');
        }
        document.body.removeChild(textArea);
    });
}

// Show status message
function showStatus(message, type = 'success') {
    const statusArea = document.getElementById('statusArea');

    const statusDiv = document.createElement('div');
    statusDiv.className = 'status-message';
    statusDiv.textContent = message;

    if (type === 'error') {
        statusDiv.style.background = '#e74c3c';
    }

    statusArea.appendChild(statusDiv);

    setTimeout(() => {
        statusDiv.remove();
    }, 2000);
}

// Color conversion functions
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function isValidHex(hex) {
    return /^#[0-9A-F]{6}$/i.test(hex);
}