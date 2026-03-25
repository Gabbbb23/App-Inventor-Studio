/**
 * Compatibility Check Tests
 *
 * These tests validate the generated .scm output against KNOWN rendering
 * issues on the MIT AI Companion (especially iOS). Each test catches a
 * specific class of bug that would cause the companion to render differently
 * from the MIT App Inventor web editor.
 *
 * Run with: npm test
 */

import { describe, it, expect } from 'vitest';
import { parseLayout } from '../src/lib/layoutParser';
import { generateScm } from '../src/lib/scmGenerator';
import { COMPONENTS } from '../src/lib/componentDefs';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildAndParseSCM(layoutCode) {
  const layoutResult = parseLayout(layoutCode);
  const screen = {
    name: 'Screen1',
    title: 'Screen1',
    appName: 'TestApp',
    properties: {},
    components: layoutResult.components || [],
    code: layoutResult.remainingCode || '',
  };
  const scm = generateScm(screen, 'TestApp');
  const lines = scm.split('\n');
  return JSON.parse(lines[2]);
}

function flattenComponents(comp) {
  const result = [comp];
  if (comp.$Components) {
    for (const child of comp.$Components) {
      result.push(...flattenComponents(child));
    }
  }
  return result;
}

function getAllComponents(json) {
  const all = [];
  if (json.Properties.$Components) {
    for (const comp of json.Properties.$Components) {
      all.push(...flattenComponents(comp));
    }
  }
  return all;
}

const ARRANGEMENT_TYPES = [
  'VerticalArrangement', 'HorizontalArrangement',
  'VerticalScrollArrangement', 'HorizontalScrollArrangement',
  'TableArrangement',
];

// ═══════════════════════════════════════════════════════════════════════════════
// iOS COMPANION RENDERING CHECKS
// ═══════════════════════════════════════════════════════════════════════════════

describe('iOS Companion Compatibility', () => {

  describe('Arrangement backgrounds (prevents black rendering)', () => {
    it('every arrangement has an explicit BackgroundColor', () => {
      const json = buildAndParseSCM(`screen {
        Vertical(fill, fill) {
          Horizontal(fill) {
            Label("A")
          }
          VScroll(fill, fill) {
            Label("B")
          }
          HScroll(fill) {
            Button("C")
          }
        }
      }`);

      const all = getAllComponents(json);
      const arrangements = all.filter(c => ARRANGEMENT_TYPES.includes(c.$Type));

      for (const arr of arrangements) {
        expect(
          arr.BackgroundColor,
          `${arr.$Name} (${arr.$Type}) is missing BackgroundColor — will render as BLACK on iOS companion`
        ).toBeTruthy();
      }
    });

    it('explicit backgrounds are not overwritten', () => {
      const json = buildAndParseSCM(`screen {
        Horizontal(fill, bg=#FF0000) { Label("Red") }
        Vertical(fill, bg=#0000FF) { Label("Blue") }
      }`);

      const all = getAllComponents(json);
      const redH = all.find(c => c.$Type === 'HorizontalArrangement');
      const blueV = all.find(c => c.$Type === 'VerticalArrangement');

      expect(redH.BackgroundColor).toBe('&HFFFF0000');
      expect(blueV.BackgroundColor).toBe('&HFF0000FF');
    });
  });

  describe('Color format validation', () => {
    it('all color values use &HAARRGGBB format', () => {
      const json = buildAndParseSCM(`screen {
        Vertical(fill, fill, bg=#3F51B5) {
          Label("Title", color=#FFFFFF, bg=#000000)
          Button("Go", bg=#22C55E, color=#FFFFFF)
        }
      }`);

      const all = getAllComponents(json);
      const colorProps = ['BackgroundColor', 'TextColor', 'ItemBackgroundColor', 'ItemTextColor', 'ColorLeft', 'ColorRight'];

      for (const comp of all) {
        for (const prop of colorProps) {
          if (comp[prop]) {
            expect(
              comp[prop],
              `${comp.$Name}.${prop} = "${comp[prop]}" — must use &HAARRGGBB format`
            ).toMatch(/^&H[0-9A-F]{8}$/);
          }
        }
      }
    });
  });

  describe('Component property completeness', () => {
    it('buttons have Shape and TextAlignment for consistent rendering', () => {
      const json = buildAndParseSCM(`screen {
        Button("A")
        Button("B", bg=#FF0000)
        Horizontal(fill) {
          Button("C")
        }
      }`);

      const all = getAllComponents(json);
      const buttons = all.filter(c => c.$Type === 'Button');

      for (const btn of buttons) {
        expect(
          btn.Shape,
          `${btn.$Name} missing Shape — may render inconsistently`
        ).toBeTruthy();
        expect(
          btn.TextAlignment,
          `${btn.$Name} missing TextAlignment — text may not be centered`
        ).toBeTruthy();
      }
    });

    it('all components have valid $Version numbers', () => {
      const json = buildAndParseSCM(`screen {
        Vertical(fill, fill) {
          Button("B")
          Label("L")
          TextBox(hint="T")
          CheckBox("C")
          Slider()
          ListView()
          Image()
          Spinner()
          Switch("S")
        }
        Notifier()
        TinyDB()
        Clock()
      }`);

      const all = getAllComponents(json);
      for (const comp of all) {
        expect(
          comp.$Version,
          `${comp.$Name} (${comp.$Type}) missing $Version`
        ).toBeTruthy();
        expect(comp.$Version).toMatch(/^\d+$/);

        // Verify it matches our known version
        if (comp.$Type !== 'Form' && COMPONENTS[comp.$Type]) {
          expect(
            comp.$Version,
            `${comp.$Name} version ${comp.$Version} doesn't match expected ${COMPONENTS[comp.$Type].version}`
          ).toBe(COMPONENTS[comp.$Type].version);
        }
      }
    });

    it('all components have a Uuid', () => {
      const json = buildAndParseSCM(`screen {
        Vertical(fill, fill) {
          Horizontal(fill) {
            Button("A")
            Button("B")
          }
          Label("C")
        }
      }`);

      const all = getAllComponents(json);
      const uuids = new Set();
      for (const comp of all) {
        expect(comp.Uuid, `${comp.$Name} missing Uuid`).toBeTruthy();
        expect(uuids.has(comp.Uuid), `Duplicate Uuid: ${comp.Uuid}`).toBe(false);
        uuids.add(comp.Uuid);
      }
    });
  });

  describe('Dimension values', () => {
    it('fill dimensions use -2, auto uses -1', () => {
      const json = buildAndParseSCM(`screen {
        Vertical(fill, fill) {
          Button("Fill", fill)
          Label("Auto")
        }
      }`);

      const all = getAllComponents(json);
      const vert = all.find(c => c.$Type === 'VerticalArrangement');
      expect(vert.Width).toBe('-2');
      expect(vert.Height).toBe('-2');

      const fillBtn = all.find(c => c.$Type === 'Button');
      expect(fillBtn.Width).toBe('-2');
    });

    it('pixel dimensions are plain numbers', () => {
      const json = buildAndParseSCM(`screen {
        Horizontal(fill, h=50) {
          Button("Go", w=120, h=40)
        }
      }`);

      const all = getAllComponents(json);
      const h = all.find(c => c.$Type === 'HorizontalArrangement');
      expect(h.Height).toBe('50');

      const btn = all.find(c => c.$Type === 'Button');
      expect(btn.Width).toBe('120');
      expect(btn.Height).toBe('40');
    });
  });

  describe('SCM structure validation', () => {
    it('root is always Form with correct metadata', () => {
      const json = buildAndParseSCM(`screen { Label("Hi") }`);

      expect(json.authURL).toEqual(['ai2.appinventor.mit.edu']);
      expect(json.YaVersion).toBe('233');
      expect(json.Source).toBe('Form');
      expect(json.Properties.$Type).toBe('Form');
      expect(json.Properties.$Version).toBe('31');
      expect(json.Properties.Uuid).toBe('0');
    });

    it('children are nested under $Components arrays', () => {
      const json = buildAndParseSCM(`screen {
        Vertical(fill, fill) {
          Horizontal(fill) {
            Button("Deep")
          }
        }
      }`);

      const vert = json.Properties.$Components[0];
      expect(vert.$Components).toBeInstanceOf(Array);
      const horiz = vert.$Components[0];
      expect(horiz.$Components).toBeInstanceOf(Array);
      expect(horiz.$Components[0].$Type).toBe('Button');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FULL APP COMPATIBILITY TESTS (real user scenarios)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Real App Scenarios', () => {
  it('nav+content+footer layout passes all checks', () => {
    const json = buildAndParseSCM(`screen {
      Vertical(fill, fill) {
        Horizontal(fill, h=50, bg=#3F51B5, centerV) {
          Label("My App", bold, color=#FFFFFF, fontSize=18)
        }
        VScroll(fill, fill) {
          Label("Page content goes here")
          Button("Action 1", fill)
          Button("Action 2", fill)
        }
        Horizontal(fill, h=50, bg=#3F51B5, center) {
          Button("Tab 1", color=#FFFFFF, bg=#3F51B5)
          Button("Tab 2", color=#FFFFFF, bg=#3F51B5)
          Button("Tab 3", color=#FFFFFF, bg=#3F51B5)
        }
      }
    }`);

    const all = getAllComponents(json);

    // Every arrangement has a background
    const arrangements = all.filter(c => ARRANGEMENT_TYPES.includes(c.$Type));
    for (const arr of arrangements) {
      expect(arr.BackgroundColor, `${arr.$Name} missing bg`).toBeTruthy();
    }

    // Every button has Shape + TextAlignment
    const buttons = all.filter(c => c.$Type === 'Button');
    for (const btn of buttons) {
      expect(btn.Shape, `${btn.$Name} missing Shape`).toBeTruthy();
      expect(btn.TextAlignment, `${btn.$Name} missing TextAlignment`).toBeTruthy();
    }

    // All colors are valid format
    for (const comp of all) {
      if (comp.BackgroundColor) expect(comp.BackgroundColor).toMatch(/^&H[0-9A-F]{8}$/);
      if (comp.TextColor) expect(comp.TextColor).toMatch(/^&H[0-9A-F]{8}$/);
    }

    // All Uuids unique
    const uuids = all.map(c => c.Uuid);
    expect(new Set(uuids).size).toBe(uuids.length);
  });

  it('login screen passes all checks', () => {
    const json = buildAndParseSCM(`screen {
      Vertical(fill, fill, center) {
        Label("Login", fontSize=28, bold, color=#3F51B5)
        Text(hint="Username", fill)
        Password(hint="Password", fill)
        Button("Log In", fill, bg=#3F51B5, color=#FFFFFF, bold)
        Label("", color=#EF4444)
      }
      Notifier()
      DB()
    }`);

    const all = getAllComponents(json);

    // Should have the right types
    const types = all.map(c => c.$Type);
    expect(types).toContain('VerticalArrangement');
    expect(types).toContain('TextBox');
    expect(types).toContain('PasswordTextBox');
    expect(types).toContain('Button');
    expect(types).toContain('Notifier');
    expect(types).toContain('TinyDB');

    // VerticalArrangement should have bg
    const vert = all.find(c => c.$Type === 'VerticalArrangement');
    expect(vert.BackgroundColor).toBeTruthy();
    expect(vert.AlignHorizontal).toBe('3');
  });
});
