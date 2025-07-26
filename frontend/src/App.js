import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Page Components
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import CreateProduct from './pages/CreateProduct';
import EditProduct from './pages/EditProduct';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import Watchlist from './pages/Watchlist';
import Orders from './pages/Orders';
import BidHistory from './pages/BidHistory';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProducts from './pages/admin/AdminProducts';
import AdminAnalytics from './pages/admin/AdminAnalytics';

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';

// 404 Page
import NotFound from './pages/NotFound';

// Page transition variants for Framer Motion
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  in: {
    opacity: 1,
    y: 0
  },
  out: {
    opacity: 0,
    y: -20
  }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4
};

// Animated page wrapper
const AnimatedPage = ({ children }) => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
};

function App() {
  const location = useLocation();

  return (
    <div className="App min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public Routes */}
            <Route 
              path="/" 
              element={
                <AnimatedPage>
                  <Home />
                </AnimatedPage>
              } 
            />
            <Route 
              path="/products" 
              element={
                <AnimatedPage>
                  <ProductList />
                </AnimatedPage>
              } 
            />
            <Route 
              path="/products/:id" 
              element={
                <AnimatedPage>
                  <ProductDetail />
                </AnimatedPage>
              } 
            />
            <Route 
              path="/users/:userId" 
              element={
                <AnimatedPage>
                  <UserProfile />
                </AnimatedPage>
              } 
            />

            {/* Auth Routes */}
            <Route 
              path="/login" 
              element={
                <AnimatedPage>
                  <Login />
                </AnimatedPage>
              } 
            />
            <Route 
              path="/register" 
              element={
                <AnimatedPage>
                  <Register />
                </AnimatedPage>
              } 
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AnimatedPage>
                    <Dashboard />
                  </AnimatedPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AnimatedPage>
                    <Profile />
                  </AnimatedPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/watchlist"
              element={
                <ProtectedRoute>
                  <AnimatedPage>
                    <Watchlist />
                  </AnimatedPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <AnimatedPage>
                    <Orders />
                  </AnimatedPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bids"
              element={
                <ProtectedRoute>
                  <AnimatedPage>
                    <BidHistory />
                  </AnimatedPage>
                </ProtectedRoute>
              }
            />

            {/* Seller Routes */}
            <Route
              path="/sell"
              element={
                <ProtectedRoute roles={['seller', 'admin']}>
                  <AnimatedPage>
                    <CreateProduct />
                  </AnimatedPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/:id/edit"
              element={
                <ProtectedRoute roles={['seller', 'admin']}>
                  <AnimatedPage>
                    <EditProduct />
                  </AnimatedPage>
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AnimatedPage>
                    <AdminDashboard />
                  </AnimatedPage>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AnimatedPage>
                    <AdminUsers />
                  </AnimatedPage>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <AdminRoute>
                  <AnimatedPage>
                    <AdminProducts />
                  </AnimatedPage>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <AdminRoute>
                  <AnimatedPage>
                    <AdminAnalytics />
                  </AnimatedPage>
                </AdminRoute>
              }
            />

            {/* 404 Route */}
            <Route 
              path="*" 
              element={
                <AnimatedPage>
                  <NotFound />
                </AnimatedPage>
              } 
            />
          </Routes>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

export default App;