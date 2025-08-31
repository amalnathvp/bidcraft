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
import AdminDashboard from './components/AdminDashboard';
import AdminUserManagement from './components/AdminUserManagement';
import AdminAuctionManagement from './components/AdminAuctionManagement';
import AdminCategoryManagement from './components/AdminCategoryManagement';
import AdminReports from './components/AdminReports';
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
    if (path.startsWith('/admin')) {
      const adminPath = path.split('/')[2] || 'dashboard';
      // Only set admin page if user is authenticated and admin
      if (user && user.role === 'admin') {
        setCurrentPage(`admin-${adminPath}`);
      } else {
        // Redirect to login if not admin
        setCurrentPage('login');
      }
    }
  }, [user]); // Add user dependency to react to auth state changes

  const handleNavigation = useCallback((page: string, data?: any) => {
    setCurrentPage(page);
    setNavigationData(data);
    
    // Update URL for admin routes
    if (page.startsWith('admin-')) {
      const adminPath = page.replace('admin-', '');
      window.history.pushState({}, '', `/admin/${adminPath}`);
    } else {
      // Reset URL for non-admin pages
      window.history.pushState({}, '', '/');
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
        return <AdminDashboard onNavigate={handleNavigation} />;
      case 'admin-users':
        return <AdminUserManagement onNavigate={handleNavigation} />;
      case 'admin-auctions':
        return <AdminAuctionManagement onNavigate={handleNavigation} />;
      case 'admin-categories':
        return <AdminCategoryManagement onNavigate={handleNavigation} />;
      case 'admin-reports':
        return <AdminReports onNavigate={handleNavigation} />;
      case 'admin-analytics':
        return (
          <div className="admin-analytics">
            <div className="container">
              <h1>Analytics (Coming Soon)</h1>
              <p>Advanced analytics and reporting features will be available here.</p>
              <button 
                className="btn-primary"
                onClick={() => handleNavigation('admin-dashboard')}
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        );
      case 'admin-settings':
        return (
          <div className="admin-settings">
            <div className="container">
              <h1>System Settings (Coming Soon)</h1>
              <p>Platform configuration and system settings will be available here.</p>
              <button 
                className="btn-primary"
                onClick={() => handleNavigation('admin-dashboard')}
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        );
      
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
