// src/lib/EquationAnagramLogic.ts - Optimized with True Pool Sampling
import type { EquationAnagramOptions, EquationAnagramResult, AmathToken, AmathTokenInfo, EquationElement } from '@/app/types/EquationAnagram';
import { Fraction, compareFractions } from './fractionUtil';
import { isNumber, isLightNumber, isHeavyNumber, isOperator, getElementType } from './tokenUtil';
import { generateLimitedPermutations } from './permutationUtil';
import { evaluateExpressionAsFraction } from './expressionUtil';

export const AMATH_TOKENS: Record<AmathToken, AmathTokenInfo> = {
  '0': { token: '0', count: 4, type: 'lightNumber', point: 1 },
  '1': { token: '1', count: 6, type: 'lightNumber', point: 1 },
  '2': { token: '2', count: 6, type: 'lightNumber', point: 1 },
  '3': { token: '3', count: 5, type: 'lightNumber', point: 1 },
  '4': { token: '4', count: 5, type: 'lightNumber', point: 2 },
  '5': { token: '5', count: 4, type: 'lightNumber', point: 2 },
  '6': { token: '6', count: 4, type: 'lightNumber', point: 2 },
  '7': { token: '7', count: 4, type: 'lightNumber', point: 2 },
  '8': { token: '8', count: 4, type: 'lightNumber', point: 2 },
  '9': { token: '9', count: 4, type: 'lightNumber', point: 2 },
  '10': { token: '10', count: 2, type: 'heavyNumber', point: 3 },
  '11': { token: '11', count: 1, type: 'heavyNumber', point: 4 },
  '12': { token: '12', count: 2, type: 'heavyNumber', point: 3 },
  '13': { token: '13', count: 1, type: 'heavyNumber', point: 6 },
  '14': { token: '14', count: 1, type: 'heavyNumber', point: 4 },
  '15': { token: '15', count: 1, type: 'heavyNumber', point: 4 },
  '16': { token: '16', count: 1, type: 'heavyNumber', point: 4 },
  '17': { token: '17', count: 1, type: 'heavyNumber', point: 6 },
  '18': { token: '18', count: 1, type: 'heavyNumber', point: 4 },
  '19': { token: '19', count: 1, type: 'heavyNumber', point: 7 },
  '20': { token: '20', count: 1, type: 'heavyNumber', point: 5 },
  '+': { token: '+', count: 4, type: 'operator', point: 2 },
  '-': { token: '-', count: 4, type: 'operator', point: 2 },
  '×': { token: '×', count: 4, type: 'operator', point: 2 },
  '÷': { token: '÷', count: 4, type: 'operator', point: 2 },
  '+/-': { token: '+/-', count: 5, type: 'choice', point: 1 },
  '×/÷': { token: '×/÷', count: 4, type: 'choice', point: 1 },
  '=': { token: '=', count: 11, type: 'equals', point: 1 },
  '?': { token: '?', count: 4, type: 'Blank', point: 0 }
};



/**
 * สร้าง pool ของ tokens ทั้งหมดตามจำนวนจริง
 */
function createTokenPool(): AmathToken[] {
  const pool: AmathToken[] = [];
  Object.entries(AMATH_TOKENS).forEach(([token, info]) => {
    for (let i = 0; i < info.count; i++) {
      pool.push(token as AmathToken);
    }
  });
  return pool;
}

/**
 * Generate DS Equation Anagram problem based on options
 */
export async function generateEquationAnagram(options: EquationAnagramOptions): Promise<EquationAnagramResult> {
  const validation = validateEquationAnagramOptions(options);
  if (validation) {
    throw new Error(validation);
  }

  let attempts = 0;
  const maxAttempts = 10000;

  while (attempts < maxAttempts) {
    try {
      const tokens = generateTokensBasedOnOptions(options);
      const equations = findValidEquations(tokens, Math.max(options.equalsCount, 1));
      
      if (equations.length > 0) {
        return {
          elements: tokens.map(t => t.originalToken),
          sampleEquation: equations[0],
          possibleEquations: equations.slice(0, 10)
        };
      }
    } catch (error) {
      console.warn(`Attempt ${attempts + 1} failed:`, error);
    }
    attempts++;
  }

  throw new Error('Could not generate a valid problem. Please adjust your options or reduce the number of tiles/operators.');
}

/**
 * Generate tokens based on selected options - Random individual counts only
 */
function generateTokensBasedOnOptions(options: EquationAnagramOptions): EquationElement[] {
  // สร้าง options ใหม่โดยสุ่มเฉพาะจำนวนของ options ที่เป็น random
  const processedOptions = { ...options };
  
  if (options.randomSettings) {
    const { totalCount, randomSettings } = options;
    let remainingTiles = totalCount;
    
    // คำนวณจำนวนที่ fixed ก่อน
    if (!randomSettings.operators) remainingTiles -= options.operatorCount;
    if (!randomSettings.equals) remainingTiles -= options.equalsCount;
    if (!randomSettings.heavy) remainingTiles -= options.heavyNumberCount;
    if (!randomSettings.blank) remainingTiles -= options.BlankCount;
    if (!randomSettings.zero) remainingTiles -= options.zeroCount;
    
    // สุ่มจำนวนสำหรับ options ที่เป็น random
    if (randomSettings.operators) {
      processedOptions.operatorCount = Math.max(1, Math.min(remainingTiles - 1, Math.floor(Math.random() * (remainingTiles / 2)) + 1));
      remainingTiles -= processedOptions.operatorCount;
    }
    
    if (randomSettings.equals) {
      processedOptions.equalsCount = Math.max(1, Math.min(remainingTiles - 1, Math.floor(Math.random() * 3) + 1));
      remainingTiles -= processedOptions.equalsCount;
    }
    
    if (randomSettings.heavy) {
      processedOptions.heavyNumberCount = Math.max(0, Math.min(remainingTiles, Math.floor(Math.random() * (remainingTiles / 3))));
      remainingTiles -= processedOptions.heavyNumberCount;
    }
    
    if (randomSettings.blank) {
      processedOptions.BlankCount = Math.max(0, Math.min(remainingTiles, Math.floor(Math.random() * (remainingTiles / 4))));
      remainingTiles -= processedOptions.BlankCount;
    }
    
    if (randomSettings.zero) {
      processedOptions.zeroCount = Math.max(0, Math.min(remainingTiles, Math.floor(Math.random() * (remainingTiles / 4))));
      remainingTiles -= processedOptions.zeroCount;
    }
  }
  
  // ใช้ deterministic generation กับ options ที่ประมวลผลแล้ว
  return generateTokensDeterministic(processedOptions);
}



/**
 * Generate tokens แบบเดิม (deterministic) สำหรับกรณีที่ไม่ได้ใช้ random
 */
function generateTokensDeterministic(options: EquationAnagramOptions): EquationElement[] {
  const { totalCount, operatorCount, equalsCount, heavyNumberCount, BlankCount, zeroCount, operatorMode, specificOperators, operatorFixed } = options;
  
  const lightNumberCount = totalCount - operatorCount - equalsCount - heavyNumberCount - BlankCount - zeroCount;
  
  if (lightNumberCount < 0) {
    throw new Error('Not enough light numbers. Please adjust your options.');
  }
  
  const availablePool = createTokenPool();
  const selectedTokens: EquationElement[] = [];
  
  // Pick equals tokens
  for (let i = 0; i < equalsCount; i++) {
    // พยายามเลือก equals token ก่อน
    let token = pickTokenFromPool('equals', availablePool);
    
    // ถ้าไม่มี equals tokens เหลือ ให้ใช้ blank token แทน (เพราะ ? สามารถแทน = ได้)
    if (!token) {
      token = pickTokenFromPool('Blank', availablePool);
      if (!token) {
        throw new Error('Not enough equals (=) or blank (?) tokens in pool.');
      }
    }
    
    selectedTokens.push(createElementFromToken(token));
  }
  
  // Pick operator tokens based on mode
  if (operatorMode === 'specific' && operatorFixed) {
    // Flexible specific mode with individual operator random/fixed
    const operatorTypes: Array<'+' | '-' | '×' | '÷' | '+/-' | '×/÷'> = ['+', '-', '×', '÷', '+/-', '×/÷'];
    let totalFixedOperators = 0;
    const randomOperatorTypes: Array<'+' | '-' | '×' | '÷' | '+/-' | '×/÷'> = [];
    
    // ใส่ operator ที่ fixed ก่อน
    for (const type of operatorTypes) {
      const fixedValue = operatorFixed[type];
      if (typeof fixedValue === 'number') {
        // Fixed: ใช้จำนวนตรง ๆ (รวมถึง 0)
        for (let i = 0; i < fixedValue; i++) {
          const token = pickTokenFromPool('operator', availablePool, type);
          if (!token) {
            throw new Error(`Not enough ${type} tokens in pool.`);
          }
          selectedTokens.push(createElementFromToken(token));
        }
        totalFixedOperators += fixedValue;
      } else if (fixedValue === null) {
        // Random: เก็บไว้สุ่มทีหลัง
        randomOperatorTypes.push(type);
      }
    }
    
    // สุ่ม operator ที่เหลือให้กับ types ที่เป็น random
    const remainingOperators = operatorCount - totalFixedOperators;
    for (let i = 0; i < remainingOperators; i++) {
      if (randomOperatorTypes.length > 0) {
        const type = randomOperatorTypes[Math.floor(Math.random() * randomOperatorTypes.length)];
        const token = pickTokenFromPool('operator', availablePool, type);
        if (!token) {
          throw new Error(`Not enough ${type} tokens in pool.`);
        }
        selectedTokens.push(createElementFromToken(token));
      } else {
        // ถ้าไม่มี random types เหลือ ให้สุ่มจากทั้งหมด
        const token = pickTokenFromPool('operator', availablePool);
        if (!token) {
          throw new Error('Not enough operator tokens in pool.');
        }
        selectedTokens.push(createElementFromToken(token));
      }
    }
  } else if (operatorMode === 'specific' && specificOperators) {
    // Specific mode with exact counts
    const operatorTypes: Array<{type: '+' | '-' | '×' | '÷', count: number}> = [
      { type: '+', count: specificOperators.plus || 0 },
      { type: '-', count: specificOperators.minus || 0 },
      { type: '×', count: specificOperators.multiply || 0 },
      { type: '÷', count: specificOperators.divide || 0 }
    ];
    
    for (const { type, count } of operatorTypes) {
      for (let i = 0; i < count; i++) {
        const token = pickTokenFromPool('operator', availablePool, type);
        if (!token) {
          throw new Error(`Not enough ${type} tokens in pool.`);
        }
        selectedTokens.push(createElementFromToken(token));
      }
    }
  } else {
    // Random mode
    for (let i = 0; i < operatorCount; i++) {
      const token = pickTokenFromPool('operator', availablePool);
      if (!token) {
        throw new Error('Not enough operator tokens in pool.');
      }
      selectedTokens.push(createElementFromToken(token));
    }
  }
  
  // Pick other token types
  for (let i = 0; i < heavyNumberCount; i++) {
    const token = pickTokenFromPool('heavy', availablePool);
    if (!token) throw new Error('Not enough heavy number tokens in pool.');
    selectedTokens.push(createElementFromToken(token));
  }
  
  for (let i = 0; i < BlankCount; i++) {
    const token = pickTokenFromPool('Blank', availablePool);
    if (!token) throw new Error('Not enough Blank tokens in pool.');
    selectedTokens.push(createElementFromToken(token));
  }
  
  for (let i = 0; i < zeroCount; i++) {
    const token = pickTokenFromPool('zero', availablePool);
    if (!token) throw new Error('Not enough zero tokens in pool.');
    selectedTokens.push(createElementFromToken(token));
  }
  
  for (let i = 0; i < lightNumberCount; i++) {
    const token = pickTokenFromPool('light', availablePool);
    if (!token) throw new Error('Not enough light number tokens in pool.');
    selectedTokens.push(createElementFromToken(token));
  }
  
  return sortTokensByPriority(selectedTokens);
}

/**
 * Enhanced blank expansion with smart optimization
 */
function expandBlanks(tokens: string[]): string[][] {
  const SMART_REPLACEMENTS = [
    // High priority (essential for equations)
    '=', '+', '-', '×', '÷', '+/-', '×/÷',
    // Medium priority (common numbers)
    '1', '2', '3', '4', '5', '6', '7', '8', '9',
    // Lower priority (special cases)
    '10', '12', '0'
  ];
  
  const results: string[][] = [];
  const blankCount = tokens.filter(t => t === '?').length;
  
  // Limit expansion for performance
  if (blankCount > 3) {
    return expandBlanksLimited(tokens, SMART_REPLACEMENTS.slice(0, 5));
  }
  
  function smartExpansion(current: string[], idx: number, equalsFound: boolean) {
    if (idx === tokens.length) {
      if (equalsFound) {
        results.push([...current]);
      }
      return;
    }
    
    if (tokens[idx] === '?') {
      let replacements = [...SMART_REPLACEMENTS];
      
      // Prioritize equals if none found
      if (!equalsFound) {
        replacements = ['=', ...replacements.filter(r => r !== '=')];
      }
      
      // Limit for performance
      replacements = replacements.slice(0, Math.min(3, replacements.length));
      
      for (const rep of replacements) {
        current.push(rep);
        smartExpansion(current, idx + 1, equalsFound || rep === '=');
        current.pop();
        
        if (results.length >= 50) return;
      }
    } else {
      current.push(tokens[idx]);
      smartExpansion(current, idx + 1, equalsFound || tokens[idx] === '=');
      current.pop();
    }
  }
  
  smartExpansion([], 0, false);
  return results;
}

/**
 * Limited expansion for cases with too many blanks
 */
function expandBlanksLimited(tokens: string[], limitedReplacements: string[]): string[][] {
  const results: string[][] = [];
  
  function helper(current: string[], idx: number) {
    if (idx === tokens.length) {
      if (current.some(t => t === '=')) {
        results.push([...current]);
      }
      return;
    }
    
    if (tokens[idx] === '?') {
      for (const rep of limitedReplacements) {
        current.push(rep);
        helper(current, idx + 1);
        current.pop();
        
        if (results.length >= 20) return;
      }
    } else {
      current.push(tokens[idx]);
      helper(current, idx + 1);
      current.pop();
    }
  }
  
  helper([], 0);
  return results;
}

/**
 * Optimized equation finding with early termination
 */
function findValidEquations(tokens: EquationElement[], equalsCount: number): string[] {
  const validEquations: string[] = [];
  const tokenValues = tokens.map(t => t.originalToken);

  // Quick validation checks - คำนึงว่า ? สามารถแทน = ได้
  const hasEquals = tokenValues.some(t => t === '=');
  const hasBlanks = tokenValues.some(t => t === '?');
  const hasOperators = tokenValues.some(t => ['+', '-', '×', '÷', '+/-', '×/÷'].includes(t));
  const hasNumbers = tokenValues.some(t => /^\d+$/.test(t));
  
  // ถ้าไม่มี = และไม่มี ? เลย ให้ return empty
  if ((!hasEquals && !hasBlanks) || !hasOperators || !hasNumbers) {
    return [];
  }

  const expandedTokenSets = expandBlanks(tokenValues);
  
  // Filter token sets before permutation - คำนึงว่า ? สามารถแทน = ได้
  const filteredTokenSets = expandedTokenSets.filter(tokens => {
    const hasEqualsOrBlanks = tokens.some(t => t === '=' || t === '?');
    if (!hasEqualsOrBlanks) return false;
    
    if (!tokens.some(t => ['+', '-', '×', '÷', '+/-', '×/÷'].includes(t))) return false;
    
    const numberCount = tokens.filter(t => /^\d+$/.test(t)).length;
    if (numberCount < 2) return false;
    
    return true;
  });

  for (const expandedTokens of filteredTokenSets) {
    const maxPermutations = expandedTokens.length > 8 ? 500 : 1000;
    const permutations = generateLimitedPermutations(expandedTokens, maxPermutations);
    
    for (const perm of permutations) {
      try {
        const equation = createEquationFromPermutation(perm as AmathToken[], Math.max(equalsCount, 1));
        if (equation && isValidEquationByRules(equation, Math.max(equalsCount, 1))) {
          validEquations.push(equation);
          
          if (validEquations.length >= 10) {
            return validEquations;
          }
        }
      } catch {
        continue;
      }
    }
    
    if (validEquations.length >= 10) {
      break;
    }
  }

  return validEquations;
}

// ฟังก์ชันอื่นๆ ที่เหลือยังคงเหมือนเดิม (ไม่เปลี่ยนแปลง)

/**
 * Create equation from permutation
 */
function createEquationFromPermutation(tokens: AmathToken[], equalsCount: number): string | null {
  // Handle choice tokens FIRST before any processing
  const processedTokens = tokens.map(token => {
    if (token === '+/-') {
      return Math.random() < 0.5 ? '+' : '-';
    }
    if (token === '×/÷') {
      return Math.random() < 0.5 ? '×' : '÷';
    }
    return token;
  });
  
  const processed = combineAdjacentNumbers(processedTokens as AmathToken[]);
  if (processed.length === 0) return null;
  
  const minEqualsCount = Math.max(equalsCount, 1);
  
  if (!isValidTokenStructure(processed, minEqualsCount)) return null;
  
  const equation = processed.join('');
  
  return equation;
}

/**
 * Combine adjacent numbers with improved logic
 */
function combineAdjacentNumbers(tokens: AmathToken[]): string[] {
  const result: string[] = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    if (isHeavyNumber(token) || token === '0') {
      const prev = result[result.length - 1];
      const next = tokens[i + 1];
      if ((prev && (isLightNumber(prev) || isHeavyNumber(prev) || prev === '0')) ||
          (next && (isLightNumber(next) || isHeavyNumber(next) || next === '0'))) {
        return [];
      }
      result.push(token);
      i++;
      continue;
    }

    if (isLightNumber(token)) {
      let combinedNumber = token;
      let j = i + 1;
      while (j < tokens.length && isLightNumber(tokens[j]) && combinedNumber.length < 3) {
        combinedNumber += tokens[j];
        j++;
      }
      result.push(combinedNumber);
      i = j;
      continue;
    }

    result.push(token);
    i++;
  }

  for (let i = 0; i < result.length; i++) {
    const current = result[i];
    if (isNumber(current) && (current.length > 3 || parseInt(current) > 999)) {
      return [];
    }
  }

  return result;
}

/**
 * Check if token structure is valid
 */
function isValidTokenStructure(tokens: string[], equalsCount: number): boolean {
  if (tokens.length < 3) return false;

  // คำนึงว่า ? สามารถแทน = ได้
  const equalsInTokens = tokens.filter(t => t === '=').length;
  const blanksInTokens = tokens.filter(t => t === '?').length;
  const totalEqualsOrBlanks = equalsInTokens + blanksInTokens;
  
  if (totalEqualsOrBlanks < 1) {
    return false;
  }
  
  if (equalsCount > 0 && totalEqualsOrBlanks < equalsCount) {
    return false;
  }

  if (equalsInTokens > 1) {
    const parts = tokens.join('').split('=');
    if (parts.length !== equalsInTokens + 1) return false;
    for (const part of parts) {
      if (part.length === 0) return false;
      if (!/\d/.test(part)) return false;
    }
  }
  
  for (let i = 0; i < tokens.length; i++) {
    const current = tokens[i];
    const next = tokens[i + 1];
    const prev = tokens[i - 1];
    
    // Choice tokens should have been converted already - if we see them, it's an error
    if (current === '+/-' || current === '×/÷') {
      return false;
    }
    
    if (isHeavyNumber(current)) {
      if (prev && !isOperator(prev) && prev !== '=' && prev !== '?') {
        return false;
      }
      if (next && !isOperator(next) && next !== '=' && next !== '?') {
        return false;
      }
    }
    
    if (current === '0') {
      if (prev === '-') {
        return false;
      }
    }
    
    if (isOperator(current)) {
      if (isOperator(next)) {
        if (current === '=' && next === '-') {
          // Allow =-3
        } else {
          return false;
        }
      }
      
      if (isOperator(prev)) {
        if (prev === '=' && current === '-') {
          // Allow =-3
        } else {
          return false;
        }
      }
    }
    
    if (current === '=' || current === '?') {
      if (i === 0 || i === tokens.length - 1) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Check if equation is valid according to rules
 */
export function isValidEquationByRules(equation: string, equalsCount?: number): boolean {
  try {
    const parts = equation.split('=');
    if (parts.length < 2) {
      return false;
    }
    
    const actualEquals = parts.length - 1;
    const requiredEquals = equalsCount === undefined ? actualEquals : equalsCount;
    
    if (requiredEquals > 0 && actualEquals !== requiredEquals) {
      return false;
    }
    
    if (actualEquals < 1) {
      return false;
    }
    
    if (parts.some(part => part.length === 0)) return false;
    
    const fractions: Fraction[] = [];
    for (const part of parts) {
      const fraction = evaluateExpressionAsFraction(part);
      if (!fraction) return false;
      fractions.push(fraction);
    }
    
    const firstFraction = fractions[0];
    return fractions.every(fraction => compareFractions(fraction, firstFraction));
  } catch {
    return false;
  }
}

/**
 * Validate EquationAnagram options
 */
function validateEquationAnagramOptions(options: EquationAnagramOptions): string | null {
  const { totalCount, operatorCount, equalsCount, heavyNumberCount, BlankCount, zeroCount, operatorMode, specificOperators, operatorFixed, randomSettings } = options;
  
  if (totalCount < 8) {
    return 'Total count must be at least 8.';
  }
  
  // Validate random settings if enabled
  if (randomSettings) {
    const availableBlanks = AMATH_TOKENS['?'].count;
    const availableZeros = AMATH_TOKENS['0'].count;
    
    if (randomSettings.blank && BlankCount > availableBlanks) {
      return `Random blank count (${BlankCount}) exceeds available tokens (${availableBlanks}).`;
    }
    
    if (randomSettings.zero && zeroCount > availableZeros) {
      return `Random zero count (${zeroCount}) exceeds available tokens (${availableZeros}).`;
    }
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

  // Validate operatorFixed logic
  if (operatorMode === 'specific' && operatorFixed) {
    const fixedSum = Object.values(operatorFixed).reduce<number>((sum, v) => sum + (typeof v === 'number' && v > 0 ? v : 0), 0);
    if (fixedSum > operatorCount) {
      return `Sum of fixed operators (${fixedSum}) exceeds total operator count (${operatorCount}).`;
    }
    
    // Check choice operators availability
    if ((operatorFixed['+/-'] || 0) > AMATH_TOKENS['+/-'].count) {
      return `Requested number of +/- operators (${operatorFixed['+/-']}) exceeds available tokens (${AMATH_TOKENS['+/-'].count}).`;
    }
    if ((operatorFixed['×/÷'] || 0) > AMATH_TOKENS['×/÷'].count) {
      return `Requested number of ×/÷ operators (${operatorFixed['×/÷']}) exceeds available tokens (${AMATH_TOKENS['×/÷'].count}).`;
    }
  }

  // ไม่ตรวจสอบ lightNumberCount เมื่อใช้ random settings
  if (!randomSettings || !Object.values(randomSettings).some(val => val === true)) {
    const lightNumberCount = totalCount - operatorCount - equalsCount - heavyNumberCount - BlankCount - zeroCount;
    
    if (lightNumberCount < 1) {
      return 'There must be at least 1 light number.';
    }
    
    // Check light numbers (1-9) - only when not using random
    const availableLightNumbers = Object.entries(AMATH_TOKENS)
      .filter(([token, info]) => info.type === 'lightNumber' && token !== '0')
      .reduce((sum, [, info]) => sum + info.count, 0);
    if (lightNumberCount > availableLightNumbers) {
      return `Requested number of light numbers (1-9) (${lightNumberCount}) exceeds available tokens (${availableLightNumbers}).`;
    }
  }
  
  // Check equals
  const availableEquals = AMATH_TOKENS['='].count;
  const availableBlanks = AMATH_TOKENS['?'].count;
  
  // ถ้าใช้ random settings และ blank เป็น random หรือ equals เป็น random
  // ให้รวม blank เข้าไปใน available equals เพราะ ? สามารถแทน = ได้
  const effectiveAvailableEquals = (randomSettings && (randomSettings.equals || randomSettings.blank)) 
    ? availableEquals + availableBlanks 
    : availableEquals;
  
  if (equalsCount > effectiveAvailableEquals) {
    return `Requested number of equals (${equalsCount}) exceeds available tokens (${effectiveAvailableEquals} = ${availableEquals} equals + ${availableBlanks} blanks).`;
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
  
  // Check Blanks
  const availableBlank = AMATH_TOKENS['?'].count;
  if (BlankCount > availableBlank) {
    return `Requested number of blank (${BlankCount}) exceeds available tokens (${availableBlank}).`;
  }
  
  // Check zero
  const availableZeros = AMATH_TOKENS['0'].count;
  if (zeroCount > availableZeros) {
    return `Requested number of zeros (${zeroCount}) exceeds available tokens (${availableZeros}).`;
  }
  
  return null;
}

/**
 * Weighted random selection based on token availability in pool
 */
function weightedRandomFromPool(pool: AmathToken[], weights: number[]): AmathToken | null {
  if (pool.length === 0) return null;
  
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight === 0) return null;
  
  const random = Math.random() * totalWeight;
  
  let currentWeight = 0;
  for (let i = 0; i < pool.length; i++) {
    currentWeight += weights[i];
    if (random <= currentWeight) {
      return pool[i];
    }
  }
  
  return pool[pool.length - 1];
}

/**
 * Get weighted pool for specific token type
 */
function getWeightedPool(tokenType: 'equals' | 'operator' | 'light' | 'heavy' | 'Blank' | 'zero', availablePool: AmathToken[], specificOperator?: '+' | '-' | '×' | '÷' | '+/-' | '×/÷'): { tokens: AmathToken[], weights: number[] } {
  let candidates: AmathToken[] = [];
  let weights: number[] = [];
  
  if (tokenType === 'equals') {
    candidates = availablePool.filter(token => token === '=');
    weights = candidates.map(() => AMATH_TOKENS['='].count);
  } else if (tokenType === 'operator') {
    if (specificOperator) {
      candidates = availablePool.filter(token => token === specificOperator);
      weights = candidates.map(token => AMATH_TOKENS[token].count);
    } else {
      // รวม choice operators เป็นส่วนหนึ่งของ operator
      candidates = availablePool.filter(token => ['+', '-', '×', '÷', '+/-', '×/÷'].includes(token));
      weights = candidates.map(token => AMATH_TOKENS[token].count);
    }
  } else if (tokenType === 'light') {
    candidates = availablePool.filter(token => ['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(token));
    weights = candidates.map(token => AMATH_TOKENS[token].count);
  } else if (tokenType === 'heavy') {
    candidates = availablePool.filter(token => ['10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'].includes(token));
    weights = candidates.map(token => AMATH_TOKENS[token].count);
  } else if (tokenType === 'Blank') {
    candidates = availablePool.filter(token => token === '?');
    weights = candidates.map(() => AMATH_TOKENS['?'].count);
  } else if (tokenType === 'zero') {
    candidates = availablePool.filter(token => token === '0');
    weights = candidates.map(() => AMATH_TOKENS['0'].count);
  }
  
  return { tokens: candidates, weights };
}

/**
 * Pick token from pool using weighted random
 */
const pickTokenFromPool = (tokenType: 'equals' | 'operator' | 'light' | 'heavy' | 'Blank' | 'zero', availablePool: AmathToken[], specificOperator?: '+' | '-' | '×' | '÷' | '+/-' | '×/÷'): AmathToken | null => {
  const { tokens, weights } = getWeightedPool(tokenType, availablePool, specificOperator);
  
  if (tokens.length === 0) return null;
  
  const selectedToken = weightedRandomFromPool(tokens, weights);
  if (!selectedToken) return null;
  
  const poolIndex = availablePool.indexOf(selectedToken);
  if (poolIndex !== -1) {
    availablePool.splice(poolIndex, 1);
  }
  
  return selectedToken;
};

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
 * Sort tokens by AMATH_TOKENS order for better readability
 */
function sortTokensByPriority(tokens: EquationElement[]): EquationElement[] {
  // สร้าง order array ตามลำดับที่ประกาศใน AMATH_TOKENS
  const amathOrder = Object.keys(AMATH_TOKENS) as AmathToken[];
  
  return tokens.sort((a, b) => {
    const indexA = amathOrder.indexOf(a.value as AmathToken);
    const indexB = amathOrder.indexOf(b.value as AmathToken);
    return indexA - indexB;
  });
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