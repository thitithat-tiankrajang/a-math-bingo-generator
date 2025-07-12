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
  const maxAttempts = 2000;

  while (attempts < maxAttempts) {
    try {
      // Reset และสร้าง tokens ใหม่ทุกครั้ง (เพื่อให้ pool รีเซ็ต)
      const tokens = generateTokensBasedOnOptions(options);
      const equations = findValidEquations(tokens);
      
      if (equations.length > 0) {
        return {
          elements: tokens.map(t => t.originalToken),
          sampleEquation: equations[0],
          possibleEquations: equations.slice(0, 10) // แสดงสูงสุด 10 สมการ
        };
      }
    } catch (error) {
      // ถ้าหมด tokens ในพูล ให้ลองใหม่ (pool จะถูก reset อัตโนมัติ)
      console.log(`Attempt ${attempts + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    attempts++;
  }

  throw new Error('ไม่สามารถสร้างโจทย์ที่มีคำตอบได้ กรุณาลองปรับตัวเลือก หรือลดจำนวนชุดตัวเลข/เครื่องหมาย');
}

/**
 * สร้างชุด tokens ตามข้อกำหนดที่เลือก
 */
function generateTokensBasedOnOptions(options: MathBingoOptions): EquationElement[] {
  const { totalCount, operatorCount, equalsCount } = options;
  const numberCount = totalCount - operatorCount - equalsCount;
  
  // สร้าง pool ที่มีจำนวนจริงตามเบี้ยเอแม็ท
  const availablePool = createAvailableTokenPool();
  const selectedTokens: EquationElement[] = [];
  
  // ฟังก์ชันหยิบ token จาก pool
  const pickTokenFromPool = (tokenType: 'equals' | 'operator' | 'light' | 'heavy'): AmathToken | null => {
    let candidates: AmathToken[] = [];
    
    if (tokenType === 'equals') {
      candidates = availablePool.filter(token => token === '=');
    } else if (tokenType === 'operator') {
      candidates = availablePool.filter(token => ['+', '-', '×', '÷'].includes(token));
    } else if (tokenType === 'light') {
      candidates = availablePool.filter(token => ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(token));
    } else if (tokenType === 'heavy') {
      candidates = availablePool.filter(token => ['10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'].includes(token));
    }
    
    if (candidates.length === 0) return null;
    
    // สุ่มเลือก และลบออกจาก pool
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const selectedToken = candidates[randomIndex];
    const poolIndex = availablePool.indexOf(selectedToken);
    if (poolIndex !== -1) {
      availablePool.splice(poolIndex, 1);
    }
    
    return selectedToken;
  };
  
  // หยิบเครื่องหมาย = ตามจำนวนที่กำหนด
  for (let i = 0; i < equalsCount; i++) {
    const token = pickTokenFromPool('equals');
    if (!token) {
      throw new Error('หมดเครื่องหมาย = ในพูล');
    }
    selectedTokens.push(createElementFromToken(token));
  }
  
  // หยิบเครื่องหมายคำนวณ
  for (let i = 0; i < operatorCount; i++) {
    const token = pickTokenFromPool('operator');
    if (!token) {
      throw new Error('หมดเครื่องหมายคำนวณในพูล');
    }
    selectedTokens.push(createElementFromToken(token));
  }
  
  // หยิบตัวเลข (ผสมระหว่างเบาและหนัก)
  const lightCount = Math.floor(numberCount * 0.7);
  const heavyCount = numberCount - lightCount;
  
  // หยิบตัวเลขเบา
  for (let i = 0; i < lightCount; i++) {
    const token = pickTokenFromPool('light');
    if (!token) {
      // ถ้าหมดเลขเบา ให้ลองหยิบเลขหนักแทน
      const heavyToken = pickTokenFromPool('heavy');
      if (!heavyToken) {
        throw new Error('หมดตัวเลขในพูล');
      }
      selectedTokens.push(createElementFromToken(heavyToken));
    } else {
      selectedTokens.push(createElementFromToken(token));
    }
  }
  
  // หยิบตัวเลขหนัก
  for (let i = 0; i < heavyCount; i++) {
    const token = pickTokenFromPool('heavy');
    if (!token) {
      // ถ้าหมดเลขหนัก ให้ลองหยิบเลขเบาแทน
      const lightToken = pickTokenFromPool('light');
      if (!lightToken) {
        throw new Error('หมดตัวเลขในพูล');
      }
      selectedTokens.push(createElementFromToken(lightToken));
    } else {
      selectedTokens.push(createElementFromToken(token));
    }
  }
  
  // เรียงลำดับ tokens ให้สวยงาม
  const sortedTokens = sortTokensByPriority(selectedTokens);
  
  return sortedTokens;
}

/**
 * สร้าง pool ของ tokens ที่สามารถใช้ได้ (ตามจำนวนจริงของเบี้ยเอแม็ท)
 */
function createAvailableTokenPool(): AmathToken[] {
  const pool: AmathToken[] = [];
  
  Object.values(AMATH_TOKENS).forEach(tokenInfo => {
    for (let i = 0; i < tokenInfo.count; i++) {
      pool.push(tokenInfo.token);
    }
  });

  return pool;
}

/**
 * สร้าง EquationElement จาก token
 */
function createElementFromToken(token: AmathToken): EquationElement {
  return {
    type: getElementType(token),
    value: token,
    originalToken: token
  };
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
  
  // สร้างการเรียงลำดับที่เป็นไปได้
  const permutations = generateLimitedPermutations(tokenValues, 1500);
  
  for (const perm of permutations) {
    try {
      const equation = createEquationFromPermutation(perm);
      if (equation && isValidEquationByRules(equation)) {
        validEquations.push(equation);
        if (validEquations.length >= 15) break; // จำกัดจำนวนที่ตรวจสอบ
      }
    } catch {
      continue;
    }
  }

  return [...new Set(validEquations)]; // ลบสมการที่ซ้ำ
}

/**
 * สร้างสมการจากการเรียงลำดับ tokens
 */
function createEquationFromPermutation(tokens: AmathToken[]): string | null {
  const processedTokens: string[] = [];
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const tokenInfo = AMATH_TOKENS[token];
    
    if (!tokenInfo) continue;

    // จัดการ choice tokens
    if (tokenInfo.type === 'choice') {
      const choiceResult = handleChoiceToken(token);
      if (!choiceResult) return null;
      processedTokens.push(choiceResult);
    } 
    // จัดการ wildcard - ให้เป็นตัวเลขง่าย ๆ
    else if (tokenInfo.type === 'wildcard') {
      const wildcardOptions = ['1', '2', '3', '4', '5'];
      const randomWildcard = wildcardOptions[Math.floor(Math.random() * wildcardOptions.length)];
      processedTokens.push(randomWildcard);
    }
    else {
      processedTokens.push(token);
    }
  }
  
  // สร้างสมการโดยการรวม light numbers ที่ติดกัน
  const finalTokens = combineLightNumbers(processedTokens);
  
  // ถ้า combineLightNumbers return empty array แสดงว่าไม่ valid (0 ติดกับ -)
  if (finalTokens.length === 0) {
    return null;
  }
  
  // ตรวจสอบโครงสร้างพื้นฐาน
  if (!isValidTokenStructure(finalTokens)) {
    return null;
  }
  
  return finalTokens.join('');
}

/**
 * รวม light numbers ที่ติดกันเป็นตัวเลขหลายหลัก
 */
function combineLightNumbers(tokens: string[]): string[] {
  const result: string[] = [];
  let i = 0;
  
  while (i < tokens.length) {
    const token = tokens[i];
    
    // เลขหนักต้องแยกเดี่ยวเสมอ และห้ามติดกับเลขอื่น ๆ
    if (isHeavyNumber(token)) {
      // ตรวจสอบว่าเลขหนักไม่ติดกับเลขอื่น ๆ
      const prev = tokens[i - 1];
      const next = tokens[i + 1];
      
      if ((prev && (isLightNumber(prev) || isHeavyNumber(prev))) || 
          (next && (isLightNumber(next) || isHeavyNumber(next)))) {
        return []; // return empty array เพื่อบอกว่าไม่ valid
      }
      
      result.push(token);
      i++;
      continue;
    }
    
    // combine เฉพาะเลขเบาติดกันเท่านั้น
    if (isLightNumber(token)) {
      // ตรวจสอบว่าเลขเบาไม่ติดกับเลขหนัก
      const prev = tokens[i - 1];
      if (prev && isHeavyNumber(prev)) {
        return []; // return empty array เพื่อบอกว่าไม่ valid
      }
      
      let combinedNumber = token;
      let j = i + 1;
      
      // รวมเฉพาะเลขเบาติดกัน ไม่เกิน 3 หลัก
      while (j < tokens.length && j - i < 3 && isLightNumber(tokens[j])) {
        // ตรวจสอบว่าเลขถัดไปไม่ใช่เลขหนัก
        if (j + 1 < tokens.length && isHeavyNumber(tokens[j + 1])) {
          break; // หยุดการรวมถ้าถัดไปเป็นเลขหนัก
        }
        
        // ไม่ให้ 0 นำหน้าตัวเลขอื่น
        if (combinedNumber === '0' && tokens[j] !== '0') {
          break;
        }
        combinedNumber += tokens[j];
        j++;
      }
      
      // ถ้า 0 อยู่ข้างหน้าและมีตัวเลขตามมา ให้ใช้แค่ 0
      if (combinedNumber.startsWith('0') && combinedNumber.length > 1) {
        result.push('0');
        i++;
      } else {
        result.push(combinedNumber);
        i = j;
      }
    } else {
      // อื่น ๆ (operator, =, wildcard, choice)
      result.push(token);
      i++;
    }
  }
  
  // ตรวจสอบเพิ่มเติม: 0 ห้ามติดกับ -
  for (let i = 0; i < result.length - 1; i++) {
    if (result[i] === '0' && result[i + 1] === '-') {
      return [];
    }
    if (result[i] === '-' && result[i + 1] === '0') {
      return [];
    }
  }
  
  return result;
}

/**
 * ตรวจสอบว่าเป็นตัวเลขเบาหรือไม่
 */
function isLightNumber(token: string): boolean {
  return /^[0-9]$/.test(token);
}

/**
 * ตรวจสอบว่าเป็นตัวเลขหนักหรือไม่
 */
function isHeavyNumber(token: string): boolean {
  const num = parseInt(token);
  return num >= 10 && num <= 20;
}

/**
 * ตรวจสอบว่าเป็นเครื่องหมายคำนวณหรือไม่
 */
function isOperator(token: string): boolean {
  return ['+', '-', '×', '÷'].includes(token);
}

/**
 * ตรวจสอบโครงสร้างของ tokens ว่าถูกต้องหรือไม่
 */
function isValidTokenStructure(tokens: string[]): boolean {
  if (tokens.length < 3) return false;
  
  // ต้องมี = อย่างน้อย 1 ตัว
  if (!tokens.includes('=')) return false;
  
  for (let i = 0; i < tokens.length; i++) {
    const current = tokens[i];
    const next = tokens[i + 1];
    const prev = tokens[i - 1];
    
    // ตรวจสอบกฎการติดกัน
    if (isHeavyNumber(current)) {
      // เลขหนักต้องติดกับเครื่องหมายเท่านั้น
      if (prev && !isOperator(prev) && prev !== '=') {
        return false;
      }
      if (next && !isOperator(next) && next !== '=') {
        return false;
      }
    }
    
    // ตรวจสอบเลข 0 ห้ามติดกับ -
    if (current === '0') {
      if (next === '-' || prev === '-') {
        return false;
      }
    }
    
    if (isOperator(current)) {
      // เครื่องหมายห้ามติดกัน ยกเว้น =- 
      if (isOperator(next) && !(current === '=' && next === '-')) {
        return false;
      }
      if (isOperator(prev) && !(prev === '=' && current === '-')) {
        return false;
      }
      
      // + ห้ามอยู่ต้นสมการ
      if (current === '+' && i === 0) {
        return false;
      }
      
      // + ห้ามอยู่หลัง =
      if (current === '+' && prev === '=') {
        return false;
      }
      
      // - ห้ามติดกับ 0
      if (current === '-') {
        if (next === '0' || prev === '0') {
          return false;
        }
      }
    }
    
    if (current === '=') {
      // = ห้ามอยู่ต้นหรือท้ายสมการ
      if (i === 0 || i === tokens.length - 1) {
        return false;
      }
    }
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
 * ตรวจสอบความถูกต้องของสมการตามกฎ
 */
function isValidEquationByRules(equation: string): boolean {
  try {
    // แยกสมการตาม =
    const equalIndex = equation.indexOf('=');
    if (equalIndex === -1) return false;
    
    const leftSide = equation.substring(0, equalIndex);
    const rightSide = equation.substring(equalIndex + 1);
    
    if (leftSide.length === 0 || rightSide.length === 0) return false;
    
    // คำนวณค่าทั้งสองฝั่ง
    const leftValue = evaluateExpressionSafely(leftSide);
    const rightValue = evaluateExpressionSafely(rightSide);
    
    if (leftValue === null || rightValue === null) return false;
    
    // ตรวจสอบว่าผลลัพธ์เท่ากัน
    return Math.abs(leftValue - rightValue) < 0.0001;
  } catch {
    return false;
  }
}

/**
 * คำนวณค่าของ expression อย่างปลอดภัย
 */
function evaluateExpressionSafely(expr: string): number | null {
  try {
    // แทนที่เครื่องหมายเอแม็ท
    const processedExpr = expr.replace(/×/g, '*').replace(/÷/g, '/');
    
    // ตรวจสอบความปลอดภัยของ expression
    if (!/^[0-9+\-*/\s\.]+$/.test(processedExpr)) {
      return null;
    }
    
    // ตรวจสอบหารด้วยศูนย์
    if (processedExpr.includes('/0')) {
      return null;
    }
    
    // คำนวณ
    const result = Function('"use strict"; return (' + processedExpr + ')')();
    
    // ตรวจสอบผลลัพธ์
    if (typeof result !== 'number' || !isFinite(result)) {
      return null;
    }
    
    return result;
  } catch {
    return null;
  }
}

/**
 * สร้างการเรียงลำดับแบบจำกัด
 */
function generateLimitedPermutations<T>(arr: T[], maxCount: number): T[][] {
  if (arr.length <= 1) return [arr];
  
  const permutations: T[][] = [];
  const attempts = Math.min(maxCount, factorial(arr.length));
  
  for (let i = 0; i < attempts; i++) {
    const shuffled = [...arr];
    shuffleArray(shuffled);
    permutations.push(shuffled);
  }
  
  // ลบรายการที่ซ้ำ
  const uniquePermutations: T[][] = [];
  const seen = new Set<string>();
  
  for (const perm of permutations) {
    const key = perm.join(',');
    if (!seen.has(key)) {
      seen.add(key);
      uniquePermutations.push(perm);
    }
  }
  
  return uniquePermutations;
}

/**
 * คำนวณแฟกทอเรียล
 */
function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= Math.min(n, 10); i++) { // จำกัดไม่เกิน 10!
    result *= i;
  }
  return result;
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
 * เรียงลำดับ tokens ตาม priority ที่กำหนด
 */
function sortTokensByPriority(tokens: EquationElement[]): EquationElement[] {
  return tokens.sort((a, b) => {
    const priorityA = getTokenPriority(a.originalToken);
    const priorityB = getTokenPriority(b.originalToken);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // ถ้า priority เท่ากัน ให้เรียงตามค่า
    return compareTokenValues(a.originalToken, b.originalToken);
  });
}

/**
 * กำหนด priority ของแต่ละประเภท token
 */
function getTokenPriority(token: AmathToken): number {
  const tokenInfo = AMATH_TOKENS[token];
  if (!tokenInfo) return 999;
  
  switch (tokenInfo.type) {
    case 'lightNumber': return 1;   // เลขเบา 0-9
    case 'heavyNumber': return 2;   // เลขหนัก 10-20
    case 'operator': return 3;      // บวกลบคูณหาร
    case 'choice': return 4;        // บวกหรือลบ, คูณหรือหาร
    case 'equals': return 5;        // เท่ากับ
    case 'wildcard': return 6;      // ?
    default: return 999;
  }
}

/**
 * เปรียบเทียบค่าของ token ในกลุ่มเดียวกัน
 */
function compareTokenValues(a: AmathToken, b: AmathToken): number {
  const aInfo = AMATH_TOKENS[a];
  const bInfo = AMATH_TOKENS[b];
  
  // เลขเบาและเลขหนัก เรียงตามค่าตัวเลข
  if ((aInfo.type === 'lightNumber' || aInfo.type === 'heavyNumber') &&
      (bInfo.type === 'lightNumber' || bInfo.type === 'heavyNumber')) {
    return parseInt(a) - parseInt(b);
  }
  
  // เครื่องหมายคำนวณ เรียงตาม +, -, ×, ÷
  if (aInfo.type === 'operator' && bInfo.type === 'operator') {
    const operatorOrder = ['+', '-', '×', '÷'];
    return operatorOrder.indexOf(a) - operatorOrder.indexOf(b);
  }
  
  // เครื่องหมายทางเลือก เรียงตาม +/-, ×/÷
  if (aInfo.type === 'choice' && bInfo.type === 'choice') {
    const choiceOrder = ['+/-', '×/÷'];
    return choiceOrder.indexOf(a) - choiceOrder.indexOf(b);
  }
  
  // อื่น ๆ เรียงตาม string
  return a.localeCompare(b);
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
  
  // ตรวจสอบว่าจำนวนที่ขอมีใน pool หรือไม่
  const totalAvailableTokens = Object.values(AMATH_TOKENS).reduce((sum, token) => sum + token.count, 0);
  if (totalCount > totalAvailableTokens) {
    return `จำนวนชุดที่ขอ (${totalCount}) เกินจำนวนเบี้ยที่มี (${totalAvailableTokens})`;
  }
  
  // ตรวจสอบเครื่องหมาย =
  const availableEquals = AMATH_TOKENS['='].count;
  if (equalsCount > availableEquals) {
    return `จำนวนเครื่องหมาย = ที่ขอ (${equalsCount}) เกินจำนวนที่มี (${availableEquals})`;
  }
  
  // ตรวจสอบเครื่องหมายคำนวณ
  const availableOperators = AMATH_TOKENS['+'].count + AMATH_TOKENS['-'].count + 
                            AMATH_TOKENS['×'].count + AMATH_TOKENS['÷'].count;
  if (operatorCount > availableOperators) {
    return `จำนวนเครื่องหมายคำนวณที่ขอ (${operatorCount}) เกินจำนวนที่มี (${availableOperators})`;
  }
  
  // ตรวจสอบตัวเลข
  const availableNumbers = Object.entries(AMATH_TOKENS)
    .filter(([, info]) => info.type === 'lightNumber' || info.type === 'heavyNumber')
    .reduce((sum, [, info]) => sum + info.count, 0);
  if (numberCount > availableNumbers) {
    return `จำนวนตัวเลขที่ขอ (${numberCount}) เกินจำนวนที่มี (${availableNumbers})`;
  }
  
  return null;
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