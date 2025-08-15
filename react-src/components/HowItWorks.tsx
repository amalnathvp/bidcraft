import React from 'react';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: 1,
      title: 'Browse & Discover',
      description: 'Explore our curated collection of authentic handicrafts from talented artisans worldwide.'
    },
    {
      number: 2,
      title: 'Place Your Bid',
      description: 'Join live auctions and place bids on items that catch your eye. Set maximum bids for automatic bidding.'
    },
    {
      number: 3,
      title: 'Win & Enjoy',
      description: 'Win your favorite pieces and have them carefully packaged and shipped directly to your door.'
    }
  ];

  return (
    <section className="how-it-works">
      <div className="container">
        <div className="section-header">
          <h2>How BidCraft Works</h2>
          <p>Start your journey with authentic handicrafts in three simple steps</p>
        </div>
        <div className="steps-grid">
          {steps.map((step) => (
            <div key={step.number} className="step">
              <div className="step-number">{step.number}</div>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
