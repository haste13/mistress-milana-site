// Backblaze B2 Configuration
const B2_CONFIG = {
    keyId: '0051a031cc090120000000005', // Your Application Key ID
    applicationKey: 'K005XJnkC0P7Ft1Lb1ZncMqo2pKtBoE', // Your Application Key
    bucketId: '51da1023a10ccc4099a00112', // Your Bucket ID
    bucketName: 'Milana', // Your Bucket Name
    endpoint: 'https://s3.us-east-005.backblazeb2.com' // Your endpoint
};

// Cache for B2 auth token
let b2AuthToken = null;
let b2ApiUrl = null;
let b2DownloadUrl = null;

// Admin credentials
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'mistress2025'
};

const STORAGE_KEYS = {
    isLoggedIn: 'admin_logged_in',
    galleryImages: 'gallery_images_b2'
};

let selectedFiles = [];

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem(STORAGE_KEYS.isLoggedIn) === 'true') {
        showDashboard();
    }
});

// Login Form Handler
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        localStorage.setItem(STORAGE_KEYS.isLoggedIn, 'true');
        localStorage.setItem('admin_username', username);
        errorMessage.textContent = '';
        showDashboard();
    } else {
        errorMessage.textContent = 'Invalid username or password';
    }
});

// Logout Handler
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEYS.isLoggedIn);
    localStorage.removeItem('admin_username');
    showLogin();
});

// Show Dashboard
function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    
    const username = localStorage.getItem('admin_username') || 'Admin';
    document.getElementById('adminUsername').textContent = username;
    
    loadGalleryImages();
    updateStats();
}

// Show Login
function showLogin() {
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('loginForm').reset();
}

// Note: Direct browser upload to B2 has CORS limitations
// For production, you need a backend server to handle uploads
// For now, we'll convert images to base64 and store URLs as if they were on B2
async function authenticateB2() {
    // Simulate authentication success for demo purposes
    // In production, this would be handled by your backend server
    return true;
}

// Get Upload URL from B2
async function getUploadUrl() {
    if (!b2AuthToken) {
        await authenticateB2();
    }
    
    try {
        const response = await fetch(`${b2ApiUrl}/b2api/v2/b2_get_upload_url`, {
            method: 'POST',
            headers: {
                'Authorization': b2AuthToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bucketId: B2_CONFIG.bucketId
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to get upload URL');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error getting upload URL:', error);
        throw error;
    }
}

// Upload file to B2 (converted to base64 for demo)
// Note: For production with real B2 upload, you need a backend server
async function uploadToB2(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const imageData = {
                id: Date.now() + Math.random(),
                fileName: `gallery/${Date.now()}-${file.name}`,
                url: e.target.result, // Base64 data URL (in production, this would be the B2 URL)
                uploadDate: new Date().toISOString(),
                originalName: file.name,
                size: file.size
            };
            resolve(imageData);
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsDataURL(file);
    });
}

// Delete file from B2 (local storage version)
async function deleteFromB2(fileName, fileId) {
    // In production with real B2, this would call the B2 API
    // For now, deletion is handled in the deleteImage function
    return true;
}

// File Input Handler
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const previewContainer = document.getElementById('previewContainer');
const uploadButton = document.getElementById('uploadButton');

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// Drag and Drop Handlers
uploadArea.addEventListener('click', () => {
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

// Upload Images to B2
uploadButton.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;
    
    uploadButton.disabled = true;
    uploadButton.innerHTML = '<span class="loading"></span> Uploading to Backblaze B2...';
    
    try {
        // Authenticate with B2
        const authenticated = await authenticateB2();
        if (!authenticated) {
            throw new Error('Authentication failed');
        }
        
        const galleryImages = getGalleryImages();
        let uploadedCount = 0;
        
        // Upload each file
        for (const file of selectedFiles) {
            try {
                const imageData = await uploadToB2(file);
                galleryImages.push(imageData);
                uploadedCount++;
                
                // Update button text with progress
                uploadButton.innerHTML = `<span class="loading"></span> Uploading ${uploadedCount}/${selectedFiles.length}...`;
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
            }
        }
        
        if (uploadedCount > 0) {
            saveGalleryImages(galleryImages);
            showSuccessMessage(`${uploadedCount} image(s) uploaded successfully!`);
        }
        
        // Reset
        selectedFiles = [];
        previewContainer.innerHTML = '';
        fileInput.value = '';
        uploadButton.style.display = 'none';
        uploadButton.disabled = false;
        uploadButton.textContent = 'Upload Images';
        
        // Reload gallery
        loadGalleryImages();
        updateStats();
        syncToMainWebsite();
        
    } catch (error) {
        console.error('Upload error:', error);
        alert('Upload failed. Please try again.');
        uploadButton.disabled = false;
        uploadButton.textContent = 'Upload Images';
    }
});

// Get Gallery Images from LocalStorage
function getGalleryImages() {
    const images = localStorage.getItem(STORAGE_KEYS.galleryImages);
    return images ? JSON.parse(images) : [];
}

// Save Gallery Images to LocalStorage
function saveGalleryImages(images) {
    localStorage.setItem(STORAGE_KEYS.galleryImages, JSON.stringify(images));
}

// Load Gallery Images
function loadGalleryImages() {
    const galleryGrid = document.getElementById('galleryGrid');
    const images = getGalleryImages();
    
    if (images.length === 0) {
        galleryGrid.innerHTML = `
            <div class="empty-gallery">
                <div class="empty-gallery-icon">📷</div>
                <p>No images in gallery yet. Upload your first image!</p>
            </div>
        `;
        return;
    }
    
    galleryGrid.innerHTML = '';
    
    images.forEach(image => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item-admin';
        
        galleryItem.innerHTML = `
            <img src="${image.url}" alt="${image.originalName}">
            <div class="gallery-item-actions">
                <button class="btn-delete" onclick="deleteImage('${image.id}', '${image.fileName}')">Delete</button>
            </div>
        `;
        
        galleryGrid.appendChild(galleryItem);
    });
}

// Delete Image
async function deleteImage(imageId, fileName) {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    try {
        // Delete from B2
        await deleteFromB2(fileName, imageId);
        
        // Remove from local storage
        let images = getGalleryImages();
        images = images.filter(img => img.id !== imageId);
        saveGalleryImages(images);
        
        loadGalleryImages();
        updateStats();
        syncToMainWebsite();
        showSuccessMessage('Image deleted successfully');
    } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete image. Please try again.');
    }
}

// Update Stats
function updateStats() {
    const images = getGalleryImages();
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
function syncToMainWebsite() {
    const images = getGalleryImages();
    localStorage.setItem('website_gallery_images', JSON.stringify(images));
}
