// Mobile Menu Toggle
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    menuToggle.classList.toggle('active');
});

// Close mobile menu when clicking on a link
const navLinks = document.querySelectorAll('.nav-menu a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
    });
});

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 80;
            const targetPosition = target.offsetTop - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Navbar Background on Scroll
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.background = 'rgba(250, 248, 243, 1)';
        navbar.style.boxShadow = '0 2px 20px rgba(139, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(250, 248, 243, 0.98)';
        navbar.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

// Scroll Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
const animateElements = document.querySelectorAll('.service-card, .gallery-item, .about-text, .about-image');
animateElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    observer.observe(el);
});

// Contact Form Handling (only if form exists on page)
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });
        
        // Here you would typically send the data to a server
        console.log('Form submitted:', data);
        
        // Show success message
        alert('Thank you for reaching out. Your message has been received. Mistress Milana will respond to worthy submissions.');
        
        // Reset form
        contactForm.reset();
    });
}

// Newsletter Form (only if forms exist on page)
const newsletterForms = document.querySelectorAll('.newsletter-form');

if (newsletterForms.length > 0) {
    newsletterForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = form.querySelector('input[type="email"]').value;
            
            // Here you would typically send the email to a server
            console.log('Newsletter subscription:', email);
            
            alert('You have been added to the VIP list. Welcome.');
            form.reset();
        });
    });
}

// Parallax Effect on Hero
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero-content');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
        hero.style.opacity = 1 - (scrolled / 700);
    }
});

// Gallery Image Click (Placeholder for lightbox functionality)
const galleryItems = document.querySelectorAll('.gallery-item');

galleryItems.forEach(item => {
    item.addEventListener('click', () => {
        // This would typically open a lightbox
        console.log('Gallery item clicked');
        alert('Image viewer functionality would open here. Add your images to make this functional.');
    });
});

// Cursor Effect (Optional - for desktop)
if (window.innerWidth > 768) {
    document.addEventListener('mousemove', (e) => {
        const cursor = document.createElement('div');
        cursor.style.position = 'fixed';
        cursor.style.width = '5px';
        cursor.style.height = '5px';
        cursor.style.borderRadius = '50%';
        cursor.style.background = 'rgba(212, 175, 55, 0.6)';
        cursor.style.pointerEvents = 'none';
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        cursor.style.zIndex = '9999';
        
        document.body.appendChild(cursor);
        
        setTimeout(() => {
            cursor.style.opacity = '0';
            cursor.style.transform = 'scale(2)';
            cursor.style.transition = 'all 0.5s ease';
        }, 10);
        
        setTimeout(() => {
            cursor.remove();
        }, 500);
    });
}

// Add active state to navigation based on scroll position
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Loading Animation
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
    
    // Load gallery images from admin panel
    loadGalleryFromAdmin();
    loadAboutImageFromAdmin();
});

// Load Gallery Images from Backend API (Backblaze B2)
async function loadGalleryFromAdmin() {
    const galleryGrid = document.querySelector('.gallery-grid') || document.getElementById('galleryGrid');
    
    if (!galleryGrid) return;
    
    // Show loading
    galleryGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--light-text); font-size: 18px; padding: 40px;">Loading images...</p>';
    
    try {
        const response = await fetch('https://mistress-milana-backend.vercel.app/api/images');
        const data = await response.json();
        
        // Clear loading message
        galleryGrid.innerHTML = '';
        
        if (!data.success || !data.images || data.images.length === 0) {
            galleryGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--light-text); font-size: 18px; padding: 40px;">No images uploaded yet. Upload images through the admin panel.</p>';
            return;
        }
        
        // Reverse array to show newest first
        const sortedImages = [...data.images].reverse();
        
        // Add uploaded images from B2
        sortedImages.forEach(image => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            
            galleryItem.innerHTML = `
                <img src="${image.url}" alt="${image.fileName || 'Gallery image'}" style="width: 100%; height: auto; display: block; border: 2px solid var(--border-color); border-radius: 5px; cursor: pointer;">
            `;
            
            galleryItem.addEventListener('click', () => {
                openLightbox(image.url);
            });
            
            galleryGrid.appendChild(galleryItem);
        });
    } catch (error) {
        console.error('Failed to load gallery:', error);
        galleryGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--light-text); font-size: 18px; padding: 40px;">Failed to load images. Please try again later.</p>';
    }
}

// Auto-refresh gallery when localStorage changes (from admin panel uploads)
window.addEventListener('storage', (e) => {
    if (e.key === 'website_gallery_images') {
        loadGalleryFromAdmin();
    }
    if (e.key === 'website_about_image') {
        loadAboutImageFromAdmin();
    }
});

// Periodic check for gallery updates (every 2 seconds)
setInterval(() => {
    const currentImages = localStorage.getItem('website_gallery_images');
    if (currentImages !== window.lastGalleryState) {
        window.lastGalleryState = currentImages;
        loadGalleryFromAdmin();
    }
}, 2000);

// Simple Lightbox
function openLightbox(imageSrc) {
    const lightbox = document.createElement('div');
    lightbox.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        border: 3px solid var(--accent-gold);
    `;
    
    lightbox.appendChild(img);
    document.body.appendChild(lightbox);
    
    lightbox.addEventListener('click', () => {
        lightbox.remove();
    });
}

// Load About Image from Admin Panel
function loadAboutImageFromAdmin() {
    const aboutImageUrl = localStorage.getItem('website_about_image');
    const aboutImageContainer = document.getElementById('aboutImageContainer');
    
    if (aboutImageUrl && aboutImageContainer) {
        // Replace placeholder with actual image
        aboutImageContainer.innerHTML = '';
        aboutImageContainer.style.background = 'none';
        aboutImageContainer.style.border = 'none';
        
        const img = document.createElement('img');
        img.src = aboutImageUrl;
        img.alt = 'Mistress Milana';
        img.style.cssText = 'width: 100%; height: auto; object-fit: cover; border: 3px solid var(--accent-gold); border-radius: 5px;';
        
        aboutImageContainer.appendChild(img);
    }
}
