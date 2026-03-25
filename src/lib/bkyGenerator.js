// bkyGenerator.js — Generates MIT App Inventor .bky XML from a screen's code.

import { parseCode, extractComponentType as fallbackExtractType } from './codeParser';

// Build a name→type map from a component tree so we can resolve
// custom names like "PlusButton" → "Button" instead of relying on
// the naive digit-stripping heuristic.
function buildComponentTypeMap(components) {
  const map = {};
  if (!components) return map;
  for (const comp of components) {
    if (comp.$Name && comp.$Type) {
      map[comp.$Name] = comp.$Type;
    }
    if (comp.children) {
      Object.assign(map, buildComponentTypeMap(comp.children));
    }
  }
  return map;
}

/**
 * Generate .bky XML for a screen.
 * @param {object} screen — screen object with `code` and optionally `components`
 * @returns {string} — valid .bky XML
 */
export function generateBky(screen) {
  if (!screen.code || screen.code.trim() === '') {
    return '<xml xmlns="https://developers.google.com/blockly/xml">\n</xml>';
  }

  const { ast, errors } = parseCode(screen.code);
  if (errors.length > 0) {
    console.warn('Code parse errors:', errors);
  }

  // Build component name→type lookup from the screen's component tree
  const compTypeMap = buildComponentTypeMap(screen.components);

  // Screen1 is the Form root — always add it
  compTypeMap['Screen1'] = 'Form';

  // Resolve component type: check the map first, fall back to digit-stripping
  const resolveType = (instanceName) => {
    if (compTypeMap[instanceName]) return compTypeMap[instanceName];
    // Check if it matches a known component type directly (e.g. "Notifier1" → "Notifier")
    const stripped = fallbackExtractType(instanceName);
    // Import COMPONENTS to validate
    return stripped;
  };

  let blockId = 1;
  const nextId = () => String(blockId++);

  // Track global variable names so we can prefix them in get/set
  const globalVars = new Set();
  for (const node of ast) {
    if (node.type === 'var_declaration') {
      globalVars.add(node.name);
    }
  }

  let y = 50;
  const blocks = [];

  for (const node of ast) {
    const xml = generateTopLevel(node, nextId, y, globalVars, resolveType);
    if (xml) {
      blocks.push(xml);
      y += 200;
    }
  }

  return `<xml xmlns="https://developers.google.com/blockly/xml">\n${blocks.join('\n')}\n</xml>`;
}

// All mutation elements in App Inventor's .bky require this xmlns
const XMLNS = 'xmlns="http://www.w3.org/1999/xhtml" ';

// ============================================================
// Escape XML special characters
// ============================================================
function escXml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ============================================================
// Top-level block generation
// ============================================================
function generateTopLevel(node, nextId, y, globalVars, resolveType) {
  switch (node.type) {
    case 'var_declaration':
      return generateVarDeclaration(node, nextId, y, globalVars, resolveType);
    case 'event_handler':
      return generateEventHandler(node, nextId, y, globalVars, resolveType);
    case 'proc_definition':
      return generateProcDefinition(node, nextId, y, globalVars, resolveType);
    case 'func_definition':
      return generateFuncDefinition(node, nextId, y, globalVars, resolveType);
    default:
      return null;
  }
}

// --- Global variable declaration ---
function generateVarDeclaration(node, nextId, y, globalVars, resolveType) {
  const id = nextId();
  const valueXml = generateExpression(node.value, nextId, globalVars, resolveType);
  return `  <block type="global_declaration" id="${id}" x="20" y="${y}">
    <field name="NAME">${escXml(node.name)}</field>
    <value name="VALUE">
      ${valueXml}
    </value>
  </block>`;
}

// --- Event handler ---
function generateEventHandler(node, nextId, y, globalVars, resolveType) {
  const id = nextId();
  // Always use resolveType — don't trust node.componentType from the parser
  // because it uses naive digit-stripping that fails for custom names
  const componentType = resolveType(node.component);

  // Build mutation
  let eventParams = '';
  if (node.params && node.params.length > 0) {
    eventParams = node.params.map(p => `<eventparam name="${escXml(p)}"/>`).join('');
  }
  const mutation = `<mutation ${XMLNS}component_type="${escXml(componentType)}" is_generic="false" instance_name="${escXml(node.component)}" event_name="${escXml(node.event)}">${eventParams}</mutation>`;

  const bodyXml = generateStatementChain(node.body, nextId, globalVars, resolveType);

  let stmtValue = '';
  if (bodyXml) {
    stmtValue = `\n    <statement name="DO">\n      ${bodyXml}\n    </statement>`;
  }

  return `  <block type="component_event" id="${id}" x="20" y="${y}">
    ${mutation}
    <field name="COMPONENT_SELECTOR">${escXml(node.component)}</field>${stmtValue}
  </block>`;
}

// --- Procedure (no return) ---
function generateProcDefinition(node, nextId, y, globalVars, resolveType) {
  const id = nextId();

  let argMutation = '';
  if (node.params && node.params.length > 0) {
    argMutation = node.params.map(p => `<arg name="${escXml(p)}"/>`).join('');
  }
  const mutation = `<mutation ${XMLNS}>${argMutation}</mutation>`;

  const bodyXml = generateStatementChain(node.body, nextId, globalVars, resolveType);

  let stmtValue = '';
  if (bodyXml) {
    stmtValue = `\n    <statement name="STACK">\n      ${bodyXml}\n    </statement>`;
  }

  return `  <block type="procedures_defnoreturn" id="${id}" x="20" y="${y}">
    ${mutation}
    <field name="NAME">${escXml(node.name)}</field>${stmtValue}
  </block>`;
}

// --- Function (with return) ---
function generateFuncDefinition(node, nextId, y, globalVars, resolveType) {
  const id = nextId();

  let argMutation = '';
  if (node.params && node.params.length > 0) {
    argMutation = node.params.map(p => `<arg name="${escXml(p)}"/>`).join('');
  }
  const mutation = `<mutation ${XMLNS}>${argMutation}</mutation>`;

  const bodyXml = generateStatementChain(node.body, nextId, globalVars, resolveType);

  let stmtValue = '';
  if (bodyXml) {
    stmtValue = `\n    <statement name="STACK">\n      ${bodyXml}\n    </statement>`;
  }

  let returnValue = '';
  if (node.returnExpr) {
    const returnXml = generateExpression(node.returnExpr, nextId, globalVars, resolveType);
    returnValue = `\n    <value name="RETURN">\n      ${returnXml}\n    </value>`;
  }

  return `  <block type="procedures_defreturn" id="${id}" x="20" y="${y}">
    ${mutation}
    <field name="NAME">${escXml(node.name)}</field>${stmtValue}${returnValue}
  </block>`;
}

// ============================================================
// Statement chain generation
// Chains statements with <next> nesting
// ============================================================
function generateStatementChain(stmts, nextId, globalVars, resolveType) {
  if (!stmts || stmts.length === 0) return '';

  const first = generateStatement(stmts[0], nextId, globalVars, resolveType);
  if (!first) return '';

  if (stmts.length === 1) {
    return first;
  }

  // Chain the rest via <next>
  const rest = generateStatementChain(stmts.slice(1), nextId, globalVars, resolveType);
  if (!rest) return first;

  // Insert <next> before the closing </block> of the first statement
  return insertNext(first, rest);
}

/**
 * Insert a <next> block before the last </block> closing tag of an XML string.
 */
function insertNext(blockXml, nextBlockXml) {
  const lastClose = blockXml.lastIndexOf('</block>');
  if (lastClose === -1) return blockXml;
  const before = blockXml.substring(0, lastClose);
  const after = blockXml.substring(lastClose);
  return `${before}  <next>\n    ${nextBlockXml}\n  </next>\n${after}`;
}

// ============================================================
// Statement generation
// ============================================================
function generateStatement(node, nextId, globalVars, resolveType) {
  if (!node) return null;

  switch (node.type) {
    case 'set_property':
      return generateSetProperty(node, nextId, globalVars, resolveType);
    case 'set_variable':
      return generateSetVariable(node, nextId, globalVars, resolveType);
    case 'call_method':
      return generateCallMethod(node, nextId, globalVars, resolveType);
    case 'call_proc':
      return generateCallProc(node, nextId, globalVars, resolveType);
    case 'if_statement':
      return generateIfStatement(node, nextId, globalVars, resolveType);
    case 'for_range':
      return generateForRange(node, nextId, globalVars, resolveType);
    case 'for_each':
      return generateForEach(node, nextId, globalVars, resolveType);
    case 'while_loop':
      return generateWhileLoop(node, nextId, globalVars, resolveType);
    case 'return_statement':
      // Return statements are handled at the func_definition level,
      // but if we encounter one here, silently ignore it
      return null;
    default:
      return null;
  }
}

// --- set Component.Property = expr ---
function generateSetProperty(node, nextId, globalVars, resolveType) {
  const id = nextId();
  const componentType = resolveType(node.component);
  const valueXml = generateExpression(node.value, nextId, globalVars, resolveType);

  const mutation = `<mutation ${XMLNS}component_type="${escXml(componentType)}" set_or_get="set" property_name="${escXml(node.property)}" is_generic="false" instance_name="${escXml(node.component)}"/>`;

  return `<block type="component_set_get" id="${id}" inline="false">
  ${mutation}
  <field name="COMPONENT_SELECTOR">${escXml(node.component)}</field>
  <field name="PROP">${escXml(node.property)}</field>
  <value name="VALUE">
    ${valueXml}
  </value>
</block>`;
}

// --- variable = expr ---
function generateSetVariable(node, nextId, globalVars, resolveType) {
  const id = nextId();
  const valueXml = generateExpression(node.value, nextId, globalVars, resolveType);
  const varName = globalVars.has(node.name) ? `global ${node.name}` : node.name;

  return `<block type="lexical_variable_set" id="${id}" inline="false">
  <field name="VAR">${escXml(varName)}</field>
  <value name="VALUE">
    ${valueXml}
  </value>
</block>`;
}

// --- call Component.Method(args) ---
function generateCallMethod(node, nextId, globalVars, resolveType) {
  const id = nextId();
  const componentType = resolveType(node.component);

  const mutation = `<mutation ${XMLNS}component_type="${escXml(componentType)}" method_name="${escXml(node.method)}" is_generic="false" instance_name="${escXml(node.component)}"/>`;

  let argsXml = '';
  if (node.args && node.args.length > 0) {
    argsXml = node.args.map((arg, i) => {
      const argExpr = generateExpression(arg, nextId, globalVars, resolveType);
      return `\n  <value name="ARG${i}">\n    ${argExpr}\n  </value>`;
    }).join('');
  }

  return `<block type="component_method" id="${id}">
  ${mutation}
  <field name="COMPONENT_SELECTOR">${escXml(node.component)}</field>${argsXml}
</block>`;
}

// --- call procName(args) ---
function generateCallProc(node, nextId, globalVars, resolveType) {
  const id = nextId();

  let argMutation = '';
  if (node.args && node.args.length > 0) {
    argMutation = node.args.map((_, i) => `<arg name="x${i}"/>`).join('');
  }
  const mutation = `<mutation ${XMLNS}name="${escXml(node.name)}">${argMutation}</mutation>`;

  let argsXml = '';
  if (node.args && node.args.length > 0) {
    argsXml = node.args.map((arg, i) => {
      const argExpr = generateExpression(arg, nextId, globalVars, resolveType);
      return `\n  <value name="ARG${i}">\n    ${argExpr}\n  </value>`;
    }).join('');
  }

  return `<block type="procedures_callnoreturn" id="${id}">
  ${mutation}${argsXml}
</block>`;
}

// --- if / else ---
function generateIfStatement(node, nextId, globalVars, resolveType) {
  const id = nextId();
  const conditionXml = generateExpression(node.condition, nextId, globalVars, resolveType);

  // Count elseif and else clauses
  // Our AST nests else-if as a single if_statement inside elseBody
  // We flatten this for the mutation
  let elseIfCount = 0;
  let hasElse = false;
  const conditions = [node.condition];
  const thenBodies = [node.thenBody];
  let elseBody = null;

  // Flatten chained else-ifs
  let current = node;
  while (current.elseBody && current.elseBody.length === 1 && current.elseBody[0].type === 'if_statement') {
    elseIfCount++;
    const elseIf = current.elseBody[0];
    conditions.push(elseIf.condition);
    thenBodies.push(elseIf.thenBody);
    current = elseIf;
  }
  if (current.elseBody && current.elseBody.length > 0) {
    // Check if it's not another chained if
    if (!(current.elseBody.length === 1 && current.elseBody[0].type === 'if_statement')) {
      hasElse = true;
      elseBody = current.elseBody;
    }
  }

  let mutationAttrs = '';
  if (elseIfCount > 0) {
    mutationAttrs += ` elseif="${elseIfCount}"`;
  }
  if (hasElse) {
    mutationAttrs += ` else="1"`;
  }
  const mutation = `<mutation ${XMLNS}${mutationAttrs}/>`;

  // Build condition and then body values
  let innerXml = '';

  // IF0 condition + DO0 body
  innerXml += `\n  <value name="IF0">\n    ${generateExpression(conditions[0], nextId, globalVars, resolveType)}\n  </value>`;
  const do0Xml = generateStatementChain(thenBodies[0], nextId, globalVars, resolveType);
  if (do0Xml) {
    innerXml += `\n  <statement name="DO0">\n    ${do0Xml}\n  </statement>`;
  }

  // ELSEIF conditions and bodies
  for (let i = 1; i <= elseIfCount; i++) {
    innerXml += `\n  <value name="IF${i}">\n    ${generateExpression(conditions[i], nextId, globalVars, resolveType)}\n  </value>`;
    const doXml = generateStatementChain(thenBodies[i], nextId, globalVars, resolveType);
    if (doXml) {
      innerXml += `\n  <statement name="DO${i}">\n    ${doXml}\n  </statement>`;
    }
  }

  // ELSE body
  if (hasElse && elseBody) {
    const elseXml = generateStatementChain(elseBody, nextId, globalVars, resolveType);
    if (elseXml) {
      innerXml += `\n  <statement name="ELSE">\n    ${elseXml}\n  </statement>`;
    }
  }

  return `<block type="controls_if" id="${id}">
  ${mutation}${innerXml}
</block>`;
}

// --- for i in range(start, end, step) ---
function generateForRange(node, nextId, globalVars, resolveType) {
  const id = nextId();
  const startXml = generateExpression(node.start, nextId, globalVars, resolveType);
  const endXml = generateExpression(node.end, nextId, globalVars, resolveType);
  const stepXml = generateExpression(node.step, nextId, globalVars, resolveType);
  const bodyXml = generateStatementChain(node.body, nextId, globalVars, resolveType);

  let stmtValue = '';
  if (bodyXml) {
    stmtValue = `\n  <statement name="DO">\n    ${bodyXml}\n  </statement>`;
  }

  return `<block type="controls_forRange" id="${id}">
  <field name="VAR">${escXml(node.variable)}</field>
  <value name="START">
    ${startXml}
  </value>
  <value name="END">
    ${endXml}
  </value>
  <value name="STEP">
    ${stepXml}
  </value>${stmtValue}
</block>`;
}

// --- foreach item in list ---
function generateForEach(node, nextId, globalVars, resolveType) {
  const id = nextId();
  const listXml = generateExpression(node.list, nextId, globalVars, resolveType);
  const bodyXml = generateStatementChain(node.body, nextId, globalVars, resolveType);

  let stmtValue = '';
  if (bodyXml) {
    stmtValue = `\n  <statement name="DO">\n    ${bodyXml}\n  </statement>`;
  }

  return `<block type="controls_forEach" id="${id}">
  <field name="VAR">${escXml(node.variable)}</field>
  <value name="LIST">
    ${listXml}
  </value>${stmtValue}
</block>`;
}

// --- while condition ---
function generateWhileLoop(node, nextId, globalVars, resolveType) {
  const id = nextId();
  const conditionXml = generateExpression(node.condition, nextId, globalVars, resolveType);
  const bodyXml = generateStatementChain(node.body, nextId, globalVars, resolveType);

  let stmtValue = '';
  if (bodyXml) {
    stmtValue = `\n  <statement name="DO">\n    ${bodyXml}\n  </statement>`;
  }

  return `<block type="controls_while" id="${id}">
  <value name="TEST">
    ${conditionXml}
  </value>${stmtValue}
</block>`;
}

// ============================================================
// Expression generation
// ============================================================
function generateExpression(node, nextId, globalVars, resolveType) {
  if (!node) {
    return generateEmptyString(nextId);
  }

  switch (node.type) {
    case 'number':
      return generateNumber(node, nextId);
    case 'string':
      return generateString(node, nextId);
    case 'boolean':
      return generateBoolean(node, nextId);
    case 'empty_string':
      return generateEmptyString(nextId);
    case 'empty_list':
      return generateEmptyList(nextId);
    case 'get_variable':
      return generateGetVariable(node, nextId, globalVars);
    case 'get_property':
      return generateGetProperty(node, nextId, resolveType);
    case 'call_method_expr':
      return generateCallMethodExpr(node, nextId, globalVars, resolveType);
    case 'call_func':
      return generateCallFunc(node, nextId, globalVars, resolveType);
    case 'binary_op':
      return generateBinaryOp(node, nextId, globalVars, resolveType);
    case 'unary_op':
      return generateUnaryOp(node, nextId, globalVars, resolveType);
    case 'join':
      return generateJoin(node, nextId, globalVars, resolveType);
    case 'list_create':
      return generateListCreate(node, nextId, globalVars, resolveType);
    case 'list_index':
      return generateListIndex(node, nextId, globalVars, resolveType);
    default:
      // Fallback: return a 0
      return generateNumber({ type: 'number', value: 0 }, nextId);
  }
}

// --- number ---
function generateNumber(node, nextId) {
  const id = nextId();
  return `<block type="math_number" id="${id}">
  <field name="NUM">${node.value}</field>
</block>`;
}

// --- string ---
function generateString(node, nextId) {
  const id = nextId();
  return `<block type="text" id="${id}">
  <field name="TEXT">${escXml(node.value)}</field>
</block>`;
}

// --- boolean ---
function generateBoolean(node, nextId) {
  const id = nextId();
  const val = node.value ? 'TRUE' : 'FALSE';
  return `<block type="logic_boolean" id="${id}">
  <field name="BOOL">${val}</field>
</block>`;
}

// --- empty string ---
function generateEmptyString(nextId) {
  const id = nextId();
  return `<block type="text" id="${id}">
  <field name="TEXT"></field>
</block>`;
}

// --- empty list ---
function generateEmptyList(nextId) {
  const id = nextId();
  return `<block type="lists_create_with" id="${id}">
  <mutation ${XMLNS} items="0"/>
</block>`;
}

// --- get variable ---
function generateGetVariable(node, nextId, globalVars) {
  const id = nextId();
  const varName = globalVars.has(node.name) ? `global ${node.name}` : node.name;
  return `<block type="lexical_variable_get" id="${id}">
  <field name="VAR">${escXml(varName)}</field>
</block>`;
}

// --- get Component.Property ---
function generateGetProperty(node, nextId, resolveType) {
  const id = nextId();
  const componentType = resolveType(node.component);
  const mutation = `<mutation ${XMLNS}component_type="${escXml(componentType)}" set_or_get="get" property_name="${escXml(node.property)}" is_generic="false" instance_name="${escXml(node.component)}"/>`;

  return `<block type="component_set_get" id="${id}">
  ${mutation}
  <field name="COMPONENT_SELECTOR">${escXml(node.component)}</field>
  <field name="PROP">${escXml(node.property)}</field>
</block>`;
}

// --- call Component.Method(args) as expression ---
function generateCallMethodExpr(node, nextId, globalVars, resolveType) {
  const id = nextId();
  const componentType = resolveType(node.component);
  const mutation = `<mutation ${XMLNS}component_type="${escXml(componentType)}" method_name="${escXml(node.method)}" is_generic="false" instance_name="${escXml(node.component)}"/>`;

  let argsXml = '';
  if (node.args && node.args.length > 0) {
    argsXml = node.args.map((arg, i) => {
      const argExpr = generateExpression(arg, nextId, globalVars, resolveType);
      return `\n  <value name="ARG${i}">\n    ${argExpr}\n  </value>`;
    }).join('');
  }

  return `<block type="component_method" id="${id}">
  ${mutation}
  <field name="COMPONENT_SELECTOR">${escXml(node.component)}</field>${argsXml}
</block>`;
}

// --- call funcName(args) as expression ---
function generateCallFunc(node, nextId, globalVars, resolveType) {
  const id = nextId();

  let argMutation = '';
  if (node.args && node.args.length > 0) {
    argMutation = node.args.map((_, i) => `<arg name="x${i}"/>`).join('');
  }
  const mutation = `<mutation ${XMLNS}name="${escXml(node.name)}">${argMutation}</mutation>`;

  let argsXml = '';
  if (node.args && node.args.length > 0) {
    argsXml = node.args.map((arg, i) => {
      const argExpr = generateExpression(arg, nextId, globalVars, resolveType);
      return `\n  <value name="ARG${i}">\n    ${argExpr}\n  </value>`;
    }).join('');
  }

  return `<block type="procedures_callreturn" id="${id}">
  ${mutation}${argsXml}
</block>`;
}

// --- binary operations ---
function generateBinaryOp(node, nextId, globalVars, resolveType) {
  const id = nextId();
  const leftXml = generateExpression(node.left, nextId, globalVars, resolveType);
  const rightXml = generateExpression(node.right, nextId, globalVars, resolveType);

  switch (node.op) {
    // math_add and math_multiply are multi-input blocks in App Inventor
    // They use a mutation with items count and NUM0/NUM1 inputs
    case '+':
      return `<block type="math_add" id="${id}" inline="false">
  <mutation ${XMLNS}items="2"/>
  <value name="NUM0">
    ${leftXml}
  </value>
  <value name="NUM1">
    ${rightXml}
  </value>
</block>`;

    // math_subtract and math_division are binary (A/B inputs, no mutation)
    case '-':
      return `<block type="math_subtract" id="${id}">
  <value name="A">
    ${leftXml}
  </value>
  <value name="B">
    ${rightXml}
  </value>
</block>`;

    case '*':
      return `<block type="math_multiply" id="${id}" inline="false">
  <mutation ${XMLNS}items="2"/>
  <value name="NUM0">
    ${leftXml}
  </value>
  <value name="NUM1">
    ${rightXml}
  </value>
</block>`;

    case '/':
      return `<block type="math_division" id="${id}">
  <value name="A">
    ${leftXml}
  </value>
  <value name="B">
    ${rightXml}
  </value>
</block>`;

    case '==':
      return `<block type="logic_compare" id="${id}">
  <field name="OP">EQ</field>
  <value name="A">
    ${leftXml}
  </value>
  <value name="B">
    ${rightXml}
  </value>
</block>`;

    case '!=':
      return `<block type="logic_compare" id="${id}">
  <field name="OP">NEQ</field>
  <value name="A">
    ${leftXml}
  </value>
  <value name="B">
    ${rightXml}
  </value>
</block>`;

    case '<':
      return `<block type="math_compare" id="${id}">
  <field name="OP">LT</field>
  <value name="A">
    ${leftXml}
  </value>
  <value name="B">
    ${rightXml}
  </value>
</block>`;

    case '>':
      return `<block type="math_compare" id="${id}">
  <field name="OP">GT</field>
  <value name="A">
    ${leftXml}
  </value>
  <value name="B">
    ${rightXml}
  </value>
</block>`;

    case '<=':
      return `<block type="math_compare" id="${id}">
  <field name="OP">LTE</field>
  <value name="A">
    ${leftXml}
  </value>
  <value name="B">
    ${rightXml}
  </value>
</block>`;

    case '>=':
      return `<block type="math_compare" id="${id}">
  <field name="OP">GTE</field>
  <value name="A">
    ${leftXml}
  </value>
  <value name="B">
    ${rightXml}
  </value>
</block>`;

    case 'and':
      return `<block type="logic_operation" id="${id}">
  <field name="OP">AND</field>
  <value name="A">
    ${leftXml}
  </value>
  <value name="B">
    ${rightXml}
  </value>
</block>`;

    case 'or':
      return `<block type="logic_operation" id="${id}">
  <field name="OP">OR</field>
  <value name="A">
    ${leftXml}
  </value>
  <value name="B">
    ${rightXml}
  </value>
</block>`;

    default:
      // Fallback: treat as math_add
      return `<block type="math_add" id="${id}">
  <value name="A">
    ${leftXml}
  </value>
  <value name="B">
    ${rightXml}
  </value>
</block>`;
  }
}

// --- unary not ---
function generateUnaryOp(node, nextId, globalVars, resolveType) {
  const id = nextId();
  const operandXml = generateExpression(node.operand, nextId, globalVars, resolveType);

  return `<block type="logic_negate" id="${id}">
  <value name="BOOL">
    ${operandXml}
  </value>
</block>`;
}

// --- join(a, b, c...) ---
function generateJoin(node, nextId, globalVars, resolveType) {
  const id = nextId();
  const count = node.parts.length;

  let itemsXml = '';
  for (let i = 0; i < count; i++) {
    const partXml = generateExpression(node.parts[i], nextId, globalVars, resolveType);
    itemsXml += `\n  <value name="ADD${i}">\n    ${partXml}\n  </value>`;
  }

  return `<block type="text_join" id="${id}">
  <mutation ${XMLNS} items="${count}"/>${itemsXml}
</block>`;
}

// --- [1, 2, 3] ---
function generateListCreate(node, nextId, globalVars, resolveType) {
  const id = nextId();
  const count = node.items.length;

  let itemsXml = '';
  for (let i = 0; i < count; i++) {
    const itemXml = generateExpression(node.items[i], nextId, globalVars, resolveType);
    itemsXml += `\n  <value name="ADD${i}">\n    ${itemXml}\n  </value>`;
  }

  return `<block type="lists_create_with" id="${id}">
  <mutation ${XMLNS} items="${count}"/>${itemsXml}
</block>`;
}

// --- myList[index] ---
function generateListIndex(node, nextId, globalVars, resolveType) {
  const id = nextId();
  const listXml = generateExpression(node.list, nextId, globalVars, resolveType);
  const indexXml = generateExpression(node.index, nextId, globalVars, resolveType);

  return `<block type="lists_select_item" id="${id}">
  <value name="LIST">
    ${listXml}
  </value>
  <value name="NUM">
    ${indexXml}
  </value>
</block>`;
}

export default generateBky;
