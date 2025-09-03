import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
import ListNewItemPage from './components/ListNewItemPage';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminAnalytics from './components/admin/AdminAnalytics';
import AdminCommission from './components/admin/AdminCommission';
import AdminFraud from './components/admin/AdminFraud';
import AdminModeration from './components/admin/AdminModeration';
import AdminDisputes from './components/admin/AdminDisputes';
import AdminFeatured from './components/admin/AdminFeatured';
import AdminRegistration from './components/AdminRegistration';
import { useNotifications } from './hooks';
import './App.css';
import './styles/ListNewItemPage.css';
import './styles/AdminComponents.css';

// Main App component that provides AuthContext
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

// Create the main app content component that has access to AuthContext
const AppContent: React.FC = () => {
  const { user, logout } = useAuth();
  const { notifications, addNotification, removeNotification } = useNotifications();
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [navigationData, setNavigationData] = useState<any>(null);

  // Check URL for admin routes and set initial page
  useEffect(() => {
    const path = window.location.pathname;
    console.log('🔍 Current path:', path);
    if (path.startsWith('/admin')) {
      const adminPath = path.split('/')[2] || 'dashboard';
      console.log('🔧 Admin path detected:', adminPath);
      // Direct admin access without authentication check (development mode)
      console.log('🔧 Dev Mode: Direct admin access to:', adminPath);
      setCurrentPage(`admin-${adminPath}`);
      
      // Auto-login as admin if not already authenticated
      if (!user) {
        console.log('🚀 Auto-logging in as admin for development');
        // You could add auto-login logic here if needed
      }
    } else {
      console.log('🏠 Setting home page');
      setCurrentPage('home');
    }
  }, []); // Remove user dependency to avoid redirects

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopstate = () => {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) {
        const adminPath = path.split('/')[2] || 'dashboard';
        setCurrentPage(`admin-${adminPath}`);
      } else {
        setCurrentPage('home');
      }
    };

    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, []);

  const handleNavigation = useCallback((page: string, data?: any) => {
    console.log('🚀 Navigation triggered:', page, data);
    setCurrentPage(page);
    setNavigationData(data);
    
    // Update URL for admin routes
    if (page.startsWith('admin-')) {
      const adminPath = page.replace('admin-', '');
      window.history.pushState({}, '', `/admin/${adminPath}`);
      console.log('🌐 URL updated to:', `/admin/${adminPath}`);
    } else {
      // Reset URL for non-admin pages
      window.history.pushState({}, '', '/');
      console.log('🌐 URL updated to:', '/');
    }
  }, []);

  const handleLogin = useCallback((userData: any) => {
    // The AuthContext will handle the user state, so we just show notification
    const userName = userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email;
    addNotification(`Welcome back, ${userName}!`, 'success');
  }, [addNotification]);

  const handleLogout = useCallback(() => {
    logout();
    setCurrentPage('home');
    addNotification('Logged out successfully', 'info');
  }, [logout, addNotification]);

  const handleSignup = useCallback((userData: any) => {
    // The AuthContext will handle the user state, so we just show notification  
    const userName = userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email;
    addNotification(`Welcome to BidCraft, ${userName}!`, 'success');
  }, [addNotification]);

  const renderPage = () => {
    console.log('🎭 Rendering page:', currentPage);
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
      case 'list-new-item':
        return <ListNewItemPage onNavigate={handleNavigation} />;
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
      case 'admin-setup':
        return <AdminRegistration />;
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
      
      // Admin Routes - Authentication handled in URL effect
      case 'admin-dashboard':
        console.log('🎯 Rendering AdminDashboard component');
        return <AdminDashboard onNavigate={handleNavigation} />;
      case 'admin-analytics':
        console.log('� Rendering AdminAnalytics component');
        return <AdminAnalytics onNavigate={handleNavigation} />;
      case 'admin-commission':
        console.log('� Rendering AdminCommission component');
        return <AdminCommission onNavigate={handleNavigation} />;
      case 'admin-fraud':
        console.log('�️ Rendering AdminFraud component');
        return <AdminFraud onNavigate={handleNavigation} />;
      case 'admin-moderation':
        console.log('� Rendering AdminModeration component');
        return <AdminModeration onNavigate={handleNavigation} />;
      case 'admin-disputes':
        console.log('⚖️ Rendering AdminDisputes component');
        return <AdminDisputes onNavigate={handleNavigation} />;
      case 'admin-featured':
        console.log('⭐ Rendering AdminFeatured component');
        return <AdminFeatured onNavigate={handleNavigation} />;
      
      // Legacy admin routes - keeping for compatibility
      case 'admin-users':
        console.log('👥 Redirecting to admin dashboard');
        return <AdminDashboard onNavigate={handleNavigation} />;
      case 'admin-auctions':
        console.log('🔨 Redirecting to admin moderation');
        return <AdminModeration onNavigate={handleNavigation} />;
      case 'admin-categories':
        console.log('📂 Redirecting to admin dashboard');
        return <AdminDashboard onNavigate={handleNavigation} />;
      case 'admin-reports':
        console.log('📊 Redirecting to admin analytics');
        return <AdminAnalytics onNavigate={handleNavigation} />;
      
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
