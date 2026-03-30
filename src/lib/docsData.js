// docsData.js — Structured documentation data for the Docs panel.
// Imports live data from componentDefs and layoutParser so docs stay in sync.
// Can also be serialized to JSON to feed to an AI as reference material.

import { CATEGORIES, COMPONENTS } from './componentDefs';
import { TYPE_ALIASES } from './layoutParser';

export { CATEGORIES, COMPONENTS, TYPE_ALIASES };

// ─── Layout Syntax Reference ─────────────────────────────────────────────────

export const LAYOUT_SYNTAX = {
  overview: `Define your app's UI inside a screen { } block in the Code editor. Components are nested with curly braces. The first string argument becomes the Text property. Use shorthand flags and key=value pairs for properties.`,

  screenBlock: `screen {
  Vertical(fill, fill) {
    Label("Hello World", bold, fontSize=24)
    Button("Click Me", fill, bg=#3F51B5, color=#FFFFFF)
  }
  Notifier()
}`,

  typeAliases: Object.entries(TYPE_ALIASES).map(([alias, full]) => ({ alias, fullType: full })),

  shorthandKeys: [
    { key: 'w', mapsTo: 'Width', example: 'w=200', note: 'Pixel width' },
    { key: 'h', mapsTo: 'Height', example: 'h=100', note: 'Pixel height' },
    { key: 'bg', mapsTo: 'BackgroundColor', example: 'bg=#FF5733', note: 'Hex color' },
    { key: 'color', mapsTo: 'TextColor', example: 'color=#FFFFFF', note: 'Hex color' },
    { key: 'fontSize', mapsTo: 'FontSize', example: 'fontSize=18', note: 'Number' },
    { key: 'hint', mapsTo: 'Hint', example: 'hint="Enter name"', note: 'String' },
    { key: 'enabled', mapsTo: 'Enabled', example: 'enabled=false', note: 'Boolean' },
    { key: 'visible', mapsTo: 'Visible', example: 'visible=false', note: 'Boolean' },
  ],

  shorthandFlags: [
    { flag: 'fill', effect: 'Width = fill-parent (1st use), Height = fill-parent (2nd use)' },
    { flag: 'fillW', effect: 'Width = fill-parent' },
    { flag: 'fillH', effect: 'Height = fill-parent' },
    { flag: 'auto', effect: 'Width = automatic' },
    { flag: 'autoH', effect: 'Height = automatic' },
    { flag: 'bold', effect: 'FontBold = True' },
    { flag: 'italic', effect: 'FontItalic = True' },
    { flag: 'center', effect: 'AlignHorizontal=3 (layouts) or TextAlignment=1 (text)' },
    { flag: 'centerV', effect: 'AlignVertical=2 (layouts only)' },
    { flag: 'left', effect: 'AlignHorizontal=1 or TextAlignment=0' },
    { flag: 'right', effect: 'AlignHorizontal=2 or TextAlignment=2' },
    { flag: 'checked', effect: 'Checked = True' },
    { flag: 'multiline', effect: 'MultiLine = True' },
    { flag: 'numbersOnly', effect: 'NumbersOnly = True' },
  ],

  naming: `Use "text" as CustomName to give a component a custom name:
  Button("Go" as GoButton, fill, bg=#22C55E)
  Label("Score" as ScoreLabel, bold)`,

  examples: [
    {
      title: 'Login Screen',
      code: `screen {
  Vertical(fill, fill, center) {
    Label("Welcome", bold, fontSize=28, color=#3F51B5)
    Text(hint="Username", fill)
    Password(hint="Password", fill)
    Button("Log In", fill, bg=#3F51B5, color=#FFFFFF, bold)
    Label("" as ErrorLabel, color=#EF4444)
  }
  Notifier()
  DB()
}`,
    },
    {
      title: 'Nav + Content + Footer',
      code: `screen {
  Vertical(fill, fill) {
    Horizontal(fill, h=50, bg=#3F51B5, centerV) {
      Label("My App", bold, color=#FFFFFF, fontSize=18)
    }
    VScroll(fill, fill) {
      Label("Content goes here")
      Button("Action", fill)
    }
    Horizontal(fill, h=50, bg=#3F51B5, center) {
      Button("Tab 1", color=#FFFFFF, bg=#3F51B5)
      Button("Tab 2", color=#FFFFFF, bg=#3F51B5)
    }
  }
}`,
    },
  ],
};

// ─── Code Syntax Reference ───────────────────────────────────────────────────

export const CODE_SYNTAX = {
  overview: `Write logic below the screen { } block (or without one if using the visual designer). The syntax compiles to MIT App Inventor Blockly XML.`,

  keywords: [
    { keyword: 'var', syntax: 'var name = value', description: 'Declare a global variable', example: 'var count = 0' },
    { keyword: 'when', syntax: 'when Component.Event(params) { ... }', description: 'Handle a component event', example: 'when Button1.Click {\n  set Label1.Text = "Clicked!"\n}' },
    { keyword: 'set', syntax: 'set Component.Property = expr', description: 'Set a component property', example: 'set Label1.Text = "Hello"' },
    { keyword: 'get', syntax: 'get Component.Property', description: 'Read a component property (in expressions)', example: 'var t = get TextBox1.Text' },
    { keyword: 'call', syntax: 'call Component.Method(args)', description: 'Call a component method', example: 'call Notifier1.ShowAlert("Done!")' },
    { keyword: 'if', syntax: 'if condition { ... } else { ... }', description: 'Conditional branch', example: 'if count > 10 {\n  set Label1.Text = "High"\n} else {\n  set Label1.Text = "Low"\n}' },
    { keyword: 'for', syntax: 'for i in range(start, end, step) { ... }', description: 'Count-based loop', example: 'for i in range(1, 10) {\n  call Notifier1.ShowAlert(join("i=", i))\n}' },
    { keyword: 'foreach', syntax: 'foreach item in list { ... }', description: 'Iterate over a list', example: 'foreach item in myList {\n  call Notifier1.ShowAlert(item)\n}' },
    { keyword: 'while', syntax: 'while condition { ... }', description: 'While loop', example: 'while count < 10 {\n  count = count + 1\n}' },
    { keyword: 'proc', syntax: 'proc name(params) { ... }', description: 'Define a procedure (no return value)', example: 'proc greet(name) {\n  call Notifier1.ShowAlert(join("Hi ", name))\n}' },
    { keyword: 'func', syntax: 'func name(params) { ... return expr }', description: 'Define a function (returns a value)', example: 'func double(n) {\n  return n * 2\n}' },
    { keyword: 'join', syntax: 'join(a, b, ...)', description: 'Concatenate strings', example: 'set Label1.Text = join("Score: ", score)' },
    { keyword: 'return', syntax: 'return expression', description: 'Return a value from a func', example: 'return x + y' },
  ],

  operators: [
    { op: '+', description: 'Add' },
    { op: '-', description: 'Subtract' },
    { op: '*', description: 'Multiply' },
    { op: '/', description: 'Divide' },
    { op: '==', description: 'Equal to' },
    { op: '!=', description: 'Not equal to' },
    { op: '<', description: 'Less than' },
    { op: '>', description: 'Greater than' },
    { op: '<=', description: 'Less or equal' },
    { op: '>=', description: 'Greater or equal' },
    { op: 'and', description: 'Logical AND' },
    { op: 'or', description: 'Logical OR' },
    { op: 'not', description: 'Logical NOT' },
  ],

  literals: [
    { type: 'Number', examples: '42, 3.14, 0' },
    { type: 'String', examples: '"hello", "world"' },
    { type: 'Boolean', examples: 'true, false' },
    { type: 'List', examples: '[1, 2, 3], ["a", "b"]' },
    { type: 'Empty list', examples: '[]' },
  ],

  comments: '// This is a comment (single-line only)',
};

// ─── Common Patterns ─────────────────────────────────────────────────────────

export const COMMON_PATTERNS = [
  {
    title: 'Firebase Real-Time Read/Write',
    description: 'Store and retrieve data with FirebaseDB. DataChanged fires whenever any value updates in the database.',
    code: `// Store a value
call FirebaseDB1.StoreValue("score", join("", score))

// Retrieve a value
call FirebaseDB1.GetValue("score", "0")

// Handle retrieved value
when FirebaseDB1.GotValue(tag, value) {
  if tag == "score" {
    set ScoreLabel.Text = value
  }
}

// Real-time updates from other users
when FirebaseDB1.DataChanged(tag, value) {
  if tag == "score" {
    set ScoreLabel.Text = value
  }
}`,
  },
  {
    title: 'GPS Location Tracking',
    description: 'Use LocationSensor to get the device GPS position. LocationChanged fires when the device moves.',
    code: `when LocationSensor1.LocationChanged(latitude, longitude, altitude, speed) {
  set LatLabel.Text = join("Lat: ", latitude)
  set LngLabel.Text = join("Lng: ", longitude)
}`,
  },
  {
    title: 'TinyDB Persistence',
    description: 'Save and load data locally on the device using TinyDB.',
    code: `// Save on button click
when SaveButton.Click {
  call TinyDB1.StoreValue("myKey", get TextBox1.Text)
  call Notifier1.ShowAlert("Saved!")
}

// Load on screen init
when Screen1.Initialize {
  var saved = call TinyDB1.GetValue("myKey", "")
  if saved != "" {
    set TextBox1.Text = saved
  }
}`,
  },
  {
    title: 'List Management',
    description: 'Work with lists: create, add items, iterate, and index.',
    code: `var items = []

// Add item
when AddButton.Click {
  items = join(items, get InputBox.Text)
  set InputBox.Text = ""
  set ListView1.Elements = items
}

// Iterate
foreach item in items {
  call Notifier1.ShowAlert(item)
}

// Access by index (1-based in App Inventor)
var first = items[1]`,
  },
  {
    title: 'Notifier Alerts',
    description: 'Show alerts and messages to the user.',
    code: `// Simple alert
call Notifier1.ShowAlert("Hello!")

// Use with conditions
when SubmitButton.Click {
  if get NameBox.Text == "" {
    call Notifier1.ShowAlert("Please enter your name")
  } else {
    call Notifier1.ShowAlert(join("Welcome, ", get NameBox.Text))
  }
}`,
  },
  {
    title: 'Map with Markers',
    description: 'Display a map, update marker positions, and pan to locations.',
    code: `// Update marker from GPS
when LocationSensor1.LocationChanged(latitude, longitude, altitude, speed) {
  call MyMarker.SetLocation(latitude, longitude)
  call Map1.PanTo(latitude, longitude, 15)
}

// Create a marker dynamically
call Map1.CreateMarker(42.36, -71.09)`,
  },
  {
    title: 'Procedures and Functions',
    description: 'Reuse logic with proc (no return) and func (returns value).',
    code: `// Procedure
proc showError(message) {
  set ErrorLabel.Text = message
  set ErrorLabel.TextColor = "#FF0000"
  call Notifier1.ShowAlert(message)
}

// Function
func celsiusToF(c) {
  return c * 9 / 5 + 32
}

// Using them
when ConvertButton.Click {
  var temp = get TempInput.Text
  set ResultLabel.Text = join("", celsiusToF(temp))
}`,
  },
];

// ─── Search Index ────────────────────────────────────────────────────────────

export function buildSearchIndex() {
  const entries = [];

  // Components
  for (const [key, comp] of Object.entries(COMPONENTS)) {
    const propNames = Object.keys(comp.properties || {}).join(' ');
    const eventNames = (comp.events || []).join(' ');
    const methodNames = Object.keys(comp.methods || {}).join(' ');
    entries.push({
      type: 'component',
      name: key,
      category: comp.category,
      searchText: `${key} ${comp.defaultName} ${comp.category} ${propNames} ${eventNames} ${methodNames}`.toLowerCase(),
    });
  }

  // Keywords
  for (const kw of CODE_SYNTAX.keywords) {
    entries.push({
      type: 'keyword',
      name: kw.keyword,
      searchText: `${kw.keyword} ${kw.description} ${kw.syntax}`.toLowerCase(),
    });
  }

  // Type aliases
  for (const { alias, fullType } of LAYOUT_SYNTAX.typeAliases) {
    entries.push({
      type: 'alias',
      name: alias,
      searchText: `${alias} ${fullType}`.toLowerCase(),
    });
  }

  // Patterns
  for (const p of COMMON_PATTERNS) {
    entries.push({
      type: 'pattern',
      name: p.title,
      searchText: `${p.title} ${p.description}`.toLowerCase(),
    });
  }

  return entries;
}
