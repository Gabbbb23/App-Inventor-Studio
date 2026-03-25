import { Download, Layout, Code, FolderOpen, Smartphone, LayoutGrid } from 'lucide-react';

export default function Header({ projectName, onProjectNameChange, onExport, view, onViewChange, onShowTemplates }) {
  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-[var(--color-border)] bg-[var(--color-surface-light)] shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-[var(--color-primary-light)]" />
          <span className="font-semibold text-[var(--color-primary-light)] text-lg">AI Studio</span>
        </div>
        <div className="w-px h-6 bg-[var(--color-border)]" />
        <input
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          className="bg-transparent border border-transparent hover:border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none rounded px-2 py-1 text-sm text-[var(--color-text)] w-40"
          spellCheck={false}
        />
      </div>

      <div className="flex items-center gap-2">
        {/* View Toggle */}
        <div className="flex rounded-lg overflow-hidden border border-[var(--color-border)]">
          <button
            onClick={() => onViewChange('design')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
              view === 'design'
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
            }`}
          >
            <Layout className="w-4 h-4" />
            Design
          </button>
          <button
            onClick={() => onViewChange('layout')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
              view === 'layout'
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Layout
          </button>
          <button
            onClick={() => onViewChange('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
              view === 'code'
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
            }`}
          >
            <Code className="w-4 h-4" />
            Code
          </button>
        </div>

        {onShowTemplates && (
          <button
            onClick={onShowTemplates}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            Templates
          </button>
        )}

        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-[var(--color-accent-green)] text-white font-medium hover:opacity-90 transition-opacity"
        >
          <Download className="w-4 h-4" />
          Export .aia
        </button>
      </div>
    </header>
  );
}
