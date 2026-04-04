import React, { useState } from 'react';
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

  // 1. Fetch categories directly into the Layout!
  const { topLevelCategories, getSubcategories } = useCategories();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Increased height to h-20 for a more premium, airy feel */}
          <div className="flex justify-between items-center h-20">
            
            {/* 1. LEFT: Brand Logo */}
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <Gem className="h-8 w-8 text-yellow-600" />
              <div>
                <span className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">KhushiiWithDiamond</span>
                <div className="text-[10px] md:text-xs text-yellow-600 font-semibold uppercase tracking-widest mt-0.5">Premium Indian Jewellery</div>
              </div>
            </Link>

            {/* 2. CENTER: Premium Mega-Menu (Hidden on Mobile) */}
            <nav className="hidden lg:flex items-center space-x-8 h-full">
              {topLevelCategories.map((category) => {
                const subcategories = getSubcategories(category.id);
                const hasSubcats = subcategories.length > 0;
                const isActive = location.pathname.includes(category.name);

                return (
                  <div key={category.id} className="relative group h-full flex items-center">
                    <Link
                      to={`/category/${category.name}`}
                      className={`flex items-center space-x-1 text-sm font-bold uppercase tracking-wider transition-colors ${
                        isActive ? 'text-yellow-600' : 'text-gray-800 group-hover:text-yellow-600'
                      }`}
                    >
                      <span>{category.name}</span>
                      {hasSubcats && <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />}
                    </Link>

                    {/* Desktop Mega-Menu Dropdown */}
                    {hasSubcats && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-56 bg-white shadow-xl border-t-2 border-yellow-500 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="py-2">
                          {subcategories.map((sub) => (
                            <Link
                              key={sub.id}
                              to={`/category/${sub.name}`}
                              className="block px-5 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-yellow-600 font-medium transition-colors"
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

            {/* 3. RIGHT: Quality Selectors & Mobile Toggle */}
            <div className="flex items-center space-x-4">
              
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

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-800 hover:text-yellow-600 hover:bg-gray-100 transition-colors"
              >
                {isMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
              </button>
            </div>

          </div>
        </div>

        {/* --- MOBILE NAV ACCORDION --- */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-xl overflow-y-auto max-h-[85vh]">
            <div className="px-4 pt-2 pb-6 space-y-1">
              
              <Link 
                to="/" 
                onClick={() => setIsMenuOpen(false)} 
                className="block py-4 border-b border-gray-100 text-sm font-bold uppercase tracking-wider text-gray-900"
              >
                Home
              </Link>

              {/* Mobile Category Accordions */}
              {topLevelCategories.map((category) => {
                const subcategories = getSubcategories(category.id);
                const hasSubcats = subcategories.length > 0;
                const isExpanded = mobileExpanded === category.id;

                return (
                  <div key={category.id} className="border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/category/${category.name}`}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex-1 py-4 text-sm font-bold uppercase tracking-wider text-gray-900"
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

                    {/* Subcategory Drawer */}
                    <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96 opacity-100 mb-2' : 'max-h-0 opacity-0'}`}>
                      <div className="bg-gray-50 px-4 py-2 space-y-1 rounded-lg">
                        {subcategories.map((sub) => (
                          <Link
                            key={sub.id}
                            to={`/category/${sub.name}`}
                            onClick={() => setIsMenuOpen(false)}
                            className="block py-2.5 text-sm font-medium text-gray-600 hover:text-yellow-600"
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
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-gray-900 text-white">
        {/* ... (Footer remains exactly the same as your previous code) ... */}
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