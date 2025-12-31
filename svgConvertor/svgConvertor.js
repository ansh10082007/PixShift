const fileInput = document.getElementById("svgFile");
const svgCodeInput = document.getElementById("svgCode");
const convertBtn = document.getElementById("convertBtn");
const resultBox = document.getElementById("resultBox");
const previewImg = document.getElementById("previewImg");
const downloadBtn = document.getElementById("downloadBtn");
const widthInput = document.getElementById("width");
const heightInput = document.getElementById("height");


let lastSVG = "";
let lastWidth = 1024;
let bgColor = "#ffffff";

convertBtn.addEventListener("click", () => {
    if (fileInput.files.length > 0) {
        readSVGFile(fileInput.files[0]);
    } else if (svgCodeInput.value.trim() !== "") {
        convertSVGToJPG(svgCodeInput.value.trim());
    } else {
        alert("Please upload an SVG file or paste SVG code.");
    }
});

function readSVGFile(file) {
    const reader = new FileReader();
    reader.onload = () => convertSVGToJPG(reader.result);
    reader.readAsText(file);
}

function convertSVGToJPG(svgContent) {

    lastSVG = svgContent;
    lastWidth = parseInt(widthInput.value) || 1024;
    const svgBlob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = function () {
        let width = parseInt(widthInput.value) || img.width;
        let height = parseInt(heightInput.value);

        // If height not entered → keep aspect ratio automatically
        if (!height) {
            let scale = width / img.width;
            height = img.height * scale;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const jpgData = canvas.toDataURL("image/jpeg", 0.95);
        previewImg.src = jpgData;
        downloadBtn.href = jpgData;

        resultBox.classList.remove("hidden");
        URL.revokeObjectURL(url);
    };

    img.onerror = () => alert("Invalid SVG. Please upload a valid file or code.");

    img.src = url;
}
const bgWhiteBtn = document.getElementById("bgWhite");
const bgBlackBtn = document.getElementById("bgBlack");

bgWhiteBtn.addEventListener("click", () => {
    bgColor = "#ffffff";
    toggleButtons(bgWhiteBtn, bgBlackBtn);
    redraw();
});

bgBlackBtn.addEventListener("click", () => {
    bgColor = "#111111";
    toggleButtons(bgBlackBtn, bgWhiteBtn);
    redraw();
});

function toggleButtons(activeBtn, otherBtn) {
    activeBtn.classList.add("active");
    otherBtn.classList.remove("active");
}

function redraw() {
    if (lastSVG) {
        convertSVGToJPG(lastSVG);
    }
}

