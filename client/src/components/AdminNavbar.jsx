import React from 'react';
import { Link, useLocation } from 'react-router';
import { useAdminAuth } from '../context/AdminAuthContext';

export const AdminNavbar = () => {
    const { admin, logout } = useAdminAuth();
    const location = useLocation();

    const isActive = (path) => {
        if (path === '/admin' && location.pathname === '/admin') {
            return true;
        }
        return location.pathname.startsWith(path) && path !== '/admin';
    };

    return (
        <nav className="bg-gray-900 shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-4">
                    {/* Logo */}
                    <Link to="/admin" className="flex items-center space-x-2">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div className="text-white">
                            <div className="text-xl font-bold">BidCraft</div>
                            <div className="text-xs text-gray-300">Admin Panel</div>
                        </div>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-6">
                        <Link
                            to="/admin"
                            className={`text-white hover:text-blue-300 transition-colors px-3 py-2 rounded-md text-sm font-medium ${
                                isActive('/admin') ? 'bg-blue-600' : ''
                            }`}
                        >
                            Dashboard
                        </Link>
                        <Link
                            to="/admin/users"
                            className={`text-white hover:text-blue-300 transition-colors px-3 py-2 rounded-md text-sm font-medium ${
                                isActive('/admin/users') ? 'bg-blue-600' : ''
                            }`}
                        >
                            Users
                        </Link>
                        <Link
                            to="/admin/sellers"
                            className={`text-white hover:text-blue-300 transition-colors px-3 py-2 rounded-md text-sm font-medium ${
                                isActive('/admin/sellers') ? 'bg-blue-600' : ''
                            }`}
                        >
                            Sellers
                        </Link>
                        <Link
                            to="/admin/buyers"
                            className={`text-white hover:text-blue-300 transition-colors px-3 py-2 rounded-md text-sm font-medium ${
                                isActive('/admin/buyers') ? 'bg-blue-600' : ''
                            }`}
                        >
                            Buyers
                        </Link>
                    </div>

                    {/* Admin Profile & Logout */}
                    <div className="flex items-center space-x-4">
                        <div className="text-white text-sm">
                            <div className="font-medium">{admin?.name}</div>
                            <div className="text-gray-300 text-xs">Administrator</div>
                        </div>
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                                {admin?.name?.charAt(0).toUpperCase() || 'A'}
                            </span>
                        </div>
                        <button
                            onClick={logout}
                            className="text-white hover:text-red-300 transition-colors p-2 rounded-md"
                            title="Logout"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden pb-4">
                    <div className="flex flex-col space-y-2">
                        <Link
                            to="/admin"
                            className={`text-white hover:text-blue-300 transition-colors px-3 py-2 rounded-md text-sm font-medium ${
                                isActive('/admin') ? 'bg-blue-600' : ''
                            }`}
                        >
                            Dashboard
                        </Link>
                        <Link
                            to="/admin/users"
                            className={`text-white hover:text-blue-300 transition-colors px-3 py-2 rounded-md text-sm font-medium ${
                                isActive('/admin/users') ? 'bg-blue-600' : ''
                            }`}
                        >
                            Users
                        </Link>
                        <Link
                            to="/admin/sellers"
                            className={`text-white hover:text-blue-300 transition-colors px-3 py-2 rounded-md text-sm font-medium ${
                                isActive('/admin/sellers') ? 'bg-blue-600' : ''
                            }`}
                        >
                            Sellers
                        </Link>
                        <Link
                            to="/admin/buyers"
                            className={`text-white hover:text-blue-300 transition-colors px-3 py-2 rounded-md text-sm font-medium ${
                                isActive('/admin/buyers') ? 'bg-blue-600' : ''
                            }`}
                        >
                            Buyers
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};