// Tree utility functions for component tree manipulation.
// Used by useAppState and anywhere else that needs to traverse/modify the tree.

import { COMPONENTS } from './componentDefs';

export function getAllComponentNames(components) {
  const names = [];
  for (const comp of components) {
    names.push(comp.$Name);
    if (comp.children) {
      names.push(...getAllComponentNames(comp.children));
    }
  }
  return names;
}

export function getUniqueNameFromComponents(type, components) {
  const allNames = getAllComponentNames(components);
  const baseName = COMPONENTS[type]?.defaultName || type;
  let counter = 1;
  while (allNames.includes(baseName + counter)) {
    counter++;
  }
  return baseName + counter;
}

export function addToParent(components, parentId, newComp) {
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

export function removeFromTree(components, uuid) {
  return components
    .filter(c => c.Uuid !== uuid)
    .map(c => ({
      ...c,
      children: c.children ? removeFromTree(c.children, uuid) : []
    }));
}

export function updateInTree(components, uuid, updater) {
  return components.map(c => {
    if (c.Uuid === uuid) return updater(c);
    if (c.children) {
      return { ...c, children: updateInTree(c.children, uuid, updater) };
    }
    return c;
  });
}

export function findInTree(components, uuid) {
  for (const c of components) {
    if (c.Uuid === uuid) return c;
    if (c.children) {
      const found = findInTree(c.children, uuid);
      if (found) return found;
    }
  }
  return null;
}

export function findByName(components, name) {
  for (const c of components) {
    if (c.$Name === name) return c;
    if (c.children) {
      const found = findByName(c.children, name);
      if (found) return found;
    }
  }
  return null;
}

export function moveInTree(components, uuid, direction) {
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
  return components.map(c => ({
    ...c,
    children: c.children ? moveInTree(c.children, uuid, direction) : []
  }));
}
