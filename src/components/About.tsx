import React from 'react';

const About: React.FC = () => {
  const features = [
    { icon: 'fas fa-certificate', text: 'Authenticated Items' },
    { icon: 'fas fa-shipping-fast', text: 'Worldwide Shipping' },
    { icon: 'fas fa-shield-alt', text: 'Secure Transactions' },
    { icon: 'fas fa-handshake', text: 'Fair Trade Practices' }
  ];

  return (
    <section id="about" className="about">
      <div className="container">
        <div className="about-content">
          <div className="about-text">
            <h2>About BidCraft</h2>
            <p className="large-text">
              BidCraft is the world's premier auction platform dedicated exclusively to authentic handicrafts. 
              We connect passionate collectors with skilled artisans, preserving traditional craftsmanship while 
              creating a global marketplace for unique, handmade treasures.
            </p>
            <p>
              Every item on our platform is carefully authenticated and comes with a certificate of authenticity. 
              We work directly with artisans to ensure fair compensation and support traditional craft communities 
              around the world.
            </p>
            <div className="features">
              {features.map((feature, index) => (
                <div key={index} className="feature">
                  <i className={feature.icon}></i>
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="about-image">
            <img 
              src="https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=500&h=400&fit=crop" 
              alt="Artisan working" 
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
