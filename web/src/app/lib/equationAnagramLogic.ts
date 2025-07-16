// src/lib/EquationAnagramLogic.ts - Updated to fix blank/wildcard logic and ensure equations always have equals
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
 * Generate DS Equation Anagram problem based on options
 */
export async function generateEquationAnagram(options: EquationAnagramOptions): Promise<EquationAnagramResult> {
  const validation = validateEquationAnagramOptions(options);
  if (validation) {
    throw new Error(validation);
  }

  let attempts = 0;
  const maxAttempts = 300;

  while (attempts < maxAttempts) {
    try {
      // Reset and generate tokens for each attempt (reset pool)
      const tokens = generateTokensBasedOnOptions(options);
      const equations = findValidEquations(tokens, options.equalsCount);
      
      if (equations.length > 0) {
        return {
          elements: tokens.map(t => t.originalToken),
          sampleEquation: equations[0],
          possibleEquations: equations.slice(0, 10) // Show up to 10 equations
        };
      }
    } catch (error) {
      alert(error);
    }
    attempts++;
  }

  throw new Error('Could not generate a valid problem. Please adjust your options or reduce the number of tiles/operators.');
}

/**
 * Expand all ? in tokens to all possible values - FIXED: Include both numbers and operators
 */
function expandBlanks(tokens: string[]): string[][] {
  // 🔥 FIX: Include ALL possible AMath tokens as replacement options for blank/wildcard
  const BLANK_REPLACEMENTS = [
    // Numbers (light)
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    // Numbers (heavy) 
    '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
    // Operators
    '+', '-', '×', '÷',
    // Equals
    '='
  ];
  const results: string[][] = [];

  function helper(current: string[], idx: number) {
    if (idx === tokens.length) {
      results.push([...current]);
      return;
    }
    if (tokens[idx] === '?') {
      for (const rep of BLANK_REPLACEMENTS) {
        current.push(rep);
        helper(current, idx + 1);
        current.pop();
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
 * Find valid equations from given tokens - FIXED: Ensure equations always have equals
 */
function findValidEquations(tokens: EquationElement[], equalsCount: number): string[] {
  const validEquations: string[] = [];
  const tokenValues = tokens.map(t => t.originalToken);

  // Expand all ? to all possible operator and equals values
  const expandedTokenSets = expandBlanks(tokenValues);

  // Generate possible permutations for each expanded set
  for (const expandedTokens of expandedTokenSets) {
    // 🔥 FIX: Skip any token sets that don't have at least one equals sign
    const equalsInSet = expandedTokens.filter(t => t === '=').length;
    if (equalsInSet === 0) {
      continue; // Skip this expansion as it has no equals
    }
    
    const permutations = generateLimitedPermutations(expandedTokens, 10000);
    for (const perm of permutations) {
      try {
        const equation = createEquationFromPermutation(perm as AmathToken[], Math.max(equalsCount, 1));
        if (equation && isValidEquationByRules(equation, Math.max(equalsCount, 1))) {
          validEquations.push(equation);
          if (validEquations.length >= 15) break;
        }
      } catch {
        continue;
      }
    }
    if (validEquations.length >= 15) break;
  }

  return validEquations;
}

/**
 * Create equation from permutation - FIXED: Ensure minimum equals count
 */
function createEquationFromPermutation(tokens: AmathToken[], equalsCount: number): string | null {
  const processed = combineAdjacentNumbers(tokens);
  if (processed.length === 0) return null;
  
  // 🔥 FIX: Use at least 1 equals, even if equalsCount is 0
  const minEqualsCount = Math.max(equalsCount, 1);
  
  if (!isValidTokenStructure(processed, minEqualsCount)) return null;
  
  let equation = processed.join('');
  
  // Handle choice tokens
  equation = equation.replace(/\+\/-/g, () => Math.random() < 0.5 ? '+' : '-');
  equation = equation.replace(/×\/÷/g, () => Math.random() < 0.5 ? '×' : '÷');
  
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

    // เลขหนัก (10-20) และ 0 ต้องอยู่เดี่ยวเสมอ
    if (isHeavyNumber(token) || token === '0') {
      // ตรวจสอบว่าข้างๆ เป็นเลขเบาหรือเลขหนักหรือ 0 หรือไม่ (ห้ามติดกับเลขใดๆ)
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

    // เลขเบา (1-9) สามารถติดกับเลขเบาเท่านั้น
    if (isLightNumber(token)) {
      let combinedNumber = token;
      let j = i + 1;
      // รวมเลขเบาที่ติดกันเท่านั้น (ห้ามรวมกับ 0 หรือเลขหนัก)
      while (j < tokens.length && isLightNumber(tokens[j]) && combinedNumber.length < 3) {
        combinedNumber += tokens[j];
        j++;
      }
      result.push(combinedNumber);
      i = j;
      continue;
    }

    // สัญลักษณ์อื่น ๆ (operators, =, Blank, choice)
    result.push(token);
    i++;
  }

  // ตรวจสอบ post-process: ไม่มีเลขที่เกิน 3 หลัก, ไม่มีเลขที่เกิน 999
  for (let i = 0; i < result.length; i++) {
    const current = result[i];
    if (isNumber(current) && (current.length > 3 || parseInt(current) > 999)) {
      return [];
    }
  }

  return result;
}

/**
 * Check if token structure is valid - FIXED: Allow negative numbers
 */
function isValidTokenStructure(tokens: string[], equalsCount: number): boolean {
  if (tokens.length < 3) return false;

  // 🔥 FIX: Must have at least 1 equals, regardless of equalsCount parameter
  const equalsInTokens = tokens.filter(t => t === '=').length;
  
  if (equalsInTokens < 1) {
    return false; // Always require at least 1 equals
  }
  
  if (equalsCount > 0 && equalsInTokens !== equalsCount) {
    return false; // If specific count requested, must match exactly
  }

  // **แก้ไข: ตรวจสอบโครงสร้างสำหรับ = หลายตัว**
  if (equalsInTokens > 1) {
    // สำหรับ = หลายตัว ต้องมีรูปแบบ: expression = expression = expression
    const parts = tokens.join('').split('=');
    if (parts.length !== equalsInTokens + 1) return false;
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
    
    // 🔥 REMOVED: Check for 0 adjacent to - (now allowing negative numbers)
    // if (current === '0') {
    //   if (next === '-' || prev === '-') {
    //     return false;
    //   }
    // }
    
    if (isOperator(current)) {
      // Operators should not be adjacent, except for specific cases
      if (isOperator(next)) {
        // 🔥 NEW: Allow = followed by - for negative numbers (e.g., "=-3")
        if (current === '=' && next === '-') {
          // This is allowed: equals followed by minus for negative number
        } else {
          return false; // Other operator adjacencies not allowed
        }
      }
      
      if (isOperator(prev)) {
        // 🔥 NEW: Allow - preceded by = for negative numbers (e.g., "=-3")  
        if (prev === '=' && current === '-') {
          // This is allowed: minus after equals for negative number
        } else {
          return false; // Other operator adjacencies not allowed
        }
      }
      
      // 🔥 MODIFIED: Allow + at the beginning for positive numbers (though uncommon)
      // if (current === '+' && i === 0) {
      //   return false;
      // }
      
      // 🔥 MODIFIED: Allow + after = for positive numbers  
      // if (current === '+' && prev === '=') {
      //   return false;
      // }
      
      // 🔥 MODIFIED: Allow - adjacent to any number (including 0) for negative numbers
      // if (current === '-') {
      //   if (next === '0' || prev === '0') {
      //     return false;
      //   }
      // }
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
 * Check if equation is valid according to rules - FIXED: Always require at least 1 equals
 */
function isValidEquationByRules(equation: string, equalsCount: number): boolean {
  try {
    // 🔥 FIX: Always require at least 1 equals
    const parts = equation.split('=');
    if (parts.length < 2) {
      return false; // No equals found
    }
    
    const actualEquals = parts.length - 1;
    
    if (equalsCount > 0 && actualEquals !== equalsCount) {
      return false; // If specific count requested, must match exactly
    }
    
    if (actualEquals < 1) {
      return false; // Always require at least 1 equals
    }
    
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

/**
 * Validate EquationAnagram options - FIXED: Always require at least 1 equals
 */
function validateEquationAnagramOptions(options: EquationAnagramOptions): string | null {
  const { totalCount, operatorCount, equalsCount, heavyNumberCount, BlankCount, zeroCount, operatorMode, specificOperators, operatorFixed } = options;
  
  if (totalCount < 8) {
    return 'Total count must be at least 8.';
  }
  
  // 🔥 FIX: Always require at least 1 equals (can't have equalsCount = 0)
  if (equalsCount < 1) {
    return 'Number of equals must be at least 1. Valid equations require equals sign.';
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
  }

  // เพิ่ม logic ใน generateTokensBasedOnOptions:
  // - ถ้า options.operatorFixed มีค่า ให้ fix จำนวน operator ตามนั้น (number)
  // - ที่เหลือ (null) ให้ random จาก operator ที่เหลือ
  // - validate ให้จำนวนรวมตรงกับ operatorCount
  // - อัปเดต type EquationAnagramOptions ด้วย operatorFixed: { '+': number|null, ... }
  const lightNumberCount = totalCount - operatorCount - equalsCount - heavyNumberCount - BlankCount - zeroCount;
  
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
function generateTokensBasedOnOptions(options: EquationAnagramOptions): EquationElement[] {
  const { totalCount, operatorCount, equalsCount, heavyNumberCount, BlankCount, zeroCount, operatorMode, specificOperators, operatorFixed } = options;
  const lightNumberCount = totalCount - operatorCount - equalsCount - heavyNumberCount - BlankCount - zeroCount;
  
  if (lightNumberCount < 0) {
    throw new Error('Not enough light numbers. Please adjust your options.');
  }
  
  // Create pool with actual AMath tile counts
  const availablePool = createAvailableTokenPool();
  const selectedTokens: EquationElement[] = [];
  
  // Pick token from pool by type
  const pickTokenFromPool = (tokenType: 'equals' | 'operator' | 'light' | 'heavy' | 'Blank' | 'zero', specificOperator?: '+' | '-' | '×' | '÷'): AmathToken | null => {
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
    } else if (tokenType === 'Blank') {
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
  if (operatorMode === 'specific' && operatorFixed) {
    // Flexible specific mode: fix บางตัว, random บางตัว
    const fixedOps: Array<{type: '+' | '-' | '×' | '÷', count: number}> = [];
    const randomOps: Array<'+' | '-' | '×' | '÷'> = [];
    let fixedSum = 0;
    (['+', '-', '×', '÷'] as const).forEach(type => {
      const v = operatorFixed[type];
      if (typeof v === 'number' && v > 0) {
        fixedOps.push({ type, count: v });
        fixedSum += v;
      } else {
        randomOps.push(type);
      }
    });
    // ใส่ operator ที่ fix ก่อน
    for (const { type, count } of fixedOps) {
      if (typeof count === 'number' && count > 0) {
        for (let i = 0; i < count; i++) {
          const token = pickTokenFromPool('operator', type);
          if (!token) {
            throw new Error(`Not enough ${type} tokens in pool.`);
          }
          selectedTokens.push(createElementFromToken(token));
        }
      }
    }
    // ที่เหลือ random
    const remain = operatorCount - fixedSum;
    for (let i = 0; i < remain; i++) {
      // random จาก operator ที่ยังไม่ fix
      const type = randomOps[Math.floor(Math.random() * randomOps.length)];
      const token = pickTokenFromPool('operator', type);
      if (!token) {
        throw new Error(`Not enough ${type} tokens in pool.`);
      }
      selectedTokens.push(createElementFromToken(token));
    }
  } else if (operatorMode === 'specific' && specificOperators) {
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
  
  // Pick Blank tokens
  for (let i = 0; i < BlankCount; i++) {
    const token = pickTokenFromPool('Blank');
    if (!token) {
      throw new Error('Not enough Blank tokens in pool.');
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
 * Sort tokens by priority for better readability
 */
function sortTokensByPriority(tokens: EquationElement[]): EquationElement[] {
  const amathOrder = Object.keys(AMATH_TOKENS);
  return tokens.sort((a, b) => {
    const getPriority = (token: EquationElement): number => {
      if (token.type === 'number') return 1;
      if (token.type === 'operator') return 2;
      if (token.type === 'equals') return 3;
      if (token.type === 'choice') return 4;
      return 5;
    };
    const pa = getPriority(a);
    const pb = getPriority(b);
    if (pa !== pb) return pa - pb;
    // secondary sort by value order in AMATH_TOKENS
    return amathOrder.indexOf(a.value) - amathOrder.indexOf(b.value);
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