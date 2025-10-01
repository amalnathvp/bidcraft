import { Outlet, useNavigate, useLocation } from "react-router";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import LoadingScreen from "../components/LoadingScreen";
import ScrollToTop from "../utils/ScrollToTop";
import { useSellerAuth } from "../contexts/SellerAuthContext.jsx";
import { useEffect, useState } from "react";

export const MainLayout = () => {
  const { seller, isAuthenticated, isLoading } = useSellerAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // Only check after initial loading is complete
    if (!isLoading) {
      setHasCheckedAuth(true);
      
      // Add a small delay to allow for authentication to settle
      const timer = setTimeout(() => {
        if (!isAuthenticated) {
          // Don't redirect if already on login/signup pages
          if (!location.pathname.includes('/login') && !location.pathname.includes('/signup')) {
            console.log('Redirecting to login - not authenticated');
            navigate("/login");
          }
        }
      }, 1000); // 1 second delay
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, navigate, location.pathname]);

  // Show loading while authentication is being checked
  if (isLoading || !hasCheckedAuth) {
    return <LoadingScreen />;
  }

  // Allow access to login/signup pages even when not authenticated
  if (!isAuthenticated && (location.pathname.includes('/login') || location.pathname.includes('/signup'))) {
    return (
      <>
        <ScrollToTop />
        <Navbar />
        <Outlet />
        <Footer />
      </>
    );
  }

  if (!isAuthenticated) return null; // Prevents flashing protected content before redirect

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
};
