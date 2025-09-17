// Custom Vite plugin to handle WebSocket connection issues gracefully
export function webSocketErrorHandler() {
  return {
    name: 'websocket-error-handler',
    configureServer(server) {
      // Handle WebSocket errors gracefully
      server.ws.on('error', (error) => {
        console.warn('WebSocket error (HMR disabled):', error.message);
      });
      
      // Override HMR connection attempts
      const originalSend = server.ws.send;
      server.ws.send = function(payload) {
        try {
          return originalSend.call(this, payload);
        } catch (error) {
          console.warn('Failed to send HMR update, continuing without hot reload:', error.message);
        }
      };
    },
    transform(code, id) {
      // Inject custom WebSocket error handling for client-side
      if (id.includes('vite/dist/client/client.mjs') || id.includes('@vite/client')) {
        return code.replace(
          /console\.error\(\[vite\] websocket connection failed/g,
          'console.warn("[vite] websocket connection failed (hot reload disabled)"'
        );
      }
    }
  };
}