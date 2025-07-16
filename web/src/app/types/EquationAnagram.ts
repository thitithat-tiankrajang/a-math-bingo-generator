// src/types/EquationAnagram.ts

export interface EquationAnagramOptions {
  totalCount: number;
  operatorMode: 'random' | 'specific';
  operatorCount: number;
  specificOperators?: {
    plus?: number;
    minus?: number;
    multiply?: number;
    divide?: number;
  };
  equalsCount: number;
  heavyNumberCount: number;
  BlankCount: number;
  zeroCount: number;
  operatorCounts?: {
    '+': number;
    '-': number;
    '×': number;
    '÷': number;
  };
  operatorFixed?: {
    '+': number|null;
    '-': number|null;
    '×': number|null;
    '÷': number|null;
  };
}

export type OperatorSymbol = '+' | '-' | '×' | '÷';
export interface PopupEquationAnagramOptions extends EquationAnagramOptions {
  operatorMode: 'random' | 'specific';
  operatorList?: OperatorSymbol[];
  operatorCounts?: { [op in OperatorSymbol]: number };
  operatorFixed?: {
    '+': number|null;
    '-': number|null;
    '×': number|null;
    '÷': number|null;
  };
}
export interface OptionSet {
  options: PopupEquationAnagramOptions;
  numQuestions: number;
}

export interface EquationAnagramResult {
  elements: string[];           // ชุดตัวเลขและเครื่องหมายที่สร้างขึ้น
  sampleEquation?: string;      // ตัวอย่างสมการที่เป็นไปได้
  possibleEquations?: string[]; // สมการที่เป็นไปได้ทั้งหมด (ถ้าต้องการ)
}

export type AmathToken = 
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | '10' | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' | '20'
  | '+' | '-' | '×' | '÷' | '+/-' | '×/÷' | '=' | '?';

export interface AmathTokenInfo {
  token: AmathToken;
  count: number;
  type: 'lightNumber' | 'heavyNumber' | 'operator' | 'choice' | 'equals' | 'Blank';
  point: number;
}

export interface EquationElement {
  type: 'number' | 'operator' | 'equals' | 'choice' | 'Blank';
  value: string;
  originalToken: AmathToken;
}