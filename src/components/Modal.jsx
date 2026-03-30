import { X } from 'lucide-react';

/**
 * Reusable modal wrapper with backdrop, header, and close button.
 * @param {string} title - Modal header text
 * @param {string} [maxWidth='max-w-sm'] - Tailwind max-width class
 * @param {Function} onClose - Called when backdrop or X is clicked
 * @param {React.ReactNode} children - Modal body content
 */
export default function Modal({ title, maxWidth = 'max-w-sm', onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className={`bg-[var(--color-surface-light)] rounded-xl shadow-2xl w-full ${maxWidth} max-h-[85vh] flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] shrink-0">
            <h2 className="text-base font-semibold text-[var(--color-text)]">{title}</h2>
            <button onClick={onClose} className="p-1 hover:bg-[var(--color-surface)] rounded transition-colors">
              <X className="w-4 h-4 text-[var(--color-text-dim)]" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
