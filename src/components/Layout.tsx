import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Gem, Menu, X } from 'lucide-react';
import { CategoryDropdown } from './CategoryDropdown';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate(); // <-- Added to handle navigation!

  const navigation = [
    { name: 'Home', path: '/' },
    { name: 'Admin', path: '/admin' },
  ];

  // The universal handler for when a customer clicks a category anywhere in the header
  const handleCategorySelect = (_categoryId: string, categoryName: string) => {
    navigate(`/category/${categoryName}`);
    setIsMenuOpen(false); // Close the mobile menu if they are on a phone
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

              {/* --- DESKTOP NAV DROPDOWN --- */}
                <div>
                <CategoryDropdown
                  valueLabel="Categories"
                  onSelect={handleCategorySelect}
                  // Replaced "justify-between w-full" with "space-x-1"
                  triggerClassName="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-yellow-600 hover:bg-gray-100 transition-colors"
                />
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

        {/* --- MOBILE NAV MENU --- */}
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

                {/* Fix: Replaced the form box with a seamless mobile accordion style! */}
                <div className="w-full">
                  <CategoryDropdown
                    valueLabel="Categories"
                    onSelect={handleCategorySelect}
                    triggerClassName="flex items-center justify-between w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-yellow-600 hover:bg-gray-100 transition-colors"
                  />
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