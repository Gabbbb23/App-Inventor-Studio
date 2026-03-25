import { useState, useCallback } from 'react';
import { COMPONENTS, getDefaultProperties, generateUuid } from './componentDefs';

const initialState = {
  name: 'MyApp',
  screens: [
    {
      name: 'Screen1',
      title: 'Screen1',
      properties: {},
      components: [],
      code: '// Write your code here\n// Example:\n// when Button1.Click {\n//   set Label1.Text = "Hello!"\n// }\n',
    }
  ],
  activeScreenIndex: 0,
  selectedComponentId: null,
};

export function useAppState() {
  const [state, setState] = useState(initialState);

  const activeScreen = state.screens[state.activeScreenIndex];

  // Helper to get a unique name for a new component
  const getUniqueName = useCallback((type) => {
    const screen = state.screens[state.activeScreenIndex];
    const allNames = getAllComponentNames(screen.components);
    const baseName = COMPONENTS[type]?.defaultName || type;
    let counter = 1;
    while (allNames.includes(baseName + counter)) {
      counter++;
    }
    return baseName + counter;
  }, [state]);

  // Add a component to the screen (or to a layout container)
  const addComponent = useCallback((type, parentId = null) => {
    setState(prev => {
      const screens = [...prev.screens];
      const screen = { ...screens[prev.activeScreenIndex] };
      const name = getUniqueNameFromComponents(type, screen.components);
      const def = COMPONENTS[type];
      const newComp = {
        $Name: name,
        $Type: type,
        Uuid: generateUuid(),
        properties: getDefaultProperties(type),
        children: [],
      };

      if (parentId) {
        screen.components = addToParent(screen.components, parentId, newComp);
      } else {
        screen.components = [...screen.components, newComp];
      }
      screens[prev.activeScreenIndex] = screen;
      return { ...prev, screens, selectedComponentId: newComp.Uuid };
    });
  }, []);

  // Remove a component
  const removeComponent = useCallback((uuid) => {
    setState(prev => {
      const screens = [...prev.screens];
      const screen = { ...screens[prev.activeScreenIndex] };
      screen.components = removeFromTree(screen.components, uuid);
      screens[prev.activeScreenIndex] = screen;
      return { ...prev, screens, selectedComponentId: null };
    });
  }, []);

  // Update a component's property
  const updateComponentProperty = useCallback((uuid, property, value) => {
    setState(prev => {
      const screens = [...prev.screens];
      const screen = { ...screens[prev.activeScreenIndex] };
      screen.components = updateInTree(screen.components, uuid, (comp) => ({
        ...comp,
        properties: { ...comp.properties, [property]: value }
      }));
      screens[prev.activeScreenIndex] = screen;
      return { ...prev, screens };
    });
  }, []);

  // Rename a component
  const renameComponent = useCallback((uuid, newName) => {
    setState(prev => {
      const screens = [...prev.screens];
      const screen = { ...screens[prev.activeScreenIndex] };
      screen.components = updateInTree(screen.components, uuid, (comp) => ({
        ...comp,
        $Name: newName,
      }));
      screens[prev.activeScreenIndex] = screen;
      return { ...prev, screens };
    });
  }, []);

  // Select a component
  const selectComponent = useCallback((uuid) => {
    setState(prev => ({ ...prev, selectedComponentId: uuid }));
  }, []);

  // Update screen code
  const updateCode = useCallback((code) => {
    setState(prev => {
      const screens = [...prev.screens];
      const screen = { ...screens[prev.activeScreenIndex] };
      screen.code = code;
      screens[prev.activeScreenIndex] = screen;
      return { ...prev, screens };
    });
  }, []);

  // Update project name
  const updateProjectName = useCallback((name) => {
    setState(prev => ({ ...prev, name }));
  }, []);

  // Update screen title
  const updateScreenTitle = useCallback((title) => {
    setState(prev => {
      const screens = [...prev.screens];
      const screen = { ...screens[prev.activeScreenIndex] };
      screen.title = title;
      screens[prev.activeScreenIndex] = screen;
      return { ...prev, screens };
    });
  }, []);

  // Load a template
  const loadTemplate = useCallback((template) => {
    const cloned = JSON.parse(JSON.stringify(template));
    setState({
      name: cloned.name || 'MyApp',
      screens: cloned.screens.map(s => ({
        ...s,
        title: s.title || s.name,
        properties: s.properties || {},
        components: s.components || [],
        code: s.code || '',
      })),
      activeScreenIndex: 0,
      selectedComponentId: null,
    });
  }, []);

  // Move component up/down in the list
  const moveComponent = useCallback((uuid, direction) => {
    setState(prev => {
      const screens = [...prev.screens];
      const screen = { ...screens[prev.activeScreenIndex] };
      screen.components = moveInTree(screen.components, uuid, direction);
      screens[prev.activeScreenIndex] = screen;
      return { ...prev, screens };
    });
  }, []);

  // Get the selected component
  const getSelectedComponent = useCallback(() => {
    if (!state.selectedComponentId) return null;
    return findInTree(activeScreen.components, state.selectedComponentId);
  }, [state.selectedComponentId, activeScreen]);

  // Apply a layout preset (replaces components and appends code)
  const applyPreset = useCallback((preset) => {
    setState(prev => {
      const screens = [...prev.screens];
      const screen = { ...screens[prev.activeScreenIndex] };
      screen.components = preset.components || [];
      if (preset.code) {
        screen.code = screen.code ? screen.code + '\n' + preset.code : preset.code;
      }
      screens[prev.activeScreenIndex] = screen;
      return { ...prev, screens, selectedComponentId: null };
    });
  }, []);

  // Wrap a component in a layout container
  const wrapInLayout = useCallback((uuid, layoutType) => {
    setState(prev => {
      const screens = [...prev.screens];
      const screen = { ...screens[prev.activeScreenIndex] };
      const layoutName = getUniqueNameFromComponents(layoutType, screen.components);
      const layoutComp = {
        $Name: layoutName,
        $Type: layoutType,
        Uuid: generateUuid(),
        properties: getDefaultProperties(layoutType),
        children: [],
      };
      // Find the component, remove it from its current location, add it as child of the new layout
      const target = findInTree(screen.components, uuid);
      if (target) {
        screen.components = removeFromTree(screen.components, uuid);
        layoutComp.children = [{ ...target }];
        screen.components = [...screen.components, layoutComp];
      }
      screens[prev.activeScreenIndex] = screen;
      return { ...prev, screens, selectedComponentId: layoutComp.Uuid };
    });
  }, []);

  // Get project data for export
  const getProjectData = useCallback(() => {
    return {
      name: state.name,
      screens: state.screens.map(s => ({
        name: s.name,
        title: s.title,
        appName: state.name,
        properties: s.properties,
        components: s.components,
        code: s.code,
      }))
    };
  }, [state]);

  return {
    state,
    activeScreen,
    addComponent,
    removeComponent,
    updateComponentProperty,
    renameComponent,
    selectComponent,
    updateCode,
    updateProjectName,
    updateScreenTitle,
    loadTemplate,
    moveComponent,
    getSelectedComponent,
    getProjectData,
    applyPreset,
    wrapInLayout,
  };
}

// --- Tree utility functions ---

function getAllComponentNames(components) {
  const names = [];
  for (const comp of components) {
    names.push(comp.$Name);
    if (comp.children) {
      names.push(...getAllComponentNames(comp.children));
    }
  }
  return names;
}

function getUniqueNameFromComponents(type, components) {
  const allNames = getAllComponentNames(components);
  const baseName = COMPONENTS[type]?.defaultName || type;
  let counter = 1;
  while (allNames.includes(baseName + counter)) {
    counter++;
  }
  return baseName + counter;
}

function addToParent(components, parentId, newComp) {
  return components.map(comp => {
    if (comp.Uuid === parentId) {
      return { ...comp, children: [...(comp.children || []), newComp] };
    }
    if (comp.children) {
      return { ...comp, children: addToParent(comp.children, parentId, newComp) };
    }
    return comp;
  });
}

function removeFromTree(components, uuid) {
  return components
    .filter(c => c.Uuid !== uuid)
    .map(c => ({
      ...c,
      children: c.children ? removeFromTree(c.children, uuid) : []
    }));
}

function updateInTree(components, uuid, updater) {
  return components.map(c => {
    if (c.Uuid === uuid) return updater(c);
    if (c.children) {
      return { ...c, children: updateInTree(c.children, uuid, updater) };
    }
    return c;
  });
}

function findInTree(components, uuid) {
  for (const c of components) {
    if (c.Uuid === uuid) return c;
    if (c.children) {
      const found = findInTree(c.children, uuid);
      if (found) return found;
    }
  }
  return null;
}

function moveInTree(components, uuid, direction) {
  const idx = components.findIndex(c => c.Uuid === uuid);
  if (idx !== -1) {
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx >= 0 && newIdx < components.length) {
      const arr = [...components];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    }
    return components;
  }
  // Search children
  return components.map(c => ({
    ...c,
    children: c.children ? moveInTree(c.children, uuid, direction) : []
  }));
}
