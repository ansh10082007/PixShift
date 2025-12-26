// --- CONFIGURATION & STATE ---
let mergedPdfImages = [];
let currentFiles = [];
let currentConversion = { from: '', to: '' };

// --- NAVIGATION LOGIC ---
function selectConversion(from, to) {
    currentConversion = { from, to };

    // 1. Set the file input to ONLY accept the 'from' format
    // If 'from' is jpg, it sets accept to ".jpg,.jpeg"
    const input = document.getElementById('fileInput');
    if (from === 'jpg') {
        input.accept = ".jpg,.jpeg";
    } else {
        input.accept = "." + from;
    }

    // 2. Update the display text
    const display = document.getElementById('conversionDisplay');
    display.innerHTML = `<h2>Converting <span style="color:#e74c3c">${from.toUpperCase()}</span> to <span style="color:#e74c3c">${to.toUpperCase()}</span></h2>`;

    goToStep(2);
}

function goToStep(stepNumber) {
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    document.getElementById('step' + stepNumber).classList.add('active');
}

// --- FILE HANDLING ---
document.getElementById('fileInput').addEventListener('change', function (e) {
    const files = Array.from(e.target.files);
    const expectedExt = currentConversion.from === 'jpg' ? ['jpg', 'jpeg'] : [currentConversion.from];

    // --- LIMIT SETTINGS ---
    const MAX_FILES = 10;
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_TOTAL_SIZE = 60 * 1024 * 1024; // 60MB

    let totalSize = 0;
    let validFiles = [];

    for (const file of files) {
        const fileExt = file.name.split('.').pop().toLowerCase();

        // Check correct format
        if (!expectedExt.includes(fileExt)) {
            alert(`❌ ${file.name} ignored. Only ${expectedExt.join(", ")} files allowed.`);
            continue;
        }

        // Check per file size
        if (file.size > MAX_FILE_SIZE) {
            alert(`❌ ${file.name} is larger than 10MB and was removed.`);
            continue;
        }

        totalSize += file.size;

        // Check total size
        if (totalSize > MAX_TOTAL_SIZE) {
            alert(`❌ Upload limit exceeded. Max total allowed is 60MB.`);
            break;
        }

        validFiles.push(file);

        // Check file count
        if (validFiles.length >= MAX_FILES) {
            alert("⚠️ Maximum 10 files allowed. Extra files were ignored.");
            break;
        }
    }

    currentFiles = validFiles;

    const fileList = document.getElementById('fileList');
    const convertBtn = document.getElementById('convertBtn');

    if (currentFiles.length > 0) {
        fileList.innerHTML = currentFiles
            .map(f => `<div class="file-item">📄 ${f.name}</div>`)
            .join('');
        convertBtn.disabled = false;
    } else {
        clearFiles();
    }
});


function clearFiles() {
    document.getElementById('fileInput').value = "";
    document.getElementById('fileList').innerHTML = "";
    document.getElementById('convertBtn').disabled = true;
    currentFiles = [];
}

// --- CONVERSION ENGINE ---
async function convertFiles() {
    const downloadList = document.getElementById('downloadList');

    // 1. Show a temporary message
    downloadList.innerHTML = "<p id='status-msg'>Processing your images...</p>";
    goToStep(3);

    for (const file of currentFiles) {
        try {
            if (currentConversion.to === 'pdf') {
                await convertToPdf(file);
            } else {
                await processImage(file, currentConversion.to);
            }
        } catch (error) {
            console.error("Error converting file:", file.name, error);
        }
    }
    // 2. Remove the "Processing" message once the loop is done
    const statusMsg = document.getElementById('status-msg');
    if (statusMsg) {
        statusMsg.remove();
    }
    // Show Merge Button only for JPG → PDF
    if (currentConversion.from === "jpg" && currentConversion.to === "pdf" && mergedPdfImages.length > 0) {
        // Remove existing button if already created
        const oldBtn = document.getElementById("mergePdfBtn");
        if (oldBtn) oldBtn.remove();

        const mergeBtn = document.createElement("button");
        mergeBtn.className = "btn";
        mergeBtn.id = "mergePdfBtn";
        mergeBtn.innerText = "Download Combined PDF";
        mergeBtn.onclick = mergeAllPdfs;

        document.getElementById("step3").appendChild(mergeBtn);
    }


}

function mergeAllPdfs() {
    const { jsPDF } = window.jspdf;

    if (mergedPdfImages.length === 0) {
        alert("No PDFs to merge.");
        return;
    }

    // First image decides PDF size
    const first = mergedPdfImages[0];

    const pdf = new jsPDF({
        orientation: first.width > first.height ? 'l' : 'p',
        unit: "px",
        format: [first.width, first.height]
    });

    mergedPdfImages.forEach((img, index) => {
        if (index !== 0) {
            pdf.addPage([img.width, img.height], img.width > img.height ? 'l' : 'p');
        }

        pdf.addImage(img.imgData, 'JPEG', 0, 0, img.width, img.height);
    });

    pdf.save("Merged_Images.pdf");
}


// Image to Image (WebP, PNG, JPG)
function processImage(file, targetFormat) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                const mimeType = `image/${targetFormat === 'jpg' ? 'jpeg' : targetFormat}`;
                const dataUrl = canvas.toDataURL(mimeType, 0.9);
                addDownloadLink(file.name.split('.')[0] + '.' + targetFormat, dataUrl);
                resolve();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// JPG to PDF logic
async function convertToPdf(file) {
    const { jsPDF } = window.jspdf;

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {

                // ---- Generate Normal Single PDF (Your Existing Feature) ----
                const pdf = new jsPDF({
                    orientation: img.width > img.height ? 'l' : 'p',
                    unit: 'px',
                    format: [img.width, img.height]
                });

                pdf.addImage(img, 'JPEG', 0, 0, img.width, img.height);
                const pdfData = pdf.output('bloburl');
                addDownloadLink(file.name.split('.')[0] + '.pdf', pdfData);

                // ---- Save Image for Merged PDF ----
                mergedPdfImages.push({
                    imgData: e.target.result,
                    width: img.width,
                    height: img.height
                });

                resolve();
            };

            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}


// 1. Add this array at the very top of your script.js with your other variables
let convertedFilesUrls = [];

// 2. Update your addDownloadLink function to save the URLs
function addDownloadLink(filename, url) {
    convertedFilesUrls.push({ filename, url });

    const downloadList = document.getElementById('downloadList');
    const item = document.createElement('div');
    item.className = 'file-item';

    // We added the 'download-single' class here
    item.innerHTML = `
        <span>${filename}</span>
        <a href="${url}" download="${filename}" class="download-single">Download</a>
    `;
    downloadList.appendChild(item);
}


// 3. Add the actual Download All function
function downloadAll() {
    if (convertedFilesUrls.length === 0) {
        alert("No files to download!");
        return;
    }

    // This loops through all converted files and triggers the browser download
    convertedFilesUrls.forEach((file, index) => {
        // We use a small timeout to prevent the browser from blocking multiple downloads
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = file.url;
            link.download = file.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, index * 200);
    });
}

// 4. Update your resetConverter to clear the list
function resetConverter() {
    currentFiles = [];
    convertedFilesUrls = [];
    mergedPdfImages = [];

    document.getElementById('fileInput').value = "";
    document.getElementById('downloadList').innerHTML = "";

    goToStep(1);
}

