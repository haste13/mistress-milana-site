// Mobile Menu Toggle
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
}

// Load News Cards from MongoDB
async function loadNewsCards() {
    const newsGrid = document.getElementById('newsGrid');
    
    if (!newsGrid) return;
    
    newsGrid.innerHTML = '<div class="news-loading">Loading news...</div>';
    
    try {
        const response = await fetch('https://mistress-milana-backend.vercel.app/api/news');
        
        if (!response.ok) {
            throw new Error('Failed to fetch news');
        }
        
        const newsCards = await response.json();
        
        if (newsCards.length === 0) {
            newsGrid.innerHTML = `
                <div class="news-empty">
                    <div class="news-empty-icon">📰</div>
                    <p>No news or events available yet. Check back soon for updates from Mistress Milana!</p>
                </div>
            `;
            return;
        }
        
        // Data is already sorted by date (newest first) from the API
        
        newsCards.forEach(card => {
            const newsCard = document.createElement('div');
            newsCard.className = 'news-card';
            
            const formattedDate = formatDate(card.date);
            
            newsCard.innerHTML = `
                <div class="news-card-image">
                    <img src="${card.imageUrl}" alt="${card.title}">
                </div>
                <div class="news-card-content">
                    <div class="news-card-date">${formattedDate}</div>
                    <h3 class="news-card-title">${card.title}</h3>
                    <p class="news-card-description">${card.description}</p>
                    <div class="news-card-footer">
                        ${card.location ? `<span class="news-card-location">📍 ${card.location}</span>` : '<span></span>'}
                        <span class="news-card-category">${card.category || 'Event'}</span>
                    </div>
                </div>
            `;
            
            newsGrid.appendChild(newsCard);
        });
        
    } catch (error) {
        console.error('Error loading news cards:', error);
        newsGrid.innerHTML = `
            <div class="news-empty">
                <div class="news-empty-icon">⚠️</div>
                <p>Unable to load news. Please check back later.</p>
            </div>
        `;
    }
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Periodic check for updates (every 30 seconds)
setInterval(() => {
    loadNewsCards();
}, 30000);

// Initial load
document.addEventListener('DOMContentLoaded', loadNewsCards);
