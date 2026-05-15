import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white dark:bg-dark-900 border-b border-slate-200 dark:border-dark-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <Link to="/" className="text-2xl font-bold text-slate-900 dark:text-white hover:opacity-75 transition">
              Voices
            </Link>
            <nav className="flex items-center gap-4 sm:gap-6">
              {user && (
                <>
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                      `text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`
                    }
                  >
                    Polls
                  </NavLink>
                  <NavLink
                    to="/create"
                    className={({ isActive }) =>
                      `text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`
                    }
                  >
                    Create
                  </NavLink>
                </>
              )}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
                  title="Toggle theme"
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? (
                    <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.536l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.121-10.071a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm5.414 5.414a1 1 0 01-1.414 0l-.707-.707a1 1 0 011.414-1.414l.707.707zM5 10a1 1 0 100-2H4a1 1 0 100 2h1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </button>
                {user ? (
                  <button
                    onClick={logout}
                    className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
                  >
                    Sign out
                  </button>
                ) : (
                  <NavLink
                    to="/login"
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                        isActive
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-dark-800'
                      }`
                    }
                  >
                    Sign in
                  </NavLink>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>

      <footer className="bg-slate-50 dark:bg-dark-800 border-t border-slate-200 dark:border-dark-700 mt-24 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><Link to="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Home</Link></li>
                <li><Link to="/create" className="hover:text-slate-900 dark:hover:text-white transition-colors">Create Poll</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Real-time Analytics</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Live Responses</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Share & Collect</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-dark-700 pt-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                © 2026 Poll. All rights reserved.
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Built with React, Tailwind & Socket.io
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
