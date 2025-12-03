// Admin credentials (In production, this should be handled server-side)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'mistress2025' // Change this password!
};

// Storage keys
const STORAGE_KEYS = {
    isLoggedIn: 'admin_logged_in',
    galleryImages: 'gallery_images'
};

// Selected files for upload
let selectedFiles = [];

// Check if user is already logged in
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

// Upload Images
uploadButton.addEventListener('click', () => {
    if (selectedFiles.length === 0) return;
    
    uploadButton.disabled = true;
    uploadButton.innerHTML = '<span class="loading"></span> Uploading...';
    
    // Simulate upload process (In production, this would upload to server)
    setTimeout(() => {
        const galleryImages = getGalleryImages();
        
        selectedFiles.forEach(file => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const imageData = {
                    id: Date.now() + Math.random(),
                    src: e.target.result,
                    name: file.name,
                    uploadDate: new Date().toISOString()
                };
                
                galleryImages.push(imageData);
            };
            
            reader.readAsDataURL(file);
        });
        
        // Wait for all files to be processed
        setTimeout(() => {
            saveGalleryImages(galleryImages);
            
            // Show success message
            showSuccessMessage(`${selectedFiles.length} image(s) uploaded successfully!`);
            
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
        }, 500);
    }, 1000);
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
            <img src="${image.src}" alt="${image.name}">
            <div class="gallery-item-actions">
                <button class="btn-delete" onclick="deleteImage('${image.id}')">Delete</button>
            </div>
        `;
        
        galleryGrid.appendChild(galleryItem);
    });
}

// Delete Image
function deleteImage(imageId) {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    let images = getGalleryImages();
    images = images.filter(img => img.id != imageId);
    saveGalleryImages(images);
    
    loadGalleryImages();
    updateStats();
    showSuccessMessage('Image deleted successfully');
}

// Update Stats
function updateStats() {
    const images = getGalleryImages();
    document.getElementById('totalImages').textContent = images.length;
    
    // Count images uploaded in last 7 days
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
    }, 3000);
}

// Sync gallery images to main website
function syncToMainWebsite() {
    // This function would sync images to the main index.html gallery
    // For now, we'll update it when the main page loads
    const images = getGalleryImages();
    localStorage.setItem('website_gallery_images', JSON.stringify(images));
}

// Call sync after upload
const originalUploadHandler = uploadButton.onclick;
uploadButton.addEventListener('click', () => {
    setTimeout(() => {
        syncToMainWebsite();
    }, 2000);
});
