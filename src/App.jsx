import { useState, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useAppState } from './lib/useAppState';
import { generateAia } from './lib/aiaGenerator';
import { parseLayout } from './lib/layoutParser';
import { TEMPLATES } from './lib/templates';
import Header from './components/Header';
import ComponentPalette from './components/ComponentPalette';
import ComponentTree from './components/ComponentTree';
import PhonePreview from './components/PhonePreview';
import CodeEditor from './components/CodeEditor';
import PropertyEditor from './components/PropertyEditor';
import TemplateGallery from './components/TemplateGallery';
import LayoutBuilder from './components/LayoutBuilder';

function App() {
  const appState = useAppState();
  const [showTemplates, setShowTemplates] = useState(false);
  const [view, setView] = useState('design'); // 'design', 'code', or 'layout'

  // Live-parse the screen{} layout block from code to show in preview
  const codePreviewScreen = useMemo(() => {
    const code = appState.activeScreen.code || '';
    const layoutResult = parseLayout(code);
    if (layoutResult.components && layoutResult.components.length > 0) {
      return {
        ...appState.activeScreen,
        components: layoutResult.components,
      };
    }
    return null; // no screen{} block — fall back to designer components
  }, [appState.activeScreen]);

  // The screen to show in the phone preview depends on context:
  // If the code has a screen{} block, show those components; otherwise show designer components
  const previewScreen = codePreviewScreen || appState.activeScreen;

  const handleExport = async () => {
    try {
      const project = appState.getProjectData();
      await generateAia(project);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed: ' + err.message);
    }
  };

  const handleLoadTemplate = (template) => {
    appState.loadTemplate(template);
    setShowTemplates(false);
  };

  if (showTemplates) {
    return (
      <div className="flex flex-col h-screen bg-[var(--color-surface)]">
        <Header
          projectName={appState.state.name}
          onProjectNameChange={appState.updateProjectName}
          onExport={handleExport}
          view={view}
          onViewChange={setView}
        />
        <TemplateGallery
          templates={TEMPLATES}
          onSelect={handleLoadTemplate}
          onSkip={() => setShowTemplates(false)}
        />
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-screen bg-[var(--color-surface)]">
        <Header
          projectName={appState.state.name}
          onProjectNameChange={appState.updateProjectName}
          onExport={handleExport}
          view={view}
          onViewChange={setView}
          onShowTemplates={() => setShowTemplates(true)}
        />
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Palette & Tree (design view only) */}
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

          {/* Center Panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {view === 'design' && (
              <div className="flex-1 overflow-auto flex items-start justify-center p-4 bg-[var(--color-surface)]">
                <PhonePreview
                  screen={previewScreen}
                  selectedId={appState.state.selectedComponentId}
                  onSelect={appState.selectComponent}
                />
              </div>
            )}
            {view === 'code' && (
              <div className="flex-1 flex overflow-hidden">
                {/* Code editor */}
                <div className="flex-1 overflow-hidden">
                  <CodeEditor
                    code={appState.activeScreen.code}
                    onChange={appState.updateCode}
                    components={appState.activeScreen.components}
                  />
                </div>
                {/* Live phone preview */}
                <div className="w-[390px] shrink-0 border-l border-[var(--color-border)] overflow-auto flex flex-col items-center p-3 bg-[var(--color-surface)]">
                  <div className="text-xs text-[var(--color-text-dim)] mb-2 font-medium">LIVE PREVIEW</div>
                  <PhonePreview
                    screen={previewScreen}
                    selectedId={appState.state.selectedComponentId}
                    onSelect={appState.selectComponent}
                  />
                </div>
              </div>
            )}
            {view === 'layout' && (
              <div className="flex-1 flex overflow-hidden">
                {/* Layout builder on the left */}
                <div className="w-80 border-r border-[var(--color-border)] bg-[var(--color-surface-light)] overflow-hidden">
                  <LayoutBuilder
                    onApplyPreset={appState.applyPreset}
                    components={appState.activeScreen.components}
                    onAddComponent={appState.addComponent}
                    onWrapInLayout={appState.wrapInLayout}
                    selectedId={appState.state.selectedComponentId}
                  />
                </div>
                {/* Phone preview on the right */}
                <div className="flex-1 overflow-auto flex items-start justify-center p-4 bg-[var(--color-surface)]">
                  <PhonePreview
                    screen={previewScreen}
                    selectedId={appState.state.selectedComponentId}
                    onSelect={appState.selectComponent}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Properties */}
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
    </DndProvider>
  );
}

export default App;
