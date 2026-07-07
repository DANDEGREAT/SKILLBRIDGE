import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Briefcase, User as UserIcon, Building, X } from 'lucide-react';
import { useUIStore } from '../store/ui';
import { getTechnicians, getJobs, getShops } from '../lib/api';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'job' | 'technician' | 'shop';
  link: string;
}

export function GlobalSearch() {
  const { globalSearchOpen, setGlobalSearchOpen } = useUIStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (globalSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [globalSearchOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      const [techs, jobs, shops] = await Promise.all([
        getTechnicians(),
        getJobs(),
        getShops(),
      ]);

      const q = query.toLowerCase();
      const techResults: SearchResult[] = techs
        .filter((t) => {
          const name = `${t.first_name} ${t.last_name}`.toLowerCase();
          return name.includes(q) || (t.profile?.trade || '').toLowerCase().includes(q);
        })
        .slice(0, 5)
        .map((t) => ({
          id: t.id,
          title: `${t.first_name} ${t.last_name}`,
          subtitle: t.profile?.trade || 'Technician',
          type: 'technician' as const,
          link: `/profile/${t.id}`,
        }));

      const jobResults: SearchResult[] = jobs
        .filter((j) => j.title.toLowerCase().includes(q) || (j.location_text || '').toLowerCase().includes(q))
        .slice(0, 5)
        .map((j) => ({
          id: j.id,
          title: j.title,
          subtitle: `${j.trade} - ${j.location_text || 'Lagos'}`,
          type: 'job' as const,
          link: `/jobs/${j.id}`,
        }));

      const shopResults: SearchResult[] = shops
        .filter((s) => s.name.toLowerCase().includes(q) || (s.category || '').toLowerCase().includes(q))
        .slice(0, 3)
        .map((s) => ({
          id: s.id,
          title: s.name,
          subtitle: `${s.category} - ${s.city}`,
          type: 'shop' as const,
          link: `/shops/${s.id}`,
        }));

      setResults([...techResults, ...jobResults, ...shopResults]);
      setSelectedIndex(0);
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(!globalSearchOpen);
      }
      if (e.key === 'Escape') {
        setGlobalSearchOpen(false);
      }
      if (globalSearchOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
        }
        if (e.key === 'Enter' && results[selectedIndex]) {
          e.preventDefault();
          navigate(results[selectedIndex].link);
          setGlobalSearchOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [globalSearchOpen, results, selectedIndex, setGlobalSearchOpen, navigate]);

  const icons = {
    job: <Briefcase size={16} className="text-primary-mid" />,
    technician: <UserIcon size={16} className="text-accent-mid" />,
    shop: <Building size={16} className="text-success" />,
  };

  return (
    <AnimatePresence>
      {globalSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
          onClick={() => setGlobalSearchOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-bg-2 border border-border rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search size={20} className="text-text-3" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search technicians, jobs, shops..."
                className="flex-1 bg-transparent text-text placeholder:text-text-3 outline-none"
              />
              <button onClick={() => setGlobalSearchOpen(false)} className="text-text-3 hover:text-text">
                <X size={18} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {results.length === 0 ? (
                <div className="px-4 py-8 text-center text-text-3 text-sm">
                  {query ? 'No results found' : 'Start typing to search...'}
                </div>
              ) : (
                results.map((result, idx) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => {
                      navigate(result.link);
                      setGlobalSearchOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      idx === selectedIndex ? 'bg-bg-3' : 'hover:bg-bg-3'
                    }`}
                  >
                    {icons[result.type]}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{result.title}</p>
                      <p className="text-xs text-text-2 truncate">{result.subtitle}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
