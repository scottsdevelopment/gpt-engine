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
