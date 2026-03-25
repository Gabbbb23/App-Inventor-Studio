// codeParser.js — Parses a simple scripting language into an AST
// for compilation to MIT App Inventor .bky XML.

// ============================================================
// Token types
// ============================================================
const TokenType = {
  // Literals
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  BOOLEAN: 'BOOLEAN',
  IDENTIFIER: 'IDENTIFIER',

  // Keywords
  WHEN: 'WHEN',
  VAR: 'VAR',
  IF: 'IF',
  ELSE: 'ELSE',
  FOR: 'FOR',
  FOREACH: 'FOREACH',
  IN: 'IN',
  RANGE: 'RANGE',
  WHILE: 'WHILE',
  PROC: 'PROC',
  FUNC: 'FUNC',
  RETURN: 'RETURN',
  SET: 'SET',
  GET: 'GET',
  CALL: 'CALL',
  JOIN: 'JOIN',
  NOT: 'NOT',
  AND: 'AND',
  OR: 'OR',
  TRUE: 'TRUE',
  FALSE: 'FALSE',

  // Operators
  PLUS: 'PLUS',
  MINUS: 'MINUS',
  STAR: 'STAR',
  SLASH: 'SLASH',
  EQ_EQ: 'EQ_EQ',
  BANG_EQ: 'BANG_EQ',
  LT: 'LT',
  GT: 'GT',
  LT_EQ: 'LT_EQ',
  GT_EQ: 'GT_EQ',
  EQ: 'EQ',
  DOT: 'DOT',
  COMMA: 'COMMA',

  // Grouping
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  LBRACKET: 'LBRACKET',
  RBRACKET: 'RBRACKET',
  LBRACE: 'LBRACE',
  RBRACE: 'RBRACE',

  // Special
  EOF: 'EOF',
};

const KEYWORDS = {
  when: TokenType.WHEN,
  var: TokenType.VAR,
  if: TokenType.IF,
  else: TokenType.ELSE,
  for: TokenType.FOR,
  foreach: TokenType.FOREACH,
  in: TokenType.IN,
  range: TokenType.RANGE,
  while: TokenType.WHILE,
  proc: TokenType.PROC,
  func: TokenType.FUNC,
  return: TokenType.RETURN,
  set: TokenType.SET,
  get: TokenType.GET,
  call: TokenType.CALL,
  join: TokenType.JOIN,
  not: TokenType.NOT,
  and: TokenType.AND,
  or: TokenType.OR,
  true: TokenType.TRUE,
  false: TokenType.FALSE,
};

// ============================================================
// Tokenizer
// ============================================================
class Token {
  constructor(type, value, line) {
    this.type = type;
    this.value = value;
    this.line = line;
  }
}

function tokenize(source) {
  const tokens = [];
  const errors = [];
  let pos = 0;
  let line = 1;

  while (pos < source.length) {
    const ch = source[pos];

    // Newlines
    if (ch === '\n') {
      line++;
      pos++;
      continue;
    }

    // Whitespace (except newline)
    if (ch === ' ' || ch === '\t' || ch === '\r') {
      pos++;
      continue;
    }

    // Line comments
    if (ch === '/' && pos + 1 < source.length && source[pos + 1] === '/') {
      pos += 2;
      while (pos < source.length && source[pos] !== '\n') {
        pos++;
      }
      continue;
    }

    // String literals
    if (ch === '"') {
      const startLine = line;
      pos++; // skip opening quote
      let str = '';
      let closed = false;
      while (pos < source.length) {
        if (source[pos] === '\\' && pos + 1 < source.length) {
          const next = source[pos + 1];
          if (next === '"') {
            str += '"';
            pos += 2;
          } else if (next === 'n') {
            str += '\n';
            pos += 2;
          } else if (next === 't') {
            str += '\t';
            pos += 2;
          } else if (next === '\\') {
            str += '\\';
            pos += 2;
          } else {
            str += next;
            pos += 2;
          }
        } else if (source[pos] === '"') {
          closed = true;
          pos++; // skip closing quote
          break;
        } else if (source[pos] === '\n') {
          line++;
          str += '\n';
          pos++;
        } else {
          str += source[pos];
          pos++;
        }
      }
      if (!closed) {
        errors.push({ line: startLine, message: 'Unterminated string literal' });
      }
      tokens.push(new Token(TokenType.STRING, str, startLine));
      continue;
    }

    // Number literals
    if (isDigit(ch) || (ch === '.' && pos + 1 < source.length && isDigit(source[pos + 1]))) {
      const startLine = line;
      let num = '';
      let hasDot = false;
      while (pos < source.length && (isDigit(source[pos]) || (source[pos] === '.' && !hasDot))) {
        if (source[pos] === '.') {
          // Check if this dot is part of a number or an identifier access
          // If the next char after the dot is not a digit, it's a member access
          if (pos + 1 < source.length && isDigit(source[pos + 1])) {
            hasDot = true;
            num += source[pos];
            pos++;
          } else {
            break;
          }
        } else {
          num += source[pos];
          pos++;
        }
      }
      tokens.push(new Token(TokenType.NUMBER, parseFloat(num), startLine));
      continue;
    }

    // Identifiers and keywords
    if (isAlpha(ch) || ch === '_') {
      const startLine = line;
      let ident = '';
      while (pos < source.length && (isAlphaNumeric(source[pos]) || source[pos] === '_')) {
        ident += source[pos];
        pos++;
      }
      const lower = ident.toLowerCase();
      if (KEYWORDS[lower] !== undefined) {
        if (lower === 'true') {
          tokens.push(new Token(TokenType.BOOLEAN, true, startLine));
        } else if (lower === 'false') {
          tokens.push(new Token(TokenType.BOOLEAN, false, startLine));
        } else {
          tokens.push(new Token(KEYWORDS[lower], ident, startLine));
        }
      } else {
        tokens.push(new Token(TokenType.IDENTIFIER, ident, startLine));
      }
      continue;
    }

    // Two-character operators
    if (ch === '=' && pos + 1 < source.length && source[pos + 1] === '=') {
      tokens.push(new Token(TokenType.EQ_EQ, '==', line));
      pos += 2;
      continue;
    }
    if (ch === '!' && pos + 1 < source.length && source[pos + 1] === '=') {
      tokens.push(new Token(TokenType.BANG_EQ, '!=', line));
      pos += 2;
      continue;
    }
    if (ch === '<' && pos + 1 < source.length && source[pos + 1] === '=') {
      tokens.push(new Token(TokenType.LT_EQ, '<=', line));
      pos += 2;
      continue;
    }
    if (ch === '>' && pos + 1 < source.length && source[pos + 1] === '=') {
      tokens.push(new Token(TokenType.GT_EQ, '>=', line));
      pos += 2;
      continue;
    }

    // Single-character tokens
    switch (ch) {
      case '=': tokens.push(new Token(TokenType.EQ, '=', line)); pos++; continue;
      case '+': tokens.push(new Token(TokenType.PLUS, '+', line)); pos++; continue;
      case '-': tokens.push(new Token(TokenType.MINUS, '-', line)); pos++; continue;
      case '*': tokens.push(new Token(TokenType.STAR, '*', line)); pos++; continue;
      case '/': tokens.push(new Token(TokenType.SLASH, '/', line)); pos++; continue;
      case '<': tokens.push(new Token(TokenType.LT, '<', line)); pos++; continue;
      case '>': tokens.push(new Token(TokenType.GT, '>', line)); pos++; continue;
      case '.': tokens.push(new Token(TokenType.DOT, '.', line)); pos++; continue;
      case ',': tokens.push(new Token(TokenType.COMMA, ',', line)); pos++; continue;
      case '(': tokens.push(new Token(TokenType.LPAREN, '(', line)); pos++; continue;
      case ')': tokens.push(new Token(TokenType.RPAREN, ')', line)); pos++; continue;
      case '[': tokens.push(new Token(TokenType.LBRACKET, '[', line)); pos++; continue;
      case ']': tokens.push(new Token(TokenType.RBRACKET, ']', line)); pos++; continue;
      case '{': tokens.push(new Token(TokenType.LBRACE, '{', line)); pos++; continue;
      case '}': tokens.push(new Token(TokenType.RBRACE, '}', line)); pos++; continue;
      default:
        errors.push({ line, message: `Unexpected character: '${ch}'` });
        pos++;
        continue;
    }
  }

  tokens.push(new Token(TokenType.EOF, null, line));
  return { tokens, errors };
}

function isDigit(ch) {
  return ch >= '0' && ch <= '9';
}

function isAlpha(ch) {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
}

function isAlphaNumeric(ch) {
  return isAlpha(ch) || isDigit(ch);
}

// ============================================================
// Parser
// ============================================================
class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
    this.errors = [];
  }

  // --- Helpers ---

  peek() {
    return this.tokens[this.pos];
  }

  advance() {
    const tok = this.tokens[this.pos];
    if (tok.type !== TokenType.EOF) {
      this.pos++;
    }
    return tok;
  }

  check(type) {
    return this.peek().type === type;
  }

  match(...types) {
    for (const type of types) {
      if (this.check(type)) {
        return this.advance();
      }
    }
    return null;
  }

  expect(type, message) {
    if (this.check(type)) {
      return this.advance();
    }
    this.error(message || `Expected ${type}, got ${this.peek().type}`);
    return null;
  }

  error(message) {
    const tok = this.peek();
    this.errors.push({ line: tok.line, message });
  }

  // Synchronize after an error by advancing to the next likely statement boundary
  synchronize() {
    while (!this.check(TokenType.EOF)) {
      const t = this.peek().type;
      if (
        t === TokenType.WHEN ||
        t === TokenType.VAR ||
        t === TokenType.PROC ||
        t === TokenType.FUNC ||
        t === TokenType.RBRACE
      ) {
        return;
      }
      this.advance();
    }
  }

  // --- Top-level parsing ---

  parseProgram() {
    const ast = [];
    while (!this.check(TokenType.EOF)) {
      try {
        const node = this.parseTopLevel();
        if (node) {
          ast.push(node);
        }
      } catch (e) {
        // Record error and try to recover
        if (e.parserError) {
          // Already recorded
        } else {
          this.error(e.message || 'Unexpected parse error');
        }
        this.synchronize();
      }
    }
    return ast;
  }

  parseTopLevel() {
    if (this.check(TokenType.VAR)) {
      return this.parseVarDeclaration();
    }
    if (this.check(TokenType.WHEN)) {
      return this.parseEventHandler();
    }
    if (this.check(TokenType.PROC)) {
      return this.parseProcDefinition();
    }
    if (this.check(TokenType.FUNC)) {
      return this.parseFuncDefinition();
    }

    this.error(`Unexpected token at top level: ${this.peek().type} (${this.peek().value})`);
    this.advance();
    return null;
  }

  // --- var declaration ---
  parseVarDeclaration() {
    this.expect(TokenType.VAR, 'Expected "var"');
    const nameTok = this.expect(TokenType.IDENTIFIER, 'Expected variable name');
    const name = nameTok ? nameTok.value : '__error__';
    this.expect(TokenType.EQ, 'Expected "=" in variable declaration');
    const value = this.parseExpression();
    return { type: 'var_declaration', name, value };
  }

  // --- event handler ---
  parseEventHandler() {
    this.expect(TokenType.WHEN, 'Expected "when"');

    // Parse Component.Event
    const componentTok = this.expect(TokenType.IDENTIFIER, 'Expected component name');
    const component = componentTok ? componentTok.value : '__error__';
    this.expect(TokenType.DOT, 'Expected "." after component name');
    const eventTok = this.expect(TokenType.IDENTIFIER, 'Expected event name');
    const event = eventTok ? eventTok.value : '__error__';

    // Optional parameters in parentheses
    let params = [];
    if (this.match(TokenType.LPAREN)) {
      params = this.parseIdentifierList();
      this.expect(TokenType.RPAREN, 'Expected ")" after event parameters');
    }

    const componentType = extractComponentType(component);

    this.expect(TokenType.LBRACE, 'Expected "{" to start event body');
    const body = this.parseBody();
    this.expect(TokenType.RBRACE, 'Expected "}" to end event body');

    return {
      type: 'event_handler',
      component,
      componentType,
      event,
      params,
      body,
    };
  }

  // --- proc definition ---
  parseProcDefinition() {
    this.expect(TokenType.PROC, 'Expected "proc"');
    const nameTok = this.expect(TokenType.IDENTIFIER, 'Expected procedure name');
    const name = nameTok ? nameTok.value : '__error__';

    this.expect(TokenType.LPAREN, 'Expected "(" after procedure name');
    const params = this.parseIdentifierList();
    this.expect(TokenType.RPAREN, 'Expected ")" after procedure parameters');

    this.expect(TokenType.LBRACE, 'Expected "{" to start procedure body');
    const body = this.parseBody();
    this.expect(TokenType.RBRACE, 'Expected "}" to end procedure body');

    return { type: 'proc_definition', name, params, body };
  }

  // --- func definition ---
  parseFuncDefinition() {
    this.expect(TokenType.FUNC, 'Expected "func"');
    const nameTok = this.expect(TokenType.IDENTIFIER, 'Expected function name');
    const name = nameTok ? nameTok.value : '__error__';

    this.expect(TokenType.LPAREN, 'Expected "(" after function name');
    const params = this.parseIdentifierList();
    this.expect(TokenType.RPAREN, 'Expected ")" after function parameters');

    this.expect(TokenType.LBRACE, 'Expected "{" to start function body');
    const body = this.parseBody();
    this.expect(TokenType.RBRACE, 'Expected "}" to end function body');

    // Extract return expression from body if present
    let returnExpr = null;
    const bodyWithoutReturn = [];
    for (const stmt of body) {
      if (stmt.type === 'return_statement') {
        returnExpr = stmt.value;
      } else {
        bodyWithoutReturn.push(stmt);
      }
    }

    return { type: 'func_definition', name, params, body: bodyWithoutReturn, returnExpr };
  }

  // Parse a comma-separated list of identifiers
  parseIdentifierList() {
    const names = [];
    if (!this.check(TokenType.RPAREN)) {
      const first = this.expect(TokenType.IDENTIFIER, 'Expected parameter name');
      if (first) names.push(first.value);
      while (this.match(TokenType.COMMA)) {
        const next = this.expect(TokenType.IDENTIFIER, 'Expected parameter name');
        if (next) names.push(next.value);
      }
    }
    return names;
  }

  // --- Body (list of statements) ---
  parseBody() {
    const stmts = [];
    while (!this.check(TokenType.RBRACE) && !this.check(TokenType.EOF)) {
      try {
        const stmt = this.parseStatement();
        if (stmt) {
          stmts.push(stmt);
        }
      } catch (e) {
        if (!e.parserError) {
          this.error(e.message || 'Unexpected error in statement');
        }
        // Try to recover by skipping to next statement
        this.advanceToStatementBoundary();
      }
    }
    return stmts;
  }

  advanceToStatementBoundary() {
    while (!this.check(TokenType.EOF) && !this.check(TokenType.RBRACE)) {
      const t = this.peek().type;
      if (
        t === TokenType.SET ||
        t === TokenType.CALL ||
        t === TokenType.IF ||
        t === TokenType.FOR ||
        t === TokenType.FOREACH ||
        t === TokenType.WHILE ||
        t === TokenType.RETURN ||
        t === TokenType.VAR
      ) {
        return;
      }
      // Also break if we see an identifier followed by = (variable assignment)
      if (t === TokenType.IDENTIFIER) {
        return;
      }
      this.advance();
    }
  }

  // --- Statement parsing ---
  parseStatement() {
    // set Component.Property = expr
    if (this.check(TokenType.SET)) {
      return this.parseSetProperty();
    }

    // call Component.Method(args)
    if (this.check(TokenType.CALL)) {
      return this.parseCallStatement();
    }

    // if condition { ... } else { ... }
    if (this.check(TokenType.IF)) {
      return this.parseIfStatement();
    }

    // for i in range(start, end) { ... }
    if (this.check(TokenType.FOR)) {
      return this.parseForRange();
    }

    // foreach item in list { ... }
    if (this.check(TokenType.FOREACH)) {
      return this.parseForEach();
    }

    // while condition { ... }
    if (this.check(TokenType.WHILE)) {
      return this.parseWhileLoop();
    }

    // return expr
    if (this.check(TokenType.RETURN)) {
      return this.parseReturnStatement();
    }

    // var declaration inside a body (local variable)
    if (this.check(TokenType.VAR)) {
      return this.parseLocalVarDeclaration();
    }

    // identifier = expr (variable assignment)
    if (this.check(TokenType.IDENTIFIER)) {
      return this.parseAssignmentOrExprStatement();
    }

    this.error(`Unexpected token in statement: ${this.peek().type} (${this.peek().value})`);
    this.advance();
    return null;
  }

  // set Component.Property = expr
  parseSetProperty() {
    this.expect(TokenType.SET, 'Expected "set"');
    const componentTok = this.expect(TokenType.IDENTIFIER, 'Expected component name');
    const component = componentTok ? componentTok.value : '__error__';
    this.expect(TokenType.DOT, 'Expected "." after component name');
    const propTok = this.expect(TokenType.IDENTIFIER, 'Expected property name');
    const property = propTok ? propTok.value : '__error__';
    this.expect(TokenType.EQ, 'Expected "=" after property name');
    const value = this.parseExpression();
    return { type: 'set_property', component, property, value };
  }

  // call Component.Method(args) — as a statement
  parseCallStatement() {
    this.expect(TokenType.CALL, 'Expected "call"');
    const componentTok = this.expect(TokenType.IDENTIFIER, 'Expected component or procedure name');
    const name = componentTok ? componentTok.value : '__error__';

    if (this.match(TokenType.DOT)) {
      // call Component.Method(args)
      const methodTok = this.expect(TokenType.IDENTIFIER, 'Expected method name');
      const method = methodTok ? methodTok.value : '__error__';
      this.expect(TokenType.LPAREN, 'Expected "(" after method name');
      const args = this.parseExpressionList();
      this.expect(TokenType.RPAREN, 'Expected ")" after method arguments');
      return { type: 'call_method', component: name, method, args };
    } else {
      // call procName(args) — procedure call
      this.expect(TokenType.LPAREN, 'Expected "(" after procedure name');
      const args = this.parseExpressionList();
      this.expect(TokenType.RPAREN, 'Expected ")" after procedure arguments');
      return { type: 'call_proc', name, args };
    }
  }

  // if condition { ... } else { ... }
  parseIfStatement() {
    this.expect(TokenType.IF, 'Expected "if"');
    const condition = this.parseExpression();
    this.expect(TokenType.LBRACE, 'Expected "{" after if condition');
    const thenBody = this.parseBody();
    this.expect(TokenType.RBRACE, 'Expected "}" to end if body');

    let elseBody = null;
    if (this.match(TokenType.ELSE)) {
      if (this.check(TokenType.IF)) {
        // else if — wrap in a single-element array
        const elseIf = this.parseIfStatement();
        elseBody = [elseIf];
      } else {
        this.expect(TokenType.LBRACE, 'Expected "{" after else');
        elseBody = this.parseBody();
        this.expect(TokenType.RBRACE, 'Expected "}" to end else body');
      }
    }

    return { type: 'if_statement', condition, thenBody, elseBody };
  }

  // for i in range(start, end) { ... }
  // for i in range(start, end, step) { ... }
  parseForRange() {
    this.expect(TokenType.FOR, 'Expected "for"');
    const varTok = this.expect(TokenType.IDENTIFIER, 'Expected loop variable');
    const variable = varTok ? varTok.value : '__error__';
    this.expect(TokenType.IN, 'Expected "in" after loop variable');
    this.expect(TokenType.RANGE, 'Expected "range" keyword');
    this.expect(TokenType.LPAREN, 'Expected "(" after range');
    const start = this.parseExpression();
    this.expect(TokenType.COMMA, 'Expected "," in range');
    const end = this.parseExpression();
    let step = { type: 'number', value: 1 };
    if (this.match(TokenType.COMMA)) {
      step = this.parseExpression();
    }
    this.expect(TokenType.RPAREN, 'Expected ")" after range arguments');
    this.expect(TokenType.LBRACE, 'Expected "{" to start for body');
    const body = this.parseBody();
    this.expect(TokenType.RBRACE, 'Expected "}" to end for body');

    return { type: 'for_range', variable, start, end, step, body };
  }

  // foreach item in list { ... }
  parseForEach() {
    this.expect(TokenType.FOREACH, 'Expected "foreach"');
    const varTok = this.expect(TokenType.IDENTIFIER, 'Expected loop variable');
    const variable = varTok ? varTok.value : '__error__';
    this.expect(TokenType.IN, 'Expected "in" after loop variable');
    const list = this.parseExpression();
    this.expect(TokenType.LBRACE, 'Expected "{" to start foreach body');
    const body = this.parseBody();
    this.expect(TokenType.RBRACE, 'Expected "}" to end foreach body');

    return { type: 'for_each', variable, list, body };
  }

  // while condition { ... }
  parseWhileLoop() {
    this.expect(TokenType.WHILE, 'Expected "while"');
    const condition = this.parseExpression();
    this.expect(TokenType.LBRACE, 'Expected "{" to start while body');
    const body = this.parseBody();
    this.expect(TokenType.RBRACE, 'Expected "}" to end while body');

    return { type: 'while_loop', condition, body };
  }

  // return expr
  parseReturnStatement() {
    this.expect(TokenType.RETURN, 'Expected "return"');
    const value = this.parseExpression();
    return { type: 'return_statement', value };
  }

  // var x = expr (local variable — treated as set_variable with initial value)
  parseLocalVarDeclaration() {
    this.expect(TokenType.VAR, 'Expected "var"');
    const nameTok = this.expect(TokenType.IDENTIFIER, 'Expected variable name');
    const name = nameTok ? nameTok.value : '__error__';
    this.expect(TokenType.EQ, 'Expected "=" in variable declaration');
    const value = this.parseExpression();
    // Local var inside a body: treat as set_variable
    // (App Inventor doesn't have local variable blocks in the same way,
    //  so we treat it as initializing/setting a global)
    return { type: 'set_variable', name, value };
  }

  // identifier = expr  OR  identifier as expression-statement
  parseAssignmentOrExprStatement() {
    const nameTok = this.advance(); // consume identifier
    const name = nameTok.value;

    if (this.match(TokenType.EQ)) {
      // Variable assignment
      const value = this.parseExpression();
      return { type: 'set_variable', name, value };
    }

    // This shouldn't normally happen in our language, but handle gracefully
    this.error(`Expected "=" after "${name}" for assignment`);
    return null;
  }

  // --- Expression parsing (recursive descent with precedence) ---

  parseExpressionList() {
    const exprs = [];
    if (!this.check(TokenType.RPAREN)) {
      exprs.push(this.parseExpression());
      while (this.match(TokenType.COMMA)) {
        exprs.push(this.parseExpression());
      }
    }
    return exprs;
  }

  // Expression entry point — handles 'or' (lowest precedence)
  parseExpression() {
    return this.parseOr();
  }

  parseOr() {
    let left = this.parseAnd();
    while (this.match(TokenType.OR)) {
      const right = this.parseAnd();
      left = { type: 'binary_op', op: 'or', left, right };
    }
    return left;
  }

  parseAnd() {
    let left = this.parseNot();
    while (this.match(TokenType.AND)) {
      const right = this.parseNot();
      left = { type: 'binary_op', op: 'and', left, right };
    }
    return left;
  }

  parseNot() {
    if (this.match(TokenType.NOT)) {
      const operand = this.parseNot();
      return { type: 'unary_op', op: 'not', operand };
    }
    return this.parseComparison();
  }

  parseComparison() {
    let left = this.parseAddition();
    while (true) {
      const tok = this.match(
        TokenType.EQ_EQ,
        TokenType.BANG_EQ,
        TokenType.LT,
        TokenType.GT,
        TokenType.LT_EQ,
        TokenType.GT_EQ
      );
      if (!tok) break;
      const right = this.parseAddition();
      left = { type: 'binary_op', op: tok.value, left, right };
    }
    return left;
  }

  parseAddition() {
    let left = this.parseMultiplication();
    while (true) {
      const tok = this.match(TokenType.PLUS, TokenType.MINUS);
      if (!tok) break;
      const right = this.parseMultiplication();
      left = { type: 'binary_op', op: tok.value, left, right };
    }
    return left;
  }

  parseMultiplication() {
    let left = this.parseUnary();
    while (true) {
      const tok = this.match(TokenType.STAR, TokenType.SLASH);
      if (!tok) break;
      const right = this.parseUnary();
      left = { type: 'binary_op', op: tok.value, left, right };
    }
    return left;
  }

  parseUnary() {
    if (this.match(TokenType.MINUS)) {
      const operand = this.parsePrimary();
      // Negative number: wrap as binary 0 - operand
      return { type: 'binary_op', op: '-', left: { type: 'number', value: 0 }, right: operand };
    }
    return this.parsePostfix();
  }

  parsePostfix() {
    let expr = this.parsePrimary();

    // Handle list indexing: expr[index]
    while (this.check(TokenType.LBRACKET)) {
      this.advance(); // consume [
      const index = this.parseExpression();
      this.expect(TokenType.RBRACKET, 'Expected "]" after list index');
      expr = { type: 'list_index', list: expr, index };
    }

    return expr;
  }

  parsePrimary() {
    // Number literal
    if (this.check(TokenType.NUMBER)) {
      const tok = this.advance();
      return { type: 'number', value: tok.value };
    }

    // String literal
    if (this.check(TokenType.STRING)) {
      const tok = this.advance();
      return { type: 'string', value: tok.value };
    }

    // Boolean literal
    if (this.check(TokenType.BOOLEAN)) {
      const tok = this.advance();
      return { type: 'boolean', value: tok.value };
    }

    // Parenthesized expression
    if (this.match(TokenType.LPAREN)) {
      const expr = this.parseExpression();
      this.expect(TokenType.RPAREN, 'Expected ")" after expression');
      return expr;
    }

    // List literal: [expr, expr, ...]
    if (this.check(TokenType.LBRACKET)) {
      return this.parseListLiteral();
    }

    // get Component.Property
    if (this.check(TokenType.GET)) {
      return this.parseGetProperty();
    }

    // call Component.Method(args) as expression
    if (this.check(TokenType.CALL)) {
      return this.parseCallExpression();
    }

    // join(expr, expr, ...)
    if (this.check(TokenType.JOIN)) {
      return this.parseJoin();
    }

    // Identifier — could be a variable reference, could also be Component.Something
    if (this.check(TokenType.IDENTIFIER)) {
      const tok = this.advance();
      const name = tok.value;

      // If followed by a dot, could be get_property
      // (for expressions like `myList` or `score` this just returns get_variable)
      if (this.check(TokenType.DOT)) {
        // Peek ahead: Identifier.Identifier => get_property
        this.advance(); // consume dot
        const propTok = this.expect(TokenType.IDENTIFIER, 'Expected property name after "."');
        const prop = propTok ? propTok.value : '__error__';
        return { type: 'get_property', component: name, property: prop };
      }

      // If followed by (, could be a function call
      if (this.check(TokenType.LPAREN)) {
        this.advance(); // consume (
        const args = this.parseExpressionList();
        this.expect(TokenType.RPAREN, 'Expected ")" after function arguments');
        return { type: 'call_func', name, args };
      }

      return { type: 'get_variable', name };
    }

    // range keyword used outside of for — treat as identifier
    if (this.check(TokenType.RANGE)) {
      const tok = this.advance();
      return { type: 'get_variable', name: tok.value };
    }

    this.error(`Unexpected token in expression: ${this.peek().type} (${this.peek().value})`);
    this.advance();
    return { type: 'number', value: 0 }; // fallback
  }

  // [expr, expr, ...] or []
  parseListLiteral() {
    this.expect(TokenType.LBRACKET, 'Expected "["');
    if (this.match(TokenType.RBRACKET)) {
      return { type: 'empty_list' };
    }
    const items = [];
    items.push(this.parseExpression());
    while (this.match(TokenType.COMMA)) {
      items.push(this.parseExpression());
    }
    this.expect(TokenType.RBRACKET, 'Expected "]" after list items');
    return { type: 'list_create', items };
  }

  // get Component.Property
  parseGetProperty() {
    this.expect(TokenType.GET, 'Expected "get"');
    const componentTok = this.expect(TokenType.IDENTIFIER, 'Expected component name');
    const component = componentTok ? componentTok.value : '__error__';
    this.expect(TokenType.DOT, 'Expected "." after component name');
    const propTok = this.expect(TokenType.IDENTIFIER, 'Expected property name');
    const property = propTok ? propTok.value : '__error__';
    return { type: 'get_property', component, property };
  }

  // call Component.Method(args) as expression
  parseCallExpression() {
    this.expect(TokenType.CALL, 'Expected "call"');
    const nameTok = this.expect(TokenType.IDENTIFIER, 'Expected component or function name');
    const name = nameTok ? nameTok.value : '__error__';

    if (this.match(TokenType.DOT)) {
      const methodTok = this.expect(TokenType.IDENTIFIER, 'Expected method name');
      const method = methodTok ? methodTok.value : '__error__';
      this.expect(TokenType.LPAREN, 'Expected "(" after method name');
      const args = this.parseExpressionList();
      this.expect(TokenType.RPAREN, 'Expected ")" after method arguments');
      return { type: 'call_method_expr', component: name, method, args };
    } else {
      // call funcName(args)
      this.expect(TokenType.LPAREN, 'Expected "(" after function name');
      const args = this.parseExpressionList();
      this.expect(TokenType.RPAREN, 'Expected ")" after function arguments');
      return { type: 'call_func', name, args };
    }
  }

  // join(expr, expr, ...)
  parseJoin() {
    this.expect(TokenType.JOIN, 'Expected "join"');
    this.expect(TokenType.LPAREN, 'Expected "(" after join');
    const parts = this.parseExpressionList();
    this.expect(TokenType.RPAREN, 'Expected ")" after join arguments');
    return { type: 'join', parts };
  }
}

// ============================================================
// Helpers
// ============================================================

/**
 * Extract component type from instance name.
 * e.g. "Button1" → "Button", "TinyDB1" → "TinyDB", "HorizontalArrangement2" → "HorizontalArrangement"
 */
function extractComponentType(instanceName) {
  // Strip trailing digits
  const match = instanceName.match(/^(.*?)(\d+)$/);
  if (match) {
    return match[1];
  }
  return instanceName;
}

// ============================================================
// Public API
// ============================================================

/**
 * Parse code into an AST.
 * @param {string} code — the source code
 * @returns {{ ast: Array, errors: Array<{line: number, message: string}> }}
 */
export function parseCode(code) {
  const { tokens, errors: tokenErrors } = tokenize(code);
  const parser = new Parser(tokens);
  const ast = parser.parseProgram();
  const errors = [...tokenErrors, ...parser.errors];
  return { ast, errors };
}

export { extractComponentType };
