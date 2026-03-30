import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  let idCounter = 0;

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 200);
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
  };

  const borderColors = {
    success: 'border-green-500/30',
    error: 'border-red-500/30',
    info: 'border-blue-500/30',
  };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-[var(--color-surface-light)] border ${borderColors[toast.type]} shadow-lg transition-all duration-200 max-w-sm ${
        visible && !exiting ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
      }`}
    >
      {icons[toast.type]}
      <span className="text-sm text-[var(--color-text)] flex-1">{toast.message}</span>
      <button
        onClick={() => { setExiting(true); setTimeout(() => onRemove(toast.id), 200); }}
        className="p-0.5 hover:bg-[var(--color-surface)] rounded transition-colors shrink-0"
      >
        <X className="w-3 h-3 text-[var(--color-text-dim)]" />
      </button>
    </div>
  );
}
