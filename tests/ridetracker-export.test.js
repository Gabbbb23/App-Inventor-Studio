/**
 * Tests the ride tracker through the EXACT same pipeline as the Export button.
 * This catches issues that unit tests on individual generators might miss.
 */
import { describe, it, expect } from 'vitest';
import { TEMPLATES } from '../src/lib/templates';
import { parseLayout } from '../src/lib/layoutParser';
import { generateScm } from '../src/lib/scmGenerator';
import { generateBky } from '../src/lib/bkyGenerator';

const tmpl = TEMPLATES.find(t => t.id === 'ridetracker');

// Simulate exactly what aiaGenerator.js does
function simulateExport() {
  const project = {
    name: tmpl.name,
    screens: tmpl.screens.map(s => ({
      name: s.name,
      title: s.title,
      appName: tmpl.name,
      properties: s.properties,
      components: s.components,
      code: s.code,
    }))
  };

  const results = [];
  for (const screen of project.screens) {
    const layoutResult = parseLayout(screen.code || '');
    const effectiveScreen = { ...screen };
    if (layoutResult.components) {
      effectiveScreen.components = layoutResult.components;
      effectiveScreen.code = layoutResult.remainingCode;
    }
    const scm = generateScm(effectiveScreen, project.name);
    const bky = generateBky(effectiveScreen);
    results.push({ screen: screen.name, scm, bky, effectiveScreen });
  }
  return { project, results };
}

describe('Ride Tracker full export pipeline', () => {
  it('layout parser does NOT replace template components', () => {
    const screen = tmpl.screens[0];
    const layoutResult = parseLayout(screen.code || '');
    // Should NOT find a screen{} block in the ride tracker code
    expect(layoutResult.components).toBeNull();
  });

  it('SCM contains Clock1', () => {
    const { results } = simulateExport();
    const scm = results[0].scm;
    const json = JSON.parse(scm.split('\n')[2]);

    const allComps = [];
    function flatten(comp) {
      allComps.push(comp);
      if (comp.$Components) comp.$Components.forEach(flatten);
    }
    flatten(json.Properties);

    const clock = allComps.find(c => c.$Name === 'Clock1');
    expect(clock, 'Clock1 must be in the SCM output').toBeTruthy();
    expect(clock.$Type).toBe('Clock');
    expect(clock.$Version).toBe('4');
  });

  it('SCM contains all non-visible components', () => {
    const { results } = simulateExport();
    const scm = results[0].scm;
    const json = JSON.parse(scm.split('\n')[2]);

    const allComps = [];
    function flatten(comp) {
      allComps.push(comp);
      if (comp.$Components) comp.$Components.forEach(flatten);
    }
    flatten(json.Properties);

    const names = allComps.map(c => c.$Name);
    expect(names).toContain('Clock1');
    expect(names).toContain('LocationSensor1');
    expect(names).toContain('FirebaseDB1');
    expect(names).toContain('Notifier1');
  });

  it('BKY references Clock1 correctly', () => {
    const { results } = simulateExport();
    const bky = results[0].bky;
    expect(bky).toContain('instance_name="Clock1"');
    expect(bky).toContain('component_type="Clock"');
  });

  it('all BKY component references exist in SCM', () => {
    const { results } = simulateExport();
    const scm = results[0].scm;
    const bky = results[0].bky;
    const json = JSON.parse(scm.split('\n')[2]);

    // Collect all component names from SCM
    const scmNames = new Set();
    function flatten(comp) {
      scmNames.add(comp.$Name);
      if (comp.$Components) comp.$Components.forEach(flatten);
    }
    flatten(json.Properties);

    // Extract all instance_name references from BKY
    const instanceRefs = [...bky.matchAll(/instance_name="([^"]+)"/g)].map(m => m[1]);
    const selectorRefs = [...bky.matchAll(/<field name="COMPONENT_SELECTOR">([^<]+)<\/field>/g)].map(m => m[1]);

    const allRefs = new Set([...instanceRefs, ...selectorRefs]);
    for (const ref of allRefs) {
      expect(scmNames.has(ref), `BKY references "${ref}" but it's not in the SCM. SCM has: ${[...scmNames].join(', ')}`).toBe(true);
    }
  });

  it('raw SCM output is valid single-line JSON', () => {
    const { results } = simulateExport();
    const scm = results[0].scm;
    const lines = scm.split('\n');
    expect(lines).toHaveLength(4); // #|, $JSON, {json}, |#
    expect(lines[0]).toBe('#|');
    expect(lines[1]).toBe('$JSON');
    expect(lines[3]).toBe('|#');
    // The JSON must be a single line (MIT requirement)
    expect(lines[2]).not.toContain('\n');
    JSON.parse(lines[2]); // should not throw
  });
});
