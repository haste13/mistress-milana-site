// Mobile Menu Toggle
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
}

// Contact Form Handler
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(contactForm);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message'),
        submittedAt: new Date().toISOString()
    };
    
    // Disable submit button
    const submitButton = contactForm.querySelector('.submit-button');
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    
    try {
        // Save message to localStorage (in production, this would go to a server)
        saveMessage(data);
        
        // Simulate server delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Show success message
        showMessage('Thank you for reaching out. Your message has been received. I will respond to worthy submissions within 48-72 hours.', 'success');
        
        // Reset form
        contactForm.reset();
        
        // Scroll to message
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
    } catch (error) {
        console.error('Contact form error:', error);
        showMessage('An error occurred while sending your message. Please try again or contact directly via email.', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Send Message';
    }
});

// Save message to localStorage
function saveMessage(data) {
    // Get existing messages
    let messages = localStorage.getItem('contact_messages');
    messages = messages ? JSON.parse(messages) : [];
    
    // Add new message with unique ID
    const message = {
        id: Date.now(),
        ...data
    };
    
    messages.push(message);
    
    // Save back to localStorage
    localStorage.setItem('contact_messages', JSON.stringify(messages));
    
    // Update message count
    const latestMessageCount = localStorage.getItem('latest_message_count') || 0;
    localStorage.setItem('latest_message_count', parseInt(latestMessageCount) + 1);
}

// Show form message
function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    formMessage.style.display = 'block';
    
    // Auto-hide after 10 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 10000);
    }
}

// Newsletter Form Handler
const newsletterForm = document.querySelector('.newsletter-form');

if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const emailInput = newsletterForm.querySelector('input[type="email"]');
        const email = emailInput.value;
        const submitBtn = newsletterForm.querySelector('.submit-button');
        
        // Save to localStorage
        let subscribers = localStorage.getItem('newsletter_subscribers');
        subscribers = subscribers ? JSON.parse(subscribers) : [];
        
        if (!subscribers.includes(email)) {
            subscribers.push(email);
            localStorage.setItem('newsletter_subscribers', JSON.stringify(subscribers));
            
            submitBtn.textContent = '✓ Subscribed';
            submitBtn.style.background = '#28a745';
            
            setTimeout(() => {
                submitBtn.textContent = 'Subscribe';
                submitBtn.style.background = '';
                newsletterForm.reset();
            }, 3000);
        } else {
            submitBtn.textContent = 'Already Subscribed';
            setTimeout(() => {
                submitBtn.textContent = 'Subscribe';
            }, 2000);
        }
    });
}

// Form validation feedback
const inputs = document.querySelectorAll('input[required], textarea[required]');
inputs.forEach(input => {
    input.addEventListener('blur', () => {
        if (input.value.trim() === '') {
            input.style.borderColor = '#c41e3a';
        } else {
            input.style.borderColor = 'var(--border-color)';
        }
    });
    
    input.addEventListener('input', () => {
        if (input.value.trim() !== '') {
            input.style.borderColor = 'var(--border-color)';
        }
    });
});

// Loading animation
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});
