// Generates .scm file content for a screen
// The .scm format is:
// #|
// $JSON
// {single line of JSON}
// |#

import { COMPONENTS } from './componentDefs';

export function generateScm(screen, appName) {
  const rootComponent = buildComponentTree(screen);

  const scmData = {
    authURL: ['ai2.appinventor.mit.edu'],
    YaVersion: '233',
    Source: 'Form',
    Properties: rootComponent,
  };

  const json = JSON.stringify(scmData);
  return `#|\n$JSON\n${json}\n|#`;
}

function buildComponentTree(screen) {
  // The root is always a Form
  const form = {
    $Name: screen.name,
    $Type: 'Form',
    $Version: '31',
    AppName: screen.appName || 'MyApp',
    Title: screen.title || screen.name,
    Uuid: '0',
  };

  // Add screen-level properties
  if (screen.properties) {
    for (const [key, value] of Object.entries(screen.properties)) {
      if (key !== '$Name' && key !== '$Type' && key !== '$Version' && key !== 'Uuid') {
        form[key] = value;
      }
    }
  }

  // Add components (pass 'Form' as parent type for iOS compat context)
  if (screen.components && screen.components.length > 0) {
    form.$Components = screen.components.map(comp => buildComponent(comp, 'Form'));
  }

  return form;
}

// Layout types that need explicit BackgroundColor to avoid black rendering
// on the iOS MIT AI Companion (it treats "default" bg as black, not transparent)
const ARRANGEMENT_TYPES = new Set([
  'VerticalArrangement', 'HorizontalArrangement',
  'VerticalScrollArrangement', 'HorizontalScrollArrangement',
  'TableArrangement',
]);

const SCROLL_TYPES = new Set([
  'VerticalScrollArrangement', 'HorizontalScrollArrangement',
]);

// Visible component types that render on screen (need Width for iOS compat)
const VISIBLE_WIDGET_TYPES = new Set([
  'Button', 'Label', 'TextBox', 'PasswordTextBox', 'CheckBox', 'Image',
  'ListPicker', 'ListView', 'Slider', 'Spinner', 'Switch', 'DatePicker',
  'TimePicker', 'WebViewer', 'Canvas', 'VideoPlayer', 'ContactPicker',
]);

function buildComponent(comp, parentType = null) {
  const def = COMPONENTS[comp.$Type];

  // iOS AI Companion critical fix: VerticalScrollArrangement with Height=Fill
  // inside a VerticalArrangement does NOT render children on iOS at all.
  // Replace with regular VerticalArrangement which works identically but renders.
  // Same for HorizontalScrollArrangement inside HorizontalArrangement.
  let actualType = comp.$Type;
  if (actualType === 'VerticalScrollArrangement') {
    actualType = 'VerticalArrangement';
  }
  if (actualType === 'HorizontalScrollArrangement') {
    actualType = 'HorizontalArrangement';
  }

  const actualDef = COMPONENTS[actualType];
  const result = {
    $Name: comp.$Name,
    $Type: actualType,
    $Version: actualDef ? actualDef.version : (def ? def.version : '1'),
    Uuid: comp.Uuid || ('-' + Math.floor(Math.random() * 1000000000)),
  };

  // Add all explicitly-set properties
  if (comp.properties) {
    for (const [key, value] of Object.entries(comp.properties)) {
      if (value !== undefined && value !== '') {
        result[key] = String(value);
      }
    }
  }

  // iOS AI Companion fix: arrangements without an explicit BackgroundColor
  // render as black on the companion app. Set white background as default.
  if (ARRANGEMENT_TYPES.has(comp.$Type) && !result.BackgroundColor) {
    result.BackgroundColor = '&HFFFFFFFF';
  }

  // iOS AI Companion fix: Buttons without explicit Shape can look odd.
  // Ensure buttons have TextAlignment set for consistent rendering.
  if (comp.$Type === 'Button') {
    if (!result.Shape) result.Shape = '0';
    if (!result.TextAlignment) result.TextAlignment = '1';
  }

  // iOS AI Companion fix: components inside scroll arrangements need
  // explicit Width to render. Without it, iOS collapses them to 0.
  if (parentType && SCROLL_TYPES.has(parentType)) {
    if (!result.Width && (VISIBLE_WIDGET_TYPES.has(comp.$Type) || ARRANGEMENT_TYPES.has(comp.$Type))) {
      result.Width = '-2'; // fill parent
    }
  }

  // iOS AI Companion fix: components inside ANY arrangement benefit from
  // explicit Width to avoid collapse. Set fill-parent if not specified.
  if (parentType && ARRANGEMENT_TYPES.has(parentType) && !result.Width) {
    if (VISIBLE_WIDGET_TYPES.has(comp.$Type) || ARRANGEMENT_TYPES.has(comp.$Type)) {
      result.Width = '-2'; // fill parent
    }
  }

  // Add children (for layouts), passing current type as parent context
  if (comp.children && comp.children.length > 0) {
    result.$Components = comp.children.map(child => buildComponent(child, comp.$Type));
  }

  return result;
}

