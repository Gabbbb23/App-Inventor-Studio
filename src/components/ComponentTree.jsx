import { COMPONENTS } from '../lib/componentDefs';
import { Trash2, ChevronUp, ChevronDown, ChevronRight, ChevronDown as ChevronDownIcon } from 'lucide-react';
import { useState } from 'react';

export default function ComponentTree({ components, selectedId, onSelect, onRemove, onMove }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-[var(--color-border)]">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">Component Tree</h3>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {components.length === 0 ? (
          <div className="px-3 py-4 text-xs text-[var(--color-text-dim)] text-center">
            No components yet.<br />Add from the palette above.
          </div>
        ) : (
          <TreeNodes
            components={components}
            depth={0}
            selectedId={selectedId}
            onSelect={onSelect}
            onRemove={onRemove}
            onMove={onMove}
          />
        )}
      </div>
    </div>
  );
}

function TreeNodes({ components, depth, selectedId, onSelect, onRemove, onMove }) {
  return (
    <>
      {components.map((comp) => (
        <TreeNode
          key={comp.Uuid}
          comp={comp}
          depth={depth}
          selectedId={selectedId}
          onSelect={onSelect}
          onRemove={onRemove}
          onMove={onMove}
        />
      ))}
    </>
  );
}

function TreeNode({ comp, depth, selectedId, onSelect, onRemove, onMove }) {
  const [expanded, setExpanded] = useState(true);
  const def = COMPONENTS[comp.$Type];
  const hasChildren = comp.children && comp.children.length > 0;
  const isSelected = comp.Uuid === selectedId;
  const isLayout = def?.isLayout;

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 cursor-pointer text-sm transition-colors group ${
          isSelected
            ? 'bg-[var(--color-primary)] bg-opacity-30 text-[var(--color-text)]'
            : 'hover:bg-[var(--color-surface-lighter)] text-[var(--color-text)]'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(comp.Uuid)}
      >
        {isLayout ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="w-4 h-4 flex items-center justify-center"
          >
            {expanded ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <span className="text-base">{def?.icon || '📦'}</span>
        <span className="truncate flex-1">{comp.$Name}</span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); onMove(comp.Uuid, 'up'); }}
            className="p-0.5 hover:bg-[var(--color-surface)] rounded"
            title="Move up"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMove(comp.Uuid, 'down'); }}
            className="p-0.5 hover:bg-[var(--color-surface)] rounded"
            title="Move down"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(comp.Uuid); }}
            className="p-0.5 hover:bg-[var(--color-accent-red)] hover:bg-opacity-30 rounded"
            title="Delete"
          >
            <Trash2 className="w-3 h-3 text-[var(--color-accent-red)]" />
          </button>
        </div>
      </div>
      {isLayout && expanded && hasChildren && (
        <TreeNodes
          components={comp.children}
          depth={depth + 1}
          selectedId={selectedId}
          onSelect={onSelect}
          onRemove={onRemove}
          onMove={onMove}
        />
      )}
    </div>
  );
}
