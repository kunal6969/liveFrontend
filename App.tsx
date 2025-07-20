import React, { useEffect, useState, useRef } from 'react';
import { HashRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthContextProvider, useAuth } from './contexts/AuthContext';
import { ThemeContextProvider, useTheme } from './contexts/ThemeContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HostelRoomsPage from './pages/HostelRoomsPage'; 
import EventsPage from './pages/EventsPage';
import CgpaPage from './pages/CgpaPage';
import { Spinner, Button } from './components/UIElements'; 
import { 
    Gradients, SunIcon, MoonIcon, HomeIcon, LogoutIcon, LoginIcon, BuildingIcon, CalendarDaysIcon, ChartPieIcon, XMarkIcon, MenuIcon as VibrantMenuIcon
} from './components/VibrantIcons';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <button
            onClick={toggleTheme} 
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-200" 
            aria-label="Toggle theme" 
        >
            {theme === 'light' ? <MoonIcon className="w-7 h-7" /> : <SunIcon className="w-7 h-7" />}
        </button>
    );
};

const Navbar: React.FC = () => {
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const [sliderStyle, setSliderStyle] = useState({ opacity: 0, left: 0, width: 0 });

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <HomeIcon /> },
    { path: '/hostel-rooms', label: 'Hostel Rooms', icon: <BuildingIcon /> },
    { path: '/events', label: 'Events', icon: <CalendarDaysIcon /> },
    { path: '/cgpa-calculator', label: 'CGPA', icon: <ChartPieIcon /> },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 100 && currentScrollY > lastScrollY.current) {
        setIsNavbarVisible(false); // Hide on scroll down
      } else {
        setIsNavbarVisible(true); // Show on scroll up or near top
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto' };
  }, [isMenuOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Effect for the navigation slider
  useEffect(() => {
    if (navContainerRef.current) {
      const activeItem = navItems
        .slice()
        .sort((a, b) => b.path.length - a.path.length)
        .find(item => location.pathname.startsWith(item.path));
      
      const activeLinkEl = activeItem ? navContainerRef.current.querySelector(`[data-path="${activeItem.path}"]`) as HTMLElement : null;

      if (activeLinkEl) {
          setSliderStyle({
            left: activeLinkEl.offsetLeft,
            width: activeLinkEl.offsetWidth,
            opacity: 1,
          });
      } else {
        setSliderStyle(s => ({ ...s, opacity: 0 }));
      }
    }
  }, [location.pathname, user]);

  const MobileNavLinks: React.FC = () => (
    <>
      {navItems.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={`relative flex items-center gap-x-3 transition-colors duration-200 ease-in-out font-semibold text-lg w-full p-4 rounded-md ${location.pathname.startsWith(item.path) ? 'bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'}`}
        > 
          <span className="w-6 h-6">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </>
  );

  return (
    <>
      <nav className={`bg-slate-100/80 dark:bg-gray-950/80 backdrop-blur-xl shadow-lg fixed top-0 left-0 right-0 z-30 border-b border-slate-200/50 dark:border-slate-800/50 transition-transform duration-300 ease-in-out ${isNavbarVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/dashboard" className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 transform hover:scale-105">
            MNIT LIVE
          </Link>
          
          {/* Desktop Nav */}
          <div ref={navContainerRef} className="hidden md:flex items-center gap-x-1 h-full relative">
            {navItems.map(item => (
              <Link
                key={item.path}
                data-path={item.path}
                to={item.path}
                className={`relative flex items-center gap-x-2 transition-colors duration-200 ease-in-out font-semibold text-sm px-3 h-full
                  ${location.pathname.startsWith(item.path) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`
                }
              > 
                <span className="w-6 h-6">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            <div 
              className="absolute top-1/2 -translate-y-1/2 h-10 bg-slate-200/70 dark:bg-black/40 rounded-full -z-10"
              style={{...sliderStyle, transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'}}
            ></div>
          </div>

          <div className="flex items-center gap-x-4">
            {/* Desktop controls */}
            <div className="hidden md:flex items-center gap-x-2">
               {user && (
                  <Button onClick={logout} variant="ghost" size="sm" className="!p-2" title="Logout">
                      <LogoutIcon />
                  </Button>
               )}
               <ThemeToggle />
            </div>

            {/* Mobile controls */}
            <div className="flex items-center gap-x-1 md:hidden">
              <ThemeToggle />
              {user && (
                <Button onClick={logout} variant="ghost" size="sm" className="!p-2" title="Logout">
                  <LogoutIcon className="h-7 w-7" />
                </Button>
              )}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors z-50"
                aria-label="Open menu"
              >
                {isMenuOpen ? <XMarkIcon className="h-8 w-8" /> : <VibrantMenuIcon className="h-8 w-8" />}
              </button>
            </div>

            {!user && !loading && (
              <Link to="/login">
                  <Button variant="primary" size="sm" leftIcon={<LoginIcon className="w-5 h-5" />}> 
                      Login
                  </Button>
              </Link>
            )}
            {loading && <Spinner size="sm" />}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Panel */}
      <div className={`fixed inset-0 z-20 transition-opacity duration-300 md:hidden ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsMenuOpen(false)}></div>
          {/* Drawer */}
          <div className={`absolute top-0 right-0 h-full w-full max-w-xs bg-slate-100 dark:bg-gray-950 shadow-2xl transition-transform duration-300 ease-in-out transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
              <div className="flex flex-col h-full p-4 pt-20">
                  <div className="flex-grow space-y-2">
                    <MobileNavLinks />
                  </div>
              </div>
          </div>
      </div>
    </>
  );
};

const AppBody: React.FC = () => {
    const location = useLocation();
    return (
        <>
            <Navbar />
            <main key={location.pathname} className="container mx-auto p-4 pt-24 sm:pt-24 animate-fade-in">
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/hostel-rooms" element={<HostelRoomsPage />} />
                    <Route path="/events" element={<EventsPage />} />
                    <Route path="/cgpa-calculator" element={<CgpaPage />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/" />} /> 
                </Routes>
            </main>
            <Footer />
        </>
    );
};

const App: React.FC = () => {
  return (
    <ThemeContextProvider>
        <AuthContextProvider>
        <Gradients />
        <HashRouter>
            <AppBody />
        </HashRouter>
        </AuthContextProvider>
    </ThemeContextProvider>
  );
};

const Footer: React.FC = () => {
    return (
        <footer className="bg-transparent text-slate-500 dark:text-slate-400 py-6 mt-12">
            <div className="container mx-auto text-center">
                <p>&copy; {new Date().getFullYear()} MNIT LIVE. All rights reserved.</p>
                <p className="text-sm mt-1">A platform for MNIT Jaipur students. 🎓</p>
                <p className="text-sm mt-2">
                    <a href="mailto:hostel.admin@mnit.ac.in?subject=MNIT LIVE Query" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 underline transition-colors duration-200">Contact Admin</a>
                </p>
            </div>
        </footer>
    );
}

export default App;
