import { useState, useMemo, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useAppState } from './lib/useAppState';
import { generateAia } from './lib/aiaGenerator';
import { parseLayout } from './lib/layoutParser';
import { TEMPLATES } from './lib/templates';
import { supabase, saveProject, signOut as authSignOut } from './lib/supabase';
import Header from './components/Header';
import ComponentPalette from './components/ComponentPalette';
import ComponentTree from './components/ComponentTree';
import PhonePreview from './components/PhonePreview';
import CodeEditor from './components/CodeEditor';
import PropertyEditor from './components/PropertyEditor';
import TemplateGallery from './components/TemplateGallery';
import ExportWarnings, { validateForExport } from './components/ExportWarnings';
import DocsPanel from './components/DocsPanel';
import AuthModal from './components/AuthModal';
import ProjectsModal from './components/ProjectsModal';
import { ToastProvider, useToast } from './components/Toast';
import LayoutBuilder from './components/LayoutBuilder';

function findComponent(components, name) {
  for (const c of components) {
    if (c.$Name === name) return c;
    if (c.children) {
      const found = findComponent(c.children, name);
      if (found) return found;
    }
  }
  return null;
}

function AppInner() {
  const appState = useAppState();
  const toast = useToast();
  const [showTemplates, setShowTemplates] = useState(false);
  const [exportWarnings, setExportWarnings] = useState(null);
  const [showDocs, setShowDocs] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(null);
  const [view, setView] = useState('design');

  // Listen for auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Track unsaved changes by comparing current state to last saved snapshot
  const currentSnapshot = JSON.stringify(appState.getProjectData());
  const hasUnsavedChanges = user && lastSavedSnapshot !== null && currentSnapshot !== lastSavedSnapshot;

  // ─── Keyboard shortcuts ──────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't capture shortcuts when typing in inputs, textareas, or contenteditable
      const tag = e.target.tagName;
      const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;

      // Ctrl+S — Save (always capture to prevent browser save dialog)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      // Ctrl+E — Export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        handleExport();
        return;
      }

      // Escape — Deselect / close panels
      if (e.key === 'Escape') {
        if (showDocs) { setShowDocs(false); return; }
        if (showAuth) { setShowAuth(false); return; }
        if (showProjects) { setShowProjects(false); return; }
        if (exportWarnings) { setExportWarnings(null); return; }
        appState.selectComponent(null);
        return;
      }

      // Skip remaining shortcuts if typing in an input
      if (isEditing) return;

      const selectedId = appState.state.selectedComponentId;

      // Delete / Backspace — Remove selected component
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        appState.removeComponent(selectedId);
        return;
      }

      // Ctrl+D — Duplicate selected component
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedId) {
        e.preventDefault();
        appState.duplicateComponent(selectedId);
        return;
      }

      // Ctrl+ArrowUp — Move component up
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowUp' && selectedId) {
        e.preventDefault();
        appState.moveComponent(selectedId, 'up');
        return;
      }

      // Ctrl+ArrowDown — Move component down
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowDown' && selectedId) {
        e.preventDefault();
        appState.moveComponent(selectedId, 'down');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState, handleSave, handleExport, showDocs, showAuth, showProjects, exportWarnings]);

  // Live-parse the screen{} layout block from code to show in preview
  const codePreviewScreen = useMemo(() => {
    const code = appState.activeScreen.code || '';
    const layoutResult = parseLayout(code);
    if (layoutResult.components && layoutResult.components.length > 0) {
      return { ...appState.activeScreen, components: layoutResult.components };
    }
    return null;
  }, [appState.activeScreen]);

  const previewScreen = codePreviewScreen || appState.activeScreen;

  // ─── Export ──────────────────────────────────────────────────────────

  const doExport = async () => {
    try {
      // Auto-save before exporting if signed in
      if (user) {
        try {
          const projectData = appState.getProjectData();
          const saved = await saveProject(projectData.name, projectData);
          setCurrentProjectId(saved.id);
          setLastSavedSnapshot(JSON.stringify(projectData));
        } catch (e) {
          // Save failed silently — still export
        }
      }
      const project = appState.getProjectData();
      await generateAia(project);
      toast('Project exported as .aia', 'success');
    } catch (err) {
      console.error('Export failed:', err);
      toast('Export failed: ' + err.message, 'error');
    }
  };

  const handleExport = useCallback(() => {
    const warnings = validateForExport(appState.activeScreen.components);
    if (warnings.length > 0) {
      setExportWarnings(warnings);
    } else {
      doExport();
    }
  }, [appState.activeScreen.components]);

  const handleExportFix = (componentName, property, value) => {
    const comp = findComponent(appState.activeScreen.components, componentName);
    if (comp) {
      appState.updateComponentProperty(comp.Uuid, property, value);
    }
  };

  // ─── Templates ───────────────────────────────────────────────────────

  const handleLoadTemplate = (template) => {
    appState.loadTemplate(template);
    setCurrentProjectId(null);
    setLastSavedSnapshot(null);
    setShowTemplates(false);
    toast(`Loaded template: ${template.name}`, 'success');
  };

  // ─── Auth ────────────────────────────────────────────────────────────

  const handleAuth = (u) => {
    setUser(u);
    toast('Signed in successfully', 'success');
  };

  const handleSignOut = async () => {
    await authSignOut();
    setUser(null);
    setCurrentProjectId(null);
    toast('Signed out', 'info');
  };

  // ─── Save / Load / New ──────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!user) { setShowAuth(true); return; }
    setSaving(true);
    try {
      const projectData = appState.getProjectData();
      const saved = await saveProject(projectData.name, projectData);
      setCurrentProjectId(saved.id);
      setLastSavedSnapshot(JSON.stringify(projectData));
      toast(`Project "${projectData.name}" saved`, 'success');
    } catch (err) {
      toast('Save failed: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  }, [user, appState, toast]);

  const handleLoadProject = (projectData, projectId, projectName) => {
    appState.loadTemplate({
      name: projectData.name || projectName,
      screens: projectData.screens,
    });
    setCurrentProjectId(projectId);
    setLastSavedSnapshot(JSON.stringify(projectData));
    toast(`Opened "${projectData.name || projectName}"`, 'success');
  };

  const handleNewProject = () => {
    appState.loadTemplate({
      name: 'MyApp',
      screens: [{
        name: 'Screen1',
        title: 'Screen1',
        properties: {},
        components: [],
        code: '// Write your code here\n',
      }],
    });
    setCurrentProjectId(null);
    setLastSavedSnapshot(null);
    toast('New project created', 'info');
  };

  // ─── Header props shared between both render paths ──────────────────

  const headerProps = {
    projectName: appState.state.name,
    onProjectNameChange: appState.updateProjectName,
    onExport: handleExport,
    view,
    onViewChange: setView,
    onShowDocs: () => setShowDocs(true),
    user,
    onSignIn: () => setShowAuth(true),
    onSignOut: handleSignOut,
    hasUnsavedChanges,
    onSave: handleSave,
    onOpenProjects: () => {
      if (!user) { setShowAuth(true); return; }
      setShowProjects(true);
    },
    saving,
  };

  // ─── Overlays ───────────────────────────────────────────────────────

  const overlays = (
    <>
      {showDocs && <DocsPanel onClose={() => setShowDocs(false)} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={handleAuth} />}
      {showProjects && (
        <ProjectsModal
          onClose={() => setShowProjects(false)}
          onLoad={handleLoadProject}
          onNewProject={handleNewProject}
        />
      )}
      {exportWarnings && (
        <ExportWarnings
          warnings={exportWarnings}
          onFix={handleExportFix}
          onExportAnyway={() => { setExportWarnings(null); doExport(); }}
          onCancel={() => setExportWarnings(null)}
        />
      )}
    </>
  );

  if (showTemplates) {
    return (
      <div className="flex flex-col h-screen bg-[var(--color-surface)]">
        <Header {...headerProps} />
        <TemplateGallery
          templates={TEMPLATES}
          onSelect={handleLoadTemplate}
          onSkip={() => setShowTemplates(false)}
        />
        {overlays}
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-screen bg-[var(--color-surface)]">
        <Header {...headerProps} onShowTemplates={() => setShowTemplates(true)} />
        <div className="flex flex-1 overflow-hidden">
          {view === 'design' && (
            <div className="w-64 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-light)]">
              <ComponentPalette onAdd={appState.addComponent} />
              <ComponentTree
                components={appState.activeScreen.components}
                selectedId={appState.state.selectedComponentId}
                onSelect={appState.selectComponent}
                onRemove={appState.removeComponent}
                onMove={appState.moveComponent}
              />
            </div>
          )}

          <div className="flex-1 flex flex-col overflow-hidden">
            {view === 'design' && (
              <div className="flex-1 overflow-auto flex items-start justify-center p-4 bg-[var(--color-surface)]">
                <PhonePreview screen={previewScreen} selectedId={appState.state.selectedComponentId} onSelect={appState.selectComponent} />
              </div>
            )}
            {view === 'code' && (
              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-hidden">
                  <CodeEditor code={appState.activeScreen.code} onChange={appState.updateCode} components={appState.activeScreen.components} />
                </div>
                <div className="w-[390px] shrink-0 border-l border-[var(--color-border)] overflow-auto flex flex-col items-center p-3 bg-[var(--color-surface)]">
                  <div className="text-xs text-[var(--color-text-dim)] mb-2 font-medium">LIVE PREVIEW</div>
                  <PhonePreview screen={previewScreen} selectedId={appState.state.selectedComponentId} onSelect={appState.selectComponent} />
                </div>
              </div>
            )}
            {view === 'layout' && (
              <div className="flex-1 flex overflow-hidden">
                <div className="w-80 border-r border-[var(--color-border)] bg-[var(--color-surface-light)] overflow-hidden">
                  <LayoutBuilder onApplyPreset={appState.applyPreset} components={appState.activeScreen.components} onAddComponent={appState.addComponent} onWrapInLayout={appState.wrapInLayout} selectedId={appState.state.selectedComponentId} />
                </div>
                <div className="flex-1 overflow-auto flex items-start justify-center p-4 bg-[var(--color-surface)]">
                  <PhonePreview screen={previewScreen} selectedId={appState.state.selectedComponentId} onSelect={appState.selectComponent} />
                </div>
              </div>
            )}
          </div>

          <div className={`${view === 'layout' ? 'w-64' : 'w-72'} border-l border-[var(--color-border)] bg-[var(--color-surface-light)] overflow-y-auto`}>
            <PropertyEditor
              component={appState.getSelectedComponent()}
              onPropertyChange={appState.updateComponentProperty}
              onRename={appState.renameComponent}
              onRemove={appState.removeComponent}
              onAddChild={appState.addComponent}
            />
          </div>
        </div>
      </div>
      {overlays}
    </DndProvider>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
