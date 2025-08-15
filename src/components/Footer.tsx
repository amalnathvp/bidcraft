import React from 'react';

const Footer: React.FC = () => {
  const quickLinks = ['Home', 'Live Auctions', 'Categories', 'About Us'];
  const supportLinks = ['Help Center', 'Bidding Guide', 'Shipping Info', 'Returns'];
  const socialLinks = [
    { icon: 'fab fa-facebook', href: '#' },
    { icon: 'fab fa-instagram', href: '#' },
    { icon: 'fab fa-twitter', href: '#' },
    { icon: 'fab fa-pinterest', href: '#' }
  ];

  return (
    <footer id="contact" className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <h3>BidCraft</h3>
              <p>Authentic Handicrafts</p>
            </div>
            <p>Connecting artisans with collectors worldwide through authentic handicraft auctions.</p>
            <div className="social-links">
              {socialLinks.map((link, index) => (
                <a key={index} href={link.href}>
                  <i className={link.icon}></i>
                </a>
              ))}
            </div>
          </div>
          
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a href={`#${link.toLowerCase().replace(' ', '-')}`}>{link}</a>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              {supportLinks.map((link, index) => (
                <li key={index}>
                  <a href="#">{link}</a>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Contact</h4>
            <div className="contact-info">
              <p><i className="fas fa-envelope"></i> support@bidcraft.com</p>
              <p><i className="fas fa-phone"></i> +1 (555) 123-4567</p>
              <p><i className="fas fa-map-marker-alt"></i> 123 Craft Street, Art District</p>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 BidCraft. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
