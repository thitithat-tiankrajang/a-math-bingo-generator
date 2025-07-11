// src/lib/mathBingoLogic.ts
import type { MathBingoOptions, MathBingoResult, MathOperator } from '@/app/types/mathBingo';

/**
 * สร้างโจทย์บิงโกเอแม็ท
 * ฟังก์ชันนี้จะถูกพัฒนาต่อโดยคุณ
 */
export async function generateMathBingo(options: MathBingoOptions): Promise<MathBingoResult> {
  // TODO: ใส่ logic การสร้างโจทย์บิงโกเอแม็ทที่แท้จริงที่นี่
  
  // ตัวอย่างการทำงานเบื้องต้น (จะต้องถูกแทนที่ด้วย logic จริง)
  await new Promise(resolve => setTimeout(resolve, 1000)); // จำลองการทำงาน
  
  const { totalCount, operatorCount, equalsCount } = options;
  const numberCount = totalCount - operatorCount - equalsCount;
  
  // สร้างตัวอย่างผลลัพธ์ (ต้องแทนที่ด้วย logic จริง)
  const elements: string[] = [];
  
  // สร้างตัวเลขตัวอย่าง
  for (let i = 0; i < numberCount; i++) {
    elements.push((Math.floor(Math.random() * 9) + 1).toString());
  }
  
  // สร้างเครื่องหมายคำนวณ
  const operators: MathOperator[] = ['+', '-', '*', '/'];
  for (let i = 0; i < operatorCount; i++) {
    elements.push(operators[Math.floor(Math.random() * operators.length)]);
  }
  
  // สร้างเครื่องหมาย =
  for (let i = 0; i < equalsCount; i++) {
    elements.push('=');
  }
  
  // สับเปลี่ยนลำดับ
  shuffleArray(elements);
  
  return {
    elements,
    sampleEquation: "4*2+5=13", // ตัวอย่าง - ต้องคำนวณจริงจาก elements
  };
}

/**
 * ตรวจสอบว่าชุดตัวเลขและเครื่องหมายสามารถสร้างสมการที่ถูกต้องได้หรือไม่
 */
export function canFormValidEquation(elements: string[]): boolean {
  // TODO: ใส่ logic การตรวจสอบความถูกต้องของสมการ
  return true; // placeholder
}

/**
 * หาสมการที่เป็นไปได้ทั้งหมดจากชุดตัวเลขและเครื่องหมายที่ให้มา
 */
export function findAllPossibleEquations(elements: string[]): string[] {
  // TODO: ใส่ logic การหาสมการที่เป็นไปได้ทั้งหมด
  return ["4*2+5=13"]; // placeholder
}

/**
 * สับเปลี่ยนลำดับของ array
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * ตรวจสอบว่าตัวเลขหรือเครื่องหมายที่ให้มาถูกต้องหรือไม่
 */
export function validateMathBingoOptions(options: MathBingoOptions): string | null {
  const { totalCount, operatorCount, equalsCount } = options;
  
  if (totalCount < 8) {
    return "จำนวนชุดตัวเลขและเครื่องหมายต้องมีอย่างน้อย 8 ตัว";
  }
  
  if (operatorCount < 1) {
    return "ต้องมีเครื่องหมายคำนวณอย่างน้อย 1 ตัว";
  }
  
  if (equalsCount < 1) {
    return "ต้องมีเครื่องหมาย = อย่างน้อย 1 ตัว";
  }
  
  const numberCount = totalCount - operatorCount - equalsCount;
  if (numberCount < 2) {
    return "ต้องมีตัวเลขอย่างน้อย 2 ตัว";
  }
  
  return null; // ไม่มีข้อผิดพลาด
}