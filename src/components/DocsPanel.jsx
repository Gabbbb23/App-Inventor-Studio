import { useState, useMemo } from 'react';
import { X, Search, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import {
  CATEGORIES, COMPONENTS, LAYOUT_SYNTAX, CODE_SYNTAX,
  COMMON_PATTERNS, buildSearchIndex,
} from '../lib/docsData';

export default function DocsPanel({ onClose }) {
  const [tab, setTab] = useState('layout');
  const [search, setSearch] = useState('');
  const searchIndex = useMemo(() => buildSearchIndex(), []);

  const searchResults = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return null;
    return searchIndex.filter(e => e.searchText.includes(q));
  }, [search, searchIndex]);

  const tabs = [
    { id: 'layout', label: 'Layout' },
    { id: 'code', label: 'Code' },
    { id: 'components', label: 'Components' },
    { id: 'patterns', label: 'Patterns' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="w-[520px] max-w-full bg-[var(--color-surface-light)] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-3 shrink-0">
          <h2 className="text-sm font-semibold text-[var(--color-text)] flex-1">Documentation</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--color-surface)] rounded transition-colors">
            <X className="w-4 h-4 text-[var(--color-text-dim)]" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-[var(--color-border)] shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--color-text-dim)] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search components, keywords, patterns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg pl-8 pr-3 py-1.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-dim)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
        </div>

        {/* Tabs (hidden during search) */}
        {!searchResults && (
          <div className="flex border-b border-[var(--color-border)] shrink-0 px-2">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
                  tab === t.id
                    ? 'border-[var(--color-primary)] text-[var(--color-primary-light)]'
                    : 'border-transparent text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {searchResults ? (
            <SearchResultsView results={searchResults} />
          ) : tab === 'layout' ? (
            <LayoutTab />
          ) : tab === 'code' ? (
            <CodeTab />
          ) : tab === 'components' ? (
            <ComponentsTab />
          ) : (
            <PatternsTab />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared ──────────────────────────────────────────────────────────────────

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="relative group">
      <pre className="bg-[var(--color-surface)] rounded-lg p-3 text-xs text-[var(--color-text)] overflow-x-auto border border-[var(--color-border)] leading-relaxed whitespace-pre-wrap">{code}</pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1 rounded bg-[var(--color-surface-light)] border border-[var(--color-border)] opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy"
      >
        {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-[var(--color-text-dim)]" />}
      </button>
    </div>
  );
}

function SectionHeader({ children }) {
  return <h3 className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-wide mb-2">{children}</h3>;
}

function Table({ headers, rows }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] overflow-hidden mb-4">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[var(--color-surface)]">
            {headers.map((h, i) => (
              <th key={i} className="text-left px-3 py-1.5 text-[var(--color-text-dim)] font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-[var(--color-border)]">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-1.5 text-[var(--color-text)]">
                  <code className="text-[var(--color-primary-light)]">{cell}</code>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Layout Tab ──────────────────────────────────────────────────────────────

function LayoutTab() {
  return (
    <div className="p-4 space-y-5">
      <div>
        <SectionHeader>Overview</SectionHeader>
        <p className="text-xs text-[var(--color-text-dim)] mb-3">{LAYOUT_SYNTAX.overview}</p>
        <CodeBlock code={LAYOUT_SYNTAX.screenBlock} />
      </div>

      <div>
        <SectionHeader>Type Aliases</SectionHeader>
        <p className="text-xs text-[var(--color-text-dim)] mb-2">Short names you can use instead of the full component type.</p>
        <Table
          headers={['Alias', 'Component Type']}
          rows={LAYOUT_SYNTAX.typeAliases.map(a => [a.alias, a.fullType])}
        />
      </div>

      <div>
        <SectionHeader>Shorthand Properties (key=value)</SectionHeader>
        <Table
          headers={['Key', 'Maps To', 'Example']}
          rows={LAYOUT_SYNTAX.shorthandKeys.map(s => [s.key, s.mapsTo, s.example])}
        />
      </div>

      <div>
        <SectionHeader>Shorthand Flags</SectionHeader>
        <p className="text-xs text-[var(--color-text-dim)] mb-2">Single-word flags with no = sign.</p>
        <Table
          headers={['Flag', 'Effect']}
          rows={LAYOUT_SYNTAX.shorthandFlags.map(f => [f.flag, f.effect])}
        />
      </div>

      <div>
        <SectionHeader>Custom Naming</SectionHeader>
        <p className="text-xs text-[var(--color-text-dim)] mb-2">Use <code className="text-[var(--color-primary-light)]">as</code> to give components custom names for use in code.</p>
        <CodeBlock code={LAYOUT_SYNTAX.naming} />
      </div>

      <div>
        <SectionHeader>Examples</SectionHeader>
        {LAYOUT_SYNTAX.examples.map((ex, i) => (
          <div key={i} className="mb-3">
            <p className="text-xs font-medium text-[var(--color-text)] mb-1">{ex.title}</p>
            <CodeBlock code={ex.code} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Code Tab ────────────────────────────────────────────────────────────────

function CodeTab() {
  return (
    <div className="p-4 space-y-5">
      <div>
        <SectionHeader>Overview</SectionHeader>
        <p className="text-xs text-[var(--color-text-dim)] mb-2">{CODE_SYNTAX.overview}</p>
      </div>

      <div>
        <SectionHeader>Keywords</SectionHeader>
        {CODE_SYNTAX.keywords.map(kw => (
          <div key={kw.keyword} className="mb-3 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
            <div className="flex items-baseline gap-2 mb-1">
              <code className="text-sm font-bold text-[var(--color-primary-light)]">{kw.keyword}</code>
              <span className="text-xs text-[var(--color-text-dim)]">{kw.description}</span>
            </div>
            <p className="text-xs text-[var(--color-text-dim)] mb-1.5 font-mono">{kw.syntax}</p>
            <CodeBlock code={kw.example} />
          </div>
        ))}
      </div>

      <div>
        <SectionHeader>Operators</SectionHeader>
        <Table
          headers={['Operator', 'Description']}
          rows={CODE_SYNTAX.operators.map(o => [o.op, o.description])}
        />
      </div>

      <div>
        <SectionHeader>Literals</SectionHeader>
        <Table
          headers={['Type', 'Examples']}
          rows={CODE_SYNTAX.literals.map(l => [l.type, l.examples])}
        />
      </div>

      <div>
        <SectionHeader>Comments</SectionHeader>
        <CodeBlock code={CODE_SYNTAX.comments} />
      </div>
    </div>
  );
}

// ─── Components Tab ──────────────────────────────────────────────────────────

function ComponentsTab() {
  return (
    <div className="p-4 space-y-2">
      {CATEGORIES.map(cat => (
        <CategorySection key={cat.id} category={cat} />
      ))}
    </div>
  );
}

function CategorySection({ category }) {
  const [open, setOpen] = useState(false);
  const comps = Object.entries(COMPONENTS).filter(([, c]) => c.category === category.id);
  if (comps.length === 0) return null;

  return (
    <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left bg-[var(--color-surface)] hover:bg-[var(--color-surface-light)] transition-colors"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-dim)]" /> : <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-dim)]" />}
        <span className="text-sm">{category.icon}</span>
        <span className="text-xs font-medium text-[var(--color-text)]">{category.name}</span>
        <span className="text-[10px] text-[var(--color-text-dim)] ml-auto">{comps.length}</span>
      </button>
      {open && (
        <div className="border-t border-[var(--color-border)] divide-y divide-[var(--color-border)]">
          {comps.map(([key, comp]) => (
            <ComponentCard key={key} name={key} comp={comp} />
          ))}
        </div>
      )}
    </div>
  );
}

function ComponentCard({ name, comp }) {
  const [open, setOpen] = useState(false);
  const props = Object.entries(comp.properties || {});
  const events = comp.events || [];
  const methods = Object.entries(comp.methods || {});

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-1.5 text-left hover:bg-[var(--color-surface)] transition-colors"
      >
        <span className="text-sm">{comp.icon}</span>
        <span className="text-xs font-medium text-[var(--color-text)]">{name}</span>
        <span className="text-[10px] text-[var(--color-text-dim)]">v{comp.version}</span>
        {!comp.isVisible && <span className="text-[9px] bg-[var(--color-surface)] px-1.5 py-0.5 rounded text-[var(--color-text-dim)]">non-visible</span>}
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2">
          {props.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[var(--color-text-dim)] uppercase mb-1">Properties</p>
              <div className="text-xs space-y-0.5">
                {props.map(([pName, pDef]) => (
                  <div key={pName} className="flex gap-2">
                    <code className="text-[var(--color-primary-light)] w-36 shrink-0">{pName}</code>
                    <span className="text-[var(--color-text-dim)]">{pDef.type}</span>
                    {pDef.default && <span className="text-[var(--color-text-dim)] opacity-60">= {pDef.default}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {events.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[var(--color-text-dim)] uppercase mb-1">Events</p>
              <div className="flex flex-wrap gap-1">
                {events.map(e => (
                  <code key={e} className="text-xs bg-[var(--color-surface)] px-1.5 py-0.5 rounded text-[var(--color-accent-green)]">{e}</code>
                ))}
              </div>
            </div>
          )}
          {methods.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[var(--color-text-dim)] uppercase mb-1">Methods</p>
              <div className="text-xs space-y-0.5">
                {methods.map(([mName, mDef]) => (
                  <div key={mName}>
                    <code className="text-[var(--color-primary-light)]">{mName}</code>
                    <span className="text-[var(--color-text-dim)]">({(mDef.params || []).join(', ')})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Patterns Tab ────────────────────────────────────────────────────────────

function PatternsTab() {
  return (
    <div className="p-4 space-y-4">
      {COMMON_PATTERNS.map((p, i) => (
        <div key={i} className="border border-[var(--color-border)] rounded-lg p-4">
          <h3 className="text-sm font-medium text-[var(--color-text)] mb-1">{p.title}</h3>
          <p className="text-xs text-[var(--color-text-dim)] mb-3">{p.description}</p>
          <CodeBlock code={p.code} />
        </div>
      ))}
    </div>
  );
}

// ─── Search Results ──────────────────────────────────────────────────────────

function SearchResultsView({ results }) {
  if (results.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-[var(--color-text-dim)]">
        No results found
      </div>
    );
  }

  const grouped = {};
  for (const r of results) {
    if (!grouped[r.type]) grouped[r.type] = [];
    grouped[r.type].push(r);
  }

  const typeLabels = { component: 'Components', keyword: 'Keywords', alias: 'Type Aliases', pattern: 'Patterns' };

  return (
    <div className="p-4 space-y-4">
      {Object.entries(grouped).map(([type, items]) => (
        <div key={type}>
          <p className="text-[10px] font-semibold text-[var(--color-text-dim)] uppercase mb-2">{typeLabels[type] || type}</p>
          <div className="space-y-1">
            {items.slice(0, 20).map(item => (
              <SearchResultItem key={`${type}-${item.name}`} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchResultItem({ item }) {
  if (item.type === 'component') {
    const comp = COMPONENTS[item.name];
    return comp ? <ComponentCard name={item.name} comp={comp} /> : null;
  }
  if (item.type === 'keyword') {
    const kw = CODE_SYNTAX.keywords.find(k => k.keyword === item.name);
    return kw ? (
      <div className="p-2 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">
        <code className="text-xs font-bold text-[var(--color-primary-light)]">{kw.keyword}</code>
        <span className="text-xs text-[var(--color-text-dim)] ml-2">{kw.description}</span>
        <p className="text-[10px] text-[var(--color-text-dim)] font-mono mt-1">{kw.syntax}</p>
      </div>
    ) : null;
  }
  if (item.type === 'alias') {
    const a = LAYOUT_SYNTAX.typeAliases.find(x => x.alias === item.name);
    return a ? (
      <div className="p-2 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-xs">
        <code className="text-[var(--color-primary-light)]">{a.alias}</code>
        <span className="text-[var(--color-text-dim)]"> = {a.fullType}</span>
      </div>
    ) : null;
  }
  if (item.type === 'pattern') {
    const p = COMMON_PATTERNS.find(x => x.title === item.name);
    return p ? (
      <div className="p-2 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">
        <p className="text-xs font-medium text-[var(--color-text)]">{p.title}</p>
        <p className="text-[10px] text-[var(--color-text-dim)]">{p.description}</p>
      </div>
    ) : null;
  }
  return null;
}
