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
    '+/-': number|null;
    '×/÷': number|null;
  };
  // เพิ่มโหมด random/specific สำหรับแต่ละ section
  equalsMode?: 'random' | 'specific';
  equalsMin?: number;
  equalsMax?: number;
  heavyNumberMode?: 'random' | 'specific';
  heavyNumberMin?: number;
  heavyNumberMax?: number;
  blankMode?: 'random' | 'specific';
  blankMin?: number;
  blankMax?: number;
  zeroMode?: 'random' | 'specific';
  zeroMin?: number;
  zeroMax?: number;
  // เพิ่ม min/max สำหรับ operator random
  operatorMin?: number;
  operatorMax?: number;
  // เพิ่ม randomSettings สำหรับ toggle random ของแต่ละ field
  randomSettings?: {
    operators: boolean;
    equals: boolean;
    heavy: boolean;
    blank: boolean;
    zero: boolean;
  };
}

export type OperatorSymbol = '+' | '-' | '×' | '÷' | '+/-' | '×/÷';
export interface PopupEquationAnagramOptions extends EquationAnagramOptions {
  operatorMode: 'random' | 'specific';
  operatorFixed?: {
    '+': number|null;
    '-': number|null;
    '×': number|null;
    '÷': number|null;
    '+/-': number|null;
    '×/÷': number|null;
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