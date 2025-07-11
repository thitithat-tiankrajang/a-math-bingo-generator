// src/lib/mathBingoLogic.ts - Updated to support specific operator selection
import type { MathBingoOptions, MathBingoResult, AmathToken, AmathTokenInfo, EquationElement } from '@/app/types/mathBingo';

// All AMath tiles, total 100
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

// เพิ่มอินเตอร์เฟซสำหรับเศษส่วน
interface Fraction {
  numerator: number;
  denominator: number;
}

/**
 * Generate AMath bingo problem based on options
 */
export async function generateMathBingo(options: MathBingoOptions): Promise<MathBingoResult> {
  const validation = validateMathBingoOptions(options);
  if (validation) {
    throw new Error(validation);
  }

  let attempts = 0;
  const maxAttempts = 300; // เพิ่มจำนวนครั้งในการลอง

  while (attempts < maxAttempts) {
    try {
      // Reset and generate tokens for each attempt (reset pool)
      const tokens = generateTokensBasedOnOptions(options);
      // log ชุดตัวเบี้ยที่สุ่มได้
      // console.log('Attempt', attempts + 1, 'tokens:', tokens.map(t => t.originalToken).join(' '));
      const equations = findValidEquations(tokens, options.equalsCount);
      
      if (equations.length > 0) {
        return {
          elements: tokens.map(t => t.originalToken),
          sampleEquation: equations[0],
          possibleEquations: equations.slice(0, 10) // Show up to 10 equations
        };
      }
    } catch (error) {
      // If token selection fails, reset pool and try again
      console.log(`Attempt ${attempts + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    attempts++;
  }

  throw new Error('Could not generate a valid problem. Please adjust your options or reduce the number of tiles/operators.');
}

/**
 * Find valid equations from given tokens - แก้ไขให้รองรับ = หลายตัว
 */
function findValidEquations(tokens: EquationElement[], equalsCount: number): string[] {
  const validEquations: string[] = [];
  const tokenValues = tokens.map(t => t.originalToken);
  
  // Generate possible permutations
  const permutations = generateLimitedPermutations(tokenValues, 10000); // เพิ่มจำนวน permutations
  
  for (const perm of permutations) {
    try {
      const equation = createEquationFromPermutation(perm, equalsCount);
      if (equation && isValidEquationByRules(equation, equalsCount)) {
        validEquations.push(equation);
        if (validEquations.length >= 20) break; // หยุดเมื่อพบ 20 สมการ
      }
    } catch {
      // Skip invalid permutations
      continue;
    }
  }
  
  return validEquations;
}

/**
 * Create equation from permutation - แก้ไขให้รองรับ = หลายตัว
 */
function createEquationFromPermutation(tokens: AmathToken[], equalsCount: number): string | null {
  const processed = combineAdjacentNumbers(tokens);
  if (processed.length === 0) return null;
  
  if (!isValidTokenStructure(processed, equalsCount)) return null;
  
  let equation = processed.join('');
  
  // Handle choice tokens
  equation = equation.replace(/\+\/-/g, () => Math.random() < 0.5 ? '+' : '-');
  equation = equation.replace(/×\/÷/g, () => Math.random() < 0.5 ? '×' : '÷');
  
  return equation;
}

/**
 * Combine adjacent numbers with improved logic - แก้ไขให้ป้องกันหลักพันและเข้มงวดขึ้น
 */
function combineAdjacentNumbers(tokens: AmathToken[]): string[] {
  const result: string[] = [];
  let i = 0;
  
  while (i < tokens.length) {
    const token = tokens[i];
    
    // Heavy numbers (10-20) ต้องอยู่แยกเดี่ยวเสมอ
    if (isHeavyNumber(token)) {
      // ตรวจสอบว่าไม่ได้อยู่ติดกับเลขอื่น (เข้มงวดขึ้น)
      const prev = result[result.length - 1];
      const next = tokens[i + 1];
      
      if ((prev && (isLightNumber(prev) || isHeavyNumber(prev) || prev === '0')) || 
          (next && (isLightNumber(next) || isHeavyNumber(next) || next === '0'))) {
        return []; // ส่งกลับ array ว่างเพื่อบอกว่าไม่ถูกต้อง
      }
      
      result.push(token);
      i++;
      continue;
    }
    
    // Light numbers (1-9) และ 0 สามารถรวมกันได้ แต่จำกัดไม่เกิน 3 หลัก
    if (isLightNumber(token) || token === '0') {
      // ตรวจสอบว่าไม่ได้อยู่ติดกับ heavy number
      const prev = result[result.length - 1];
      if (prev && isHeavyNumber(prev)) {
        return []; // ไม่ถูกต้อง
      }
      
      let combinedNumber = token;
      let j = i + 1;
      
      // รวมเลขที่อยู่ติดกัน แต่จำกัดไม่เกิน 3 หลัก (เข้มงวดขึ้น)
      while (j < tokens.length && (isLightNumber(tokens[j]) || tokens[j] === '0')) {
        // **1. ตรวจสอบว่าไม่เกิน 3 หลัก (ก่อนรวม) - STRICT**
        if (combinedNumber.length >= 3) {
          break; // หยุดทันทีเมื่อถึง 3 หลักแล้ว
        }
        
        // **2. ตรวจสอบว่าตัวต่อไปไม่ใช่ heavy number**
        if (j + 1 < tokens.length && isHeavyNumber(tokens[j + 1])) {
          break;
        }
        
        // **3. ป้องกัน 0 นำหน้าเลขอื่น (เช่น 01, 02) - STRICT**
        if (combinedNumber === '0' && tokens[j] !== '0') {
          break; // ไม่อนุญาตให้ 0 นำหน้าเลขอื่น
        }
        
        // **4. ป้องกัน 0 อยู่ตำแหน่งแรกของเลขหลายหลัก - STRICT**
        if (combinedNumber.startsWith('0') && combinedNumber.length >= 1) {
          break; // หยุดทันทีถ้าขึ้นต้นด้วย 0 แล้ว
        }
        
        // **5. ตรวจสอบค่าตัวเลขที่จะได้ไม่เกิน 999**
        const tempCombined = combinedNumber + tokens[j];
        const numValue = parseInt(tempCombined);
        if (numValue > 999) {
          break; // หยุดถ้าจะเกิน 999
        }
        
        // **6. ป้องกันการสร้างเลขที่มากกว่า 3 หลัก - STRICT**
        if (tempCombined.length > 3) {
          break;
        }
        
        // **7. ป้องกันการสร้างเลขที่ขึ้นต้นด้วย 0 หลายหลัก - STRICT**
        if (tempCombined.startsWith('0') && tempCombined.length > 1) {
          break; // ห้าม 01, 02, 012, 0144 เป็นต้น
        }
        
        combinedNumber += tokens[j];
        j++;
      }
      
      // จัดการกรณี 0 พิเศษ
      if (combinedNumber.startsWith('0') && combinedNumber.length > 1) {
        result.push('0');
        i++;
      } else {
        result.push(combinedNumber);
        i = j;
      }
    } else {
      // สัญลักษณ์อื่น ๆ (operators, =, wildcard, choice)
      result.push(token);
      i++;
    }
  }
  
  // **การตรวจสอบเพิ่มเติมหลังจากรวมเลขแล้ว**
  for (let i = 0; i < result.length; i++) {
    const current = result[i];
    
    // 1. ตรวจสอบว่าไม่มีเลขที่เกิน 3 หลัก
    if (isNumber(current) && current.length > 3) {
      return []; // ไม่ถูกต้อง
    }
    
    // 2. ตรวจสอบว่าไม่มีเลขที่เกิน 999
    if (isNumber(current) && parseInt(current) > 999) {
      return []; // ไม่ถูกต้อง
    }
    
    // 3. ตรวจสอบ 0 ไม่อยู่ติดกับ -
    if (current === '0') {
      const next = result[i + 1];
      const prev = result[i - 1];
      if (next === '-' || prev === '-') {
        return [];
      }
    }
  }
  
  return result;
}

/**
 * Check if token structure is valid - แก้ไขให้รองรับ = หลายตัว
 */
function isValidTokenStructure(tokens: string[], equalsCount: number): boolean {
  if (tokens.length < 3) return false;
  
  // Must have exact number of = as specified
  const equalsInTokens = tokens.filter(t => t === '=').length;
  if (equalsInTokens !== equalsCount) return false;
  
  // **แก้ไข: ตรวจสอบโครงสร้างสำหรับ = หลายตัว**
  if (equalsCount > 1) {
    // สำหรับ = หลายตัว ต้องมีรูปแบบ: expression = expression = expression
    const parts = tokens.join('').split('=');
    if (parts.length !== equalsCount + 1) return false;
    
    // แต่ละส่วนต้องไม่ว่าง และมีอย่างน้อย 1 ตัวเลข
    for (const part of parts) {
      if (part.length === 0) return false;
      if (!/\d/.test(part)) return false; // ต้องมีเลขอย่างน้อย 1 ตัว
    }
  }
  
  for (let i = 0; i < tokens.length; i++) {
    const current = tokens[i];
    const next = tokens[i + 1];
    const prev = tokens[i - 1];
    
    // Check adjacency rules
    if (isHeavyNumber(current)) {
      // Heavy numbers must be adjacent to operators only
      if (prev && !isOperator(prev) && prev !== '=') {
        return false;
      }
      if (next && !isOperator(next) && next !== '=') {
        return false;
      }
    }
    
    // Check for 0 adjacent to -
    if (current === '0') {
      if (next === '-' || prev === '-') {
        return false;
      }
    }
    
    if (isOperator(current)) {
      // Operators should not be adjacent, except for =-
      if (isOperator(next) && !(current === '=' && next === '-')) {
        return false;
      }
      if (isOperator(prev) && !(prev === '=' && current === '-')) {
        return false;
      }
      
      // + should not be at the beginning of the equation
      if (current === '+' && i === 0) {
        return false;
      }
      
      // + should not be after =
      if (current === '+' && prev === '=') {
        return false;
      }
      
      // - should not be adjacent to 0
      if (current === '-') {
        if (next === '0' || prev === '0') {
          return false;
        }
      }
    }
    
    if (current === '=') {
      // = should not be at the beginning or end of the equation
      if (i === 0 || i === tokens.length - 1) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Check if equation is valid according to rules - แก้ไขให้ใช้เศษส่วนแทนทศนิยม
 */
function isValidEquationByRules(equation: string, equalsCount: number): boolean {
  try {
    // **แก้ไข: รองรับ = หลายตัว และใช้เศษส่วน**
    const parts = equation.split('=');
    if (parts.length !== equalsCount + 1) return false;
    
    if (parts.some(part => part.length === 0)) return false;
    
    // Calculate values for all parts using fractions
    const fractions: Fraction[] = [];
    for (const part of parts) {
      const fraction = evaluateExpressionAsFraction(part);
      if (!fraction) return false;
      fractions.push(fraction);
    }
    
    // Check if all fractions are equal
    const firstFraction = fractions[0];
    return fractions.every(fraction => compareFractions(fraction, firstFraction));
  } catch {
    return false;
  }
}

function evaluateExpressionAsFraction(expression: string): Fraction | null {
    try {
      // ลบ whitespace
      expression = expression.trim().replace(/\s/g, '');
      
      // ตรวจสอบความปลอดภัยของนิพจน์
      if (!/^[0-9+\-×÷\.]+$/.test(expression)) {
        return null;
      }
      
      // **ตรวจสอบเลขที่ขึ้นต้นด้วย 0 ในสมการ - STRICT**
      if (containsInvalidZeroLeadingNumbers(expression)) {
        return null; // ปฏิเสธถ้าพบเลขขึ้นต้นด้วย 0
      }
      
      // แปลงเลขเดี่ยวเป็นเศษส่วน
      if (/^\d+$/.test(expression)) {
        // ตรวจสอบเลขเดี่ยวว่าไม่ขึ้นต้นด้วย 0 (ยกเว้น 0 เดี่ยว)
        if (expression.length > 1 && expression.startsWith('0')) {
          return null;
        }
        return { numerator: parseInt(expression), denominator: 1 };
      }
      
      // แปลงนิพจน์ที่ซับซ้อนเป็นเศษส่วน (คำนวณตามลำดับความสำคัญ)
      return evaluateLeftToRight(expression);
    } catch {
      return null;
    }
}

/**
 * ตรวจสอบว่ามีเลขที่ขึ้นต้นด้วย 0 ในสมการหรือไม่ (เช่น 01, 02, 0247)
 */
function containsInvalidZeroLeadingNumbers(expression: string): boolean {
  // หาตัวเลขทั้งหมดในสมการ
  const numbers = expression.match(/\d+/g);
  if (!numbers) return false;
  
  for (const num of numbers) {
    // ถ้าเลขยาวกว่า 1 หลักและขึ้นต้นด้วย 0 = ผิด
    if (num.length > 1 && num.startsWith('0')) {
      return true; // พบเลขผิดรูปแบบ เช่น 01, 02, 0247
    }
    // ถ้าเลขเกิน 3 หลัก = ผิด
    if (num.length > 3) {
      return true; // พบเลขเกิน 3 หลัก เช่น 1234, 0247
    }
  }
  
  return false;
}

/**
 * คำนวณนิพจน์ตามลำดับความสำคัญ (คูณหารก่อน บวกลบทีหลัง)
 */
function evaluateLeftToRight(expression: string): Fraction | null {
  try {
    // แยก tokens (numbers และ operators)
    const tokens = tokenizeExpression(expression);
    if (!tokens || tokens.length === 0) return null;
    
    // ตรวจสอบว่าเริ่มต้นด้วยตัวเลข
    if (isNaN(parseInt(tokens[0]))) return null;
    
    // แปลงตัวเลขเป็นเศษส่วน
    const numbers: Fraction[] = [];
    const operators: string[] = [];
    
    for (let i = 0; i < tokens.length; i++) {
      if (i % 2 === 0) {
        // ตำแหน่งคู่ = ตัวเลข
        const num = parseInt(tokens[i]);
        if (isNaN(num)) return null;
        numbers.push({ numerator: num, denominator: 1 });
      } else {
        // ตำแหน่งคี่ = operator
        operators.push(tokens[i]);
      }
    }
    
    // ตรวจสอบว่า operators มีจำนวนถูกต้อง
    if (operators.length !== numbers.length - 1) return null;
    
    // Step 1: ทำคูณหารก่อน (จากซ้ายไปขวา)
    const processedNumbers: Fraction[] = [...numbers];
    const processedOperators: string[] = [...operators];
    
    let i = 0;
    while (i < processedOperators.length) {
      const operator = processedOperators[i];
      
      if (operator === '×' || operator === '÷') {
        const left = processedNumbers[i];
        const right = processedNumbers[i + 1];
        
        let result: Fraction;
        if (operator === '×') {
          result = multiplyFractions(left, right);
        } else {
          // ตรวจสอบการหารด้วย 0
          if (right.numerator === 0) return null;
          result = divideFractions(left, right);
        }
        
        // แทนที่ผลลัพธ์
        processedNumbers[i] = result;
        processedNumbers.splice(i + 1, 1);
        processedOperators.splice(i, 1);
        
        // ไม่เพิ่ม i เพราะต้องตรวจสอบตำแหน่งเดิมอีกครั้ง
      } else {
        i++;
      }
    }
    
    // Step 2: ทำบวกลบทีหลัง (จากซ้ายไปขวา)
    let result = processedNumbers[0];
    for (let i = 0; i < processedOperators.length; i++) {
      const operator = processedOperators[i];
      const nextNumber = processedNumbers[i + 1];
      
      if (operator === '+') {
        result = addFractions(result, nextNumber);
      } else if (operator === '-') {
        result = subtractFractions(result, nextNumber);
      } else {
        return null; // ไม่ควรเกิดขึ้นแล้ว
      }
    }
    
    return result;
  } catch {
    return null;
  }
}

/**
 * แยก expression เป็น tokens (numbers และ operators) - WITH VALIDATION
 */
function tokenizeExpression(expression: string): string[] | null {
    try {
      const tokens: string[] = [];
      let currentNumber = '';
      
      for (let i = 0; i < expression.length; i++) {
        const char = expression[i];
        
        if (/\d/.test(char)) {
          // ตัวเลข
          currentNumber += char;
        } else if (['+', '-', '×', '÷'].includes(char)) {
          // Operator
          if (currentNumber) {
            // **ตรวจสอบตัวเลขก่อน push**
            if (!isValidNumberToken(currentNumber)) {
              return null; // ปฏิเสธถ้าเลขผิดรูปแบบ
            }
            tokens.push(currentNumber);
            currentNumber = '';
          }
          tokens.push(char);
        } else {
          // Invalid character
          return null;
        }
      }
      
      // เพิ่มตัวเลขสุดท้าย
      if (currentNumber) {
        // **ตรวจสอบตัวเลขสุดท้ายก่อน push**
        if (!isValidNumberToken(currentNumber)) {
          return null; // ปฏิเสธถ้าเลขผิดรูปแบบ
        }
        tokens.push(currentNumber);
      }
      
      return tokens;
    } catch {
      return null;
    }
}

/**
 * ตรวจสอบว่าตัวเลขถูกรูปแบบหรือไม่
 */
function isValidNumberToken(numberStr: string): boolean {
  // 1. ต้องเป็นตัวเลขเท่านั้น
  if (!/^\d+$/.test(numberStr)) return false;
  
  // 2. ห้ามขึ้นต้นด้วย 0 (ยกเว้น 0 เดี่ยว)
  if (numberStr.length > 1 && numberStr.startsWith('0')) {
    return false; // ปฏิเสธ 01, 02, 012, 0247 เป็นต้น
  }
  
  // 3. ห้ามเกิน 3 หลัก
  if (numberStr.length > 3) {
    return false; // ปฏิเสธ 1234, 5678, 0247 เป็นต้น
  }
  
  // 4. ห้ามเกิน 999
  const numValue = parseInt(numberStr);
  if (numValue > 999) {
    return false;
  }
  
  return true;
}
  
/**
 * การดำเนินการเศษส่วน
 */
function addFractions(a: Fraction, b: Fraction): Fraction {
  const numerator = a.numerator * b.denominator + b.numerator * a.denominator;
  const denominator = a.denominator * b.denominator;
  return simplifyFraction({ numerator, denominator });
}

function subtractFractions(a: Fraction, b: Fraction): Fraction {
  const numerator = a.numerator * b.denominator - b.numerator * a.denominator;
  const denominator = a.denominator * b.denominator;
  return simplifyFraction({ numerator, denominator });
}

function multiplyFractions(a: Fraction, b: Fraction): Fraction {
  const numerator = a.numerator * b.numerator;
  const denominator = a.denominator * b.denominator;
  return simplifyFraction({ numerator, denominator });
}

function divideFractions(a: Fraction, b: Fraction): Fraction {
  const numerator = a.numerator * b.denominator;
  const denominator = a.denominator * b.numerator;
  return simplifyFraction({ numerator, denominator });
}

/**
 * ลดเศษส่วนให้อยู่ในรูปต่ำสุด
 */
function simplifyFraction(fraction: Fraction): Fraction {
  const gcd = findGCD(Math.abs(fraction.numerator), Math.abs(fraction.denominator));
  return {
    numerator: fraction.numerator / gcd,
    denominator: fraction.denominator / gcd
  };
}

/**
 * หาห.ร.ม.
 */
function findGCD(a: number, b: number): number {
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

/**
 * เปรียบเทียบเศษส่วน
 */
function compareFractions(a: Fraction, b: Fraction): boolean {
  // ลดเศษส่วนทั้งสองให้อยู่ในรูปต่ำสุด
  const simplifiedA = simplifyFraction(a);
  const simplifiedB = simplifyFraction(b);
  
  return simplifiedA.numerator === simplifiedB.numerator && 
         simplifiedA.denominator === simplifiedB.denominator;
}

/**
 * ตรวจสอบว่าเป็นตัวเลขหรือไม่ (ทั้ง light และ heavy และ combined)
 */
function isNumber(token: string): boolean {
  return /^\d+$/.test(token);
}

/**
 * Check if it's a light number
 */
function isLightNumber(token: string): boolean {
  return /^[1-9]$/.test(token);
}

/**
 * Check if it's a heavy number
 */
function isHeavyNumber(token: string): boolean {
  const num = parseInt(token);
  return num >= 10 && num <= 20;
}

/**
 * Check if it's an operator
 */
function isOperator(token: string): boolean {
  return ['+', '-', '×', '÷'].includes(token);
}

/**
 * Validate MathBingo options - Updated for specific operators
 */
function validateMathBingoOptions(options: MathBingoOptions): string | null {
  const { totalCount, operatorCount, equalsCount, heavyNumberCount, wildcardCount, zeroCount, operatorMode, specificOperators } = options;
  
  if (totalCount < 8) {
    return 'Total count must be at least 8.';
  }
  
  if (equalsCount < 1) {
    return 'Number of equals must be at least 1.';
  }
  
  // Validate operator count when in specific mode
  if (operatorMode === 'specific' && specificOperators) {
    const specifiedTotal = (specificOperators.plus || 0) + 
                          (specificOperators.minus || 0) + 
                          (specificOperators.multiply || 0) + 
                          (specificOperators.divide || 0);
    
    if (specifiedTotal !== operatorCount) {
      return `Specified operators (${specifiedTotal}) must equal total operator count (${operatorCount}).`;
    }
    
    // Check individual operator availability
    if ((specificOperators.plus || 0) > AMATH_TOKENS['+'].count) {
      return `Requested number of + operators (${specificOperators.plus}) exceeds available tokens (${AMATH_TOKENS['+'].count}).`;
    }
    if ((specificOperators.minus || 0) > AMATH_TOKENS['-'].count) {
      return `Requested number of - operators (${specificOperators.minus}) exceeds available tokens (${AMATH_TOKENS['-'].count}).`;
    }
    if ((specificOperators.multiply || 0) > AMATH_TOKENS['×'].count) {
      return `Requested number of × operators (${specificOperators.multiply}) exceeds available tokens (${AMATH_TOKENS['×'].count}).`;
    }
    if ((specificOperators.divide || 0) > AMATH_TOKENS['÷'].count) {
      return `Requested number of ÷ operators (${specificOperators.divide}) exceeds available tokens (${AMATH_TOKENS['÷'].count}).`;
    }
  }
  
  const lightNumberCount = totalCount - operatorCount - equalsCount - heavyNumberCount - wildcardCount - zeroCount;
  
  if (lightNumberCount < 1) {
    return 'There must be at least 1 light number.';
  }
  
  // Check equals
  const availableEquals = AMATH_TOKENS['='].count;
  if (equalsCount > availableEquals) {
    return `Requested number of equals (${equalsCount}) exceeds available tokens (${availableEquals}).`;
  }
  
  // Check operators (only when in random mode)
  if (operatorMode === 'random') {
    const availableOperators = Object.entries(AMATH_TOKENS)
      .filter(([, info]) => info.type === 'operator')
      .reduce((sum, [, info]) => sum + info.count, 0);
    if (operatorCount > availableOperators) {
      return `Requested number of operators (${operatorCount}) exceeds available tokens (${availableOperators}).`;
    }
  }
  
  // Check heavy numbers
  const availableHeavyNumbers = Object.entries(AMATH_TOKENS)
    .filter(([, info]) => info.type === 'heavyNumber')
    .reduce((sum, [, info]) => sum + info.count, 0);
  if (heavyNumberCount > availableHeavyNumbers) {
    return `Requested number of heavy numbers (${heavyNumberCount}) exceeds available tokens (${availableHeavyNumbers}).`;
  }
  
  // Check wildcards
  const availableBlank = AMATH_TOKENS['?'].count;
  if (wildcardCount > availableBlank) {
    return `Requested number of blank (${wildcardCount}) exceeds available tokens (${availableBlank}).`;
  }
  
  // Check zero
  const availableZeros = AMATH_TOKENS['0'].count;
  if (zeroCount > availableZeros) {
    return `Requested number of zeros (${zeroCount}) exceeds available tokens (${availableZeros}).`;
  }
  
  // Check light numbers (1-9)
  const availableLightNumbers = Object.entries(AMATH_TOKENS)
    .filter(([token, info]) => info.type === 'lightNumber' && token !== '0')
    .reduce((sum, [, info]) => sum + info.count, 0);
  if (lightNumberCount > availableLightNumbers) {
    return `Requested number of light numbers (1-9) (${lightNumberCount}) exceeds available tokens (${availableLightNumbers}).`;
  }
  
  return null;
}

/**
 * Generate tokens based on selected options - Updated for specific operators
 */
function generateTokensBasedOnOptions(options: MathBingoOptions): EquationElement[] {
  const { totalCount, operatorCount, equalsCount, heavyNumberCount, wildcardCount, zeroCount, operatorMode, specificOperators } = options;
  const lightNumberCount = totalCount - operatorCount - equalsCount - heavyNumberCount - wildcardCount - zeroCount;
  
  if (lightNumberCount < 0) {
    throw new Error('Not enough light numbers. Please adjust your options.');
  }
  
  // Create pool with actual AMath tile counts
  const availablePool = createAvailableTokenPool();
  const selectedTokens: EquationElement[] = [];
  
  // Pick token from pool by type
  const pickTokenFromPool = (tokenType: 'equals' | 'operator' | 'light' | 'heavy' | 'wildcard' | 'zero', specificOperator?: '+' | '-' | '×' | '÷'): AmathToken | null => {
    let candidates: AmathToken[] = [];
    
    if (tokenType === 'equals') {
      candidates = availablePool.filter(token => token === '=');
    } else if (tokenType === 'operator') {
      if (specificOperator) {
        candidates = availablePool.filter(token => token === specificOperator);
      } else {
        candidates = availablePool.filter(token => ['+', '-', '×', '÷'].includes(token));
      }
    } else if (tokenType === 'light') {
      candidates = availablePool.filter(token => ['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(token));
    } else if (tokenType === 'heavy') {
      candidates = availablePool.filter(token => ['10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'].includes(token));
    } else if (tokenType === 'wildcard') {
      candidates = availablePool.filter(token => token === '?');
    } else if (tokenType === 'zero') {
      candidates = availablePool.filter(token => token === '0');
    }
    
    if (candidates.length === 0) return null;
    
    // Remove from pool after pick
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const selectedToken = candidates[randomIndex];
    const poolIndex = availablePool.indexOf(selectedToken);
    if (poolIndex !== -1) {
      availablePool.splice(poolIndex, 1);
    }
    
    return selectedToken;
  };
  
  // Pick equals tokens
  for (let i = 0; i < equalsCount; i++) {
    const token = pickTokenFromPool('equals');
    if (!token) {
      throw new Error('Not enough equals (=) tokens in pool.');
    }
    selectedTokens.push(createElementFromToken(token));
  }
  
  // Pick operator tokens based on mode
  if (operatorMode === 'specific' && specificOperators) {
    // Specific mode - pick exact operators
    const operatorTypes: Array<{type: '+' | '-' | '×' | '÷', count: number}> = [
      { type: '+', count: specificOperators.plus || 0 },
      { type: '-', count: specificOperators.minus || 0 },
      { type: '×', count: specificOperators.multiply || 0 },
      { type: '÷', count: specificOperators.divide || 0 }
    ];
    
    for (const { type, count } of operatorTypes) {
      for (let i = 0; i < count; i++) {
        const token = pickTokenFromPool('operator', type);
        if (!token) {
          throw new Error(`Not enough ${type} tokens in pool.`);
        }
        selectedTokens.push(createElementFromToken(token));
      }
    }
  } else {
    // Random mode - pick random operators
    for (let i = 0; i < operatorCount; i++) {
      const token = pickTokenFromPool('operator');
      if (!token) {
        throw new Error('Not enough operator tokens in pool.');
      }
      selectedTokens.push(createElementFromToken(token));
    }
  }
  
  // Pick heavy number tokens
  for (let i = 0; i < heavyNumberCount; i++) {
    const token = pickTokenFromPool('heavy');
    if (!token) {
      throw new Error('Not enough heavy number tokens in pool.');
    }
    selectedTokens.push(createElementFromToken(token));
  }
  
  // Pick wildcard tokens
  for (let i = 0; i < wildcardCount; i++) {
    const token = pickTokenFromPool('wildcard');
    if (!token) {
      throw new Error('Not enough wildcard tokens in pool.');
    }
    selectedTokens.push(createElementFromToken(token));
  }
  
  // Pick zero tokens
  for (let i = 0; i < zeroCount; i++) {
    const token = pickTokenFromPool('zero');
    if (!token) {
      throw new Error('Not enough zero tokens in pool.');
    }
    selectedTokens.push(createElementFromToken(token));
  }
  
  // Pick light number tokens (1-9)
  for (let i = 0; i < lightNumberCount; i++) {
    const token = pickTokenFromPool('light');
    if (!token) {
      throw new Error('Not enough light number tokens in pool.');
    }
    selectedTokens.push(createElementFromToken(token));
  }
  
  // Sort tokens for better readability
  const sortedTokens = sortTokensByPriority(selectedTokens);
  
  return sortedTokens;
}

/**
 * Create a pool of available tokens (based on actual AMath tile counts)
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
 * Create EquationElement from token
 */
function createElementFromToken(token: AmathToken): EquationElement {
  return {
    type: getElementType(token),
    value: token,
    originalToken: token
  };
}

/**
 * Determine element type
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
 * Sort tokens by priority for better readability
 */
function sortTokensByPriority(tokens: EquationElement[]): EquationElement[] {
  return tokens.sort((a, b) => {
    const getPriority = (token: EquationElement): number => {
      if (token.type === 'number') return 1;
      if (token.type === 'operator') return 2;
      if (token.type === 'equals') return 3;
      if (token.type === 'choice') return 4;
      return 5;
    };
    
    return getPriority(a) - getPriority(b);
  });
}

/**
 * Generate limited permutations
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
  
  // Remove duplicate entries
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
 * Calculate factorial
 */
function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= Math.min(n, 10); i++) { // Limit to 10!
    result *= i;
  }
  return result;
}

/**
 * Shuffle array
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Check if a set of numbers and operators can form a valid equation
 */
export function canFormValidEquation(elements: string[]): boolean {
  try {
    const tokens: EquationElement[] = elements.map(el => ({
      type: getElementType(el),
      value: el,
      originalToken: el as AmathToken
    }));
    
    const equations = findValidEquations(tokens, 1);
    return equations.length > 0;
  } catch {
    return false;
  }
}

/**
 * Find all possible equations from a given set of numbers and operators
 */
export function findAllPossibleEquations(elements: string[]): string[] {
  try {
    const tokens: EquationElement[] = elements.map(el => ({
      type: getElementType(el),
      value: el,
      originalToken: el as AmathToken
    }));
    
    return findValidEquations(tokens, 1);
  } catch {
    return [];
  }
}

/**
 * ฟังก์ชันเพิ่มเติมสำหรับทดสอบระบบเศษส่วน
 */
export function testFractionEquation(equation: string): boolean {
  try {
    return isValidEquationByRules(equation, 1);
  } catch {
    return false;
  }
}

/**
 * แปลงเศษส่วนเป็นสตริงสำหรับแสดงผล
 */
export function fractionToString(fraction: Fraction): string {
  if (fraction.denominator === 1) {
    return fraction.numerator.toString();
  }
  return `${fraction.numerator}/${fraction.denominator}`;
}