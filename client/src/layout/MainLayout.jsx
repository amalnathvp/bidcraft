import { Outlet, useNavigate, useLocation } from "react-router";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import LoadingScreen from "../components/LoadingScreen";
import ScrollToTop from "../utils/ScrollToTop";
import { useSellerAuth } from "../contexts/SellerAuthContext.jsx";
import { useEffect } from "react";

export const MainLayout = () => {
  const { seller, isAuthenticated, isLoading } = useSellerAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect after loading is complete and we're definitely not authenticated
    if (!isLoading && !isAuthenticated) {
      // Allow access to login/signup pages
      if (!location.pathname.includes('/login') && !location.pathname.includes('/signup')) {
        console.log('Redirecting to login - not authenticated');
        navigate("/login");
      }
    }
  }, [isLoading, isAuthenticated, navigate, location.pathname]);

  // Show loading while authentication is being checked
  if (isLoading) {
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

  // Show loading for unauthenticated users on protected routes while redirect is happening
  if (!isAuthenticated) {
    return <LoadingScreen />;
  }

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
};
