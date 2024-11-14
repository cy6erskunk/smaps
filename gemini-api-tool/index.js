// Check and update API key status on page load
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('generateText').addEventListener('click', () => {
        saveInputsValues();
        generateText();
    });
    updateApiKeyStatus();
    restoreFormValues();
});

function updateApiKeyStatus() {
    const apiKey = localStorage.getItem('geminiApiKey');
    const statusElement = document.getElementById('apiKeyStatus');
    const apiKeyInput = document.getElementById('apiKey');

    if (apiKey) {
        statusElement.textContent = 'API Key is saved';
        statusElement.style.color = '#28a745';
        apiKeyInput.value = ''; // Clear the input field
    } else {
        statusElement.textContent = 'No API Key saved';
        statusElement.style.color = '#dc3545';
    }
}

function saveApiKey() {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (apiKey) {
        localStorage.setItem('geminiApiKey', apiKey);
        updateApiKeyStatus();
    } else {
        alert('Please enter an API key');
    }
}

function clearApiKey() {
    localStorage.removeItem('geminiApiKey');
    document.getElementById('apiKey').value = '';
    updateApiKeyStatus();
}

async function generateText() {
    const prompt = document.getElementById('prompt').value || 'describe the image';
    const imageUrl = document.getElementById('imageUrl').value;
    const apiKey = localStorage.getItem('geminiApiKey');
    const outputElement = document.getElementById('output');

    if (!apiKey) {
        outputElement.textContent = 'Please save your API key first.';
        return;
    }

    if (!prompt || !imageUrl) {
        outputElement.textContent = 'Please fill in both prompt and image URL fields.';
        return;
    }

    outputElement.textContent = 'Generating response...';

    try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

        const [mimeType, base64String] = await imageUrlToBase64(imageUrl);
        const requestBody = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType,
                            data: base64String
                        }
                    }
                ]
            }]
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Extract the text from the response
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
            const responseText = data.candidates[0].content.parts[0].text;
            outputElement.textContent = responseText;
            processJsonInResponse(responseText, imageUrl);
        } else {
            throw new Error('Unexpected response format');
        }
    } catch (error) {
        outputElement.textContent = 'Error: ' + error.message;
    }
}

async function imageUrlToBase64(imageUrl) {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const pre_blob = await response.blob();
        // render image to canvas to remove exif data
        const blob = await renderBlobToCanvas(pre_blob);

        // Create a FileReader to read the blob
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                // reader.result contains the base64 string that starts with 'data:image/png;base64,'
                const base64String = reader.result.split(',')[1];
                const mimeType = reader.result.split(',')[0].split(':')[1].split(';')[0];
                resolve([mimeType, base64String]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error converting image to base64:', error);
        throw error;
    }
}

function renderBlobToCanvas(blob) {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    const imageUrl = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => {
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);

            // Cleanup
            URL.revokeObjectURL(imageUrl);
            resolve(new Promise((innerResolve) => {
                canvas.toBlob((blob) => {
                    innerResolve(new File([blob], "compressed_image.jpg", { type: "image/jpeg" }));
                }, 'image/jpeg', 1.0);
            }));
        };

        image.onerror = reject;

        image.src = imageUrl;
    });
}

function isInputNotAllowed(input) {
    return input.type === 'submit' || input.type === 'button' || input.type === 'password';
}

function saveInputsValues() {
    const inputs = document.querySelectorAll('input, select, textarea');

    const formData = {};

    inputs.forEach(input => {
        if (isInputNotAllowed(input)) { return; }

        if (input.type === 'checkbox' || input.type === 'radio') {
            formData[input.id || input.name] = input.checked;
        } else {
            formData[input.id || input.name] = input.value;
        }
    });
    localStorage.setItem('formData', JSON.stringify(formData));
}

function restoreFormValues() {
    const savedData = localStorage.getItem('formData');

    if (!savedData) return;

    const formData = JSON.parse(savedData);

    const inputs = document.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        if (isInputNotAllowed(input)) { return; }

        const identifier = input.id || input.name;

        if (formData.hasOwnProperty(identifier)) {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = formData[identifier];
            } else {
                input.value = formData[identifier];
            }
        }
    });
}

function processJsonInResponse(responseText, imageUrl) {
    try {
        // Find the start and end indices of the JSON content
        const startIndex = responseText.indexOf('```json') + '```json'.length;
        const endIndex = responseText.lastIndexOf('```');
        const jsonContent = responseText.slice(startIndex, endIndex);
        // Parse the JSON content
        const jsonObject = JSON.parse(jsonContent);

        renderBoundingBoxesOnCanvas(imageUrl, jsonObject);
    } catch (error) {
        console.log('Error parsing JSON:', error);
    }
}

function renderBoundingBoxesOnCanvas(imageUrl, { items }) {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');

    items.forEach(area => {
        ctx.beginPath();
        ctx.rect(Math.round(area.x / 1000 * canvas.width),
            Math.round(area.y / 1000 * canvas.height),
            Math.round(area.width / 1000 * canvas.width),
            Math.round(area.height / 1000 * canvas.height));
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}