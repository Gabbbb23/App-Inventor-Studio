import { useState } from 'react';
import { COMPONENTS } from '../lib/componentDefs';
import { Trash2, Plus, Type, Palette, Hash, ToggleLeft, Ruler, FileImage, Info } from 'lucide-react';

export default function PropertyEditor({ component, onPropertyChange, onRename, onRemove, onAddChild }) {
  if (!component) {
    return (
      <div className="p-4">
        <div className="text-sm text-[var(--color-text-dim)] text-center py-8">
          Select a component to<br />edit its properties
        </div>
      </div>
    );
  }

  const def = COMPONENTS[component.$Type];
  const isLayout = def?.isLayout;

  return (
    <div className="flex flex-col h-full">
      {/* Component header */}
      <div className="px-3 py-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{def?.icon || '📦'}</span>
          <div className="flex-1">
            <div className="text-xs text-[var(--color-text-dim)]">{component.$Type}</div>
          </div>
          <button
            onClick={() => onRemove(component.Uuid)}
            className="p-1 hover:bg-[var(--color-accent-red)] hover:bg-opacity-20 rounded transition-colors"
            title="Delete component"
          >
            <Trash2 className="w-4 h-4 text-[var(--color-accent-red)]" />
          </button>
        </div>

        {/* Rename */}
        <NameEditor
          name={component.$Name}
          onRename={(newName) => onRename(component.Uuid, newName)}
        />
      </div>

      {/* Add child button for layouts */}
      {isLayout && (
        <div className="px-3 py-2 border-b border-[var(--color-border)]">
          <LayoutChildAdder parentId={component.Uuid} onAdd={onAddChild} />
        </div>
      )}

      {/* Properties */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-dim)] mb-2">Properties</h4>
          {def?.properties && Object.entries(def.properties).map(([propName, propDef]) => (
            <PropertyField
              key={propName}
              name={propName}
              definition={propDef}
              value={component.properties?.[propName] ?? propDef.default}
              onChange={(value) => onPropertyChange(component.Uuid, propName, value)}
            />
          ))}
        </div>

        {/* Events & Methods info */}
        {def?.events && def.events.length > 0 && (
          <div className="px-3 py-2 border-t border-[var(--color-border)]">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-dim)] mb-2">Events</h4>
            <div className="space-y-1">
              {def.events.map(event => (
                <div key={event} className="text-xs text-[var(--color-accent-orange)] bg-[var(--color-surface)] rounded px-2 py-1 font-mono">
                  when {component.$Name}.{event}
                </div>
              ))}
            </div>
          </div>
        )}

        {def?.methods && Object.keys(def.methods).length > 0 && (
          <div className="px-3 py-2 border-t border-[var(--color-border)]">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-dim)] mb-2">Methods</h4>
            <div className="space-y-1">
              {Object.entries(def.methods).map(([methodName, methodDef]) => (
                <div key={methodName} className="text-xs text-[var(--color-primary-light)] bg-[var(--color-surface)] rounded px-2 py-1 font-mono">
                  call {component.$Name}.{methodName}({methodDef.params?.join(', ') || ''})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NameEditor({ name, onRename }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== name) {
      onRename(trimmed);
    } else {
      setValue(name);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') { setValue(name); setEditing(false); } }}
        className="w-full bg-[var(--color-surface)] border border-[var(--color-primary)] rounded px-2 py-1 text-sm text-[var(--color-text)] focus:outline-none"
        autoFocus
        spellCheck={false}
      />
    );
  }

  return (
    <div
      className="px-2 py-1 text-sm font-medium text-[var(--color-text)] cursor-pointer hover:bg-[var(--color-surface)] rounded"
      onClick={() => { setEditing(true); setValue(name); }}
      title="Click to rename"
    >
      {name}
    </div>
  );
}

function LayoutChildAdder({ parentId, onAdd }) {
  const [open, setOpen] = useState(false);
  const commonChildren = [
    { type: 'Button', icon: '🔘', name: 'Button' },
    { type: 'Label', icon: '🏷️', name: 'Label' },
    { type: 'TextBox', icon: '📝', name: 'TextBox' },
    { type: 'Image', icon: '🖼️', name: 'Image' },
    { type: 'CheckBox', icon: '☑️', name: 'CheckBox' },
    { type: 'Switch', icon: '🔀', name: 'Switch' },
    { type: 'Slider', icon: '🎚️', name: 'Slider' },
    { type: 'HorizontalArrangement', icon: '↔️', name: 'H-Layout' },
    { type: 'VerticalArrangement', icon: '↕️', name: 'V-Layout' },
  ];

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-[var(--color-primary-light)] hover:bg-[var(--color-surface)] rounded border border-dashed border-[var(--color-border)] transition-colors"
      >
        <Plus className="w-3 h-3" />
        Add child component
      </button>
      {open && (
        <div className="mt-1 grid grid-cols-3 gap-1">
          {commonChildren.map(({ type, icon, name }) => (
            <button
              key={type}
              onClick={() => { onAdd(type, parentId); setOpen(false); }}
              className="flex flex-col items-center gap-0.5 p-1.5 text-[10px] text-[var(--color-text-dim)] hover:bg-[var(--color-surface)] rounded transition-colors"
            >
              <span className="text-base">{icon}</span>
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyField({ name, definition, value, onChange }) {
  const getIcon = () => {
    switch (definition.type) {
      case 'string': return <Type className="w-3 h-3" />;
      case 'color': return <Palette className="w-3 h-3" />;
      case 'number': return <Hash className="w-3 h-3" />;
      case 'boolean': return <ToggleLeft className="w-3 h-3" />;
      case 'length': return <Ruler className="w-3 h-3" />;
      case 'asset': return <FileImage className="w-3 h-3" />;
      default: return <Info className="w-3 h-3" />;
    }
  };

  const renderInput = () => {
    switch (definition.type) {
      case 'boolean':
        return (
          <button
            onClick={() => onChange(value === 'True' ? 'False' : 'True')}
            className={`w-10 h-5 rounded-full transition-colors ${
              value === 'True' ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface-lighter)]'
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
              value === 'True' ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </button>
        );

      case 'color': {
        // Convert &HAARRGGBB to #RRGGBB for the color input
        const hexToInput = (v) => {
          if (!v || !v.startsWith('&H')) return '#3F51B5';
          const hex = v.replace('&H', '');
          return hex.length === 8 ? `#${hex.substring(2)}` : `#${hex}`;
        };
        const inputToHex = (v) => {
          const hex = v.replace('#', '');
          return `&HFF${hex.toUpperCase()}`;
        };
        return (
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={hexToInput(value)}
              onChange={(e) => onChange(inputToHex(e.target.value))}
              className="w-6 h-6 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-1.5 py-0.5 text-xs text-[var(--color-text)] font-mono focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>
        );
      }

      case 'length': {
        const presets = [
          { label: 'Auto', value: '-1' },
          { label: 'Fill', value: '-2' },
        ];
        return (
          <div className="flex items-center gap-1">
            {presets.map(p => (
              <button
                key={p.value}
                onClick={() => onChange(p.value)}
                className={`px-1.5 py-0.5 text-[10px] rounded ${
                  value === p.value
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-dim)]'
                }`}
              >
                {p.label}
              </button>
            ))}
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-1.5 py-0.5 text-xs text-[var(--color-text)] font-mono focus:outline-none focus:border-[var(--color-primary)] w-12"
              placeholder="px"
            />
          </div>
        );
      }

      case 'number':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-1.5 py-0.5 text-xs text-[var(--color-text)] font-mono focus:outline-none focus:border-[var(--color-primary)]"
          />
        );

      case 'string':
      case 'asset':
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-1.5 py-0.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
          />
        );
    }
  };

  return (
    <div className="mb-2">
      <label className="flex items-center gap-1 text-xs text-[var(--color-text-dim)] mb-0.5">
        {getIcon()}
        {name}
      </label>
      {renderInput()}
    </div>
  );
}
