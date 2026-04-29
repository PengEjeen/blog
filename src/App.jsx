import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Home from './pages/Home';
import { ThemeProvider } from './utils/theme';
import { SidebarProvider } from './utils/sidebar';

const Category = lazy(() => import('./pages/Category'));
const Subcategory = lazy(() => import('./pages/Subcategory'));
const Post = lazy(() => import('./pages/Post'));
const NotFound = lazy(() => import('./pages/NotFound'));

const RouteFallback = () => (
  <div className="route-fallback" aria-live="polite">
    <span className="route-fallback-spinner" />
    <span>로딩 중…</span>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <div className="app-container">
          <Header />
          <div className="layout">
            <Sidebar />
            <main className="main-content">
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/category/:name" element={<Category />} />
                  <Route path="/category/:name/:subcategory" element={<Subcategory />} />
                  <Route path="/category/:name/:subcategory/:post" element={<Post />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
          </div>
          <Footer />
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
