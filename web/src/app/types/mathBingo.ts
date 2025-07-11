// src/types/mathBingo.ts

export interface MathBingoOptions {
    totalCount: number;      // จำนวนชุดตัวเลขและเครื่องหมายทั้งหมด (8+)
    operatorCount: number;   // จำนวนเครื่องหมายคำนวณ (+, -, *, /)
    equalsCount: number;     // จำนวนเครื่องหมาย =
  }
  
  export interface MathBingoResult {
    elements: string[];           // ชุดตัวเลขและเครื่องหมายที่สร้างขึ้น
    sampleEquation?: string;      // ตัวอย่างสมการที่เป็นไปได้
    possibleEquations?: string[]; // สมการที่เป็นไปได้ทั้งหมด (ถ้าต้องการ)
  }
  
  export type MathOperator = '+' | '-' | '*' | '/';
  
  export interface EquationElement {
    type: 'number' | 'operator' | 'equals';
    value: string;
  }