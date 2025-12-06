import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, Menu, Plus } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Glassmorphism Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30 transition-transform group-hover:scale-105">
                  S
                </div>
                <span className="font-bold text-xl tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors">SPEC</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className={`text-sm font-medium transition-colors hover:text-indigo-600 ${location.pathname === '/' ? 'text-indigo-600' : 'text-gray-500'}`}>
                홈
              </Link>
              <Link to="/sell" className={`text-sm font-medium transition-colors hover:text-indigo-600 ${location.pathname === '/sell' ? 'text-indigo-600' : 'text-gray-500'}`}>
                판매하기
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-500 hover:text-indigo-600 transition-colors rounded-full hover:bg-gray-100/50">
                <Search className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-indigo-600 transition-colors rounded-full hover:bg-gray-100/50 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <Link
                to="/sell"
                className="hidden sm:flex items-center gap-1.5 bg-gray-900 hover:bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-lg shadow-gray-900/10 hover:shadow-indigo-500/30 transform hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" />
                <span>등록하기</span>
              </Link>
              <button className="md:hidden p-2 text-gray-500">
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Removed top padding to allow full bleed hero */}
      <main className="pb-24">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-40 pb-safe">
        <Link to="/" className="flex flex-col items-center gap-1 text-gray-500">
          <div className="w-6 h-6 bg-gray-200 rounded-md" /> 
        </Link>
        <Link to="/sell" className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white p-4 rounded-full shadow-lg shadow-gray-900/30">
           <Plus className="w-6 h-6" />
        </Link>
        <Link to="/profile" className="flex flex-col items-center gap-1 text-gray-500">
          <div className="w-6 h-6 bg-gray-200 rounded-full" />
        </Link>
      </nav>
    </div>
  );
};