import { useState } from 'react';
import { CATEGORIES, COMPONENTS } from '../lib/componentDefs';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';

export default function ComponentPalette({ onAdd }) {
  const [expandedCategories, setExpandedCategories] = useState({ ui: true, layout: true });
  const [search, setSearch] = useState('');

  const toggleCategory = (id) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredComponents = Object.entries(COMPONENTS).filter(([key, comp]) => {
    if (!search) return true;
    return key.toLowerCase().includes(search.toLowerCase()) ||
           comp.defaultName.toLowerCase().includes(search.toLowerCase());
  });

  const componentsByCategory = {};
  for (const [key, comp] of filteredComponents) {
    if (!componentsByCategory[comp.category]) {
      componentsByCategory[comp.category] = [];
    }
    componentsByCategory[comp.category].push({ key, ...comp });
  }

  return (
    <div className="flex flex-col h-1/2 border-b border-[var(--color-border)]">
      <div className="px-3 py-2 border-b border-[var(--color-border)]">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-dim)] mb-2">Components</h3>
        <input
          type="text"
          placeholder="Search components..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-2 py-1 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-primary)]"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {CATEGORIES.map(cat => {
          const comps = componentsByCategory[cat.id];
          if (!comps || comps.length === 0) return null;
          const isExpanded = expandedCategories[cat.id] || search;

          return (
            <div key={cat.id}>
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[var(--color-text-dim)] hover:bg-[var(--color-surface-lighter)] transition-colors"
              >
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <span>{cat.icon} {cat.name}</span>
                <span className="ml-auto text-[10px] opacity-50">{comps.length}</span>
              </button>
              {isExpanded && (
                <div className="pb-1">
                  {comps.map(comp => (
                    <button
                      key={comp.key}
                      onClick={() => onAdd(comp.key)}
                      className="w-full flex items-center gap-2 px-4 py-1 text-sm text-[var(--color-text)] hover:bg-[var(--color-primary)] hover:bg-opacity-20 transition-colors group"
                    >
                      <span className="text-base">{comp.icon}</span>
                      <span className="truncate">{comp.defaultName}</span>
                      <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 text-[var(--color-primary-light)]" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
