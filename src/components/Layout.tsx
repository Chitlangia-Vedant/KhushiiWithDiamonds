import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gem, Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Category } from '../types';
import { useClickOutside } from '../hooks/useClickOutside';
import { useCategories } from '../hooks/useCategories';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { ref: dropdownRef, isOpen: isCategoryDropdownOpen, setIsOpen: setIsCategoryDropdownOpen } = useClickOutside<HTMLDivElement>(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const location = useLocation();

  const navigation = [
    { name: 'Home', path: '/' },
    { name: 'Admin', path: '/admin' },
  ];

  // Organize categories into hierarchy
  const { topLevelCategories, getSubcategories } = useCategories();

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const CategoryMenuItem = ({ category, level = 0, isMobile = false }: { 
    category: Category; 
    level?: number; 
    isMobile?: boolean;
  }) => {
    const subcategories = getSubcategories(category.id);
    const hasSubcategories = subcategories.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const paddingLeft = level * (isMobile ? 16 : 12);

    return (
      <div key={category.id}>
        <div className="flex items-center">
          <Link
            to={`/category/${category.name}`}
            onClick={() => {
              setIsCategoryDropdownOpen(false);
              setIsMenuOpen(false);
            }}
            className={`flex-1 px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 transition-colors ${
              isMobile ? 'block' : ''
            }`}
            style={{ paddingLeft: `${16 + paddingLeft}px` }}
          >
            {category.name}
          </Link>
          {hasSubcategories && (
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleExpanded(category.id);
              }}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <ChevronRight 
                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
              />
            </button>
          )}
        </div>
        
        {hasSubcategories && isExpanded && (
          <div className={isMobile ? 'bg-gray-50' : ''}>
            {subcategories.map((subcategory) => (
              <CategoryMenuItem 
                key={subcategory.id} 
                category={subcategory} 
                level={level + 1} 
                isMobile={isMobile}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-lg border-b-2 border-yellow-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Gem className="h-8 w-8 text-yellow-600" />
              <div>
                <span className="text-2xl font-bold text-gray-900">KhushiiWithDiamond</span>
                <div className="text-xs text-gray-600">Premium Indian Jewellery</div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'text-yellow-600 bg-yellow-50'
                      : 'text-gray-700 hover:text-yellow-600 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-yellow-600 hover:bg-gray-100 transition-colors"
                >
                  <span>Categories</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCategoryDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 max-h-96 overflow-y-auto">
                    <div className="py-1">
                      {topLevelCategories.map((category) => (
                        <CategoryMenuItem key={category.id} category={category} />
                      ))}
                      {topLevelCategories.length === 0 && (
                        <div className="px-4 py-2 text-sm text-gray-500">
                          No categories available
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </nav>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-yellow-600 hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'text-yellow-600 bg-yellow-50'
                      : 'text-gray-700 hover:text-yellow-600 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              <div className="px-3 py-2">
                <div className="text-base font-medium text-gray-900 mb-2">Categories</div>
                <div className="space-y-1">
                  {topLevelCategories.map((category) => (
                    <CategoryMenuItem key={category.id} category={category} isMobile={true} />
                  ))}
                  {topLevelCategories.length === 0 && (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      No categories available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Gem className="h-6 w-6 text-yellow-400" />
                <span className="text-lg font-semibold">KhushiiWithDiamond</span>
              </div>
              <p className="text-gray-400 mb-4">
                Premium Indian jewellery.
              </p>
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