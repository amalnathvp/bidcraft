import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import FeaturedAuctions from './components/FeaturedAuctions';
import Categories from './components/Categories';
import HowItWorks from './components/HowItWorks';
import About from './components/About';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';
import NotificationContainer from './components/NotificationContainer';
import ApiTest from './components/ApiTest';
import { useNotifications } from './hooks';
import './App.css';

const App: React.FC = () => {
  const { notifications, addNotification, removeNotification } = useNotifications();

  return (
    <div className="App">
      <ApiTest />
      <Navbar />
      <Hero onGetStarted={() => addNotification('Welcome to BidCraft!', 'success')} />
      <FeaturedAuctions onBidPlaced={(amount: number) => 
        addNotification(`Your bid of $${amount} has been placed successfully!`, 'success')
      } />
      <Categories />
      <HowItWorks />
      <About />
      <Newsletter onSubscribe={() => 
        addNotification('Thank you for subscribing! We\'ll keep you updated.', 'success')
      } />
      <Footer />
      <NotificationContainer 
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
};

export default App;
