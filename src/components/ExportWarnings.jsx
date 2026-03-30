import { useState } from 'react';
import { AlertTriangle, ExternalLink, X } from 'lucide-react';

/**
 * Pre-export validation rules.
 * Each rule checks the component tree for a known issue and returns
 * a warning object if found, or null if everything is fine.
 */
const VALIDATION_RULES = [
  {
    id: 'firebase-url',
    check(components) {
      const found = [];
      function walk(comps) {
        for (const c of comps) {
          if (c.$Type === 'FirebaseDB' && !c.properties?.FirebaseURL) {
            found.push(c.$Name);
          }
          if (c.children) walk(c.children);
        }
      }
      walk(components);
      if (found.length === 0) return null;
      return {
        id: 'firebase-url',
        severity: 'error',
        component: found[0],
        property: 'FirebaseURL',
        title: `${found[0]} is missing a Firebase URL`,
        description: 'Without a Firebase Realtime Database URL, the app will crash at runtime.',
        fix: {
          type: 'text-input',
          label: 'Firebase URL',
          placeholder: 'https://your-project-default-rtdb.firebaseio.com/',
          property: 'FirebaseURL',
          componentName: found[0],
        },
        instructions: [
          'Go to Firebase Console (console.firebase.google.com)',
          'Create a new project (or use an existing one)',
          'Go to Build > Realtime Database > Create Database',
          'Choose "Start in test mode" for development',
          'Copy the database URL and paste it above',
        ],
      };
    },
  },
];

/**
 * Run all validation rules against the component tree.
 */
export function validateForExport(components) {
  const warnings = [];
  for (const rule of VALIDATION_RULES) {
    const result = rule.check(components);
    if (result) warnings.push(result);
  }
  return warnings;
}

/**
 * Modal that shows export warnings and lets users fix them inline.
 */
export default function ExportWarnings({ warnings, onFix, onExportAnyway, onCancel }) {
  const [fixValues, setFixValues] = useState({});

  const handleApplyFix = (warning) => {
    const value = fixValues[warning.id];
    if (value && warning.fix) {
      onFix(warning.fix.componentName, warning.fix.property, value);
    }
  };

  const hasErrors = warnings.some(w => w.severity === 'error');
  const allFixed = warnings.every(w => {
    if (w.fix?.type === 'text-input') {
      return fixValues[w.id]?.trim();
    }
    return false;
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface-light)] rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)]">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Before you export</h2>
            <p className="text-xs text-[var(--color-text-dim)] mt-0.5">
              {warnings.length} {warnings.length === 1 ? 'issue' : 'issues'} found that may cause problems in MIT App Inventor
            </p>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-[var(--color-surface)] rounded transition-colors">
            <X className="w-4 h-4 text-[var(--color-text-dim)]" />
          </button>
        </div>

        {/* Warnings list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {warnings.map(warning => (
            <div
              key={warning.id}
              className={`rounded-lg border p-4 ${
                warning.severity === 'error'
                  ? 'border-red-500/30 bg-red-500/5'
                  : 'border-amber-500/30 bg-amber-500/5'
              }`}
            >
              <div className="flex items-start gap-2 mb-2">
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                  warning.severity === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {warning.severity === 'error' ? 'Required' : 'Warning'}
                </span>
                <h3 className="text-sm font-medium text-[var(--color-text)] flex-1">{warning.title}</h3>
              </div>

              <p className="text-xs text-[var(--color-text-dim)] mb-3">{warning.description}</p>

              {/* Inline fix input */}
              {warning.fix?.type === 'text-input' && (
                <div className="mb-3">
                  <label className="text-xs text-[var(--color-text-dim)] mb-1 block">{warning.fix.label}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={warning.fix.placeholder}
                      value={fixValues[warning.id] || ''}
                      onChange={(e) => setFixValues(prev => ({ ...prev, [warning.id]: e.target.value }))}
                      className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-3 py-1.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-dim)] focus:border-[var(--color-primary)] focus:outline-none"
                      spellCheck={false}
                    />
                    <button
                      onClick={() => handleApplyFix(warning)}
                      disabled={!fixValues[warning.id]?.trim()}
                      className="px-3 py-1.5 text-xs rounded bg-[var(--color-primary)] text-white font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}

              {/* Setup instructions */}
              {warning.instructions && (
                <details className="group">
                  <summary className="text-xs text-[var(--color-primary-light)] cursor-pointer hover:underline">
                    Setup instructions
                  </summary>
                  <ol className="mt-2 space-y-1.5 text-xs text-[var(--color-text-dim)] list-decimal list-inside">
                    {warning.instructions.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </details>
              )}
            </div>
          ))}
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
          <button
            onClick={onExportAnyway}
            className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors underline"
          >
            Export anyway
          </button>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-1.5 text-sm rounded-lg border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Apply all pending fixes then export
                for (const w of warnings) {
                  if (w.fix && fixValues[w.id]?.trim()) {
                    onFix(w.fix.componentName, w.fix.property, fixValues[w.id]);
                  }
                }
                onExportAnyway();
              }}
              disabled={hasErrors && !allFixed}
              className="px-4 py-1.5 text-sm rounded-lg bg-[var(--color-accent-green)] text-white font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Fix & Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
