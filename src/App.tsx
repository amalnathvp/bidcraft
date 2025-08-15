import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import FeaturedAuctions from './components/FeaturedAuctions';
import Categories from './components/Categories';
import HowItWorks from './components/HowItWorks';
import About from './components/About';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';
import NotificationContainer from './components/NotificationContainer';
import AuctionsPage from './components/AuctionsPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import SellerPage from './components/SellerPage';
import SellerDashboard from './components/SellerDashboard';
import BuyerDashboard from './components/BuyerDashboard';
import LiveAuctions from './components/LiveAuctions';
import AuctionDetail from './components/AuctionDetail';
import { useNotifications } from './hooks';
import './App.css';

const App: React.FC = () => {
  const { notifications, addNotification, removeNotification } = useNotifications();
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [user, setUser] = useState<any>(null);
  const [navigationData, setNavigationData] = useState<any>(null);

  const handleNavigation = (page: string, data?: any) => {
    setCurrentPage(page);
    setNavigationData(data);
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
    addNotification(`Welcome back, ${userData.name}!`, 'success');
  };

  const handleSignup = (userData: any) => {
    setUser(userData);
    addNotification(`Welcome to BidCraft, ${userData.name}!`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('home');
    addNotification('Successfully logged out', 'success');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'auctions':
        return <AuctionsPage />;
      case 'live-auctions':
        return <LiveAuctions onNavigate={handleNavigation} />;
      case 'auction-detail':
        return (
          <AuctionDetail 
            auctionId={navigationData?.auctionId || '1'}
            onNavigate={handleNavigation}
            onBack={() => handleNavigation('live-auctions')}
          />
        );
      case 'buyer-dashboard':
        // Allow access to buyer dashboard even without login (demo mode)
        const demoBuyer = user || {
          name: 'Demo Buyer',
          email: 'buyer@bidcraft.com',
          accountType: 'buyer',
          isAuthenticated: false
        };
        return <BuyerDashboard onNavigate={handleNavigation} user={demoBuyer} />;
      case 'login':
        return <LoginPage onNavigate={handleNavigation} onLogin={handleLogin} />;
      case 'signup':
        return <SignupPage onNavigate={handleNavigation} onSignup={handleSignup} />;
      case 'sellers':
        return <SellerPage onNavigate={handleNavigation} user={user} />;
      case 'seller-dashboard':
        // Allow access to seller dashboard even without login (demo mode)
        const demoUser = user || {
          name: 'Demo Seller',
          email: 'demo@bidcraft.com',
          accountType: 'seller',
          isAuthenticated: false
        };
        return <SellerDashboard onNavigate={handleNavigation} user={demoUser} />;
      case 'home':
      default:
        return (
          <>
            <Hero onGetStarted={() => addNotification('Welcome to BidCraft!', 'success')} />
            <FeaturedAuctions 
              onBidPlaced={(amount: number) => 
                addNotification(`Your bid of $${amount} has been placed successfully!`, 'success')
              }
              onViewAllAuctions={() => setCurrentPage('live-auctions')}
            />
            <Categories />
            <HowItWorks />
            <About />
            <Newsletter onSubscribe={() => 
              addNotification('Thank you for subscribing! We\'ll keep you updated.', 'success')
            } />
          </>
        );
    }
  };

  return (
    <div className="App">
      <Navbar 
        currentPage={currentPage} 
        onNavigate={handleNavigation}
        user={user}
        onLogout={handleLogout}
      />
      {renderPage()}
      {currentPage === 'home' && <Footer />}
      <NotificationContainer 
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
};

export default App;
