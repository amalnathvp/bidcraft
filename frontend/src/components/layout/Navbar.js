import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUser, 
  FiHeart, 
  FiShoppingBag, 
  FiMenu, 
  FiX, 
  FiPlus,
  FiSettings,
  FiLogOut,
  FiSearch,
  FiGavel
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  
  const userMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isSeller, isAdmin } = useAuth();
  const { connected } = useSocket();

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const navigation = [
    { name: 'Home', href: '/', current: location.pathname === '/' },
    { name: 'Auctions', href: '/products', current: location.pathname === '/products' },
    ...(isAuthenticated ? [
      { name: 'Dashboard', href: '/dashboard', current: location.pathname === '/dashboard' }
    ] : [])
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <FiGavel className="w-5 h-5 text-white" />
              </div>
              <span className="font-primary text-xl font-semibold text-gray-800">
                Artisan Auctions
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`font-secondary text-sm font-medium transition-colors duration-200 ${
                  item.current
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-primary'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search artisan products..."
                className={`w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200 ${
                  searchFocused ? 'shadow-md' : ''
                }`}
              />
              <FiSearch className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </form>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Real-time connection indicator */}
            {isAuthenticated && (
              <div className="flex items-center space-x-1">
                <div 
                  className={`w-2 h-2 rounded-full ${
                    connected ? 'bg-success' : 'bg-gray-400'
                  }`}
                />
                <span className="text-xs text-gray-500">
                  {connected ? 'Live' : 'Offline'}
                </span>
              </div>
            )}

            {isAuthenticated ? (
              <>
                {/* Seller Actions */}
                {isSeller && (
                  <Link
                    to="/sell"
                    className="btn btn-outline btn-sm"
                  >
                    <FiPlus className="w-4 h-4 mr-1" />
                    List Item
                  </Link>
                )}

                {/* Quick Actions */}
                <Link
                  to="/watchlist"
                  className="p-2 text-gray-600 hover:text-primary transition-colors duration-200"
                  title="Watchlist"
                >
                  <FiHeart className="w-5 h-5" />
                </Link>

                <Link
                  to="/orders"
                  className="p-2 text-gray-600 hover:text-primary transition-colors duration-200"
                  title="Orders"
                >
                  <FiShoppingBag className="w-5 h-5" />
                </Link>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    {user?.avatar?.url ? (
                      <img
                        src={user.avatar.url}
                        alt={user.firstName}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 bg-secondary rounded-full flex items-center justify-center">
                        <FiUser className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {user?.firstName}
                    </span>
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                      >
                        <Link
                          to="/dashboard"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <FiUser className="w-4 h-4 mr-3" />
                          Dashboard
                        </Link>
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <FiSettings className="w-4 h-4 mr-3" />
                          Profile Settings
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <FiSettings className="w-4 h-4 mr-3" />
                            Admin Panel
                          </Link>
                        )}
                        <hr className="my-1 border-gray-200" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <FiLogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="btn btn-ghost btn-sm"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary btn-sm"
                >
                  Join Now
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-primary transition-colors duration-200"
            >
              {mobileMenuOpen ? (
                <FiX className="w-6 h-6" />
              ) : (
                <FiMenu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-gray-200"
            >
              <div className="py-4 space-y-3">
                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="px-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                    />
                    <FiSearch className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </form>

                {/* Mobile Navigation */}
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block px-4 py-2 text-sm font-medium ${
                      item.current
                        ? 'text-primary bg-primary/5'
                        : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}

                {/* Mobile Auth Actions */}
                {isAuthenticated ? (
                  <div className="px-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-3 mb-3">
                      {user?.avatar?.url ? (
                        <img
                          src={user.avatar.url}
                          alt={user.firstName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                          <FiUser className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {user?.role}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Link
                        to="/profile"
                        className="block text-sm text-gray-600 hover:text-primary"
                      >
                        Profile Settings
                      </Link>
                      <Link
                        to="/watchlist"
                        className="block text-sm text-gray-600 hover:text-primary"
                      >
                        Watchlist
                      </Link>
                      <Link
                        to="/orders"
                        className="block text-sm text-gray-600 hover:text-primary"
                      >
                        Orders
                      </Link>
                      {isSeller && (
                        <Link
                          to="/sell"
                          className="block text-sm text-gray-600 hover:text-primary"
                        >
                          List Item
                        </Link>
                      )}
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="block text-sm text-gray-600 hover:text-primary"
                        >
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left text-sm text-error hover:text-error/80"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 pt-3 border-t border-gray-200 space-y-2">
                    <Link
                      to="/login"
                      className="block text-center btn btn-ghost w-full"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="block text-center btn btn-primary w-full"
                    >
                      Join Now
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;