import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h1 className="font-display text-[120px] sm:text-[160px] leading-none font-extrabold gold-gradient bg-clip-text text-transparent">
            404
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-2 -mt-4"
        >
          <h2 className="font-display text-2xl font-bold text-text">
            This page doesn't exist
          </h2>
          <p className="text-text-2 text-sm">
            The page you're looking for may have been moved, deleted, or never existed.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 justify-center mt-8"
        >
          <Button variant="primary" size="lg" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            Go Back
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/')}>
            <Home size={18} />
            Home
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8"
        >
          <button
            onClick={() => navigate('/search')}
            className="inline-flex items-center gap-2 text-text-3 hover:text-primary transition-colors text-sm"
          >
            <Search size={16} />
            Search for what you need
          </button>
        </motion.div>
      </div>
    </div>
  );
}
