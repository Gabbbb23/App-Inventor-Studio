import { describe, it, expect } from 'vitest';
import { parseLayout } from '../src/lib/layoutParser';
import { generateScm } from '../src/lib/scmGenerator';

// This test dumps the exact SCM JSON so we can inspect what's being exported
describe('Debug SCM Output', () => {
  it('dumps the nav+content layout SCM', () => {
    const code = `screen {
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
    }`;
    const layoutResult = parseLayout(code);
    const screen = {
      name: 'Screen1', title: 'Screen1', appName: 'MyApp',
      properties: {}, components: layoutResult.components, code: '',
    };
    const scm = generateScm(screen, 'MyApp');
    const json = JSON.parse(scm.split('\n')[2]);

    // Pretty-print for inspection
    console.log('\n=== FULL SCM JSON ===');
    console.log(JSON.stringify(json.Properties, null, 2));

    // Check VScroll children specifically
    const root = json.Properties.$Components[0]; // VerticalArrangement
    const vscroll = root.$Components[1]; // VScroll
    console.log('\n=== VSCROLL COMPONENT ===');
    console.log(JSON.stringify(vscroll, null, 2));

    // Verify children exist and have proper properties
    expect(vscroll.$Components).toHaveLength(3);

    // Check if children are missing Width (might need fill for iOS)
    for (const child of vscroll.$Components) {
      console.log(`  ${child.$Name} (${child.$Type}): Width=${child.Width || 'NOT SET'}, Height=${child.Height || 'NOT SET'}, Text="${child.Text || 'N/A'}"`);
    }
  });
});
