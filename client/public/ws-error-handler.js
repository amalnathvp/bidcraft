// WebSocket Error Suppression Script
// This script prevents WebSocket connection errors from cluttering the console
// when using privacy-focused browsers like Brave

(function() {
  'use strict';
  
  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // Override console.error to filter WebSocket-related errors
  console.error = function(...args) {
    const message = args.join(' ');
    
    // Filter out specific WebSocket error messages
    if (
      message.includes('WebSocket connection to') ||
      message.includes('ws://localhost') ||
      message.includes('waitForSuccessfulPing') ||
      message.includes('[vite] websocket connection failed') ||
      message.includes('vite:ws')
    ) {
      // Convert error to warning for WebSocket issues
      console.warn('[HMR] Hot reload unavailable - continuing without live updates');
      return;
    }
    
    // Call original error for non-WebSocket errors
    originalError.apply(console, args);
  };
  
  // Suppress specific warning patterns too
  console.warn = function(...args) {
    const message = args.join(' ');
    
    if (
      message.includes('WebSocket connection to') && 
      message.includes('failed')
    ) {
      // Only log once per session
      if (!window.__wsErrorLogged) {
        console.info('[DEV] Hot Module Replacement disabled due to WebSocket restrictions');
        window.__wsErrorLogged = true;
      }
      return;
    }
    
    originalWarn.apply(console, args);
  };
  
  // Handle unhandled promise rejections related to WebSocket
  window.addEventListener('unhandledrejection', function(event) {
    if (
      event.reason && 
      event.reason.message && 
      event.reason.message.includes('WebSocket')
    ) {
      event.preventDefault();
      console.info('[DEV] WebSocket connection issue handled gracefully');
    }
  });
  
  console.info('[DEV] WebSocket error suppression active');
})();