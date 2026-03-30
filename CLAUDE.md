# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

App Inventor Studio is a web-based IDE for building MIT App Inventor apps via text-based code and markup instead of the visual block editor. It compiles to valid `.aia` files importable into MIT App Inventor, with iOS AI Companion compatibility.

## Commands

```bash
npm run dev          # Dev server on port 5173
npm run build        # Production build
npm run lint         # ESLint
npm test             # Vitest unit tests (137 tests, ~450ms)
npm run test:watch   # Unit tests in watch mode
npm run test:visual  # Playwright visual/E2E tests (7 tests, ~18s)
npm run test:all     # Both unit + visual tests
```

## Architecture

**Stack:** React 19 + Vite 8 + Tailwind CSS 4 + CodeMirror 6 + Supabase (auth & database)

### Compilation Pipeline (the core domain logic)

The app has two parallel pipelines that convert text into App Inventor formats:

1. **Code → Blocks:** `codeParser.js` parses the custom language (event handlers, variables, loops, procedures) into an AST, then `bkyGenerator.js` converts that AST into Blockly XML (`.bky` files).

2. **Layout Markup → Components:** `layoutParser.js` parses `screen {}` blocks into a component tree, then `scmGenerator.js` serializes that tree into App Inventor's SCM JSON format.

Both pipelines feed into `aiaGenerator.js`, which orchestrates the ZIP export into the `.aia` file structure:
```
project.aia/
├── youngandroidproject/project.properties
├── assets/
└── src/appinventor/ai_user/[ProjectName]/
    ├── Screen1.scm   (JSON from scmGenerator)
    └── Screen1.bky   (XML from bkyGenerator)
```

### State Management

`useAppState.js` is a custom React hook managing the entire app state: screens (each with a component tree + code), selection, and project metadata. Components are stored as nested trees with `children` arrays for layout containers. Exports methods for add/remove/update/rename/duplicate/move components, load templates, wrap in layouts, and get project data for export.

### Authentication & Project Persistence

`supabase.js` handles auth (sign up, sign in, sign out) and project CRUD (save, load, list, delete) against a Supabase backend. Projects are stored in a `projects` table keyed on `(user_id, name)` with upsert semantics. The Supabase URL and anon key are hardcoded (public anon key, not a secret).

### UI Layer

`App.jsx` switches between three views (design/code/layout) and manages overlays (AuthModal, ProjectsModal, DocsPanel, ExportWarnings, TemplateGallery).

Key UI components:
- `PhonePreview.jsx` — renders the component tree as a 360px mock device in real-time, with a non-visible components tray below
- `CodeEditor.jsx` — CodeMirror editor with syntax highlighting and parse status indicator
- `ComponentPalette.jsx` — searchable, categorized component picker
- `ComponentTree.jsx` — hierarchical tree with drag-and-drop reordering
- `PropertyEditor.jsx` — property editor for the selected component
- `LayoutBuilder.jsx` — preset layout templates (Header+Content, Form, 2-Column, etc.)
- `Header.jsx` — project name, save button (with unsaved indicator), view toggle, export, auth, docs
- `Toast.jsx` — context-based toast notifications (success/error/info, auto-dismiss)
- `ExportWarnings.jsx` — pre-export validation (e.g., missing FirebaseDB URL)
- `DocsPanel.jsx` — searchable, tabbed docs panel (Layout, Code, Components, Patterns)

### Keyboard Shortcuts

- `Ctrl/Cmd+S` — Save project
- `Ctrl/Cmd+E` — Export .aia
- `Ctrl/Cmd+D` — Duplicate selected component
- `Ctrl/Cmd+Arrow Up/Down` — Move component in hierarchy
- `Delete/Backspace` — Remove selected component
- `Escape` — Close modals / deselect

### Unsaved Changes & Auto-Save

The app tracks unsaved changes via JSON snapshot comparison and shows an amber indicator in the header. On export, it auto-saves the project if the user is signed in (silently fails if save fails, does not block export).

## iOS AI Companion Compatibility

`scmGenerator.js` applies several fixes for iOS compatibility:
- Arrangements must have explicit `BackgroundColor` (defaults to white `&HFFFFFFFF`)
- ScrollArrangement nested inside another arrangement (not Form) gets converted to regular Arrangement
- Visible widgets inside arrangements get explicit `Width: "-2"` (fill-parent)

These are tested in `tests/compatibility-check.test.js` — run those tests when modifying SCM generation.

## Custom Language Syntax

The code editor supports: `var`, `when Component.Event {}`, `set/get Component.Property`, `call Component.Method()`, `if/else`, `for/foreach/while`, `func` (returns value), `proc` (no return), `join()`, list literals `[1,2,3]`, `return`, `// comments`, and operators (`+`, `-`, `*`, `/`, `==`, `!=`, `<`, `>`, `<=`, `>=`, `and`, `or`, `not`).

## Layout Markup Syntax

The layout editor uses `screen {}` blocks with type aliases (`V`, `H`, `VScroll`, `HScroll`, `Table`, `Text`, `Password`, `List`, `Picker`, `DB`, `WebDB`, `Firebase`), shorthand flags (`fill`, `fillW`, `fillH`, `auto`, `autoH`, `bold`, `italic`, `center`, `centerV`, `left`, `right`, `checked`, `multiline`, `numbersOnly`), shorthand keys (`w=`, `h=`, `bg=`, `color=`, `fontSize=`, `hint=`, `enabled=`, `visible=`), and custom naming via `as` (e.g., `Button("Go" as GoButton)`).

## Component Definitions

`componentDefs.js` contains the catalog of 99 App Inventor components across 13 categories (User Interface, Layout, Media, Drawing & Animation, Sensors, Social, Storage, Connectivity, Maps, Charts, Data Science, LEGO MINDSTORMS, Experimental) with their properties, events, and methods. This is the source of truth for what the editor supports.

## Templates

`templates.js` provides 7 pre-built app templates: Blank, Counter, To-Do List, Calculator, Quiz, Notes, and Ride Tracker. The template gallery shows on first visit.

## In-App Documentation

`docsData.js` powers the Docs panel with 4 tabs: Layout syntax, Code syntax, Components catalog (dynamically pulled from `componentDefs.js`), and Common Patterns (Firebase, GPS, TinyDB, Lists, Notifier, Maps, Procedures). The search index covers components, keywords, type aliases, and patterns.
