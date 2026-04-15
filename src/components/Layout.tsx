import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gem, Menu, X, Sparkles, ChevronDown } from 'lucide-react';
import { useQualityContext } from '../context/QualityContext';
import { GOLD_QUALITIES, DIAMOND_QUALITIES, DiamondQuality } from '../constants/jewellery';
import { useCategories } from '../hooks/useCategories';
import { Category } from '../types';

// --- RECURSIVE MOBILE ACCORDION COMPONENT ---
// This allows infinite levels of subcategories (Level 1 -> Level 2 -> Level 3, etc.)
interface MobileCategoryItemProps {
  category: Category;
  level?: number;
  getSubcategories: (id: string) => Category[];
  closeMenu: () => void;
}

const MobileCategoryItem = ({ category, level = 0, getSubcategories, closeMenu }: MobileCategoryItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const subcategories = getSubcategories(category.id);
  const hasSubcats = subcategories.length > 0;

  // Premium typography styling based on how deep the category is nested
  const textStyles =
    level === 0 ? "text-[15px] font-serif font-semibold uppercase tracking-widest text-gray-900" :
    level === 1 ? "text-[14px] font-serif font-medium text-gray-800" :
    "text-[13px] font-serif text-gray-600";

  // Indentation styling based on depth
  const paddingStyles =
    level === 0 ? "py-4 px-5" :
    level === 1 ? "py-3 px-5 ml-4 border-l-2 border-gray-200" :
    "py-2.5 px-5 ml-8 border-l-2 border-gray-100";

  return (
    <div className={`border-b border-gray-50 ${level > 0 ? 'bg-gray-50/30' : ''}`}>
      <div className="flex items-center justify-between">
        <Link
          to={`/category/${category.name}`}
          onClick={closeMenu}
          className={`flex-1 ${paddingStyles} ${textStyles} hover:text-yellow-600 transition-colors`}
        >
          {category.name}
        </Link>
        {hasSubcats && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-4 text-gray-400 hover:text-yellow-600"
          >
            <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-yellow-600' : ''}`} />
          </button>
        )}
      </div>
      
      {/* Nested Subcategories Drawer */}
      {hasSubcats && (
        <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="flex flex-col pb-2">
            {subcategories.map((sub) => (
              <MobileCategoryItem
                key={sub.id}
                category={sub}
                level={level + 1}
                getSubcategories={getSubcategories}
                closeMenu={closeMenu}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


// --- MAIN LAYOUT COMPONENT ---
interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center h-16 md:h-20">
            
            {/* LEFT SIDE: Hamburger & Logo Grouped Together */}
            <div className="flex items-center">
              {/* Mobile Hamburger (Left edge) */}
              <button 
                onClick={() => setIsMenuOpen(true)} 
                className="lg:hidden p-2 -ml-2 mr-1 sm:mr-3 text-gray-800 hover:text-yellow-600 transition-colors"
              >
                <Menu className="h-6 w-6 sm:h-7 sm:w-7" />
              </button>

              {/* Logo (Next to Hamburger) */}
              <Link 
                to="/" 
                className="flex items-center space-x-1 sm:space-x-2"
              >
                <Gem className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-yellow-600 flex-shrink-0" />
                <div className="flex flex-col">
                  {/* Shrunk logo text for mobile so selectors can fit gracefully */}
                  <span className="text-[13px] sm:text-lg md:text-2xl font-bold text-gray-900 tracking-tight leading-none">KhushiiWithDiamond</span>
                  <span className="hidden sm:block text-[9px] md:text-xs text-yellow-600 font-semibold uppercase tracking-widest mt-0.5 md:mt-1 leading-none">Premium Indian Jewellery</span>
                </div>
              </Link>
            </div>

            {/* RIGHT SIDE: Quality Selectors (Now visible on ALL screens) */}
            <div className="flex items-center space-x-1 sm:space-x-3 ml-auto">
              
              {/* Gold Selector */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span className="hidden sm:block text-xs font-semibold text-gray-500 uppercase">Gold:</span>
                <select 
                  value={globalGoldPurity}
                  onChange={(e) => setGlobalGoldPurity(e.target.value)}
                  className="text-[11px] sm:text-sm border-none bg-yellow-50 text-yellow-800 rounded sm:rounded-md py-1 pl-1 pr-4 sm:pl-2 sm:pr-6 focus:ring-0 cursor-pointer font-bold"
                >
                  {/* --- FIX 1: Use gold.label for a cleaner UI! --- */}
                  {GOLD_QUALITIES.map((gold) => (
                    <option key={gold.value} value={gold.value}>{gold.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Diamond Selector */}
              <div className="flex items-center space-x-0.5 sm:space-x-1 bg-blue-50 rounded sm:rounded-md pl-1 sm:pl-2">
                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-500" />
                <select 
                  value={globalDiamondQuality}
                  onChange={(e) => setGlobalDiamondQuality(e.target.value as DiamondQuality)}
                  className="text-[11px] sm:text-sm border-none bg-transparent text-blue-800 py-1 pl-0.5 sm:pl-1 pr-4 sm:pr-6 focus:ring-0 cursor-pointer font-bold"
                >
                  {/* --- FIX 2: Stop React from crashing by extracting the object properties --- */}
                  {DIAMOND_QUALITIES.map((quality) => (
                    <option key={quality.value} value={quality.value}>{quality.label}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>
        </div>

        {/* ROW 2: Dedicated Category Sub-Header (PC Only) */}
        <div className="hidden lg:block border-t border-gray-100 bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center justify-center space-x-10 h-12">
              {topLevelCategories.map((category) => {
                const subcategories = getSubcategories(category.id);
                const hasSubcats = subcategories.length > 0;
                
                // 1. EXACT MATCH FIX: Only highlight if it perfectly matches the category or its subcategories!
                const decodedPath = decodeURIComponent(location.pathname);
                const isExactMatch = decodedPath === `/category/${category.name}`;
                const isSubcategoryMatch = subcategories.some(sub => 
                  decodedPath === `/category/${sub.name}` || 
                  getSubcategories(sub.id).some(subSub => decodedPath === `/category/${subSub.name}`)
                );
                const isActive = isExactMatch || isSubcategoryMatch;

                return (
                  <div key={category.id} className="relative group h-full flex items-center">
                    <Link
                      to={`/category/${category.name}`}
                      className={`flex items-center space-x-1 text-[15px] font-serif tracking-widest uppercase transition-colors ${
                        isActive ? 'text-yellow-600 font-semibold' : 'text-gray-800 group-hover:text-yellow-600'
                      }`}
                    >
                      <span>{category.name}</span>
                      {hasSubcats && <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />}
                    </Link>

                    {/* 2. DYNAMIC WIDTH FIX: No more empty space! Width now perfectly hugs the columns. */}
                    {hasSubcats && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-max min-w-[200px] max-w-[900px] bg-white shadow-xl border-t-2 border-yellow-500 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        
                        {/* Dynamic Grid: 1 column if 1 subcategory, 2 if 2, 3 if 3+ */}
                        <div className={`p-6 grid gap-x-10 gap-y-6 ${
                          subcategories.length >= 3 ? 'grid-cols-3' : 
                          subcategories.length === 2 ? 'grid-cols-2' : 
                          'grid-cols-1'
                        }`}>
                          
                          {subcategories.map((sub) => {
                            const subSubcats = getSubcategories(sub.id);
                            return (
                              <div key={sub.id} className="flex flex-col min-w-[140px]">
                                {/* Level 2: Column Headers */}
                                <Link
                                  to={`/category/${sub.name}`}
                                  className="text-[14px] font-serif font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2 mb-3 hover:text-yellow-600 transition-colors"
                                >
                                  {sub.name}
                                </Link>
                                {/* Level 3: Nested Links */}
                                {subSubcats.length > 0 && (
                                  <div className="flex flex-col space-y-2.5">
                                    {subSubcats.map((subSub) => (
                                      <Link
                                        key={subSub.id}
                                        to={`/category/${subSub.name}`}
                                        className="text-[13px] font-serif text-gray-600 hover:text-yellow-600 transition-colors"
                                      >
                                        {subSub.name}
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
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
      <div 
        className={`lg:hidden fixed inset-0 bg-black/60 z-[60] transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      <div 
        className={`lg:hidden fixed top-0 left-0 h-full w-[85%] max-w-sm bg-white z-[70] transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
          <span className="text-lg font-serif font-semibold tracking-widest uppercase text-gray-900">Categories</span>
          <button 
            onClick={() => setIsMenuOpen(false)}
            className="p-2 -mr-2 text-gray-500 hover:text-red-500 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Multi-Level Recursive Mobile Content */}
        <div className="flex-1 overflow-y-auto pb-6">
          {topLevelCategories.map((category) => (
            <MobileCategoryItem
              key={category.id}
              category={category}
              level={0}
              getSubcategories={getSubcategories}
              closeMenu={() => setIsMenuOpen(false)}
            />
          ))}
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