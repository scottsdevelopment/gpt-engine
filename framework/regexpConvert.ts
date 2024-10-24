import { formatStringLength } from "./convert";

export interface AstClassMap {
  'RegExp': AstRegExp;
  'Disjunction': Disjunction;
  'Alternative': Alternative;
  'Assertion': Assertion;
  'Char': Char;
  'CharacterClass': CharacterClass;
  'ClassRange': ClassRange;
  'Backreference': Backreference;
  'Group': Group;
  'Repetition': Repetition;
  'Quantifier': Quantifier;
}

export type AstClass = keyof AstClassMap;
export type AstNode = AstClassMap[AstClass];
export type AstNodeLocation = {
  line: number;
  column: number;
  offset: number;
};

export interface Base<T extends AstClass> {
  type: T;
  loc?: {
    source: string;
    start: AstNodeLocation;
    end: AstNodeLocation;
  };
}

export interface SimpleChar extends Base<'Char'> {
  value: string;
  kind: 'simple';
  escaped?: true;
  codePoint: number;
}

export interface SpecialChar extends Base<'Char'> {
  value: string;
  kind: 'meta' | 'control' | 'hex' | 'decimal' | 'oct' | 'unicode';
  codePoint: number;
}

export type Char =
  | SimpleChar
  | SpecialChar;

export interface ClassRange extends Base<'ClassRange'> {
  from: Char;
  to: Char;
}

export interface CharacterClass extends Base<'CharacterClass'> {
  negative?: true;
  expressions: (Char | ClassRange)[];
}

export interface Alternative extends Base<'Alternative'> {
  expressions: Expression[];
}

export interface Disjunction extends Base<'Disjunction'> {
  left: Expression | null;
  right: Expression | null;
}

export interface CapturingGroup extends Base<'Group'> {
  capturing: true;
  number: number;
  name?: string;
  nameRaw?: string;
  expression: Expression | null;
}

export interface NoncapturingGroup extends Base<'Group'> {
  capturing: false;
  expression: Expression | null;
}

export type Group =
  | CapturingGroup
  | NoncapturingGroup;

export interface NumericBackreference extends Base<'Backreference'> {
  kind: 'number';
  number: number;
  reference: number;
}

export interface NamedBackreference extends Base<'Backreference'> {
  kind: 'name';
  number: number;
  reference: string;
  referenceRaw: string;
}

export type Backreference =
  | NumericBackreference
  | NamedBackreference;

export interface Repetition extends Base<'Repetition'> {
  expression: Expression;
  quantifier: Quantifier;
}

export interface SimpleQuantifier extends Base<'Quantifier'> {
  kind: '+' | '*' | '?';
  greedy: boolean;
}

export interface RangeQuantifier extends Base<'Quantifier'> {
  kind: 'Range';
  from: number;
  to?: number;
  greedy: boolean;
}

export type Quantifier =
  | SimpleQuantifier
  | RangeQuantifier;

export interface SimpleAssertion extends Base<'Assertion'> {
  kind: '^' | '$' | '\\b' | '\\B';
}

export interface LookaroundAssertion extends Base<'Assertion'> {
  kind: 'Lookahead' | 'Lookbehind';
  negative?: true;
  assertion: Expression | null;
}

export type Assertion =
  | SimpleAssertion
  | LookaroundAssertion;

export type Expression =
  | Char
  | CharacterClass
  | Alternative
  | Disjunction
  | Group
  | Backreference
  | Repetition
  | Assertion;

export interface AstRegExp extends Base<'RegExp'> {
  body: Expression | null;
  flags: string;
}

const regexpTree = require("regexp-tree");

// Docs: https://github.com/DmitrySoshnikov/regexp-tree#ast-nodes-specification

function isAllOfType<T extends Expression>(
  expressions: Expression[],
  type: AstClass
): expressions is T[] {
  return expressions.every((expression) => expression.type === type);
}

function convertAstToGbnf(ast: Expression | null): string {
  if (null === ast) {
    throw new Error("Unsupported null expression.");
  }

  if ("Disjunction" === ast.type) {
    return [ast.left, ast.right].map(convertAstToGbnf).join(" | ");
  }
  if ("Alternative" === ast.type && Array.isArray(ast.expressions)) {
    if (
      isAllOfType<Char>(ast.expressions, "Char") &&
      ast.expressions.every((exp: Char) => exp.kind === "simple")
    ) {
      return `"${ast.expressions
        .map((expression: Char) => expression.value)
        .join("")}"`;
    }
    return ast.expressions.map(convertAstToGbnf).join(" ");
  }
  if ("Char" === ast.type) {
    if (ast.kind === "simple") {
      return `"${ast.value}"`;
    }
    if (ast.kind === "meta") {
      if (ast.value === "\\w") {
        return "[0-9A-Za-z_]";
      }
      if (ast.value === ".") {
        return "string-char";
      }
    }
  }
  if ("Repetition" === ast.type) {
    if (["+", "?", "*"].includes(ast.quantifier.kind)) {
      const expressionGbnf = convertAstToGbnf(ast.expression);
      return expressionGbnf.endsWith("]") || expressionGbnf.endsWith(")")
        ? `${convertAstToGbnf(ast.expression)}${ast.quantifier.kind}`
        : `(${convertAstToGbnf(ast.expression)})${ast.quantifier.kind}`;
    }
    if ("Range" === ast.quantifier.kind) {
      return formatStringLength(
        convertAstToGbnf(ast.expression),
        ast.quantifier.from,
        ast.quantifier.to
      );
    }
  }
  if ("CharacterClass" === ast.type) {
    if (ast.expressions?.length === 1) {
      const expression = ast.expressions[0];
      if ("ClassRange" === expression.type) {
        return regexpTree.generate(ast);
      }
    }
  }
  if ("Group" === ast.type) {
    return `(${convertAstToGbnf(ast.expression)})`;
  }
  //throw new Error(
  //  `Unsupported regexp AST: ${regexpTree.generate(ast)} - ${JSON.stringify(
  //    ast
  //  )}`
  //);
  return '';
}

export function convertRegexpToGbnf(regexp: string): string {
  let parsed: AstRegExp;
  try {
    parsed = regexpTree.parse(regexp);
  } catch (error) {
    parsed = regexpTree.parse(new RegExp(regexp));
  }

  if (
    null === parsed.body ||
    ("Group" === parsed.body.type && null === parsed.body.expression)
  ) {
    return "(string-char)*";
  }

  let hasBeginMarker = false;
  let hasEndMarker = false;

  let ast = parsed.body;
  if (parsed.body.type === "Alternative") {
    let expressions = parsed.body.expressions;
    if (expressions[0].type === "Assertion" && expressions[0].kind === "^") {
      expressions = expressions.slice(1);
      hasBeginMarker = true;
    }
    if (
      expressions.at(-1)?.type === "Assertion" &&
      (expressions.at(-1) as Assertion)?.kind === "$"
    ) {
      expressions = expressions.slice(0, -1);
      hasEndMarker = true;
    }

    ast = {
      ...ast,
      type: "Alternative",
      expressions,
    };
  }

  let gbnf = convertAstToGbnf(ast);

  if (!hasBeginMarker) {
    gbnf = `(string-char)* ${gbnf}`;
  }
  if (!hasEndMarker) {
    gbnf = `${gbnf} (string-char){0}`;
  }

  return gbnf;
}
