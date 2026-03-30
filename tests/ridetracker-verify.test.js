/**
 * Deep verification of the Ride Tracker template.
 * Tests the full pipeline: component tree → code parse → SCM → BKY
 */
import { describe, it, expect } from 'vitest';
import { TEMPLATES } from '../src/lib/templates';
import { generateScm } from '../src/lib/scmGenerator';
import { generateBky } from '../src/lib/bkyGenerator';
import { parseCode } from '../src/lib/codeParser';
import { COMPONENTS } from '../src/lib/componentDefs';

const tmpl = TEMPLATES.find(t => t.id === 'ridetracker');
const screen = tmpl.screens[0];

// ── Helpers ──

function collectAll(comps, path = '') {
  const result = [];
  for (const c of comps) {
    const loc = path ? `${path} > ${c.$Name}` : c.$Name;
    result.push({ ...c, _path: loc });
    if (c.children && c.children.length > 0) {
      result.push(...collectAll(c.children, loc));
    }
  }
  return result;
}

function flattenScm(comp) {
  const result = [comp];
  if (comp.$Components) {
    for (const child of comp.$Components) {
      result.push(...flattenScm(child));
    }
  }
  return result;
}

const allComps = collectAll(screen.components);

// ── Tests ──

describe('Ride Tracker Template', () => {

  describe('Component tree', () => {
    it('all component types exist in the COMPONENTS catalog', () => {
      for (const c of allComps) {
        expect(COMPONENTS[c.$Type], `Unknown type "${c.$Type}" at ${c._path}`).toBeTruthy();
      }
    });

    it('all UUIDs are unique', () => {
      const uuids = allComps.map(c => c.Uuid);
      expect(new Set(uuids).size).toBe(uuids.length);
    });

    it('has expected top-level structure', () => {
      const topTypes = screen.components.map(c => c.$Type);
      expect(topTypes).toContain('VerticalArrangement');
      expect(topTypes).toContain('LocationSensor');
      expect(topTypes).toContain('FirebaseDB');
      expect(topTypes).toContain('Clock');
      expect(topTypes).toContain('Notifier');
    });

    it('has both customer and driver panels', () => {
      const names = allComps.map(c => c.$Name);
      expect(names).toContain('CustomerPanel');
      expect(names).toContain('DriverPanel');
    });

    it('has maps with markers', () => {
      const maps = allComps.filter(c => c.$Type === 'Map');
      expect(maps.length).toBe(2);
      const markers = allComps.filter(c => c.$Type === 'Marker');
      expect(markers.length).toBe(4);
    });

    it('driver panel starts hidden', () => {
      const dp = allComps.find(c => c.$Name === 'DriverPanel');
      expect(dp.properties.Visible).toBe('False');
    });
  });

  describe('Code parsing', () => {
    it('parses with zero errors', () => {
      const { ast, errors } = parseCode(screen.code);
      expect(errors).toEqual([]);
      expect(ast.length).toBeGreaterThan(0);
    });

    it('has global variable declarations', () => {
      const { ast } = parseCode(screen.code);
      const globals = ast.filter(n => n.type === 'var_declaration');
      const names = globals.map(g => g.name);
      expect(names).toContain('role');
      expect(names).toContain('rideStatus');
    });

    it('has event handlers for all interactive components', () => {
      const { ast } = parseCode(screen.code);
      const events = ast.filter(n => n.type === 'event_handler');
      const eventKeys = events.map(e => `${e.component}.${e.event}`);

      // Role switching
      expect(eventKeys).toContain('CustomerBtn.Click');
      expect(eventKeys).toContain('DriverBtn.Click');

      // Customer actions
      expect(eventKeys).toContain('BookBtn.Click');
      expect(eventKeys).toContain('CancelBtn.Click');

      // Driver actions
      expect(eventKeys).toContain('AcceptBtn.Click');
      expect(eventKeys).toContain('RejectBtn.Click');
      expect(eventKeys).toContain('CompleteBtn.Click');

      // GPS and Firebase
      expect(eventKeys).toContain('LocationSensor1.LocationChanged');
      expect(eventKeys).toContain('Clock1.Timer');
      expect(eventKeys).toContain('FirebaseDB1.DataChanged');
      expect(eventKeys).toContain('FirebaseDB1.GotValue');
    });

    it('FirebaseDB events have correct parameters', () => {
      const { ast } = parseCode(screen.code);
      const dataChanged = ast.find(n => n.type === 'event_handler' && n.component === 'FirebaseDB1' && n.event === 'DataChanged');
      expect(dataChanged.params).toEqual(['tag', 'value']);

      const gotValue = ast.find(n => n.type === 'event_handler' && n.component === 'FirebaseDB1' && n.event === 'GotValue');
      expect(gotValue.params).toEqual(['tag', 'value']);
    });

    it('LocationChanged has correct parameters', () => {
      const { ast } = parseCode(screen.code);
      const locChanged = ast.find(n => n.type === 'event_handler' && n.component === 'LocationSensor1' && n.event === 'LocationChanged');
      expect(locChanged.params).toEqual(['latitude', 'longitude', 'altitude', 'speed']);
    });

    it('all component references in code match template components', () => {
      const { ast } = parseCode(screen.code);
      const compNames = new Set(allComps.map(c => c.$Name));
      compNames.add('Screen1');

      // Extract all component refs from event handlers and statements
      const refs = new Set();
      function walk(node) {
        if (!node || typeof node !== 'object') return;
        if (node.component) refs.add(node.component);
        for (const val of Object.values(node)) {
          if (Array.isArray(val)) val.forEach(walk);
          else if (typeof val === 'object') walk(val);
        }
      }
      ast.forEach(walk);

      for (const ref of refs) {
        expect(compNames.has(ref), `Code references "${ref}" which is not in the component tree`).toBe(true);
      }
    });
  });

  describe('SCM generation', () => {
    it('generates valid SCM with correct wrapper', () => {
      const scm = generateScm(screen, 'RideTracker');
      const lines = scm.split('\n');
      expect(lines[0]).toBe('#|');
      expect(lines[1]).toBe('$JSON');
      expect(lines[lines.length - 1]).toBe('|#');

      const json = JSON.parse(lines[2]);
      expect(json.authURL).toEqual(['ai2.appinventor.mit.edu']);
      expect(json.YaVersion).toBe('233');
      expect(json.Properties.$Type).toBe('Form');
    });

    it('all components have valid $Version numbers', () => {
      const scm = generateScm(screen, 'RideTracker');
      const json = JSON.parse(scm.split('\n')[2]);
      const all = flattenScm(json.Properties);

      for (const comp of all) {
        expect(comp.$Version, `${comp.$Name} missing $Version`).toBeTruthy();
        expect(comp.$Version).toMatch(/^\d+$/);
      }
    });

    it('all arrangements have BackgroundColor (iOS fix)', () => {
      const scm = generateScm(screen, 'RideTracker');
      const json = JSON.parse(scm.split('\n')[2]);
      const all = flattenScm(json.Properties);
      const arrangements = all.filter(c =>
        ['VerticalArrangement', 'HorizontalArrangement'].includes(c.$Type)
      );

      for (const arr of arrangements) {
        expect(arr.BackgroundColor, `${arr.$Name} missing BackgroundColor`).toBeTruthy();
      }
    });

    it('maps and markers are properly nested', () => {
      const scm = generateScm(screen, 'RideTracker');
      const json = JSON.parse(scm.split('\n')[2]);
      const all = flattenScm(json.Properties);
      const maps = all.filter(c => c.$Type === 'Map');

      expect(maps.length).toBe(2);
      for (const map of maps) {
        expect(map.$Components, `${map.$Name} should have child markers`).toBeTruthy();
        const markerChildren = map.$Components.filter(c => c.$Type === 'Marker');
        expect(markerChildren.length).toBe(2);
      }
    });
  });

  describe('BKY generation', () => {
    it('generates valid Blockly XML', () => {
      const bky = generateBky(screen);
      expect(bky).toMatch(/^<xml xmlns="https:\/\/developers\.google\.com\/blockly\/xml">/);
      expect(bky).toMatch(/<\/xml>$/);
    });

    it('contains all expected block types', () => {
      const bky = generateBky(screen);
      expect(bky).toContain('component_event');
      expect(bky).toContain('component_set_get');
      expect(bky).toContain('component_method');
      expect(bky).toContain('global_declaration');
      expect(bky).toContain('controls_if');
      expect(bky).toContain('text_join');
      expect(bky).toContain('lexical_variable_set');
      expect(bky).toContain('lexical_variable_get');
    });

    it('all mutations have correct xmlns', () => {
      const bky = generateBky(screen);
      const mutations = bky.match(/<mutation [^>]*>/g) || [];
      for (const m of mutations) {
        expect(m).toContain('xmlns="http://www.w3.org/1999/xhtml"');
      }
    });

    it('event params appear in mutation', () => {
      const bky = generateBky(screen);
      // DataChanged should have tag and value params
      expect(bky).toContain('event_name="DataChanged"');
      expect(bky).toContain('<eventparam name="tag"/>');
      expect(bky).toContain('<eventparam name="value"/>');

      // LocationChanged should have lat/lng/alt/speed
      expect(bky).toContain('event_name="LocationChanged"');
      expect(bky).toContain('<eventparam name="latitude"/>');
      expect(bky).toContain('<eventparam name="longitude"/>');
    });

    it('FirebaseDB component type resolves correctly', () => {
      const bky = generateBky(screen);
      expect(bky).toContain('component_type="FirebaseDB"');
      expect(bky).toContain('instance_name="FirebaseDB1"');
    });

    it('Marker and Map component types resolve correctly', () => {
      const bky = generateBky(screen);
      expect(bky).toContain('component_type="Marker"');
      expect(bky).toContain('component_type="Map"');
    });
  });
});
