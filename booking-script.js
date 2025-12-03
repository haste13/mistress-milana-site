// Mobile Menu Toggle
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
}

// Booking Form Handler
const bookingForm = document.getElementById('bookingForm');
const formMessage = document.getElementById('formMessage');

bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(bookingForm);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        age: formData.get('age'),
        city: formData.get('city'),
        preferredDate: formData.get('preferred-date'),
        preferredTime: formData.get('preferred-time'),
        sessionType: formData.get('session-type'),
        fetishes: formData.get('fetishes'),
        notes: formData.get('notes'),
        submittedAt: new Date().toISOString()
    };
    
    // Validate age
    if (parseInt(data.age) < 18) {
        showMessage('You must be 18 years or older to book a session.', 'error');
        return;
    }
    
    // Disable submit button
    const submitButton = bookingForm.querySelector('.submit-button');
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
    
    try {
        // Send booking to backend
        const response = await fetch('http://localhost:3000/api/booking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit booking');
        }
        
        const result = await response.json();
        
        // Also save to localStorage for backup
        saveBooking(data);
        
        // Show success message
        showMessage('Your session request has been submitted successfully! You will receive a response within 48-72 hours.', 'success');
        
        // Reset form
        bookingForm.reset();
        
        // Scroll to message
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
    } catch (error) {
        console.error('Booking error:', error);
        showMessage('An error occurred while submitting your request. Please try again or contact directly via email.', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Request';
    }
});

// Save booking to localStorage
function saveBooking(data) {
    // Get existing bookings
    let bookings = localStorage.getItem('session_bookings');
    bookings = bookings ? JSON.parse(bookings) : [];
    
    // Add new booking with unique ID
    const booking = {
        id: Date.now(),
        ...data
    };
    
    bookings.push(booking);
    
    // Save back to localStorage
    localStorage.setItem('session_bookings', JSON.stringify(bookings));
    
    // Also save to a separate key for admin access
    const latestBooking = localStorage.getItem('latest_booking_count') || 0;
    localStorage.setItem('latest_booking_count', parseInt(latestBooking) + 1);
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

// Set minimum date to today
const dateInput = document.getElementById('preferred-date');
const today = new Date().toISOString().split('T')[0];
dateInput.setAttribute('min', today);

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
