import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Plus, MessageSquare, User } from 'lucide-react';

export function MobileBottomNav() {
  const location = useLocation();

  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/find', icon: Search, label: 'Find' },
    { to: '/jobs/post', icon: Plus, label: 'Post Job' },
    { to: '/chat', icon: MessageSquare, label: 'Messages' },
    { to: '/dashboard/client', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-bg-2 border-t border-border md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {links.map((link) => {
          const active = location.pathname === link.to;
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                active ? 'text-primary-mid' : 'text-text-3'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
