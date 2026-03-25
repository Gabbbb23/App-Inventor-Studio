import { useEffect, useRef, useCallback } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { autocompletion } from '@codemirror/autocomplete';
import { useState } from 'react';
import { COMPONENTS } from '../lib/componentDefs';
import { parseCode } from '../lib/codeParser';
import { parseLayout } from '../lib/layoutParser';
import { BookOpen, AlertCircle, CheckCircle } from 'lucide-react';

export default function CodeEditor({ code, onChange, components }) {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const [errors, setErrors] = useState([]);
  const [showRef, setShowRef] = useState(false);

  // Validate code on change — strip layout block first, then validate logic
  const validateCode = useCallback((newCode) => {
    try {
      const allErrors = [];
      // Strip the screen{} layout block and collect layout errors
      const layoutResult = parseLayout(newCode);
      if (layoutResult.errors && layoutResult.errors.length > 0) {
        allErrors.push(...layoutResult.errors);
      }
      // Validate the remaining code (logic only)
      const codeToValidate = layoutResult.remainingCode ?? newCode;
      if (codeToValidate.trim()) {
        const { errors: codeErrors } = parseCode(codeToValidate);
        allErrors.push(...codeErrors);
      }
      setErrors(allErrors);
    } catch (e) {
      setErrors([{ line: 0, message: e.message }]);
    }
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newCode = update.state.doc.toString();
        onChange(newCode);
        validateCode(newCode);
      }
    });

    const state = EditorState.create({
      doc: code || '',
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        javascript(),
        oneDark,
        autocompletion(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        updateListener,
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { overflow: 'auto' },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;
    validateCode(code || '');

    return () => {
      view.destroy();
    };
  }, []); // Only create once

  // Sync external code changes (e.g., template loading)
  useEffect(() => {
    const view = viewRef.current;
    if (view) {
      const currentCode = view.state.doc.toString();
      if (currentCode !== code) {
        view.dispatch({
          changes: { from: 0, to: currentCode.length, insert: code || '' },
        });
      }
    }
  }, [code]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--color-border)] bg-[var(--color-surface-light)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--color-text-dim)]">CODE EDITOR</span>
          {errors.length === 0 ? (
            <span className="flex items-center gap-1 text-xs text-[var(--color-accent-green)]">
              <CheckCircle className="w-3 h-3" /> OK
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-[var(--color-accent-red)]">
              <AlertCircle className="w-3 h-3" /> {errors.length} error{errors.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowRef(!showRef)}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
            showRef ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-dim)] hover:bg-[var(--color-surface)]'
          }`}
        >
          <BookOpen className="w-3 h-3" />
          Reference
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div ref={editorRef} className="flex-1 overflow-hidden" />

        {/* Reference panel */}
        {showRef && (
          <div className="w-72 border-l border-[var(--color-border)] overflow-y-auto bg-[var(--color-surface-light)] p-3">
            <ReferencePanel components={components} />
          </div>
        )}
      </div>

      {/* Error bar */}
      {errors.length > 0 && (
        <div className="border-t border-[var(--color-accent-red)] bg-[var(--color-accent-red)] bg-opacity-10 px-3 py-1.5 max-h-24 overflow-y-auto">
          {errors.slice(0, 5).map((err, i) => (
            <div key={i} className="text-xs text-[var(--color-accent-red)] font-mono">
              {err.line > 0 && `Line ${err.line}: `}{err.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReferencePanel({ components }) {
  const getAllNames = (comps) => {
    const names = [];
    for (const c of comps) {
      names.push(c);
      if (c.children) names.push(...getAllNames(c.children));
    }
    return names;
  };

  const allComps = getAllNames(components);

  return (
    <div className="text-xs space-y-4">
      <div>
        <h4 className="font-bold text-[var(--color-text)] mb-2">Quick Reference</h4>
        <div className="space-y-2 text-[var(--color-text-dim)]">
          <RefBlock title="Variables" code={`var myVar = 0\nmyVar = myVar + 1`} />
          <RefBlock title="Events" code={`when Button1.Click {\n  // code here\n}`} />
          <RefBlock title="Set Property" code={`set Label1.Text = "Hello"`} />
          <RefBlock title="Get Property" code={`get TextBox1.Text`} />
          <RefBlock title="Call Method" code={`call Notifier1.ShowAlert("Hi")`} />
          <RefBlock title="If/Else" code={`if score > 10 {\n  // then\n} else {\n  // else\n}`} />
          <RefBlock title="For Loop" code={`for i in range(1, 10) {\n  // body\n}`} />
          <RefBlock title="For Each" code={`foreach item in myList {\n  // body\n}`} />
          <RefBlock title="While" code={`while count < 10 {\n  count = count + 1\n}`} />
          <RefBlock title="Procedure" code={`proc greet(name) {\n  set Label1.Text = name\n}`} />
          <RefBlock title="Function" code={`func add(a, b) {\n  return a + b\n}`} />
          <RefBlock title="Join Text" code={`join("Hello ", name, "!")`} />
          <RefBlock title="List" code={`var items = [1, 2, 3]\nitems[1]`} />
        </div>
      </div>

      {allComps.length > 0 && (
        <div>
          <h4 className="font-bold text-[var(--color-text)] mb-2">Your Components</h4>
          {allComps.map(comp => {
            const def = COMPONENTS[comp.$Type];
            if (!def) return null;
            return (
              <div key={comp.Uuid} className="mb-2 p-1.5 bg-[var(--color-surface)] rounded">
                <div className="font-medium text-[var(--color-text)]">{comp.$Name}</div>
                <div className="text-[var(--color-text-dim)] text-[10px]">{comp.$Type}</div>
                {def.events.length > 0 && (
                  <div className="mt-1 text-[var(--color-accent-orange)]">
                    {def.events.slice(0, 3).map(e => (
                      <div key={e}>when {comp.$Name}.{e}</div>
                    ))}
                  </div>
                )}
                {Object.keys(def.methods).length > 0 && (
                  <div className="mt-1 text-[var(--color-primary-light)]">
                    {Object.entries(def.methods).slice(0, 3).map(([m, d]) => (
                      <div key={m}>call {comp.$Name}.{m}({d.params?.join(', ') || ''})</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RefBlock({ title, code }) {
  return (
    <div>
      <div className="font-medium text-[var(--color-text)] mb-0.5">{title}</div>
      <pre className="bg-[var(--color-surface)] rounded p-1.5 font-mono text-[var(--color-primary-light)] whitespace-pre-wrap">{code}</pre>
    </div>
  );
}
