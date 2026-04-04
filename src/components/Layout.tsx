import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gem, Menu, X, Sparkles, ChevronDown } from 'lucide-react';
import { useQualityContext } from '../context/QualityContext';
import { GOLD_QUALITIES, DIAMOND_QUALITIES, DiamondQuality } from '../constants/jewellery';
import { useCategories } from '../hooks/useCategories';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const location = useLocation();

  const { 
    globalGoldPurity, setGlobalGoldPurity, 
    globalDiamondQuality, setGlobalDiamondQuality 
  } = useQualityContext();

  const { topLevelCategories, getSubcategories } = useCategories();

  // Prevent background scrolling when the mobile drawer is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* --- STICKY HEADER CONTAINER --- */}
      <header className="sticky top-0 z-50 bg-white shadow-md flex flex-col">
        
        {/* ROW 1: Logo & Controls */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center h-16 md:h-20 relative">
            
            {/* Mobile Hamburger (Left Side - Tanishq Style) */}
            <div className="flex items-center lg:hidden">
              <button 
                onClick={() => setIsMenuOpen(true)} 
                className="p-2 -ml-2 text-gray-800 hover:text-yellow-600 transition-colors"
              >
                <Menu className="h-7 w-7" />
              </button>
            </div>

            {/* Logo (Centered on mobile, Left on PC) */}
            <Link 
              to="/" 
              className="flex items-center space-x-2 absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0"
            >
              <Gem className="h-7 w-7 md:h-8 md:w-8 text-yellow-600" />
              <div className="hidden sm:block lg:block text-center lg:text-left">
                <span className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">KhushiiWithDiamond</span>
                <div className="text-[9px] md:text-xs text-yellow-600 font-semibold uppercase tracking-widest mt-0.5">Premium Indian Jewellery</div>
              </div>
            </Link>

            {/* Controls (Right Side) */}
            <div className="flex items-center space-x-4 ml-auto">
              {/* Quality Selectors (Hidden on small mobile screens) */}
              <div className="hidden md:flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Gold:</span>
                  <select 
                    value={globalGoldPurity}
                    onChange={(e) => setGlobalGoldPurity(e.target.value)}
                    className="text-sm border-none bg-yellow-50 text-yellow-800 rounded-md py-1 pl-2 pr-6 focus:ring-0 cursor-pointer font-bold"
                  >
                    {GOLD_QUALITIES.map((gold) => (
                      <option key={gold.value} value={gold.value}>{gold.value}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-1 bg-blue-50 rounded-md pl-2">
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                  <select 
                    value={globalDiamondQuality}
                    onChange={(e) => setGlobalDiamondQuality(e.target.value as DiamondQuality)}
                    className="text-sm border-none bg-transparent text-blue-800 py-1 pl-1 pr-6 focus:ring-0 cursor-pointer font-bold"
                  >
                    {DIAMOND_QUALITIES.map((quality) => (
                      <option key={quality} value={quality}>{quality}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: Dedicated Category Sub-Header (PC Only) */}
        <div className="hidden lg:block border-t border-gray-100 bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Centered Navigation with Premium Serif Font */}
            <nav className="flex items-center justify-center space-x-10 h-12">
              {topLevelCategories.map((category) => {
                const subcategories = getSubcategories(category.id);
                const hasSubcats = subcategories.length > 0;
                const isActive = location.pathname.includes(category.name);

                return (
                  <div key={category.id} className="relative group h-full flex items-center">
                    <Link
                      to={`/category/${category.name}`}
                      /* Elegant Serif Font styling here */
                      className={`flex items-center space-x-1 text-[15px] font-serif tracking-widest uppercase transition-colors ${
                        isActive ? 'text-yellow-600 font-semibold' : 'text-gray-800 group-hover:text-yellow-600'
                      }`}
                    >
                      <span>{category.name}</span>
                      {hasSubcats && <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />}
                    </Link>

                    {/* Mega-Menu Dropdown */}
                    {hasSubcats && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-56 bg-white shadow-xl border-t-2 border-yellow-500 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="py-3">
                          {subcategories.map((sub) => (
                            <Link
                              key={sub.id}
                              to={`/category/${sub.name}`}
                              className="block px-6 py-2.5 text-[14px] font-serif text-gray-700 hover:bg-gray-50 hover:text-yellow-600 transition-colors"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* --- MOBILE SIDE DRAWER (Left Slide) --- */}
      
      {/* 1. Dark Overlay Backdrop */}
      <div 
        className={`lg:hidden fixed inset-0 bg-black/60 z-[60] transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* 2. The Drawer Menu */}
      <div 
        className={`lg:hidden fixed top-0 left-0 h-full w-4/5 max-w-sm bg-white z-[70] transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <span className="text-lg font-serif font-semibold tracking-widest uppercase text-gray-900">Categories</span>
          <button 
            onClick={() => setIsMenuOpen(false)}
            className="p-2 -mr-2 text-gray-500 hover:text-red-500 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Drawer Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-2">
          {topLevelCategories.map((category) => {
            const subcategories = getSubcategories(category.id);
            const hasSubcats = subcategories.length > 0;
            const isExpanded = mobileExpanded === category.id;

            return (
              <div key={category.id} className="border-b border-gray-50">
                <div className="flex items-center justify-between">
                  <Link
                    to={`/category/${category.name}`}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex-1 py-4 px-5 text-[14px] font-serif font-medium uppercase tracking-widest text-gray-900"
                  >
                    {category.name}
                  </Link>
                  {hasSubcats && (
                    <button
                      onClick={() => setMobileExpanded(isExpanded ? null : category.id)}
                      className="p-4 text-gray-400 hover:text-yellow-600"
                    >
                      <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-yellow-600' : ''}`} />
                    </button>
                  )}
                </div>

                {/* Mobile Subcategory Accordion */}
                <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96 opacity-100 bg-gray-50/50' : 'max-h-0 opacity-0'}`}>
                  <div className="px-5 py-2 pb-4 space-y-1">
                    {subcategories.map((sub) => (
                      <Link
                        key={sub.id}
                        to={`/category/${sub.name}`}
                        onClick={() => setIsMenuOpen(false)}
                        className="block py-2.5 pl-4 text-[13px] font-serif text-gray-600 hover:text-yellow-600 border-l-2 border-transparent hover:border-yellow-600"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- MAIN PAGE CONTENT --- */}
      <main className="flex-1">
        {children}
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Gem className="h-6 w-6 text-yellow-400" />
                <span className="text-lg font-semibold">KhushiiWithDiamond</span>
              </div>
              <p className="text-gray-400 mb-4">Premium Indian jewellery.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li>support@khushiiwithdiamond.in</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 KhushiiWithDiamond. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}