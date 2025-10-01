import React, { useEffect, useState } from 'react';
import { useSellerAuth } from '../contexts/SellerAuthContext.jsx';

export const AuthStateMonitor = () => {
  const { seller, isAuthenticated, isLoading, error } = useSellerAuth();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      timestamp,
      isLoading,
      isAuthenticated,
      hasSellerData: !!seller,
      hasUserData: !!seller?.user,
      userId: seller?.user?._id,
      userName: seller?.user?.name,
      hasError: !!error,
      errorMessage: error?.message
    };
    
    setLogs(prev => [logEntry, ...prev.slice(0, 9)]); // Keep last 10 logs
  }, [seller, isAuthenticated, isLoading, error]);

  return (
    <div className="fixed top-4 right-4 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4 max-h-96 overflow-y-auto">
      <h3 className="font-bold text-sm mb-2">🔍 Auth State Monitor</h3>
      <div className="space-y-2">
        {logs.map((log, index) => (
          <div key={index} className={`text-xs p-2 rounded ${index === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
            <div className="font-mono">{log.timestamp}</div>
            <div className="mt-1 space-y-1">
              <div className={`flex items-center ${log.isLoading ? 'text-yellow-600' : 'text-green-600'}`}>
                <span className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: log.isLoading ? '#ca8a04' : '#16a34a'}}></span>
                Loading: {log.isLoading ? 'YES' : 'NO'}
              </div>
              <div className={`flex items-center ${log.isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
                <span className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: log.isAuthenticated ? '#16a34a' : '#dc2626'}}></span>
                Auth: {log.isAuthenticated ? 'YES' : 'NO'}
              </div>
              <div className={`flex items-center ${log.hasUserData ? 'text-green-600' : 'text-gray-500'}`}>
                <span className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: log.hasUserData ? '#16a34a' : '#6b7280'}}></span>
                User: {log.hasUserData ? 'YES' : 'NO'}
              </div>
              {log.userId && (
                <div className="text-gray-600">ID: {log.userId.slice(-8)}</div>
              )}
              {log.userName && (
                <div className="text-gray-600">Name: {log.userName}</div>
              )}
              {log.hasError && (
                <div className="text-red-600">Error: {log.errorMessage}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuthStateMonitor;