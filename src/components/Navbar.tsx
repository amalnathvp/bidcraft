import React, { useState } from 'react';
import { useScrollEffect } from '../hooks';

interface NavbarProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  currentPage = 'home', 
  onNavigate, 
  user, 
  onLogout 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const isScrolled = useScrollEffect();

  const navItems = [
    { href: '#home', label: 'Home', page: 'home' },
    { href: '#auctions', label: 'Live Auctions', page: 'live-auctions' },
    { href: '#sellers', label: 'Sell', page: 'sellers' },
    { href: '#categories', label: 'Categories', page: 'home' },
    { href: '#about', label: 'About', page: 'home' },
    { href: '#contact', label: 'Contact', page: 'home' },
  ];

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, item: typeof navItems[0]) => {
    e.preventDefault();
    
    if (item.page !== currentPage && onNavigate) {
      onNavigate(item.page);
    } else if (item.page === 'home' && currentPage === 'home') {
      // Handle scrolling within the home page
      const target = document.querySelector(item.href);
      if (target) {
        const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    if (onNavigate) {
      onNavigate('home');
    }
  };

  const handleAuthNavigation = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setIsUserMenuOpen(false);
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <div className="nav-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          <h1>BidCraft</h1>
          <span className="tagline">Authentic Handicrafts</span>
        </div>
        
        <ul className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          {navItems.map((item) => (
            <li key={item.href}>
              <a 
                href={item.href} 
                className={`nav-link ${currentPage === item.page ? 'active' : ''}`}
                onClick={(e) => handleNavigation(e, item)}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        
        <div className="nav-buttons">
          {user ? (
            <div className="user-menu">
              <button 
                className="user-button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <i className="fas fa-user"></i>
                <span>{user.firstName} {user.lastName}</span>
                <i className={`fas fa-chevron-${isUserMenuOpen ? 'up' : 'down'}`}></i>
              </button>
              {isUserMenuOpen && (
                <div className="user-dropdown">
                  <button 
                    onClick={() => handleAuthNavigation('buyer-dashboard')} 
                    className="dropdown-item"
                  >
                    <i className="fas fa-tachometer-alt"></i>
                    My Dashboard
                  </button>
                  {(user.accountType === 'seller' || user.accountType === 'both') && (
                    <button 
                      onClick={() => handleAuthNavigation('seller-dashboard')} 
                      className="dropdown-item"
                    >
                      <i className="fas fa-store"></i>
                      Seller Dashboard
                    </button>
                  )}
                  {user.role === 'admin' && (
                    <button 
                      onClick={() => handleAuthNavigation('admin-dashboard')} 
                      className="dropdown-item admin-link"
                    >
                      <i className="fas fa-crown"></i>
                      Admin Dashboard
                    </button>
                  )}
                  <button 
                    onClick={() => handleAuthNavigation('live-auctions')} 
                    className="dropdown-item"
                  >
                    <i className="fas fa-gavel"></i>
                    Live Auctions
                  </button>
                  <a href="#" className="dropdown-item">
                    <i className="fas fa-heart"></i>
                    My Watchlist
                  </a>
                  <a href="#" className="dropdown-item">
                    <i className="fas fa-shopping-bag"></i>
                    My Purchases
                  </a>
                  <a href="#" className="dropdown-item">
                    <i className="fas fa-cog"></i>
                    Settings
                  </a>
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item logout">
                    <i className="fas fa-sign-out-alt"></i>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button 
                className="btn-secondary"
                onClick={() => handleAuthNavigation('login')}
              >
                Login
              </button>
              <button 
                className="btn-primary"
                onClick={() => handleAuthNavigation('signup')}
              >
                Sign Up
              </button>
              <button 
                className="btn-secondary"
                onClick={() => handleAuthNavigation('admin-setup')}
                style={{ marginLeft: '10px', fontSize: '12px' }}
              >
                Admin Setup
              </button>
            </>
          )}
        </div>
        
        <div 
          className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
