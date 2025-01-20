// Get necessary elements
const uploadForm = document.getElementById("upload-form");
const pdfFileInput = document.getElementById("pdf-file");
const dropArea = document.getElementById("drop-area");
const pdfPreview = document.getElementById("pdf-preview");
const pdfContent = document.getElementById("pdf-content");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const loadingSpinner = document.getElementById("loading-spinner");
const playPauseControls = document.getElementById("play-pause-controls");

// Speech engine variables
let speechEngine = new SpeechSynthesisUtterance();
let isSpeaking = false;
let currentText = [];
let currentPage = 0;
let wordIndex = 0; // Track the current word index globally
let wordPositions = []; // Store word positions as offsets for highlighting

// Trigger the file input when the drop area is clicked
dropArea.addEventListener("click", () => {
    pdfFileInput.click();
});

// Automatically handle file selection
pdfFileInput.addEventListener("change", () => {
    if (pdfFileInput.files.length > 0) {
        handleFileUpload(pdfFileInput.files[0]);
    }
});

// Drag-and-drop functionality
dropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropArea.classList.add("highlight");
});

dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("highlight");
});

dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    dropArea.classList.remove("highlight");
    const file = e.dataTransfer.files[0];
    if (file) {
        pdfFileInput.files = e.dataTransfer.files; // Update input for consistency
        handleFileUpload(file);
    }
});

// Upload and process the selected PDF file
function handleFileUpload(file) {
    const formData = new FormData();
    formData.append("file", file);

    // Show loading spinner
    loadingSpinner.classList.remove("hidden");
    pdfPreview.classList.add("hidden");

    fetch("/upload", {
        method: "POST",
        body: formData
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.error) {
                console.error("Error from server:", data.error);
                return;
            }
            currentText = data.text;
            currentPage = 0; // Reset page counter
            wordPositions = currentText.map((pageText) =>
                extractWordOffsets(pageText)
            );

            displayPdfPreview(currentText);

            // Hide loading spinner and show preview
            loadingSpinner.classList.add("hidden");
            pdfPreview.classList.remove("hidden");

            scrollToBottom();

            togglePlayPauseControls(true);
        })
        .catch((error) => {
            console.error("Error uploading PDF:", error);
            loadingSpinner.classList.add("hidden");
        });
}

function scrollToBottom() {
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth' // Adds a smooth scrolling effect
    });
}


// Display PDF preview
function displayPdfPreview(text) {
    pdfContent.innerHTML = "";
    text.forEach((pageText, index) => {
        const page = document.createElement("p");
        page.innerText = pageText;
        page.id = `page-${index}`;
        pdfContent.appendChild(page);
    });
}

// Text-to-speech controls
startBtn.addEventListener("click", function () {
    if (currentText.length > 0 && currentPage < currentText.length) {
        startReading();
    }
});

pauseBtn.addEventListener("click", function () {
    window.speechSynthesis.pause();
    isSpeaking = false;
    pauseBtn.classList.add("hidden");
    startBtn.classList.remove("hidden");
});

function startReading() {
    window.speechSynthesis.cancel();

    if (!currentText[currentPage]) return;

    const words = wordPositions[currentPage]; // Retrieve pre-processed word positions for the current page

    if (wordIndex >= words.length) wordIndex = 0; // Reset wordIndex if it exceeds the text length

    isSpeaking = true;
    speechEngine.text = currentText[currentPage];

    speechEngine.onboundary = (event) => {
        if (event.name === "word" && wordIndex < words.length) {
            highlightWordSequentially(words, wordIndex);
            wordIndex++;
        }
    };

    speechEngine.onend = () => {
        if (currentPage < currentText.length - 1) {
            currentPage++;
            wordIndex = 0; // Reset word index for the next page
            startReading();
        } else {
            isSpeaking = false;
            clearAllHighlights(); // Clear any remaining highlights
            startBtn.classList.remove("hidden");
            pauseBtn.classList.add("hidden");
        }
    };

    window.speechSynthesis.speak(speechEngine);

    startBtn.classList.add("hidden");
    pauseBtn.classList.remove("hidden");
}

function highlightWordSequentially(words, index) {
    const pageElement = document.getElementById(`page-${currentPage}`);
    if (!pageElement) return;

    // Clear previous highlights
    clearAllHighlights();

    const textNodes = [];
    const walker = document.createTreeWalker(pageElement, NodeFilter.SHOW_TEXT, null);

    // Collect all text nodes in the current page
    while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
    }

    let charCount = 0;
    for (const textNode of textNodes) {
        const nodeText = textNode.nodeValue;

        // Check if the current text node contains the target word
        if (charCount + nodeText.length >= words[index].start && charCount <= words[index].end) {
            const highlightStart = words[index].start - charCount;
            const highlightEnd = words[index].end - charCount;

            // Split the text node into three parts: before, the word, and after
            const before = nodeText.slice(0, highlightStart);
            const word = nodeText.slice(highlightStart, highlightEnd);
            const after = nodeText.slice(highlightEnd);

            // Create a span for the highlighted word
            const highlightSpan = document.createElement("span");
            highlightSpan.textContent = word;
            highlightSpan.style.backgroundColor = "yellow";

            // Replace the text node with the new structure
            const parent = textNode.parentNode;
            parent.insertBefore(document.createTextNode(before), textNode);
            parent.insertBefore(highlightSpan, textNode);
            parent.insertBefore(document.createTextNode(after), textNode);
            parent.removeChild(textNode);

            break;
        }

        charCount += nodeText.length;
    }
}

function clearAllHighlights() {
    const pageElement = document.getElementById(`page-${currentPage}`);
    if (!pageElement) return;

    // Traverse the page and remove highlight spans
    const highlightSpans = pageElement.querySelectorAll("span[style*='background-color: yellow']");
    for (const span of highlightSpans) {
        const parent = span.parentNode;
        parent.replaceChild(document.createTextNode(span.textContent), span);
        parent.normalize(); // Combine adjacent text nodes
    }
}


function extractWordOffsets(text) {
    // Match words and calculate their start and end offsets
    const wordRegex = /\b\w+('\w+)?\b/g;
    const words = [];
    let match;
    while ((match = wordRegex.exec(text)) !== null) {
        words.push({ word: match[0], start: match.index, end: match.index + match[0].length });
    }
    return words;
}

// Function to toggle the visibility of play/pause controls
function togglePlayPauseControls(show) {
    if (show) {
        playPauseControls.classList.remove("hidden");
    } else {
        playPauseControls.classList.add("hidden");
    }
}

// Initial setup
togglePlayPauseControls(false);
