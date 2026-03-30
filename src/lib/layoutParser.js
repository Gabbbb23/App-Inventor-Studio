// layoutParser.js
// Parses a simple markup syntax for defining App Inventor UI layouts.
// Users write a screen { } block in the code editor; this module extracts it,
// parses the component tree, and returns both the tree and the remaining code.

import { COMPONENTS, generateUuid } from './componentDefs';

// ---------------------------------------------------------------------------
// Type aliases: short names -> canonical App Inventor component types
// ---------------------------------------------------------------------------

const TYPE_ALIASES = {
  'V': 'VerticalArrangement',
  'Vertical': 'VerticalArrangement',
  'H': 'HorizontalArrangement',
  'Horizontal': 'HorizontalArrangement',
  'VScroll': 'VerticalScrollArrangement',
  'HScroll': 'HorizontalScrollArrangement',
  'Table': 'TableArrangement',
  'Text': 'TextBox',
  'Password': 'PasswordTextBox',
  'List': 'ListView',
  'Picker': 'ListPicker',
  'DB': 'TinyDB',
  'WebDB': 'TinyWebDB',
  'Firebase': 'FirebaseDB',
};

// Component types that may contain children.
const LAYOUT_TYPES = new Set([
  'VerticalArrangement', 'HorizontalArrangement',
  'VerticalScrollArrangement', 'HorizontalScrollArrangement',
  'TableArrangement',
  'Map',
]);

// ---------------------------------------------------------------------------
// Token types produced by the tokenizer
// ---------------------------------------------------------------------------

const T = {
  IDENT:    'IDENT',
  STRING:   'STRING',
  NUMBER:   'NUMBER',
  HEX:      'HEX',       // #RRGGBB
  LBRACE:   'LBRACE',    // {
  RBRACE:   'RBRACE',    // }
  LPAREN:   'LPAREN',    // (
  RPAREN:   'RPAREN',    // )
  EQUALS:   'EQUALS',    // =
  COMMA:    'COMMA',     // ,
  EOF:      'EOF',
};

// ---------------------------------------------------------------------------
// findScreenBlock  -  locate the outermost  screen { ... }  in the source
// ---------------------------------------------------------------------------

function findScreenBlock(code) {
  // Match the word "screen" followed (possibly with whitespace / comments)
  // by an opening brace.  We do NOT use a single regex for the whole block
  // because we need proper brace-matching for nested braces.
  const screenRe = /\bscreen\s*\{/g;
  let m;
  while ((m = screenRe.exec(code)) !== null) {
    const openIndex = m.index + m[0].length - 1; // index of the '{'
    // Walk forward counting braces (respect strings and comments).
    let depth = 1;
    let i = openIndex + 1;
    let inString = false;
    while (i < code.length && depth > 0) {
      const ch = code[i];
      if (inString) {
        if (ch === '\\') { i += 2; continue; }
        if (ch === '"') { inString = false; }
        i++;
        continue;
      }
      // Line comment – skip to end of line
      if (ch === '/' && i + 1 < code.length && code[i + 1] === '/') {
        while (i < code.length && code[i] !== '\n') i++;
        continue;
      }
      if (ch === '"') { inString = true; i++; continue; }
      if (ch === '{') depth++;
      if (ch === '}') depth--;
      i++;
    }
    if (depth === 0) {
      return {
        content: code.substring(openIndex + 1, i - 1), // inner content
        startIndex: m.index,
        endIndex: i,
      };
    }
    // Unbalanced – try the next match.
  }
  return null;
}

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

function tokenize(source) {
  const tokens = [];
  let pos = 0;
  const len = source.length;

  while (pos < len) {
    // Skip whitespace
    if (/\s/.test(source[pos])) { pos++; continue; }

    // Line comment
    if (source[pos] === '/' && pos + 1 < len && source[pos + 1] === '/') {
      while (pos < len && source[pos] !== '\n') pos++;
      continue;
    }

    // Single-char tokens
    const ch = source[pos];
    if (ch === '{') { tokens.push({ type: T.LBRACE, value: '{', pos }); pos++; continue; }
    if (ch === '}') { tokens.push({ type: T.RBRACE, value: '}', pos }); pos++; continue; }
    if (ch === '(') { tokens.push({ type: T.LPAREN, value: '(', pos }); pos++; continue; }
    if (ch === ')') { tokens.push({ type: T.RPAREN, value: ')', pos }); pos++; continue; }
    if (ch === '=') { tokens.push({ type: T.EQUALS, value: '=', pos }); pos++; continue; }
    if (ch === ',') { tokens.push({ type: T.COMMA, value: ',', pos }); pos++; continue; }

    // Hex color literal  #RRGGBB (must come before NUMBER check because of '-')
    if (ch === '#') {
      const hexMatch = source.substring(pos).match(/^#([0-9A-Fa-f]{6})\b/);
      if (hexMatch) {
        tokens.push({ type: T.HEX, value: hexMatch[0], pos });
        pos += hexMatch[0].length;
        continue;
      }
      // Not a valid hex color – skip the character to avoid infinite loop
      pos++;
      continue;
    }

    // Number (including negative, and floats)
    if (/[0-9]/.test(ch) || (ch === '-' && pos + 1 < len && /[0-9]/.test(source[pos + 1]))) {
      const numMatch = source.substring(pos).match(/^-?[0-9]+(\.[0-9]+)?/);
      if (numMatch) {
        tokens.push({ type: T.NUMBER, value: numMatch[0], pos });
        pos += numMatch[0].length;
        continue;
      }
    }

    // String literal (double-quoted, with escape support)
    if (ch === '"') {
      let str = '';
      pos++; // skip opening quote
      while (pos < len && source[pos] !== '"') {
        if (source[pos] === '\\' && pos + 1 < len) {
          const esc = source[pos + 1];
          if (esc === '"')       { str += '"'; pos += 2; continue; }
          else if (esc === '\\') { str += '\\'; pos += 2; continue; }
          else if (esc === 'n')  { str += '\n'; pos += 2; continue; }
          else if (esc === 't')  { str += '\t'; pos += 2; continue; }
          else                   { str += esc; pos += 2; continue; }
        }
        str += source[pos];
        pos++;
      }
      pos++; // skip closing quote (or end of input)
      tokens.push({ type: T.STRING, value: str, pos });
      continue;
    }

    // Identifier (letters, digits, underscores – must start with letter or _)
    if (/[A-Za-z_]/.test(ch)) {
      const start = pos;
      while (pos < len && /[A-Za-z0-9_]/.test(source[pos])) pos++;
      tokens.push({ type: T.IDENT, value: source.substring(start, pos), pos: start });
      continue;
    }

    // Unknown character – skip to avoid infinite loop
    pos++;
  }

  tokens.push({ type: T.EOF, value: '', pos });
  return tokens;
}

// ---------------------------------------------------------------------------
// Token stream helpers
// ---------------------------------------------------------------------------

class TokenStream {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }
  peek() { return this.tokens[this.pos] || { type: T.EOF, value: '' }; }
  next() { return this.tokens[this.pos++] || { type: T.EOF, value: '' }; }
  expect(type) {
    const tok = this.next();
    if (tok.type !== type) {
      throw new ParseError(`Expected ${type} but got ${tok.type} ("${tok.value}")`, tok.pos);
    }
    return tok;
  }
  check(type) { return this.peek().type === type; }
  match(type) {
    if (this.check(type)) { return this.next(); }
    return null;
  }
  atEnd() { return this.peek().type === T.EOF; }
}

class ParseError extends Error {
  constructor(message, charPos) {
    super(message);
    this.charPos = charPos;
  }
}

// ---------------------------------------------------------------------------
// Resolve a written type name to its canonical App Inventor type.
// ---------------------------------------------------------------------------

function resolveType(name) {
  if (TYPE_ALIASES[name]) return TYPE_ALIASES[name];
  if (COMPONENTS[name]) return name;
  // WebViewer special shorthand – the alias map already handles "Web" if you
  // want it to map to Web.  By default we leave "Web" unmapped so it resolves
  // to the Web connectivity component.  "WebViewer" must be spelled out.
  return name; // unknown type – return as-is; caller will flag an error if needed
}

// ---------------------------------------------------------------------------
// Parse the argument list inside parentheses.
// Returns { properties, customName }.
// ---------------------------------------------------------------------------

function parseArgs(stream, resolvedType) {
  const properties = {};
  let customName = null;
  const isLayout = LAYOUT_TYPES.has(resolvedType);
  let fillCount = 0; // Track positional fills: 1st = Width, 2nd = Height

  // helper: convert #RRGGBB to &HFFRRGGBB
  function hexToAI(hex) {
    return '&HFF' + hex.slice(1).toUpperCase();
  }

  // helper: set alignment properties depending on whether this is a layout
  function setAlignment(direction, value) {
    if (direction === 'center') {
      if (isLayout) {
        properties['AlignHorizontal'] = '3';
      } else {
        properties['TextAlignment'] = '1';
      }
    } else if (direction === 'centerV') {
      if (isLayout) {
        properties['AlignVertical'] = '2';
      }
    } else if (direction === 'left') {
      if (isLayout) {
        properties['AlignHorizontal'] = '1';
      } else {
        properties['TextAlignment'] = '0';
      }
    } else if (direction === 'right') {
      if (isLayout) {
        properties['AlignHorizontal'] = '2';
      } else {
        properties['TextAlignment'] = '2';
      }
    }
  }

  while (!stream.check(T.RPAREN) && !stream.atEnd()) {
    // Skip commas between arguments
    stream.match(T.COMMA);
    if (stream.check(T.RPAREN)) break;

    const tok = stream.peek();

    // --- String literal (first bare string becomes Text) ---
    if (tok.type === T.STRING) {
      stream.next();
      // Check for "as Name" immediately after the string
      if (stream.check(T.IDENT) && stream.peek().value === 'as') {
        stream.next(); // consume 'as'
        const nameTok = stream.expect(T.IDENT);
        customName = nameTok.value;
      }
      // Only set Text if not already set
      if (!('Text' in properties)) {
        properties['Text'] = tok.value;
      }
      continue;
    }

    // --- Identifier-based arguments ---
    if (tok.type === T.IDENT) {
      const ident = tok.value;

      // "as" keyword for custom naming (standalone, not after a string)
      if (ident === 'as') {
        stream.next();
        const nameTok = stream.expect(T.IDENT);
        customName = nameTok.value;
        continue;
      }

      // Check for key=value
      // We need to lookahead: IDENT EQUALS ...
      if (stream.tokens[stream.pos + 1] && stream.tokens[stream.pos + 1].type === T.EQUALS) {
        stream.next(); // consume the IDENT (key)
        stream.next(); // consume '='

        const key = ident;
        const valTok = stream.peek();

        // Shorthand keys
        if (key === 'w') {
          const v = stream.next();
          properties['Width'] = v.value;
          continue;
        }
        if (key === 'h') {
          const v = stream.next();
          properties['Height'] = v.value;
          continue;
        }
        if (key === 'bg') {
          const v = stream.next();
          if (v.type === T.HEX) {
            properties['BackgroundColor'] = hexToAI(v.value);
          } else {
            properties['BackgroundColor'] = v.value;
          }
          continue;
        }
        if (key === 'color') {
          const v = stream.next();
          if (v.type === T.HEX) {
            properties['TextColor'] = hexToAI(v.value);
          } else {
            properties['TextColor'] = v.value;
          }
          continue;
        }
        if (key === 'fontSize') {
          const v = stream.next();
          // Ensure it has a decimal point for App Inventor
          let fs = v.value;
          if (!fs.includes('.')) fs += '.0';
          properties['FontSize'] = fs;
          continue;
        }
        if (key === 'hint') {
          const v = stream.next();
          properties['Hint'] = v.value;
          continue;
        }
        if (key === 'enabled') {
          const v = stream.next();
          properties['Enabled'] = v.value === 'false' ? 'False' : 'True';
          continue;
        }
        if (key === 'visible') {
          const v = stream.next();
          properties['Visible'] = v.value === 'false' ? 'False' : 'True';
          continue;
        }

        // Generic key=value  (direct property assignment)
        const v = stream.next();
        if (v.type === T.HEX) {
          properties[key] = hexToAI(v.value);
        } else {
          properties[key] = v.value;
        }
        continue;
      }

      // Boolean / shorthand flags (single identifier, no '=' after it)
      stream.next(); // consume the identifier

      switch (ident) {
        case 'fill':
          // First 'fill' sets Width, second sets Height
          fillCount++;
          if (fillCount === 1) {
            properties['Width'] = '-2';
          } else {
            properties['Height'] = '-2';
          }
          break;
        case 'fillW':
          properties['Width'] = '-2';
          break;
        case 'fillH':
          properties['Height'] = '-2';
          break;
        case 'auto':
          properties['Width'] = '-1';
          break;
        case 'autoH':
          properties['Height'] = '-1';
          break;
        case 'bold':
          properties['FontBold'] = 'True';
          break;
        case 'italic':
          properties['FontItalic'] = 'True';
          break;
        case 'center':
          setAlignment('center');
          break;
        case 'centerV':
          setAlignment('centerV');
          break;
        case 'left':
          setAlignment('left');
          break;
        case 'right':
          setAlignment('right');
          break;
        case 'checked':
          properties['Checked'] = 'True';
          break;
        case 'multiline':
          properties['MultiLine'] = 'True';
          break;
        case 'numbersOnly':
          properties['NumbersOnly'] = 'True';
          break;
        case 'true':
        case 'True':
          // Stray boolean literal – ignore (shouldn't happen in well-formed input)
          break;
        case 'false':
        case 'False':
          break;
        default:
          // Unknown bare identifier – treat as a boolean flag set to True
          // This allows forward-compatible extensibility (e.g., `readOnly`)
          properties[ident] = 'True';
          break;
      }
      continue;
    }

    // --- Number literal in a bare position (rare but handle it) ---
    if (tok.type === T.NUMBER) {
      stream.next();
      // A bare number doesn't map to a known shorthand; skip it.
      continue;
    }

    // --- Hex color in a bare position ---
    if (tok.type === T.HEX) {
      stream.next();
      // Bare hex color – assume BackgroundColor if not set
      if (!('BackgroundColor' in properties)) {
        properties['BackgroundColor'] = hexToAI(tok.value);
      }
      continue;
    }

    // Anything else – skip to avoid infinite loop
    stream.next();
  }

  return { properties, customName };
}

// ---------------------------------------------------------------------------
// Generate a unique component name for the given type.
// ---------------------------------------------------------------------------

function autoName(resolvedType, nameCounters) {
  // Use the base type name (e.g. "Button", "VerticalArrangement")
  const base = resolvedType;
  if (!(base in nameCounters)) {
    nameCounters[base] = 0;
  }
  nameCounters[base]++;
  return base + nameCounters[base];
}

// ---------------------------------------------------------------------------
// Parse a single component:   TypeName(args) { children }
// ---------------------------------------------------------------------------

function parseComponent(stream, nameCounters, errors) {
  // Expect an identifier (the type name)
  const typeTok = stream.expect(T.IDENT);
  const rawType = typeTok.value;
  const resolvedType = resolveType(rawType);

  // Check that the component type is known
  if (!COMPONENTS[resolvedType]) {
    errors.push({
      line: charPosToLine(typeTok.pos),
      message: `Unknown component type: "${rawType}" (resolved to "${resolvedType}")`,
    });
  }

  // Parse arguments if present
  let properties = {};
  let customName = null;

  if (stream.match(T.LPAREN)) {
    const args = parseArgs(stream, resolvedType);
    properties = args.properties;
    customName = args.customName;
    stream.expect(T.RPAREN);
  }

  // Determine the component name
  const $Name = customName || autoName(resolvedType, nameCounters);

  // Parse children if this is a layout type and we see '{'
  const children = [];
  if (stream.match(T.LBRACE)) {
    while (!stream.check(T.RBRACE) && !stream.atEnd()) {
      try {
        const child = parseComponent(stream, nameCounters, errors);
        if (child) children.push(child);
      } catch (e) {
        // Error recovery: record the error and skip tokens until we can
        // resume (next identifier at the same brace depth, or closing brace).
        errors.push({
          line: e.charPos !== undefined ? charPosToLine(e.charPos) : 0,
          message: e.message,
        });
        skipToRecovery(stream);
      }
    }
    stream.match(T.RBRACE); // consume the closing brace
  }

  return {
    $Name,
    $Type: resolvedType,
    Uuid: generateUuid(),
    properties,
    children,
  };
}

// ---------------------------------------------------------------------------
// Parse a list of sibling components (the top-level contents of screen{}).
// ---------------------------------------------------------------------------

function parseComponentList(tokens, nameCounters, errors) {
  const stream = new TokenStream(tokens);
  const components = [];

  while (!stream.atEnd()) {
    try {
      const comp = parseComponent(stream, nameCounters, errors);
      if (comp) components.push(comp);
    } catch (e) {
      errors.push({
        line: e.charPos !== undefined ? charPosToLine(e.charPos) : 0,
        message: e.message,
      });
      skipToRecovery(stream);
    }
  }

  return components;
}

// ---------------------------------------------------------------------------
// Error recovery: skip tokens until we reach a state where we can try
// parsing the next component (an IDENT that could start a component, or
// a closing brace, or EOF).
// ---------------------------------------------------------------------------

function skipToRecovery(stream) {
  while (!stream.atEnd()) {
    const tok = stream.peek();
    // If we see an identifier that could be the start of a new component,
    // stop so the caller can try again.
    if (tok.type === T.IDENT) return;
    // If we hit a closing brace, let the caller handle it.
    if (tok.type === T.RBRACE) return;
    stream.next();
  }
}

// ---------------------------------------------------------------------------
// Utility: approximate a character position to a 1-based line number.
// We store this module-level during a parse call so error messages can
// reference it.  (Set before each parse invocation.)
// ---------------------------------------------------------------------------

let _sourceForLineCalc = '';

function charPosToLine(charPos) {
  if (!_sourceForLineCalc || charPos == null) return 0;
  let line = 1;
  for (let i = 0; i < charPos && i < _sourceForLineCalc.length; i++) {
    if (_sourceForLineCalc[i] === '\n') line++;
  }
  return line;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function parseLayout(code) {
  // 1. Find the screen { ... } block
  const screenMatch = findScreenBlock(code);
  if (!screenMatch) {
    return { components: null, remainingCode: code, errors: [] };
  }

  const { content, startIndex, endIndex } = screenMatch;
  const remainingCode = (
    code.substring(0, startIndex) + code.substring(endIndex)
  ).trim();

  // Store the content for line-number calculation in error messages.
  _sourceForLineCalc = content;

  // 2. Tokenize the screen block content
  const tokens = tokenize(content);

  // 3. Parse tokens into component tree
  const nameCounters = {};
  const errors = [];
  const components = parseComponentList(tokens, nameCounters, errors);

  // Clean up module-level reference
  _sourceForLineCalc = '';

  return { components, remainingCode, errors };
}
