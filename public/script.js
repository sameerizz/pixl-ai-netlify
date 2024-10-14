import { client } from "@gradio/client";

// Wait for the DOM to be fully loaded before executing the script
document.addEventListener('DOMContentLoaded', () => {
    // Select all necessary DOM elements
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.content');
    const form = document.getElementById('image-form');
    const prompt = document.getElementById('prompt');
    const result = document.getElementById('result');
    const enhanceContainer = document.querySelector('.enhance-container');
    const enhanceBackground = document.querySelector('.enhance-background');

    // Function to set the active tab
    function setActiveTab(tabName) {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(content => content.classList.remove('active'));

        const activeTab = document.querySelector(`.tab[data-tab="${tabName}"]`);
        const activeContent = document.getElementById(tabName);

        if (activeTab && activeContent) {
            activeTab.classList.add('active');
            activeContent.classList.add('active');
            localStorage.setItem('activeTab', tabName);
        }
    }

    // Tab functionality
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            setActiveTab(tabName);
        });
    });

    // Check for active tab in localStorage and set it
    const savedTab = localStorage.getItem('activeTab');
    if (savedTab) {
        setActiveTab(savedTab);
    } else {
        // If no saved tab, set 'home' as default
        setActiveTab('home');
    }

    // Form submission for image generation
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userPrompt = prompt.value.trim();
        if (!userPrompt) return;

        try {
            result.innerHTML = '<p>Generating image...</p>';
            console.log("Sending prompt:", userPrompt);
            const imageUrl = await generateImage(userPrompt);
            console.log("Received image URL:", imageUrl);
            displayImage(imageUrl);
            enableImageActions(imageUrl);
        } catch (error) {
            console.error("Error in form submission:", error);
            result.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    });

    // Image generation function (currently using mock data)
    async function generateImage(prompt) {
        try {
            const hf_token = import.meta.env.VITE_HF_TOKEN;
            const app = await client("black-forest-labs/FLUX.1-schnell", {
                hf_token: hf_token
            });
            const result = await app.predict("/infer", [
                prompt,                          // string  in 'prompt' Textbox component
                Math.floor(Math.random() * 1000000), // number  in 'seed' Slider component
                true,                            // boolean  in 'randomize_seed' Checkbox component
                512,                             // number  in 'width' Slider component
                512,                             // number  in 'height' Slider component
                4,                               // number  in 'num_inference_steps' Slider component
            ]);

            console.log("API Response:", result); // Log the entire response

            if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
                const imageData = result.data[0];
                if (typeof imageData === 'object' && imageData.url) {
                    return imageData.url; // Return the URL of the generated image
                } else {
                    console.error("Unexpected image data format:", imageData);
                    throw new Error("Unexpected image data format");
                }
            } else {
                console.error("Unexpected API response structure:", result);
                throw new Error("Unexpected API response structure");
            }
        } catch (error) {
            console.error("Error generating image:", error);
            throw new Error(`Failed to generate image: ${error.message}`);
        }
    }

    // Display the generated image in the result container
    function displayImage(imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = "Generated Image";
        img.onload = function() {
            result.innerHTML = '';
            result.appendChild(img);
        };
        img.onerror = function() {
            result.innerHTML = '<p>Error loading image</p>';
        };
        result.innerHTML = '<p>Loading image...</p>';
    }

    // Save generated image data to Firebase (placeholder function)
    // function saveToFirebase(prompt, imageUrl) {
    //     TODO: Implement Firebase saving logic here
    //     console.log('Saving to Firebase:', { prompt, imageUrl });
    // }

    // Add 3D effect to the enhance section on mouse move
    enhanceContainer.addEventListener('mousemove', (e) => {
        const { left, top, width, height } = enhanceContainer.getBoundingClientRect();
        const x = (e.clientX - left) / width - 0.5;
        const y = (e.clientY - top) / height - 0.5;
        
        // Apply 3D transform to the background
        enhanceBackground.style.transform = `
          scale(1.05)
          translate(${x * 20}px, ${y * 20}px)
          rotateX(${y * 10}deg)
          rotateY(${-x * 10}deg)
        `;
        // Add dynamic shadow based on mouse position
        enhanceBackground.style.boxShadow = `
          0 ${20 + y * 20}px 50px rgba(0, 0, 0, 0.4)
        `;
        // Apply 3D transform to the text
        enhanceBackground.querySelector('.enhance-text').style.transform = `
          translateX(-50%)
          translateY(${y * 10}px)
          rotateX(${-y * 10}deg)
          rotateY(${x * 10}deg)
        `;
        // Adjust the opacity of the pseudo-element
        enhanceBackground.style.setProperty('--before-opacity', '0');
    });
    
    // Reset 3D effect when mouse leaves the enhance section
    enhanceContainer.addEventListener('mouseleave', () => {
        enhanceBackground.style.transform = 'scale(1) translate(0, 0) rotateX(0) rotateY(0)';
        enhanceBackground.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
        enhanceBackground.querySelector('.enhance-text').style.transform = 'translateX(-50%) translateY(0) rotateX(0) rotateY(0)';
        enhanceBackground.style.setProperty('--before-opacity', '0.3');
    });

    // Function to enable image actions (download and share)
    function enableImageActions(imageUrl) {
        const downloadBtn = document.querySelector('.download-btn');
        const shareBtn = document.querySelector('.share-btn');

        if (downloadBtn) {
            downloadBtn.onclick = () => downloadImage(imageUrl);
        }

        if (shareBtn) {
            shareBtn.onclick = () => shareImage(imageUrl);
        }
    }

    // Function to handle image download
    function downloadImage(imageUrl) {
        window.open(imageUrl, '_blank');
    }

    // Function to handle image sharing (copy link to clipboard)
    function shareImage(imageUrl) {
        navigator.clipboard.writeText(imageUrl).then(() => {
            alert('Image link copied to clipboard!');
        }).catch(err => {
            console.error('Error copying link to clipboard:', err);
            alert('Failed to copy image link. Please try again.');
        });
    }
});
