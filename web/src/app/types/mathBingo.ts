// src/types/mathBingo.ts

export interface MathBingoOptions {
  totalCount: number;      // จำนวนชุดตัวเลขและเครื่องหมายทั้งหมด (8+)
  operatorMode: 'random' | 'specific'; // โหมดการเลือกเครื่องหมาย
  operatorCount: number;   // จำนวนเครื่องหมายคำนวณทั้งหมด
  specificOperators?: {    // จำนวนเครื่องหมายแต่ละประเภท (ใช้เมื่อ mode = specific)
    plus?: number;         // จำนวน +
    minus?: number;        // จำนวน -
    multiply?: number;     // จำนวน ×
    divide?: number;       // จำนวน ÷
  };
  equalsCount: number;     // จำนวนเครื่องหมาย =
  heavyNumberCount: number; // จำนวนเลขหนัก (10-20)
  wildcardCount: number;   // จำนวน ? (wildcard)
  zeroCount: number;       // จำนวนเลข 0
}

export interface MathBingoResult {
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
  type: 'lightNumber' | 'heavyNumber' | 'operator' | 'choice' | 'equals' | 'wildcard';
}

export interface EquationElement {
  type: 'number' | 'operator' | 'equals' | 'choice' | 'wildcard';
  value: string;
  originalToken: AmathToken;
}