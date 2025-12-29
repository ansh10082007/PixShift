const videoInput = document.getElementById('videoInput');
const video = document.getElementById('videoPreview');
const renderBtn = document.getElementById('renderBtn');
const startTimeDisplay = document.getElementById('startTime');
const endTimeDisplay = document.getElementById('endTime');
const progressFill = document.getElementById('progressFill');
const progressBar = document.getElementById('progressBar');

let videoFile = null;

videoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        videoFile = URL.createObjectURL(file);
        video.src = videoFile;
        document.getElementById('editorSection').style.display = 'block';
    }
});

// Update the 5-second window display as user seeks
video.addEventListener('timeupdate', () => {
    const start = video.currentTime;
    const end = Math.min(start + 5, video.duration);
    startTimeDisplay.innerText = start.toFixed(2) + "s";
    endTimeDisplay.innerText = end.toFixed(2) + "s";
});

renderBtn.addEventListener('click', async () => {
    renderBtn.disabled = true;
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';

    // --- FIX FOR WORKER CORS ISSUE ---
    const workerResponse = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');
    const workerBlob = await workerResponse.blob();
    const workerUrl = URL.createObjectURL(workerBlob);

    const gif = new GIF({
        workers: 2,
        quality: 10,
        workerScript: workerUrl // Use the local Blob URL instead of the CDN link
    });
    // ---------------------------------

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Safety check for video dimensions
    if (video.videoWidth === 0) {
        alert("Video not loaded yet. Please wait a second.");
        renderBtn.disabled = false;
        return;
    }

    canvas.width = video.videoWidth / 2;
    canvas.height = video.videoHeight / 2;

    const startCaptureTime = video.currentTime;
    const durationToCapture = 5; 
    let currentCaptureTime = startCaptureTime;

    // Add rendering progress listener
    gif.on('progress', (p) => {
        progressFill.style.width = Math.round(p * 100) + "%";
    });

    const captureFrame = () => {
        if (currentCaptureTime < startCaptureTime + durationToCapture && currentCaptureTime < video.duration) {
            video.currentTime = currentCaptureTime;
            
            video.onseeked = () => {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                gif.addFrame(ctx, {copy: true, delay: 100});
                
                currentCaptureTime += 0.1;
                // Note: This progress bar shows "Capturing" progress
                // The gif.on('progress') above shows "Rendering" progress
                captureFrame();
            };
        } else {
            progressFill.style.background = "#2ecc71";
            gif.on('finished', (blob) => {
                const url = URL.createObjectURL(blob);
                const resultArea = document.getElementById('resultArea');
                resultArea.innerHTML = `
                    <h3>Conversion Complete!</h3>
                    <img src="${url}" style="max-width:100%; border-radius:8px;">
                    <br>
                    <a href="${url}" download="PixShift.gif" class="btn" style="display:inline-block; margin-top:10px;">Download GIF</a>
                `;
                renderBtn.disabled = false;
                URL.revokeObjectURL(workerUrl); // Clean up memory
            });
            gif.render();
        }
    };

    captureFrame();
});