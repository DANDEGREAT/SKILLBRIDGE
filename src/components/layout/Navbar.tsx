import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Menu, X, Search, ChevronDown, LayoutDashboard, User as UserIcon, Settings, HelpCircle, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useUIStore } from '../../store/ui';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { getNotifications } from '../../lib/api';
import type { Notification } from '../../lib/types';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const { setMobileNavOpen, setGlobalSearchOpen } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (user) {
      getNotifications(user.id).then(setNotifications);
      const interval = setInterval(() => {
        getNotifications(user.id).then(setNotifications);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  const dashboardLink = user
    ? user.role === 'admin'
      ? '/admin'
      : user.role === 'store_owner'
      ? '/dashboard/store'
      : user.role === 'technician'
      ? '/dashboard/technician'
      : '/dashboard/client'
    : '/';

  const navLinks = [
    { to: '/find', label: 'Find a Pro' },
    { to: '/jobs', label: 'Job Board' },
    { to: '/shops', label: 'Shops' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 h-15 transition-all duration-300 ${
          scrolled ? 'glass border-b border-border' : 'bg-bg'
        }`}
        style={{ height: 60 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 shrink-0">
            <span className="font-display font-extrabold text-xl">
              <span className="text-primary-mid">Skill</span>
              <span className="text-text">Bridge</span>
            </span>
          </Link>

          {/* Center nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith(link.to)
                    ? 'text-primary-mid bg-primary/10'
                    : 'text-text-2 hover:text-text hover:bg-bg-3'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              onClick={() => setGlobalSearchOpen(true)}
              className="p-2 rounded-lg text-text-2 hover:text-text hover:bg-bg-3 transition-colors hidden sm:block"
              title="Search (Cmd+K)"
            >
              <Search size={20} />
            </button>

            {user ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="relative p-2 rounded-lg text-text-2 hover:text-text hover:bg-bg-3 transition-colors"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-primary text-bg text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {notifOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 top-full mt-2 w-80 bg-bg-2 border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
                        >
                          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                            <span className="font-semibold text-sm">Notifications</span>
                            <Link
                              to="/notifications"
                              onClick={() => setNotifOpen(false)}
                              className="text-xs text-primary-mid hover:underline"
                            >
                              View all
                            </Link>
                          </div>
                          <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className="px-4 py-8 text-center text-text-3 text-sm">
                                No notifications
                              </div>
                            ) : (
                              notifications.slice(0, 8).map((n) => (
                                <Link
                                  key={n.id}
                                  to="/notifications"
                                  onClick={() => setNotifOpen(false)}
                                  className={`block px-4 py-3 border-b border-border hover:bg-bg-3 transition-colors ${
                                    !n.is_read ? 'bg-primary/5' : ''
                                  }`}
                                >
                                  <p className="text-sm font-medium text-text">{n.title}</p>
                                  <p className="text-xs text-text-2 mt-0.5 truncate">{n.body}</p>
                                </Link>
                              ))
                            )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-bg-3 transition-colors"
                  >
                    <Avatar
                      firstName={user.first_name}
                      lastName={user.last_name}
                      size="sm"
                    />
                    <ChevronDown size={16} className="text-text-3 hidden sm:block" />
                  </button>
                  <AnimatePresence>
                    {profileOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 top-full mt-2 w-64 bg-bg-2 border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
                        >
                          <div className="px-4 py-3 border-b border-border">
                            <p className="font-semibold text-sm">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs text-text-2 capitalize">
                              {user.role.replace('_', ' ')}
                            </p>
                          </div>
                          <div className="py-1">
                            <Link
                              to={dashboardLink}
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-2 hover:text-text hover:bg-bg-3 transition-colors"
                            >
                              <LayoutDashboard size={16} /> Dashboard
                            </Link>
                            <Link
                              to={`/profile/${user.id}`}
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-2 hover:text-text hover:bg-bg-3 transition-colors"
                            >
                              <UserIcon size={16} /> Profile
                            </Link>
                            <Link
                              to="/settings"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-2 hover:text-text hover:bg-bg-3 transition-colors"
                            >
                              <Settings size={16} /> Settings
                            </Link>
                            <Link
                              to="/subscribe"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-2 hover:text-text hover:bg-bg-3 transition-colors"
                            >
                              <Badge variant="gold">PRO</Badge> Subscribe
                            </Link>
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-power hover:bg-power/10 transition-colors"
                            >
                              <LogOut size={16} /> Logout
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-text-2 hover:text-text transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/auth/register"
                  className="px-4 py-2 text-sm font-semibold gold-gradient text-bg rounded-lg btn-press"
                >
                  Get started
                </Link>
              </div>
            )}

            {/* Mobile menu */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2 rounded-lg text-text-2 hover:text-text hover:bg-bg-3 transition-colors"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <MobileNav />
    </>
  );
}

function MobileNav() {
  const { user, logout } = useAuthStore();
  const { mobileNavOpen, setMobileNavOpen } = useUIStore();
  const navigate = useNavigate();

  const dashboardLink = user
    ? user.role === 'admin'
      ? '/admin'
      : user.role === 'store_owner'
      ? '/dashboard/store'
      : user.role === 'technician'
      ? '/dashboard/technician'
      : '/dashboard/client'
    : '/';

  const links = [
    { to: '/', label: 'Home' },
    { to: '/find', label: 'Find a Pro' },
    { to: '/jobs', label: 'Job Board' },
    { to: '/shops', label: 'Shops' },
  ];

  return (
    <AnimatePresence>
      {mobileNavOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-bg md:hidden"
        >
          <div className="flex items-center justify-between px-4 h-15 border-b border-border" style={{ height: 60 }}>
            <span className="font-display font-extrabold text-xl">
              <span className="text-primary-mid">Skill</span>
              <span className="text-text">Bridge</span>
            </span>
            <button
              onClick={() => setMobileNavOpen(false)}
              className="p-2 rounded-lg text-text-2 hover:bg-bg-3"
            >
              <X size={22} />
            </button>
          </div>
          <div className="p-4 space-y-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileNavOpen(false)}
                className="block px-4 py-3 rounded-lg text-text-2 hover:text-text hover:bg-bg-3 transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  to={dashboardLink}
                  onClick={() => setMobileNavOpen(false)}
                  className="block px-4 py-3 rounded-lg text-text-2 hover:text-text hover:bg-bg-3 transition-colors font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/notifications"
                  onClick={() => setMobileNavOpen(false)}
                  className="block px-4 py-3 rounded-lg text-text-2 hover:text-text hover:bg-bg-3 transition-colors font-medium"
                >
                  Notifications
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMobileNavOpen(false)}
                  className="block px-4 py-3 rounded-lg text-text-2 hover:text-text hover:bg-bg-3 transition-colors font-medium"
                >
                  Settings
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileNavOpen(false);
                    navigate('/');
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg text-power hover:bg-power/10 transition-colors font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="pt-4 space-y-2">
                <Link
                  to="/auth/login"
                  onClick={() => setMobileNavOpen(false)}
                  className="block px-4 py-3 rounded-lg text-center text-text-2 border border-border-2 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/auth/register"
                  onClick={() => setMobileNavOpen(false)}
                  className="block px-4 py-3 rounded-lg text-center gold-gradient text-bg font-semibold"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
