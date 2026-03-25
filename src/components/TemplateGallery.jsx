export default function TemplateGallery({ templates, onSelect, onSkip }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-auto">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">Welcome to App Inventor Studio</h1>
          <p className="text-[var(--color-text-dim)]">
            Build MIT App Inventor apps with a modern editor. Choose a template or start from scratch.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {templates.map(template => (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              className="text-left p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-light)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-lighter)] transition-all group"
            >
              <div className="text-3xl mb-2">{template.icon}</div>
              <h3 className="font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary-light)] transition-colors">
                {template.name}
              </h3>
              <p className="text-sm text-[var(--color-text-dim)] mt-1">
                {template.description}
              </p>
            </button>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={onSkip}
            className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors underline"
          >
            Skip and start with blank project
          </button>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl mb-1">🖱️</div>
            <h4 className="font-medium text-[var(--color-text)] text-sm">Visual Designer</h4>
            <p className="text-xs text-[var(--color-text-dim)] mt-1">Add and arrange components visually with a phone preview</p>
          </div>
          <div>
            <div className="text-2xl mb-1">💻</div>
            <h4 className="font-medium text-[var(--color-text)] text-sm">Code Editor</h4>
            <p className="text-xs text-[var(--color-text-dim)] mt-1">Write logic in simple text instead of dragging blocks</p>
          </div>
          <div>
            <div className="text-2xl mb-1">📦</div>
            <h4 className="font-medium text-[var(--color-text)] text-sm">Export to .aia</h4>
            <p className="text-xs text-[var(--color-text-dim)] mt-1">Download and import directly into MIT App Inventor</p>
          </div>
        </div>
      </div>
    </div>
  );
}
