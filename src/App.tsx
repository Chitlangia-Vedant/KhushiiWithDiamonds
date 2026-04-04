import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { CategoryPage } from './pages/CategoryPage';
import { AdminPage } from './pages/AdminPage';
import { QualityProvider } from './context/QualityContext';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const StorefrontZone = () => {
  return (
    <Layout>
      <Outlet /> {/* This tells React Router where to put the Home or Category page */}
    </Layout>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <QualityProvider>
        <Router>
          <Routes>
            
            {/* --- SECURE ADMIN ZONE --- */}
            {/* Because this is NOT inside StorefrontZone, it will completely hide the public Header/Footer! */}
            {/* Your AdminPage already handles the Supabase Auth lock securely. */}
            <Route path="/admin/*" element={<AdminPage />} />

            {/* --- PUBLIC STOREFRONT ZONE --- */}
            <Route element={<StorefrontZone />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/category/:categoryName" element={<CategoryPage />} />
            </Route>

          </Routes>
        </Router>
      </QualityProvider>
    </ErrorBoundary>
  );
}

export default App;