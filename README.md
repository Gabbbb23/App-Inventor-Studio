# App Inventor Studio

A modern web tool that makes building MIT App Inventor apps easier. Write code instead of dragging blocks, design layouts with simple markup, and export valid `.aia` files you can import directly into MIT App Inventor.

## Features

### Code Editor
Write app logic in simple text instead of dragging blocks:
```
var count = 0

when PlusButton.Click {
  count = count + 1
  set CountLabel.Text = count
}
```
Supports variables, event handlers, if/else, loops, procedures, functions, component property get/set, and method calls — all compiled to App Inventor blocks on export.

### Layout Markup
Define your entire UI with a `screen {}` block instead of adding components one by one:
```
screen {
  Vertical(fill, fill) {
    Horizontal(fill, h=50, bg=#3F51B5, centerV) {
      Label("My App", bold, color=#FFFFFF, fontSize=18)
    }
    Vertical(fill, fill) {
      Label("Page content")
      Button("Action 1", fill)
    }
    Horizontal(fill, h=50, bg=#3F51B5, center) {
      Button("Tab 1", color=#FFFFFF, bg=#3F51B5)
      Button("Tab 2", color=#FFFFFF, bg=#3F51B5)
    }
  }
}
```
Shorthand syntax: `fill`, `bold`, `bg=#color`, `color=#color`, `w=120`, `h=50`, `center`, `as CustomName`.

### Visual Designer
- Phone preview that updates in real-time
- Component palette with 48 App Inventor components across 8 categories
- Property editor with color pickers, dimension presets, and toggle switches
- Component tree with drag-to-reorder

### Layout Builder
- 8 one-click layout presets (Login, Nav+Content, Form, Card Grid, Settings, etc.)
- Quick Build panel for fast component insertion
- Wrap-in-layout to nest components instantly

### Templates
6 ready-to-use app templates with components and starter code:
- Counter App
- To-Do List
- Calculator
- Quiz App
- Notes App
- Blank App

### AIA Export
Generates valid `.aia` files compatible with MIT App Inventor, including:
- `.scm` files (component definitions)
- `.bky` files (block logic as XML)
- `project.properties` (project metadata)
- iOS AI Companion compatibility fixes built-in

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Install & Run
```bash
npm install
npm run dev
```
Open http://localhost:5173

### Build for Production
```bash
npm run build
```

## Testing

```bash
# Unit + compatibility tests (102 tests, ~300ms)
npm test

# Visual tests with Playwright (7 tests, ~18s)
npm run test:visual

# All tests
npm run test:all
```

### What the tests cover
- **Layout Parser**: `fill,fill` dimensions, type aliases, colors, nesting, custom names
- **SCM Generator**: JSON structure, component versions, iOS compatibility fixes
- **BKY Generator**: event handlers, variables, if/else, loops, procedures, method calls
- **Code Parser**: all syntax constructs
- **iOS Compatibility**: arrangement backgrounds, color formats, explicit widths, component type resolution
- **Template Validation**: all 6 templates export without errors, valid block types, balanced XML
- **Visual Tests**: preview rendering, template loading, export download

## Code Syntax Reference

| Syntax | Description |
|---|---|
| `var x = 0` | Global variable |
| `when Button1.Click { }` | Event handler |
| `set Label1.Text = "Hi"` | Set component property |
| `get TextBox1.Text` | Get component property |
| `call Notifier1.ShowAlert("msg")` | Call component method |
| `if x > 10 { } else { }` | Conditional |
| `for i in range(1, 10) { }` | For loop |
| `foreach item in myList { }` | For-each loop |
| `while x < 10 { }` | While loop |
| `proc greet(name) { }` | Procedure (no return) |
| `func add(a, b) { return a + b }` | Function (with return) |
| `join("Hello ", name)` | Text join |
| `[1, 2, 3]` | List literal |

## Layout Syntax Reference

| Shorthand | Effect |
|---|---|
| `fill` | First = Width fill, second = Height fill |
| `fillH` | Height: fill parent |
| `w=120` / `h=50` | Width/Height in pixels |
| `bg=#3F51B5` | Background color |
| `color=#FFFFFF` | Text color |
| `bold` / `italic` | Font style |
| `fontSize=24` | Font size |
| `center` / `centerV` | Alignment |
| `hint="text"` | TextBox hint |
| `as MyName` | Custom component name |
| `V` / `Vertical` | VerticalArrangement |
| `H` / `Horizontal` | HorizontalArrangement |
| `VScroll` / `HScroll` | Scroll arrangements |
| `Text` | TextBox |
| `Password` | PasswordTextBox |
| `DB` | TinyDB |
| `Picker` | ListPicker |

## Tech Stack

- React + Vite
- Tailwind CSS
- CodeMirror (code editor)
- JSZip + FileSaver (AIA export)
- Vitest (unit tests)
- Playwright (visual tests)

## License

MIT
