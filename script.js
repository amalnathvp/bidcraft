// DOM Elements
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

// Mobile Navigation Toggle
hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
});

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// Smooth scrolling for navigation links
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Active navigation highlighting
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.clientHeight;
        
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
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

// Newsletter form submission
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value;
        
        // Simulate form submission
        showNotification('Thank you for subscribing! We\'ll keep you updated with the latest auctions.', 'success');
        e.target.reset();
    });
}

// Auction bid buttons
const bidButtons = document.querySelectorAll('.auction-card .btn-primary');
bidButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Get the current bid from the card
        const card = button.closest('.auction-card');
        const currentBidElement = card.querySelector('.current-bid');
        const currentBid = currentBidElement.textContent;
        const itemName = card.querySelector('h3').textContent;
        
        showBidModal(itemName, currentBid);
    });
});

// Bid Modal Functionality
function showBidModal(itemName, currentBid) {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Place Your Bid</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <h4>${itemName}</h4>
                <p>Current bid: <span class="current-bid-modal">${currentBid}</span></p>
                <form class="bid-form">
                    <div class="form-group">
                        <label for="bidAmount">Your bid amount:</label>
                        <input type="number" id="bidAmount" min="151" step="1" placeholder="Enter your bid" required>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="maxBid">
                            Set as maximum bid (auto-bid up to this amount)
                        </label>
                    </div>
                    <div class="modal-buttons">
                        <button type="button" class="btn-outline modal-cancel">Cancel</button>
                        <button type="submit" class="btn-primary">Place Bid</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
    
    // Modal event listeners
    const closeModal = () => {
        modalOverlay.remove();
        document.body.style.overflow = 'auto';
    };
    
    modalOverlay.querySelector('.modal-close').addEventListener('click', closeModal);
    modalOverlay.querySelector('.modal-cancel').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    
    // Bid form submission
    modalOverlay.querySelector('.bid-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const bidAmount = e.target.querySelector('#bidAmount').value;
        const isMaxBid = e.target.querySelector('#maxBid').checked;
        
        // Simulate bid placement
        showNotification(
            `Your bid of $${bidAmount} has been placed successfully! ${isMaxBid ? '(Maximum bid set)' : ''}`,
            'success'
        );
        closeModal();
    });
    
    document.body.style.overflow = 'hidden';
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    const autoRemove = setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
    
    // Manual close
    notification.querySelector('.notification-close').addEventListener('click', () => {
        clearTimeout(autoRemove);
        notification.remove();
    });
    
    // Animate in
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });
}

// Live auction countdown timers
function updateCountdowns() {
    const timeElements = document.querySelectorAll('.time-remaining');
    
    timeElements.forEach(element => {
        const timeText = element.textContent;
        // This is a simplified countdown - in a real app, you'd have actual end times
        // For demo purposes, we'll just keep the static times
    });
}

// Update countdowns every minute
setInterval(updateCountdowns, 60000);

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.auction-card, .category-card, .step');
    animateElements.forEach(el => observer.observe(el));
});

// Header scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Search functionality (placeholder)
function initializeSearch() {
    const searchInputs = document.querySelectorAll('input[type="search"]');
    searchInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            // In a real app, this would filter the auction cards
            console.log('Searching for:', query);
        });
    });
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeSearch();
    
    // Add loading class removal after page load
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
    });
});

// Keyboard navigation support
document.addEventListener('keydown', (e) => {
    // Escape key closes modals
    if (e.key === 'Escape') {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
            document.body.style.overflow = 'auto';
        }
    }
});

// Add CSS classes for JavaScript functionality
const additionalCSS = `
    <style>
    /* Modal Styles */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(62, 39, 35, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        opacity: 0;
        animation: fadeIn 0.3s ease forwards;
    }
    
    .modal-content {
        background: var(--primary-white);
        border-radius: var(--border-radius);
        padding: 0;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: var(--shadow-heavy);
        animation: slideUp 0.3s ease forwards;
    }
    
    .modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid var(--light-gray);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .modal-header h3 {
        margin: 0;
        color: var(--dark-brown);
    }
    
    .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--text-light);
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .modal-body {
        padding: 1.5rem;
    }
    
    .modal-body h4 {
        color: var(--dark-brown);
        margin-bottom: 0.5rem;
    }
    
    .current-bid-modal {
        color: var(--medium-brown);
        font-weight: 600;
        font-family: var(--font-heading);
    }
    
    .form-group {
        margin-bottom: 1rem;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--dark-brown);
        font-weight: 500;
    }
    
    .form-group input[type="number"] {
        width: 100%;
        padding: 12px;
        border: 2px solid var(--light-brown);
        border-radius: var(--border-radius);
        font-size: 1rem;
    }
    
    .form-group input[type="number"]:focus {
        outline: none;
        border-color: var(--medium-brown);
    }
    
    .form-group input[type="checkbox"] {
        margin-right: 0.5rem;
    }
    
    .modal-buttons {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
    }
    
    .modal-buttons button {
        flex: 1;
    }
    
    /* Notification Styles */
    .notification {
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--primary-white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-heavy);
        z-index: 3000;
        max-width: 400px;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-success {
        border-left: 4px solid #27ae60;
    }
    
    .notification-error {
        border-left: 4px solid #e74c3c;
    }
    
    .notification-info {
        border-left: 4px solid var(--medium-brown);
    }
    
    .notification-content {
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
    }
    
    .notification-message {
        color: var(--text-dark);
        line-height: 1.4;
    }
    
    .notification-close {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: var(--text-light);
        padding: 0;
        min-width: 20px;
    }
    
    /* Mobile Navigation Styles */
    @media (max-width: 768px) {
        .nav-menu {
            position: fixed;
            left: -100%;
            top: 70px;
            flex-direction: column;
            background-color: var(--primary-white);
            width: 100%;
            text-align: center;
            transition: 0.3s;
            box-shadow: var(--shadow-medium);
            padding: 2rem 0;
        }
        
        .nav-menu.active {
            left: 0;
        }
        
        .nav-menu li {
            margin: 1rem 0;
        }
        
        .hamburger.active span:nth-child(2) {
            opacity: 0;
        }
        
        .hamburger.active span:nth-child(1) {
            transform: translateY(8px) rotate(45deg);
        }
        
        .hamburger.active span:nth-child(3) {
            transform: translateY(-8px) rotate(-45deg);
        }
    }
    
    /* Scroll effect for navbar */
    .navbar.scrolled {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
    }
    
    /* Animation classes */
    @keyframes fadeIn {
        to { opacity: 1; }
    }
    
    @keyframes slideUp {
        from {
            transform: translateY(30px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    .animate-in {
        animation: fadeInUp 0.6s ease-out;
    }
    
    /* Active navigation link */
    .nav-link.active {
        color: var(--medium-brown);
        font-weight: 600;
    }
    
    /* Loading state */
    body:not(.loaded) {
        overflow: hidden;
    }
    
    body:not(.loaded)::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--primary-white);
        z-index: 9999;
        animation: fadeOut 0.5s ease 1s forwards;
    }
    
    @keyframes fadeOut {
        to {
            opacity: 0;
            visibility: hidden;
        }
    }
    </style>
`;

// Inject additional CSS
document.head.insertAdjacentHTML('beforeend', additionalCSS);
