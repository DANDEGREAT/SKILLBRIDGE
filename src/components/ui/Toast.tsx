import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useUIStore } from '../../store/ui';

const icons = {
  success: <CheckCircle size={20} className="text-success" />,
  error: <XCircle size={20} className="text-power" />,
  warning: <AlertTriangle size={20} className="text-primary-mid" />,
  info: <Info size={20} className="text-accent-mid" />,
};

const borders = {
  success: 'border-l-success',
  error: 'border-l-power',
  warning: 'border-l-primary-mid',
  info: 'border-l-accent-mid',
};

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
            className={`bg-bg-3 border border-border border-l-4 ${borders[toast.type]} rounded-xl shadow-xl p-4 flex items-start gap-3`}
          >
            <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text">{toast.title}</p>
              {toast.message && <p className="text-xs text-text-2 mt-0.5">{toast.message}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-text-3 hover:text-text transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
