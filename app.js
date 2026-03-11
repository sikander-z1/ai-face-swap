// Get references to all the HTML elements we'll need
const apiKeyInput = document.getElementById('apiKey');
const sourceImageInput = document.getElementById('sourceImage');
const targetImageInput = document.getElementById('targetImage');
const swapButton = document.getElementById('swapButton');
const statusDiv = document.getElementById('status');
const resultDiv = document.getElementById('result');

const API_BASE_URL = 'https://aiphotocraft.com';

// This function will check the status of our task every 3 seconds
const checkTaskStatus = async (taskId, apiKey) => {
    statusDiv.textContent = 'Processing... Please wait.';

    const interval = setInterval(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/task-status/${taskId}`, {
                headers: {
                    'X-Api-Key': apiKey,
                    'accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            // Check the status from the API response
            if (data.status === 'completed' && data.result_url) {
                clearInterval(interval); // Stop checking
                statusDiv.textContent = 'Face Swap Complete!';
                resultDiv.innerHTML = `<img src="${data.result_url}" alt="Face Swap Result">`;
                swapButton.disabled = false;
                swapButton.textContent = 'Swap Faces!';
            } else if (data.status === 'failed') {
                clearInterval(interval); // Stop checking
                statusDiv.textContent = 'Task failed. Please try again.';
                swapButton.disabled = false;
                swapButton.textContent = 'Swap Faces!';
            }
            // If still processing, the loop will just continue
        } catch (error) {
            clearInterval(interval); // Stop on error
            console.error('Error checking task status:', error);
            statusDiv.textContent = 'Error checking status. See console for details.';
            swapButton.disabled = false;
            swapButton.textContent = 'Swap Faces!';
        }
    }, 3000); // Check every 3 seconds (3000 milliseconds)
};

// This is the main function that starts the face swap
const handleFaceSwap = async () => {
    // Get the values from the input fields
    const apiKey = apiKeyInput.value;
    const sourceImage = sourceImageInput.files[0];
    const targetImage = targetImageInput.files[0];

    // Simple validation
    if (!apiKey || !sourceImage || !targetImage) {
        statusDiv.textContent = 'Please provide an API Key and both images.';
        return;
    }

    // Disable the button and show a message
    swapButton.disabled = true;
    swapButton.textContent = 'Uploading...';
    statusDiv.textContent = 'Uploading images...';
    resultDiv.innerHTML = '';

    // The API needs the data in a specific format called FormData
    const formData = new FormData();
    formData.append('srcimage', sourceImage);
    formData.append('targetimage', targetImage);
    formData.append('enhance', 'true'); // Let's enhance the result

    try {
        // First API call: submit the images for processing
        const response = await fetch(`${API_BASE_URL}/api/faceswap/basicswap`, {
            method: 'POST',
            headers: {
                'X-Api-Key': apiKey
                // Content-Type is set automatically by the browser for FormData
            },
            body: formData
        });

        if (!response.ok) {
            // If the server returns an error, show it
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();

        // If we get a task ID, start checking the status
        if (data.task_id) {
            statusDiv.textContent = `Task submitted successfully! Task ID: ${data.task_id}`;
            checkTaskStatus(data.task_id, apiKey);
        } else {
            throw new Error('Did not receive a task ID.');
        }

    } catch (error) {
        console.error('Error starting face swap:', error);
        statusDiv.textContent = `Error: ${error.message}`;
        swapButton.disabled = false;
        swapButton.textContent = 'Swap Faces!';
    }
};

// Add an event listener to the button
swapButton.addEventListener('click', handleFaceSwap);