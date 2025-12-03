// Backend server URL (force production)
const API_URL = 'https://mistress-milana-backend.vercel.app/api';

const STORAGE_KEYS = {
    authToken: 'admin_auth_token',
    adminUsername: 'admin_username',
    galleryImages: 'gallery_images_b2'
};

let selectedFiles = [];
let selectedAboutImage = null;

// Helper function to trigger file input (works better on mobile)
function triggerGalleryFileInput() {
    const fileInput = document.getElementById('fileInput');
    fileInput.value = null; // Reset to ensure change event fires
    fileInput.click();
}

// Helper function for about image input
function triggerAboutFileInput() {
    const aboutInput = document.getElementById('aboutImageInput');
    aboutInput.value = null; // Reset to ensure change event fires
    aboutInput.click();
}

// Helper function for news image input
function triggerNewsFileInput() {
    const newsInput = document.getElementById('newsImage');
    newsInput.value = null; // Reset to ensure change event fires
    newsInput.click();
}

// Get auth token from localStorage
function getAuthToken() {
    return localStorage.getItem(STORAGE_KEYS.authToken);
}

// Set auth token in localStorage
function setAuthToken(token) {
    localStorage.setItem(STORAGE_KEYS.authToken, token);
}

// Remove auth token
function removeAuthToken() {
    localStorage.removeItem(STORAGE_KEYS.authToken);
    localStorage.removeItem(STORAGE_KEYS.adminUsername);
}

// Check if user is authenticated
async function isAuthenticated() {
    const token = getAuthToken();
    if (!token) return false;

    try {
        const response = await fetch(`${API_URL}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.ok;
    } catch (error) {
        console.error('Auth verification failed:', error);
        return false;
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', async () => {
    if (await isAuthenticated()) {
        showDashboard();
    } else {
        removeAuthToken();
        showLogin();
    }
});

// Login Form Handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    const submitButton = e.target.querySelector('button[type="submit"]');

    // Disable button during login
    submitButton.disabled = true;
    submitButton.textContent = 'Logging in...';
    errorMessage.textContent = '';

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            setAuthToken(data.token);
            localStorage.setItem(STORAGE_KEYS.adminUsername, data.username);
            showDashboard();
        } else {
            errorMessage.textContent = data.error || 'Invalid credentials';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = 'Login failed. Please try again.';
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Login';
    }
});

// Logout Handler
document.getElementById('logoutBtn').addEventListener('click', () => {
    removeAuthToken();
    showLogin();
});

// Show Dashboard
function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';

    const username = localStorage.getItem(STORAGE_KEYS.adminUsername) || 'Admin';
    document.getElementById('adminUsername').textContent = username;

    loadGalleryImages();
    updateStats();
    loadAboutImage();
    initializeNewsManagement();
    initializeTabs();
}

// Tab Navigation
function initializeTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    const galleryTab = document.getElementById('galleryTab');
    const newsTab = document.getElementById('newsTab');

    // Show gallery tab by default
    if (galleryTab) {
        galleryTab.style.display = 'block';
    }
    if (newsTab) {
        newsTab.style.display = 'none';
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));

            // Add active class to clicked tab
            tab.classList.add('active');

            // Show/hide content
            const tabName = tab.getAttribute('data-tab');
            if (tabName === 'gallery') {
                galleryTab.style.display = 'block';
                newsTab.style.display = 'none';
            } else if (tabName === 'news') {
                galleryTab.style.display = 'none';
                newsTab.style.display = 'block';
            }
        });
    });
}

// Show Login
function showLogin() {
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('loginForm').reset();
}

// File Input Handler
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const previewContainer = document.getElementById('previewContainer');
const uploadButton = document.getElementById('uploadButton');

fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
    }
});

// Drag and Drop Handlers
uploadArea.addEventListener('click', () => {
    // Reset file input before opening to ensure change event fires
    fileInput.value = null;
    fileInput.click();
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

// Handle Files
function handleFiles(files) {
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

    if (validFiles.length === 0) {
        alert('Please select valid image files');
        return;
    }

    selectedFiles = [...selectedFiles, ...validFiles];
    displayPreviews();
    uploadButton.style.display = 'block';
}

// Display Previews
function displayPreviews() {
    previewContainer.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';

            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Preview ${index + 1}">
                <button class="preview-remove" onclick="removePreview(${index})">×</button>
            `;

            previewContainer.appendChild(previewItem);
        };

        reader.readAsDataURL(file);
    });
}

// Remove Preview
function removePreview(index) {
    selectedFiles.splice(index, 1);
    displayPreviews();

    if (selectedFiles.length === 0) {
        uploadButton.style.display = 'none';
    }
}

// Upload Images to Backblaze B2 via Backend
uploadButton.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;

    uploadButton.disabled = true;
    uploadButton.innerHTML = '<span class="loading"></span> Uploading to Backblaze B2...';

    try {
        const galleryImages = await getGalleryImages();
        let uploadedCount = 0;

        // Upload each file to backend
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];

            try {
                uploadButton.innerHTML = `<span class="loading"></span> Uploading ${i + 1}/${selectedFiles.length} to B2...`;

                const formData = new FormData();
                formData.append('image', file);

                const response = await fetch(`${API_URL}/upload`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${getAuthToken()}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('Upload failed');
                }

                const result = await response.json();

                if (result.success) {
                    galleryImages.push(result);
                    uploadedCount++;
                }
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
                alert(`Failed to upload ${file.name}. Check if the server is running.`);
            }
        }

        if (uploadedCount > 0) {
            saveGalleryImages(galleryImages);
            showSuccessMessage(`${uploadedCount} image(s) uploaded successfully to Backblaze B2!`);
        }

        // Reset state completely
        selectedFiles = [];
        previewContainer.innerHTML = '';
        fileInput.value = null; // Use null to fully reset
        uploadButton.style.display = 'none';
        uploadButton.disabled = false;
        uploadButton.textContent = 'Upload Images';

        // Reload gallery
        loadGalleryImages();
        updateStats();
        syncToMainWebsite();

    } catch (error) {
        console.error('Upload error:', error);
        alert('Upload failed. Make sure the backend server is running (npm start).');
        uploadButton.disabled = false;
        uploadButton.textContent = 'Upload Images';
    }
});

// Get Gallery Images
async function getGalleryImages() {
    try {
        const response = await fetch(`${API_URL}/images`);
        if (response.ok) {
            const data = await response.json();
            return data.images || [];
        }
    } catch (error) {
        console.log('Using local storage fallback');
    }

    // Fallback to localStorage
    const images = localStorage.getItem(STORAGE_KEYS.galleryImages);
    return images ? JSON.parse(images) : [];
}

// Save Gallery Images to LocalStorage
function saveGalleryImages(images) {
    localStorage.setItem(STORAGE_KEYS.galleryImages, JSON.stringify(images));
}

// Load Gallery Images
async function loadGalleryImages() {
    const galleryGrid = document.getElementById('galleryGrid');
    const images = await getGalleryImages();

    if (images.length === 0) {
        galleryGrid.innerHTML = `
            <div class="empty-gallery">
                <div class="empty-gallery-icon">📷</div>
                <p>No images in gallery yet. Upload your first image to Backblaze B2!</p>
            </div>
        `;
        return;
    }

    galleryGrid.innerHTML = '';

    // Reverse to show newest first
    const sortedImages = [...images].reverse();

    sortedImages.forEach(image => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item-admin';

        galleryItem.innerHTML = `
            <img src="${image.url}" alt="${image.originalName || image.fileName}">
            <div class="gallery-item-actions">
                <button class="btn-delete" onclick="deleteImage('${image.id}', '${encodeURIComponent(image.fileName)}')">Delete</button>
            </div>
        `;

        galleryGrid.appendChild(galleryItem);
    });
}

// Delete Image from B2
async function deleteImage(imageId, fileName) {
    if (!confirm('Are you sure you want to delete this image from Backblaze B2?')) return;

    try {
        const response = await fetch(`${API_URL}/delete/${imageId}/${fileName}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Delete failed');
        }

        // Remove from local storage
        let images = await getGalleryImages();
        images = images.filter(img => img.id !== imageId);
        saveGalleryImages(images);

        loadGalleryImages();
        updateStats();
        syncToMainWebsite();
        showSuccessMessage('Image deleted successfully from Backblaze B2');
    } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete image. Make sure the server is running.');
    }
}

// Update Stats
async function updateStats() {
    const images = await getGalleryImages();
    document.getElementById('totalImages').textContent = images.length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUploads = images.filter(img => {
        const uploadDate = new Date(img.uploadDate);
        return uploadDate > sevenDaysAgo;
    }).length;

    document.getElementById('recentUploads').textContent = recentUploads;
}

// Show Success Message
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;

    const uploadSection = document.querySelector('.upload-section');
    uploadSection.insertBefore(successDiv, uploadSection.firstChild);

    setTimeout(() => {
        successDiv.remove();
    }, 4000);
}

// Sync to Main Website
async function syncToMainWebsite() {
    const images = await getGalleryImages();
    localStorage.setItem('website_gallery_images', JSON.stringify(images));
}

// About Image Management
const aboutImageInput = document.getElementById('aboutImageInput');
const uploadAboutButton = document.getElementById('uploadAboutButton');

aboutImageInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        selectedAboutImage = e.target.files[0];

        // Preview the image immediately
        const reader = new FileReader();
        reader.onload = (event) => {
            const imgElement = document.getElementById('currentAboutImage');
            imgElement.src = event.target.result;
            imgElement.style.display = 'block';
        };
        reader.readAsDataURL(selectedAboutImage);

        // Show upload button
        uploadAboutButton.style.display = 'block';
    }
});

uploadAboutButton.addEventListener('click', async () => {
    if (!selectedAboutImage) return;

    uploadAboutButton.disabled = true;
    uploadAboutButton.innerHTML = '<span class="loading"></span> Uploading to B2...';

    try {
        const formData = new FormData();
        formData.append('image', selectedAboutImage);

        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const result = await response.json();

        if (result.success) {
            // Save the about image to MongoDB via backend
            const saveResponse = await fetch(`${API_URL}/about-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify({
                    url: result.url,
                    fileId: result.id,
                    fileName: result.fileName
                })
            });

            if (!saveResponse.ok) {
                throw new Error('Failed to save image reference to database');
            }

            // Update localStorage as backup
            localStorage.setItem('about_image_url', result.url);
            localStorage.setItem('about_image_data', JSON.stringify(result));

            // Update the displayed image with the B2 URL
            document.getElementById('currentAboutImage').src = result.url;

            // Update main website
            syncAboutImageToWebsite();

            showSuccessMessage('About Me image updated successfully on Backblaze B2 and database!');
            
            // Reset state
            selectedAboutImage = null;
            aboutImageInput.value = null;
            uploadAboutButton.style.display = 'none';
        }

        uploadAboutButton.disabled = false;
        uploadAboutButton.textContent = 'Update About Image';

    } catch (error) {
        console.error('Upload error:', error);
        alert('Upload failed. Check console for details and ensure you are logged in.');
        uploadAboutButton.disabled = false;
        uploadAboutButton.textContent = 'Update About Image';
    }
});

async function loadAboutImage() {
    try {
        // Try to fetch from backend API first
        const response = await fetch(`${API_URL}/about-image`);
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.image && data.image.url) {
                document.getElementById('currentAboutImage').src = data.image.url;
                // Update localStorage as cache
                localStorage.setItem('about_image_url', data.image.url);
                return;
            }
        }
    } catch (error) {
        console.log('Could not fetch about image from API, trying localStorage');
    }

    // Fallback to localStorage
    const aboutImageUrl = localStorage.getItem('about_image_url');
    if (aboutImageUrl) {
        document.getElementById('currentAboutImage').src = aboutImageUrl;
    } else {
        // Default placeholder
        document.getElementById('currentAboutImage').src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f5f1e8" width="400" height="400"/%3E%3Ctext fill="%236a6a6a" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
    }
}

function syncAboutImageToWebsite() {
    const aboutImageUrl = localStorage.getItem('about_image_url');
    if (aboutImageUrl) {
        localStorage.setItem('website_about_image', aboutImageUrl);
    }
}

// ===== NEWS/EVENTS MANAGEMENT =====

let selectedNewsImage = null;

// News Image Preview
const newsImageInput = document.getElementById('newsImage');
const newsImagePreview = document.getElementById('newsImagePreview');

newsImageInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        selectedNewsImage = e.target.files[0];

        // Preview the image immediately
        const reader = new FileReader();
        reader.onload = (event) => {
            newsImagePreview.innerHTML = `<img src="${event.target.result}" alt="Preview" style="width: 100%; height: auto; border-radius: 6px; display: block;">`;
        };
        reader.readAsDataURL(selectedNewsImage);
    }
});

// News Form Submit Handler
document.getElementById('newsForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedNewsImage) {
        alert('Please select an image for the event');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span> Creating...';

    try {
        // Upload image to B2
        const formData = new FormData();
        formData.append('image', selectedNewsImage);

        const uploadResponse = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: formData
        });

        if (!uploadResponse.ok) {
            throw new Error('Image upload failed');
        }

        const uploadResult = await uploadResponse.json();

        // Create news card object
        const newsCard = {
            title: document.getElementById('newsTitle').value,
            description: document.getElementById('newsDescription').value,
            date: document.getElementById('newsDate').value,
            category: document.getElementById('newsCategory').value,
            location: document.getElementById('newsLocation').value,
            imageUrl: uploadResult.url,
            imageId: uploadResult.fileId,
            imageFileName: uploadResult.fileName
        };

        // Save to MongoDB
        await saveNewsCard(newsCard);

        // Reset form
        document.getElementById('newsForm').reset();
        newsImagePreview.innerHTML = '';
        selectedNewsImage = null;

        // Reload news cards display
        await loadNewsCardsAdmin();

        showSuccessMessage('Event card created successfully!');

    } catch (error) {
        console.error('Error creating news card:', error);
        alert('Failed to create event card: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// Get News Cards from MongoDB
async function getNewsCards() {
    try {
        console.log('Fetching news cards from:', `${API_URL}/news`);
        const response = await fetch(`${API_URL}/news`);
        console.log('News cards response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch news cards:', response.status, errorText);
            throw new Error('Failed to fetch news cards');
        }
        
        const data = await response.json();
        console.log('News cards data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching news cards:', error);
        return [];
    }
}

// Save News Card to MongoDB
async function saveNewsCard(newsCard) {
    try {
        console.log('Saving news card:', newsCard);
        const response = await fetch(`${API_URL}/news`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(newsCard)
        });
        
        console.log('Save news card response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to save news card:', response.status, errorText);
            throw new Error(`Failed to save news card: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('News card saved successfully:', result);
        return result;
    } catch (error) {
        console.error('Error saving news card:', error);
        throw error;
    }
}

// Load News Cards in Admin
async function loadNewsCardsAdmin() {
    const newsCardsGrid = document.getElementById('newsCardsGrid');
    
    if (!newsCardsGrid) {
        console.error('News cards grid element not found');
        return;
    }
    
    const newsCards = await getNewsCards();
    console.log('Loading news cards count:', newsCards.length);

    if (!newsCards || newsCards.length === 0) {
        newsCardsGrid.innerHTML = `
            <div class="news-empty-state">
                <div style="font-size: 60px; margin-bottom: 15px;">📰</div>
                <p>No news or events created yet. Create your first event card above!</p>
            </div>
        `;
        return;
    }

    newsCardsGrid.innerHTML = '';

    // Sort by date (newest first)
    newsCards.sort((a, b) => new Date(b.date) - new Date(a.date));

    newsCards.forEach(card => {
        const newsCardDiv = document.createElement('div');
        newsCardDiv.className = 'news-card-admin';

        const formattedDate = new Date(card.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        newsCardDiv.innerHTML = `
            <div class="news-card-admin-image">
                <img src="${card.imageUrl}" alt="${card.title}">
            </div>
            <div class="news-card-admin-content">
                <div class="news-card-admin-date">${formattedDate}</div>
                <h4 class="news-card-admin-title">${card.title}</h4>
                <p class="news-card-admin-description">${card.description}</p>
                <div class="news-card-admin-meta">
                    <span class="news-card-admin-category">${card.category}</span>
                    ${card.location ? `<span class="news-card-admin-location">📍 ${card.location}</span>` : '<span></span>'}
                </div>
                <div class="news-card-admin-actions">
                    <button class="btn-delete" onclick="deleteNewsCard('${card._id}', '${card.imageId}', '${encodeURIComponent(card.imageFileName)}')">Delete</button>
                </div>
            </div>
        `;

        newsCardsGrid.appendChild(newsCardDiv);
    });
}

// Delete News Card
async function deleteNewsCard(cardId, imageId, imageFileName) {
    if (!confirm('Are you sure you want to delete this event card? This action cannot be undone.')) return;

    try {
        console.log('Deleting news card:', cardId);
        
        // Delete image from B2
        console.log('Deleting image from B2:', imageId, imageFileName);
        const imageResponse = await fetch(`${API_URL}/delete/${imageId}/${imageFileName}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!imageResponse.ok) {
            const errorText = await imageResponse.text();
            console.error('Failed to delete image:', imageResponse.status, errorText);
            throw new Error('Failed to delete image from B2');
        }

        // Delete from MongoDB
        console.log('Deleting news card from database:', cardId);
        const response = await fetch(`${API_URL}/news/${cardId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to delete news card:', response.status, errorText);
            throw new Error('Failed to delete news card from database');
        }

        console.log('News card deleted successfully');

        // Reload display
        await loadNewsCardsAdmin();

        showSuccessMessage('Event card deleted successfully from B2 and database!');

    } catch (error) {
        console.error('Error deleting news card:', error);
        alert('Failed to delete event card: ' + error.message);
    }
}

// Initialize news cards on dashboard load
function initializeNewsManagement() {
    loadNewsCardsAdmin();
}
