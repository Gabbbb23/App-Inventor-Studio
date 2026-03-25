/**
 * Template Validation Tests
 *
 * Exports every built-in template and validates the generated
 * .scm and .bky files for correctness. Catches the exact errors
 * the user saw in MIT App Inventor's blocks editor.
 */

import { describe, it, expect } from 'vitest';
import { TEMPLATES } from '../src/lib/templates';
import { parseLayout } from '../src/lib/layoutParser';
import { generateScm } from '../src/lib/scmGenerator';
import { generateBky } from '../src/lib/bkyGenerator';
import { parseCode } from '../src/lib/codeParser';
import { COMPONENTS } from '../src/lib/componentDefs';

const XMLNS = 'xmlns="http://www.w3.org/1999/xhtml"';

function exportTemplate(template) {
  const screen = template.screens[0];
  const layoutResult = parseLayout(screen.code || '');

  const effectiveScreen = {
    name: screen.name,
    title: screen.title || screen.name,
    appName: template.name || 'TestApp',
    properties: screen.properties || {},
    components: layoutResult.components || screen.components || [],
    code: layoutResult.remainingCode || screen.code || '',
  };

  const scm = generateScm(effectiveScreen, template.name || 'TestApp');
  const bky = generateBky(effectiveScreen);
  const scmJson = JSON.parse(scm.split('\n')[2]);

  return { scm, bky, scmJson, effectiveScreen, layoutErrors: layoutResult.errors };
}

// Validate BKY has proper xmlns on all mutations
function validateBkyMutations(bky, templateName) {
  // Every <mutation should have xmlns
  const mutationMatches = bky.match(/<mutation\b[^>]*>/g) || [];
  for (const m of mutationMatches) {
    expect(
      m.includes('xmlns='),
      `${templateName}: mutation missing xmlns: ${m.substring(0, 80)}`
    ).toBe(true);
  }
}

// Validate BKY has COMPONENT_SELECTOR on component blocks
function validateBkyComponentSelectors(bky, templateName) {
  // Every component_event should have COMPONENT_SELECTOR field
  const eventBlocks = (bky.match(/type="component_event"/g) || []).length;
  const eventSelectors = (bky.match(/COMPONENT_SELECTOR/g) || []).length;
  // component_set_get and component_method also have COMPONENT_SELECTOR
  // At minimum, event blocks should have selectors
  if (eventBlocks > 0) {
    expect(
      eventSelectors,
      `${templateName}: ${eventBlocks} event blocks but only ${eventSelectors} COMPONENT_SELECTOR fields`
    ).toBeGreaterThanOrEqual(eventBlocks);
  }
}

// Validate all blocks have matching open/close tags
function validateBkyStructure(bky, templateName) {
  const opens = (bky.match(/<block /g) || []).length;
  const closes = (bky.match(/<\/block>/g) || []).length;
  expect(opens, `${templateName}: mismatched block tags (${opens} opens, ${closes} closes)`).toBe(closes);

  const valueOpens = (bky.match(/<value /g) || []).length;
  const valueCloses = (bky.match(/<\/value>/g) || []).length;
  expect(valueOpens, `${templateName}: mismatched value tags`).toBe(valueCloses);

  const stmtOpens = (bky.match(/<statement /g) || []).length;
  const stmtCloses = (bky.match(/<\/statement>/g) || []).length;
  expect(stmtOpens, `${templateName}: mismatched statement tags`).toBe(stmtCloses);
}

// Validate code parses without errors
function validateCodeParsing(code, templateName) {
  if (!code || !code.trim()) return;
  const { errors } = parseCode(code);
  expect(
    errors,
    `${templateName}: code parse errors: ${errors.map(e => e.message).join(', ')}`
  ).toEqual([]);
}

describe('Template Validation', () => {
  for (const template of TEMPLATES) {
    describe(`Template: ${template.name}`, () => {
      it('exports without layout parse errors', () => {
        const { layoutErrors } = exportTemplate(template);
        expect(layoutErrors).toEqual([]);
      });

      it('generates valid SCM with proper structure', () => {
        const { scmJson } = exportTemplate(template);
        expect(scmJson.Properties.$Type).toBe('Form');
        expect(scmJson.Properties.$Version).toBe('31');
        expect(scmJson.Properties.Uuid).toBe('0');
        expect(scmJson.YaVersion).toBe('233');
      });

      it('code parses without errors', () => {
        const { effectiveScreen } = exportTemplate(template);
        validateCodeParsing(effectiveScreen.code, template.name);
      });

      it('BKY has xmlns on all mutations', () => {
        const { bky } = exportTemplate(template);
        validateBkyMutations(bky, template.name);
      });

      it('BKY has COMPONENT_SELECTOR on event/method blocks', () => {
        const { bky } = exportTemplate(template);
        validateBkyComponentSelectors(bky, template.name);
      });

      it('BKY has balanced XML tags', () => {
        const { bky } = exportTemplate(template);
        validateBkyStructure(bky, template.name);
      });

      it('all SCM components have valid types and versions', () => {
        const { scmJson } = exportTemplate(template);
        function checkComp(comp) {
          if (comp.$Type !== 'Form') {
            expect(
              COMPONENTS[comp.$Type],
              `Unknown type: ${comp.$Type} in ${comp.$Name}`
            ).toBeTruthy();
            expect(comp.$Version).toMatch(/^\d+$/);
          }
          if (comp.$Components) {
            comp.$Components.forEach(checkComp);
          }
        }
        checkComp(scmJson.Properties);
      });

      it('BKY component_type attributes reference valid App Inventor types', () => {
        const { bky } = exportTemplate(template);
        // Extract all component_type="..." values from mutations
        const typeMatches = bky.matchAll(/component_type="([^"]+)"/g);
        for (const match of typeMatches) {
          const type = match[1];
          // "Form" is valid — it's the Screen/Form component type for Screen1 events
          const isValid = COMPONENTS[type] || type === 'Form';
          expect(
            isValid,
            `${template.name}: BKY references unknown component_type="${type}" — likely a custom name not resolved to its actual type`
          ).toBeTruthy();
        }
      });
    });
  }
});

// Specific regression test for the Counter template bug
describe('Counter Template Regression', () => {
  it('resolves custom names (PlusButton→Button, CountLabel→Label) in BKY', () => {
    const counter = TEMPLATES.find(t => t.id === 'counter');
    const { bky } = exportTemplate(counter);

    // PlusButton should resolve to component_type="Button", NOT "PlusButton"
    expect(bky).toContain('instance_name="PlusButton"');
    expect(bky).toContain('component_type="Button"');
    expect(bky).not.toContain('component_type="PlusButton"');
    expect(bky).not.toContain('component_type="MinusButton"');
    expect(bky).not.toContain('component_type="ResetButton"');
    expect(bky).not.toContain('component_type="CountLabel"');

    // CountLabel should resolve to component_type="Label"
    expect(bky).toContain('instance_name="CountLabel"');
    expect(bky).toContain('component_type="Label"');
  });
});
