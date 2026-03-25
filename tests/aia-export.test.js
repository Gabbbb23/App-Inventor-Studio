import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { parseLayout } from '../src/lib/layoutParser';
import { generateScm } from '../src/lib/scmGenerator';
import { generateBky } from '../src/lib/bkyGenerator';
import { parseCode } from '../src/lib/codeParser';
import { COMPONENTS } from '../src/lib/componentDefs';

// ─── Helper: build a screen object from layout code + logic code ────────────
function buildScreen(code, name = 'Screen1') {
  const layoutResult = parseLayout(code);
  const screen = {
    name,
    title: name,
    appName: 'TestApp',
    properties: {},
    components: layoutResult.components || [],
    code: layoutResult.remainingCode || code,
  };
  return { screen, layoutErrors: layoutResult.errors };
}

// ─── Helper: parse the SCM JSON from the formatted .scm content ─────────────
function parseScmJson(scmContent) {
  // Format: #|\n$JSON\n{...json...}\n|#
  const lines = scmContent.split('\n');
  expect(lines[0]).toBe('#|');
  expect(lines[1]).toBe('$JSON');
  expect(lines[lines.length - 1]).toBe('|#');
  return JSON.parse(lines[2]);
}

// ─── Helper: validate that a component in the SCM has the right structure ───
function validateScmComponent(comp, path = '') {
  const location = path ? `${path} > ${comp.$Name}` : comp.$Name;
  expect(comp.$Name, `${location}: missing $Name`).toBeTruthy();
  expect(comp.$Type, `${location}: missing $Type`).toBeTruthy();
  expect(comp.$Version, `${location}: missing $Version`).toBeTruthy();
  expect(comp.Uuid, `${location}: missing Uuid`).toBeTruthy();

  // Type must be known
  if (comp.$Type !== 'Form') {
    expect(COMPONENTS[comp.$Type], `${location}: unknown type "${comp.$Type}"`).toBeTruthy();
  }

  // Version must be a string of digits
  expect(comp.$Version).toMatch(/^\d+$/);

  // Recurse into children
  if (comp.$Components) {
    for (const child of comp.$Components) {
      validateScmComponent(child, location);
    }
  }
}

// ─── Helper: basic XML validation for .bky ──────────────────────────────────
function validateBkyXml(bkyContent) {
  expect(bkyContent).toContain('<xml');
  expect(bkyContent).toContain('</xml>');
  // Check that all opened block tags are closed
  const openBlocks = (bkyContent.match(/<block /g) || []).length;
  const closeBlocks = (bkyContent.match(/<\/block>/g) || []).length;
  expect(openBlocks, 'Mismatched <block> open/close tags').toBe(closeBlocks);
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYOUT PARSER TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Layout Parser', () => {
  it('parses empty screen block', () => {
    const result = parseLayout('screen { }');
    expect(result.components).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('parses a simple component', () => {
    const result = parseLayout('screen { Button("Click") }');
    expect(result.errors).toEqual([]);
    expect(result.components).toHaveLength(1);
    expect(result.components[0].$Type).toBe('Button');
    expect(result.components[0].properties.Text).toBe('Click');
  });

  it('handles fill,fill setting Width then Height', () => {
    const result = parseLayout('screen { Vertical(fill, fill) { } }');
    expect(result.errors).toEqual([]);
    const v = result.components[0];
    expect(v.$Type).toBe('VerticalArrangement');
    expect(v.properties.Width).toBe('-2');
    expect(v.properties.Height).toBe('-2');
  });

  it('handles type aliases', () => {
    const code = `screen {
      V(fill, fill) { }
      H(fill) { }
      VScroll(fill, fill) { }
      Text(hint="Name")
      Password(hint="Pass")
      DB()
      Picker("Choose")
    }`;
    const result = parseLayout(code);
    expect(result.errors).toEqual([]);
    const types = result.components.map(c => c.$Type);
    expect(types).toEqual([
      'VerticalArrangement',
      'HorizontalArrangement',
      'VerticalScrollArrangement',
      'TextBox',
      'PasswordTextBox',
      'TinyDB',
      'ListPicker',
    ]);
  });

  it('handles color properties correctly', () => {
    const result = parseLayout('screen { Button("Go", bg=#22C55E, color=#FFFFFF) }');
    expect(result.errors).toEqual([]);
    const btn = result.components[0];
    expect(btn.properties.BackgroundColor).toBe('&HFF22C55E');
    expect(btn.properties.TextColor).toBe('&HFFFFFFFF');
  });

  it('handles dimension shorthands', () => {
    const result = parseLayout('screen { Button("Go", fill, h=80, w=120) }');
    const btn = result.components[0];
    // fill sets Width=-2, but w=120 overrides it
    expect(btn.properties.Width).toBe('120');
    expect(btn.properties.Height).toBe('80');
  });

  it('handles boolean flags', () => {
    const result = parseLayout('screen { Label("Title", bold, italic) }');
    const lbl = result.components[0];
    expect(lbl.properties.FontBold).toBe('True');
    expect(lbl.properties.FontItalic).toBe('True');
  });

  it('handles custom naming with "as"', () => {
    const result = parseLayout('screen { Button("Save" as SaveBtn) }');
    expect(result.components[0].$Name).toBe('SaveBtn');
  });

  it('handles nested layouts', () => {
    const code = `screen {
      Vertical(fill, fill) {
        Horizontal(fill, h=50) {
          Label("Title")
        }
        VScroll(fill, fill) {
          Button("Action 1", fill)
          Button("Action 2", fill)
        }
      }
    }`;
    const result = parseLayout(code);
    expect(result.errors).toEqual([]);
    const root = result.components[0];
    expect(root.$Type).toBe('VerticalArrangement');
    expect(root.children).toHaveLength(2);
    expect(root.children[0].$Type).toBe('HorizontalArrangement');
    expect(root.children[0].children).toHaveLength(1);
    expect(root.children[1].$Type).toBe('VerticalScrollArrangement');
    expect(root.children[1].children).toHaveLength(2);
    // VScroll should have fill height
    expect(root.children[1].properties.Height).toBe('-2');
  });

  it('extracts remaining code after screen block', () => {
    const code = `screen { Button("Go") }

when Button1.Click {
  set Label1.Text = "Clicked"
}`;
    const result = parseLayout(code);
    expect(result.components).toHaveLength(1);
    expect(result.remainingCode).toContain('when Button1.Click');
    expect(result.remainingCode).not.toContain('screen');
  });

  it('returns null components when no screen block exists', () => {
    const result = parseLayout('when Button1.Click { set Label1.Text = "Hi" }');
    expect(result.components).toBeNull();
    expect(result.remainingCode).toContain('when Button1.Click');
  });

  it('handles alignment shorthands', () => {
    const result = parseLayout('screen { Horizontal(fill, center, centerV) { } }');
    const h = result.components[0];
    expect(h.properties.AlignHorizontal).toBe('3');
    expect(h.properties.AlignVertical).toBe('2');
  });

  it('auto-generates unique names', () => {
    const code = `screen {
      Button("A")
      Button("B")
      Button("C")
      Label("X")
      Label("Y")
    }`;
    const result = parseLayout(code);
    const names = result.components.map(c => c.$Name);
    expect(names).toEqual(['Button1', 'Button2', 'Button3', 'Label1', 'Label2']);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SCM GENERATOR TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('SCM Generator', () => {
  it('generates valid SCM format', () => {
    const { screen } = buildScreen('screen { Label("Hello") }');
    const scm = generateScm(screen, 'TestApp');
    expect(scm).toMatch(/^#\|\n\$JSON\n.+\n\|#$/);
    const json = parseScmJson(scm);
    expect(json.authURL).toEqual(['ai2.appinventor.mit.edu']);
    expect(json.YaVersion).toBe('233');
    expect(json.Source).toBe('Form');
  });

  it('generates correct Form root', () => {
    const { screen } = buildScreen('screen { }');
    const scm = generateScm(screen, 'TestApp');
    const json = parseScmJson(scm);
    expect(json.Properties.$Type).toBe('Form');
    expect(json.Properties.$Name).toBe('Screen1');
    expect(json.Properties.$Version).toBe('31');
    expect(json.Properties.Uuid).toBe('0');
  });

  it('includes component properties in output', () => {
    const { screen } = buildScreen('screen { Button("Click Me", bg=#FF0000, color=#FFFFFF, bold) }');
    const scm = generateScm(screen, 'TestApp');
    const json = parseScmJson(scm);
    const btn = json.Properties.$Components[0];
    expect(btn.$Type).toBe('Button');
    expect(btn.Text).toBe('Click Me');
    expect(btn.BackgroundColor).toBe('&HFFFF0000');
    expect(btn.TextColor).toBe('&HFFFFFFFF');
    expect(btn.FontBold).toBe('True');
  });

  it('preserves nested component hierarchy', () => {
    const code = `screen {
      Vertical(fill, fill) {
        Horizontal(fill) {
          Button("A")
          Button("B")
        }
        Label("Footer")
      }
    }`;
    const { screen } = buildScreen(code);
    const scm = generateScm(screen, 'TestApp');
    const json = parseScmJson(scm);
    const vert = json.Properties.$Components[0];
    expect(vert.$Type).toBe('VerticalArrangement');
    expect(vert.$Components).toHaveLength(2);
    expect(vert.$Components[0].$Type).toBe('HorizontalArrangement');
    expect(vert.$Components[0].$Components).toHaveLength(2);
    expect(vert.$Components[1].$Type).toBe('Label');
  });

  it('sets correct version numbers for all component types', () => {
    const code = `screen {
      Button("B")
      Label("L")
      TextBox(hint="T")
      CheckBox("C")
      Slider()
      ListView()
      Notifier()
      TinyDB()
      Clock()
    }`;
    const { screen } = buildScreen(code);
    const scm = generateScm(screen, 'TestApp');
    const json = parseScmJson(scm);
    for (const comp of json.Properties.$Components) {
      validateScmComponent(comp);
    }
  });

  it('validates the full nav+content layout the user tested', () => {
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
    const { screen, layoutErrors } = buildScreen(code);
    expect(layoutErrors).toEqual([]);

    const scm = generateScm(screen, 'TestApp');
    const json = parseScmJson(scm);
    const root = json.Properties.$Components[0];

    // Root Vertical: fill width AND fill height
    expect(root.$Type).toBe('VerticalArrangement');
    expect(root.Width).toBe('-2');
    expect(root.Height).toBe('-2');

    // Header: fill width, height=50, blue bg, vertically centered
    const header = root.$Components[0];
    expect(header.$Type).toBe('HorizontalArrangement');
    expect(header.Width).toBe('-2');
    expect(header.Height).toBe('50');
    expect(header.BackgroundColor).toBe('&HFF3F51B5');
    expect(header.AlignVertical).toBe('2');

    // Header label: white, bold, fontSize 18
    const titleLabel = header.$Components[0];
    expect(titleLabel.Text).toBe('My App');
    expect(titleLabel.TextColor).toBe('&HFFFFFFFF');
    expect(titleLabel.FontBold).toBe('True');
    expect(titleLabel.FontSize).toBe('18.0');

    // VScroll: fill width AND fill height (converted to VerticalArrangement for iOS compat)
    const vscroll = root.$Components[1];
    expect(vscroll.$Type).toBe('VerticalArrangement');
    expect(vscroll.Width).toBe('-2');
    expect(vscroll.Height).toBe('-2');
    expect(vscroll.$Components).toHaveLength(3);

    // Bottom nav: fill width, height=50, centered
    const bottomNav = root.$Components[2];
    expect(bottomNav.$Type).toBe('HorizontalArrangement');
    expect(bottomNav.Width).toBe('-2');
    expect(bottomNav.Height).toBe('50');
    expect(bottomNav.AlignHorizontal).toBe('3');

    // Tab buttons: white text, blue bg
    for (const btn of bottomNav.$Components) {
      expect(btn.$Type).toBe('Button');
      expect(btn.TextColor).toBe('&HFFFFFFFF');
      expect(btn.BackgroundColor).toBe('&HFF3F51B5');
    }
  });

  it('adds explicit white background to arrangements without bg (iOS companion fix)', () => {
    const code = `screen {
      Vertical(fill, fill) {
        Label("Content")
      }
      VScroll(fill, fill) {
        Label("Scroll content")
      }
      Horizontal(fill) {
        Button("A")
      }
    }`;
    const { screen } = buildScreen(code);
    const scm = generateScm(screen, 'TestApp');
    const json = parseScmJson(scm);

    // All arrangements without explicit bg should get white
    const vert = json.Properties.$Components[0];
    expect(vert.BackgroundColor).toBe('&HFFFFFFFF');

    const vscroll = json.Properties.$Components[1];
    expect(vscroll.BackgroundColor).toBe('&HFFFFFFFF');

    const horiz = json.Properties.$Components[2];
    expect(horiz.BackgroundColor).toBe('&HFFFFFFFF');
  });

  it('preserves explicit background colors on arrangements', () => {
    const code = `screen {
      Vertical(fill, fill, bg=#3F51B5) {
        Label("Blue area")
      }
    }`;
    const { screen } = buildScreen(code);
    const scm = generateScm(screen, 'TestApp');
    const json = parseScmJson(scm);

    // Explicit blue should be kept, NOT overwritten with white
    const vert = json.Properties.$Components[0];
    expect(vert.BackgroundColor).toBe('&HFF3F51B5');
  });

  it('adds centered TextAlignment and Shape to buttons', () => {
    const code = `screen { Button("Click") }`;
    const { screen } = buildScreen(code);
    const scm = generateScm(screen, 'TestApp');
    const json = parseScmJson(scm);
    const btn = json.Properties.$Components[0];
    expect(btn.Shape).toBe('0');
    expect(btn.TextAlignment).toBe('1');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BKY GENERATOR TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('BKY Generator', () => {
  it('generates empty XML for no code', () => {
    const screen = { name: 'Screen1', code: '', components: [] };
    const bky = generateBky(screen);
    expect(bky).toContain('<xml');
    expect(bky).toContain('</xml>');
  });

  it('generates event handler blocks', () => {
    const screen = {
      name: 'Screen1',
      code: 'when Button1.Click {\n  set Label1.Text = "Hello"\n}',
      components: [],
    };
    const bky = generateBky(screen);
    validateBkyXml(bky);
    expect(bky).toContain('component_event');
    expect(bky).toContain('event_name="Click"');
    expect(bky).toContain('instance_name="Button1"');
    expect(bky).toContain('component_set_get');
    expect(bky).toContain('set_or_get="set"');
    expect(bky).toContain('property_name="Text"');
  });

  it('generates global variable declarations', () => {
    const screen = {
      name: 'Screen1',
      code: 'var score = 0',
      components: [],
    };
    const bky = generateBky(screen);
    validateBkyXml(bky);
    expect(bky).toContain('global_declaration');
    expect(bky).toContain('>score<');
    expect(bky).toContain('math_number');
  });

  it('generates method calls', () => {
    const screen = {
      name: 'Screen1',
      code: 'when Button1.Click {\n  call Notifier1.ShowAlert("Hi!")\n}',
      components: [],
    };
    const bky = generateBky(screen);
    validateBkyXml(bky);
    expect(bky).toContain('component_method');
    expect(bky).toContain('method_name="ShowAlert"');
    expect(bky).toContain('instance_name="Notifier1"');
  });

  it('generates if/else blocks', () => {
    const screen = {
      name: 'Screen1',
      code: `when Button1.Click {
  if get TextBox1.Text == "yes" {
    set Label1.Text = "Correct"
  } else {
    set Label1.Text = "Wrong"
  }
}`,
      components: [],
    };
    const bky = generateBky(screen);
    validateBkyXml(bky);
    expect(bky).toContain('controls_if');
  });

  it('generates procedure definitions', () => {
    const screen = {
      name: 'Screen1',
      code: 'proc greet(name) {\n  set Label1.Text = name\n}',
      components: [],
    };
    const bky = generateBky(screen);
    validateBkyXml(bky);
    expect(bky).toContain('procedures_defnoreturn');
    expect(bky).toContain('>greet<');
  });

  it('generates function definitions with return', () => {
    const screen = {
      name: 'Screen1',
      code: 'func add(a, b) {\n  return a + b\n}',
      components: [],
    };
    const bky = generateBky(screen);
    validateBkyXml(bky);
    expect(bky).toContain('procedures_defreturn');
  });

  it('generates for-range loops', () => {
    const screen = {
      name: 'Screen1',
      code: 'when Button1.Click {\n  for i in range(1, 10) {\n    set Label1.Text = i\n  }\n}',
      components: [],
    };
    const bky = generateBky(screen);
    validateBkyXml(bky);
    expect(bky).toContain('controls_forRange');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CODE PARSER TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Code Parser', () => {
  it('parses variable declarations', () => {
    const { ast, errors } = parseCode('var x = 0');
    expect(errors).toEqual([]);
    expect(ast).toHaveLength(1);
    expect(ast[0].type).toBe('var_declaration');
    expect(ast[0].name).toBe('x');
  });

  it('parses event handlers', () => {
    const { ast, errors } = parseCode('when Button1.Click {\n  set Label1.Text = "Hi"\n}');
    expect(errors).toEqual([]);
    expect(ast).toHaveLength(1);
    expect(ast[0].type).toBe('event_handler');
    expect(ast[0].component).toBe('Button1');
    expect(ast[0].event).toBe('Click');
  });

  it('parses set property statements', () => {
    const { ast } = parseCode('when Button1.Click {\n  set Label1.Text = "Hello"\n}');
    const body = ast[0].body;
    expect(body).toHaveLength(1);
    expect(body[0].type).toBe('set_property');
    expect(body[0].component).toBe('Label1');
    expect(body[0].property).toBe('Text');
  });

  it('parses get property expressions', () => {
    const { ast } = parseCode('when Button1.Click {\n  set Label1.Text = get TextBox1.Text\n}');
    const setValue = ast[0].body[0].value;
    expect(setValue.type).toBe('get_property');
    expect(setValue.component).toBe('TextBox1');
  });

  it('parses method calls', () => {
    const { ast } = parseCode('when Button1.Click {\n  call Notifier1.ShowAlert("Msg")\n}');
    const stmt = ast[0].body[0];
    expect(stmt.type).toBe('call_method');
    expect(stmt.component).toBe('Notifier1');
    expect(stmt.method).toBe('ShowAlert');
  });

  it('parses if/else', () => {
    const code = `when Button1.Click {
  if x == 1 {
    set Label1.Text = "one"
  } else {
    set Label1.Text = "other"
  }
}`;
    const { ast, errors } = parseCode(code);
    expect(errors).toEqual([]);
    const ifStmt = ast[0].body[0];
    expect(ifStmt.type).toBe('if_statement');
    expect(ifStmt.thenBody).toHaveLength(1);
    expect(ifStmt.elseBody).toHaveLength(1);
  });

  it('parses join expressions', () => {
    const { ast } = parseCode('when Button1.Click {\n  set Label1.Text = join("Hello ", "World")\n}');
    const val = ast[0].body[0].value;
    expect(val.type).toBe('join');
    expect(val.parts).toHaveLength(2);
  });

  it('parses procedure definitions', () => {
    const { ast, errors } = parseCode('proc greet(name) {\n  set Label1.Text = name\n}');
    expect(errors).toEqual([]);
    expect(ast[0].type).toBe('proc_definition');
    expect(ast[0].name).toBe('greet');
    expect(ast[0].params).toEqual(['name']);
  });

  it('parses binary operations', () => {
    const { ast } = parseCode('var x = 1 + 2 * 3');
    const val = ast[0].value;
    expect(val.type).toBe('binary_op');
    expect(val.op).toBe('+');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FULL EXPORT INTEGRATION TEST
// ═══════════════════════════════════════════════════════════════════════════════

describe('Full Export Integration', () => {
  it('generates valid SCM + BKY for a complete app', () => {
    const code = `screen {
  Vertical(fill, fill) {
    Label("Counter" as TitleLabel, fontSize=24, bold, color=#3F51B5)
    Label("0" as CountLabel, fontSize=48)
    Horizontal(fill, center) {
      Button("-" as MinusBtn, w=100, bg=#EF4444, color=#FFFFFF)
      Button("+" as PlusBtn, w=100, bg=#22C55E, color=#FFFFFF)
    }
  }
}

var count = 0

when PlusBtn.Click {
  count = count + 1
  set CountLabel.Text = count
}

when MinusBtn.Click {
  count = count - 1
  set CountLabel.Text = count
}`;

    const { screen, layoutErrors } = buildScreen(code);
    expect(layoutErrors).toEqual([]);

    // Validate SCM
    const scm = generateScm(screen, 'CounterApp');
    const json = parseScmJson(scm);
    validateScmComponent(json.Properties);
    expect(json.Properties.$Components).toHaveLength(1); // root Vertical
    const vert = json.Properties.$Components[0];
    expect(vert.$Components).toHaveLength(3); // TitleLabel, CountLabel, Horizontal

    // Custom names should be used
    expect(vert.$Components[0].$Name).toBe('TitleLabel');
    expect(vert.$Components[1].$Name).toBe('CountLabel');
    const hLayout = vert.$Components[2];
    expect(hLayout.$Components[0].$Name).toBe('MinusBtn');
    expect(hLayout.$Components[1].$Name).toBe('PlusBtn');

    // Validate BKY
    const bky = generateBky(screen);
    validateBkyXml(bky);
    // Should have: global_declaration for count, 2 event handlers
    expect(bky).toContain('global_declaration');
    expect((bky.match(/component_event/g) || []).length).toBeGreaterThanOrEqual(2);
    expect(bky).toContain('instance_name="PlusBtn"');
    expect(bky).toContain('instance_name="MinusBtn"');
  });
});
