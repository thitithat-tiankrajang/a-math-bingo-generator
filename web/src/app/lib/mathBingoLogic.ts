// src/lib/mathBingoLogic.ts
import type { MathBingoOptions, MathBingoResult, AmathToken, AmathTokenInfo, EquationElement } from '@/app/types/mathBingo';

// เบี้ยเอแม็ททั้งหมด 100 ตัว
const AMATH_TOKENS: Record<AmathToken, AmathTokenInfo> = {
  '0': { token: '0', count: 4, type: 'lightNumber' },
  '1': { token: '1', count: 6, type: 'lightNumber' },
  '2': { token: '2', count: 6, type: 'lightNumber' },
  '3': { token: '3', count: 5, type: 'lightNumber' },
  '4': { token: '4', count: 5, type: 'lightNumber' },
  '5': { token: '5', count: 4, type: 'lightNumber' },
  '6': { token: '6', count: 4, type: 'lightNumber' },
  '7': { token: '7', count: 4, type: 'lightNumber' },
  '8': { token: '8', count: 4, type: 'lightNumber' },
  '9': { token: '9', count: 4, type: 'lightNumber' },
  '10': { token: '10', count: 2, type: 'heavyNumber' },
  '11': { token: '11', count: 1, type: 'heavyNumber' },
  '12': { token: '12', count: 2, type: 'heavyNumber' },
  '13': { token: '13', count: 1, type: 'heavyNumber' },
  '14': { token: '14', count: 1, type: 'heavyNumber' },
  '15': { token: '15', count: 1, type: 'heavyNumber' },
  '16': { token: '16', count: 1, type: 'heavyNumber' },
  '17': { token: '17', count: 1, type: 'heavyNumber' },
  '18': { token: '18', count: 1, type: 'heavyNumber' },
  '19': { token: '19', count: 1, type: 'heavyNumber' },
  '20': { token: '20', count: 1, type: 'heavyNumber' },
  '+': { token: '+', count: 4, type: 'operator' },
  '-': { token: '-', count: 4, type: 'operator' },
  '×': { token: '×', count: 4, type: 'operator' },
  '÷': { token: '÷', count: 4, type: 'operator' },
  '+/-': { token: '+/-', count: 5, type: 'choice' },
  '×/÷': { token: '×/÷', count: 4, type: 'choice' },
  '=': { token: '=', count: 11, type: 'equals' },
  '?': { token: '?', count: 4, type: 'wildcard' }
};

/**
 * สร้างโจทย์บิงโกเอแม็ทตามกฎของเอแม็ท
 */
export async function generateMathBingo(options: MathBingoOptions): Promise<MathBingoResult> {
  const validation = validateMathBingoOptions(options);
  if (validation) {
    throw new Error(validation);
  }

  let attempts = 0;
  const maxAttempts = 1000;

  while (attempts < maxAttempts) {
    try {
      const tokens = generateRandomTokens(options);
      const equations = findValidEquations(tokens);
      
      if (equations.length > 0) {
        return {
          elements: tokens.map(t => t.originalToken),
          sampleEquation: equations[0],
          possibleEquations: equations.slice(0, 5) // แสดงสูงสุด 5 สมการ
        };
      }
    } catch (error) {
      // ลองใหม่
    }
    attempts++;
  }

  throw new Error('ไม่สามารถสร้างโจทย์ที่มีคำตอบได้ กรุณาลองปรับตัวเลือก');
}

/**
 * สร้างชุด tokens แบบสุ่มตามข้อกำหนด
 */
function generateRandomTokens(options: MathBingoOptions): EquationElement[] {
  const { totalCount } = options;
  const availableTokens = createTokenPool();
  const selectedTokens: EquationElement[] = [];

  // เลือก tokens แบบสุ่ม
  for (let i = 0; i < totalCount; i++) {
    if (availableTokens.length === 0) {
      throw new Error('หมดเบี้ยที่ใช้ได้');
    }

    const randomIndex = Math.floor(Math.random() * availableTokens.length);
    const token = availableTokens[randomIndex];
    
    selectedTokens.push({
      type: getElementType(token),
      value: token,
      originalToken: token as AmathToken
    });

    const currentCount = availableTokens.filter(t => t === token).length;
    if (currentCount <= 1) {
      availableTokens.splice(randomIndex, 1);
    } else {
      availableTokens.splice(randomIndex, 1);
    }
  }

  return selectedTokens;
}

/**
 * สร้าง pool ของ tokens ที่สามารถใช้ได้
 */
function createTokenPool(): AmathToken[] {
  const pool: AmathToken[] = [];
  
  Object.values(AMATH_TOKENS).forEach(tokenInfo => {
    for (let i = 0; i < tokenInfo.count; i++) {
      pool.push(tokenInfo.token);
    }
  });

  return pool;
}

/**
 * กำหนดประเภทของ element
 */
function getElementType(token: string): EquationElement['type'] {
  const tokenInfo = AMATH_TOKENS[token as AmathToken];
  if (!tokenInfo) return 'wildcard';
  
  switch (tokenInfo.type) {
    case 'lightNumber':
    case 'heavyNumber':
      return 'number';
    case 'operator':
      return 'operator';
    case 'equals':
      return 'equals';
    case 'choice':
      return 'choice';
    case 'wildcard':
      return 'wildcard';
    default:
      return 'wildcard';
  }
}

/**
 * หาสมการที่ถูกต้องจาก tokens ที่ให้มา
 */
function findValidEquations(tokens: EquationElement[]): string[] {
  const validEquations: string[] = [];
  const tokenValues = tokens.map(t => t.originalToken);
  
  // สร้างการเรียงลำดับที่เป็นไปได้ทั้งหมด
  const permutations = generatePermutations(tokenValues);
  
  for (const perm of permutations) {
    try {
      const equation = createEquationFromTokens(perm);
      if (equation && isValidEquation(equation)) {
        validEquations.push(equation);
        if (validEquations.length >= 10) break; // จำกัดจำนวนที่ตรวจสอบ
      }
    } catch {
      // ข้ามถ้ามีข้อผิดพลาด
      continue;
    }
  }

  return validEquations;
}

/**
 * สร้างสมการจาก tokens
 */
function createEquationFromTokens(tokens: AmathToken[]): string | null {
  let equation = '';
  let lastTokenType = '';

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const tokenInfo = AMATH_TOKENS[token];
    
    if (!tokenInfo) continue;

    // ตรวจสอบกฎการต่อ token
    if (!canConnectTokens(lastTokenType, tokenInfo.type, equation, token)) {
      return null;
    }

    // จัดการ choice tokens
    if (tokenInfo.type === 'choice') {
      const choiceResult = handleChoiceToken(token);
      if (!choiceResult) return null;
      equation += choiceResult;
    } 
    // จัดการ wildcard
    else if (tokenInfo.type === 'wildcard') {
      const wildcardResult = handleWildcardToken(lastTokenType);
      if (!wildcardResult) return null;
      equation += wildcardResult;
    }
    // จัดการ light numbers (0-9) - สามารถรวมกันเป็นหลักสิบ/ร้อย
    else if (tokenInfo.type === 'lightNumber') {
      const nextToken = i + 1 < tokens.length ? tokens[i + 1] : null;
      const nextNextToken = i + 2 < tokens.length ? tokens[i + 2] : null;
      
      // ตรวจสอบการต่อเป็นหลักร้อย
      if (canFormThreeDigitNumber(token, nextToken, nextNextToken)) {
        equation += token + nextToken + nextNextToken;
        i += 2; // ข้าม 2 tokens ถัดไป
      }
      // ตรวจสอบการต่อเป็นหลักสิบ
      else if (canFormTwoDigitNumber(token, nextToken)) {
        equation += token + nextToken;
        i += 1; // ข้าม 1 token ถัดไป
      }
      else {
        equation += token;
      }
    }
    else {
      equation += token;
    }

    lastTokenType = tokenInfo.type;
  }

  return equation.length > 0 ? equation : null;
}

/**
 * ตรวจสอบว่าสามารถต่อ tokens ได้หรือไม่
 */
function canConnectTokens(lastType: string, currentType: string, currentEquation: string, currentToken: AmathToken): boolean {
  // กฎการต่อ tokens ตามเอแม็ท
  
  // Heavy numbers (10-20) ต่อได้แค่กับเครื่องหมาย
  if (currentType === 'heavyNumber') {
    return lastType === '' || lastType === 'operator' || lastType === 'equals' || 
           (lastType === 'operator' && currentEquation.endsWith('-')); // =- case
  }

  // เครื่องหมายต่อกันได้แค่กรณี =-
  if (currentType === 'operator' && lastType === 'equals' && currentToken === '-') {
    return true;
  }

  if (currentType === 'operator' && lastType === 'operator') {
    return false;
  }

  return true;
}

/**
 * จัดการ choice token (+/- หรือ ×/÷)
 */
function handleChoiceToken(token: AmathToken): string | null {
  if (token === '+/-') {
    return Math.random() < 0.5 ? '+' : '-';
  } else if (token === '×/÷') {
    return Math.random() < 0.5 ? '×' : '÷';
  }
  return null;
}

/**
 * จัดการ wildcard token (?)
 */
function handleWildcardToken(lastType: string): string | null {
  // เลือก token ที่เหมาะสมตาม context
  const suitableTokens: AmathToken[] = [];
  
  if (lastType === '' || lastType === 'operator' || lastType === 'equals') {
    // ต้องการตัวเลข
    suitableTokens.push('1', '2', '3', '4', '5');
  } else if (lastType === 'lightNumber' || lastType === 'heavyNumber') {
    // ต้องการเครื่องหมาย
    suitableTokens.push('+', '-', '×', '÷', '=');
  }

  if (suitableTokens.length === 0) {
    suitableTokens.push('1'); // fallback
  }

  return suitableTokens[Math.floor(Math.random() * suitableTokens.length)];
}

/**
 * ตรวจสอบว่าสามารถสร้างเลขสามหลักได้หรือไม่
 */
function canFormThreeDigitNumber(first: AmathToken | null, second: AmathToken | null, third: AmathToken | null): boolean {
  if (!first || !second || !third) return false;
  
  const firstInfo = AMATH_TOKENS[first];
  const secondInfo = AMATH_TOKENS[second];
  const thirdInfo = AMATH_TOKENS[third];
  
  // ต้องเป็น light number ทั้งหมด
  if (firstInfo?.type !== 'lightNumber' || secondInfo?.type !== 'lightNumber' || thirdInfo?.type !== 'lightNumber') {
    return false;
  }

  // 0 ห้ามอยู่หน้าสุด
  return first !== '0';
}

/**
 * ตรวจสอบว่าสามารถสร้างเลขสองหลักได้หรือไม่
 */
function canFormTwoDigitNumber(first: AmathToken | null, second: AmathToken | null): boolean {
  if (!first || !second) return false;
  
  const firstInfo = AMATH_TOKENS[first];
  const secondInfo = AMATH_TOKENS[second];
  
  // ต้องเป็น light number ทั้งคู่
  if (firstInfo?.type !== 'lightNumber' || secondInfo?.type !== 'lightNumber') {
    return false;
  }

  // 0 ห้ามอยู่หน้าสุด
  return first !== '0';
}

/**
 * ตรวจสอบความถูกต้องของสมการ
 */
function isValidEquation(equation: string): boolean {
  try {
    // แยกสมการตาม =
    const parts = equation.split('=');
    if (parts.length !== 2) return false;

    const leftSide = parts[0].trim();
    const rightSide = parts[1].trim();

    // คำนวณค่าทั้งสองฝั่ง
    const leftValue = evaluateExpression(leftSide);
    const rightValue = evaluateExpression(rightSide);

    return Math.abs(leftValue - rightValue) < 0.0001; // ป้องกัน floating point error
  } catch {
    return false;
  }
}

/**
 * คำนวณค่าของ expression
 */
function evaluateExpression(expr: string): number {
  // แทนที่เครื่องหมายเอแม็ท
  const processedExpr = expr.replace(/×/g, '*').replace(/÷/g, '/');
  
  try {
    // ใช้ Function constructor เพื่อความปลอดภัย
    return Function('"use strict"; return (' + processedExpr + ')')();
  } catch {
    throw new Error('Invalid expression');
  }
}

/**
 * สร้างการเรียงลำดับที่เป็นไปได้ (จำกัดจำนวนเพื่อประสิทธิภาพ)
 */
function generatePermutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  if (arr.length > 8) {
    // ถ้ามีมากเกินไป ให้สุ่มแค่บางส่วน
    const permutations: T[][] = [];
    for (let i = 0; i < 1000; i++) {
      const shuffled = [...arr];
      shuffleArray(shuffled);
      permutations.push(shuffled);
    }
    return permutations;
  }

  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    const restPermutations = generatePermutations(rest);
    for (const perm of restPermutations) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}

/**
 * ตรวจสอบว่าชุดตัวเลขและเครื่องหมายสามารถสร้างสมการที่ถูกต้องได้หรือไม่
 */
export function canFormValidEquation(elements: string[]): boolean {
  try {
    const tokens: EquationElement[] = elements.map(el => ({
      type: getElementType(el),
      value: el,
      originalToken: el as AmathToken
    }));
    
    const equations = findValidEquations(tokens);
    return equations.length > 0;
  } catch {
    return false;
  }
}

/**
 * หาสมการที่เป็นไปได้ทั้งหมดจากชุดตัวเลขและเครื่องหมายที่ให้มา
 */
export function findAllPossibleEquations(elements: string[]): string[] {
  try {
    const tokens: EquationElement[] = elements.map(el => ({
      type: getElementType(el),
      value: el,
      originalToken: el as AmathToken
    }));
    
    return findValidEquations(tokens);
  } catch {
    return [];
  }
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
 * ตรวจสอบความถูกต้องของตัวเลือก
 */
export function validateMathBingoOptions(options: MathBingoOptions): string | null {
  const { totalCount, operatorCount, equalsCount } = options;
  
  if (totalCount < 8) {
    return "จำนวนชุดตัวเลขและเครื่องหมายต้องมีอย่างน้อย 8 ตัว";
  }
  
  if (totalCount > 20) {
    return "จำนวนชุดตัวเลขและเครื่องหมายต้องไม่เกิน 20 ตัว";
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
  
  return null;
}