// src/lib/mathBingoLogic.ts
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

/**
 * Generate AMath bingo problem based on options
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
      // Reset and generate tokens for each attempt (reset pool)
      const tokens = generateTokensBasedOnOptions(options);
      const equations = findValidEquations(tokens);
      
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
 * Generate tokens based on selected options
 */
function generateTokensBasedOnOptions(options: MathBingoOptions): EquationElement[] {
  const { totalCount, operatorCount, equalsCount, heavyNumberCount, wildcardCount, zeroCount } = options;
  const lightNumberCount = totalCount - operatorCount - equalsCount - heavyNumberCount - wildcardCount - zeroCount;
  
  if (lightNumberCount < 0) {
    throw new Error('Not enough light numbers. Please adjust your options.');
  }
  
  // Create pool with actual AMath tile counts
  const availablePool = createAvailableTokenPool();
  const selectedTokens: EquationElement[] = [];
  
  // Pick token from pool by type
  const pickTokenFromPool = (tokenType: 'equals' | 'operator' | 'light' | 'heavy' | 'wildcard' | 'zero'): AmathToken | null => {
    let candidates: AmathToken[] = [];
    
    if (tokenType === 'equals') {
      candidates = availablePool.filter(token => token === '=');
    } else if (tokenType === 'operator') {
      candidates = availablePool.filter(token => ['+', '-', '×', '÷'].includes(token));
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
  
  // Pick operator tokens
  for (let i = 0; i < operatorCount; i++) {
    const token = pickTokenFromPool('operator');
    if (!token) {
      throw new Error('Not enough operator tokens in pool.');
    }
    selectedTokens.push(createElementFromToken(token));
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
 * Find valid equations from given tokens
 */
function findValidEquations(tokens: EquationElement[]): string[] {
  const validEquations: string[] = [];
  const tokenValues = tokens.map(t => t.originalToken);
  
  // Generate possible permutations
  const permutations = generateLimitedPermutations(tokenValues, 1500);
  
  for (const perm of permutations) {
    try {
      const equation = createEquationFromPermutation(perm);
      if (equation && isValidEquationByRules(equation)) {
        validEquations.push(equation);
        if (validEquations.length >= 15) break; // Limit number of checks
      }
    } catch {
      continue;
    }
  }

  return [...new Set(validEquations)]; // Remove duplicate equations
}

/**
 * Create equation from token permutation
 */
function createEquationFromPermutation(tokens: AmathToken[]): string | null {
  const processedTokens: string[] = [];
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const tokenInfo = AMATH_TOKENS[token];
    
    if (!tokenInfo) continue;

    // Handle choice tokens
    if (tokenInfo.type === 'choice') {
      const choiceResult = handleChoiceToken(token);
      if (!choiceResult) return null;
      processedTokens.push(choiceResult);
    } 
    // Handle wildcard - simplify to a simple number
    else if (tokenInfo.type === 'wildcard') {
      const wildcardOptions = ['1', '2', '3', '4', '5'];
      const randomWildcard = wildcardOptions[Math.floor(Math.random() * wildcardOptions.length)];
      processedTokens.push(randomWildcard);
    }
    else {
      processedTokens.push(token);
    }
  }
  
  // Combine consecutive light numbers
  const finalTokens = combineLightNumbers(processedTokens);
  
  // If combineLightNumbers returns empty array, it's not valid (0 with -)
  if (finalTokens.length === 0) {
    return null;
  }
  
  // Basic structure check
  if (!isValidTokenStructure(finalTokens)) {
    return null;
  }
  
  return finalTokens.join('');
}

/**
 * Combine consecutive light numbers into multi-digit numbers
 */
function combineLightNumbers(tokens: string[]): string[] {
  const result: string[] = [];
  let i = 0;
  
  while (i < tokens.length) {
    const token = tokens[i];
    
    // Heavy numbers must be separate and cannot be adjacent to other numbers
    if (isHeavyNumber(token)) {
      // Check if heavy number is not adjacent to other numbers
      const prev = tokens[i - 1];
      const next = tokens[i + 1];
      
      if ((prev && (isLightNumber(prev) || isHeavyNumber(prev) || prev === '0')) || 
          (next && (isLightNumber(next) || isHeavyNumber(next) || next === '0'))) {
        return []; // return empty array to indicate invalid
      }
      
      result.push(token);
      i++;
      continue;
    }
    
    // Combine only light numbers and 0s adjacent to each other
    if (isLightNumber(token) || token === '0') {
      // Check if light/0 is not adjacent to heavy numbers
      const prev = tokens[i - 1];
      if (prev && isHeavyNumber(prev)) {
        return []; // return empty array to indicate invalid
      }
      
      let combinedNumber = token;
      let j = i + 1;
      
      // Combine only light numbers and 0s adjacent to each other, up to 3 digits
      while (j < tokens.length && j - i < 3 && (isLightNumber(tokens[j]) || tokens[j] === '0')) {
        // Check if the next token is not a heavy number
        if (j + 1 < tokens.length && isHeavyNumber(tokens[j + 1])) {
          break; // Stop combining if the next is a heavy number
        }
        
        // Do not allow 0 to precede other numbers
        if (combinedNumber === '0' && tokens[j] !== '0') {
          break;
        }
        combinedNumber += tokens[j];
        j++;
      }
      
      // If 0 is at the beginning and there are numbers following, use only 0
      if (combinedNumber.startsWith('0') && combinedNumber.length > 1) {
        result.push('0');
        i++;
      } else {
        result.push(combinedNumber);
        i = j;
      }
    } else {
      // Others (operators, =, wildcard, choice)
      result.push(token);
      i++;
    }
  }
  
  // Additional check: 0 should not be adjacent to -
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
 * Check if token structure is valid
 */
function isValidTokenStructure(tokens: string[]): boolean {
  if (tokens.length < 3) return false;
  
  // Must have at least 1 =
  if (!tokens.includes('=')) return false;
  
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
 * Handle choice tokens (+/- or ×/÷)
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
 * Check if equation is valid according to rules
 */
function isValidEquationByRules(equation: string): boolean {
  try {
    // Split equation by =
    const equalIndex = equation.indexOf('=');
    if (equalIndex === -1) return false;
    
    const leftSide = equation.substring(0, equalIndex);
    const rightSide = equation.substring(equalIndex + 1);
    
    if (leftSide.length === 0 || rightSide.length === 0) return false;
    
    // Calculate values on both sides
    const leftValue = evaluateExpressionSafely(leftSide);
    const rightValue = evaluateExpressionSafely(rightSide);
    
    if (leftValue === null || rightValue === null) return false;
    
    // Check if results are equal
    return Math.abs(leftValue - rightValue) < 0.0001;
  } catch {
    return false;
  }
}

/**
 * Evaluate expression safely
 */
function evaluateExpressionSafely(expr: string): number | null {
  try {
    // Replace AMath symbols
    const processedExpr = expr.replace(/×/g, '*').replace(/÷/g, '/');
    
    // Check safety of expression
    if (!/^[0-9+\-*/\s\.]+$/.test(processedExpr)) {
      return null;
    }
    
    // Check division by zero
    if (processedExpr.includes('/0')) {
      return null;
    }
    
    // Calculate
    const result = Function('"use strict"; return (' + processedExpr + ')')();
    
    // Check result
    if (typeof result !== 'number' || !isFinite(result)) {
      return null;
    }
    
    return result;
  } catch {
    return null;
  }
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
 * Sort tokens by priority
 */
function sortTokensByPriority(tokens: EquationElement[]): EquationElement[] {
  return tokens.sort((a, b) => {
    const priorityA = getTokenPriority(a.originalToken);
    const priorityB = getTokenPriority(b.originalToken);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // If priorities are the same, sort by value
    return compareTokenValues(a.originalToken, b.originalToken);
  });
}

/**
 * Assign priority to each token type
 */
function getTokenPriority(token: AmathToken): number {
  const tokenInfo = AMATH_TOKENS[token];
  if (!tokenInfo) return 999;
  
  switch (tokenInfo.type) {
    case 'lightNumber': 
      return token === '0' ? 0.5 : 1; // Give 0 precedence over other light numbers
    case 'heavyNumber': return 2;   // Heavy numbers 10-20
    case 'operator': return 3;      // Add, Subtract, Multiply, Divide
    case 'choice': return 4;        // Add or Subtract, Multiply or Divide
    case 'equals': return 5;        // Equals
    case 'wildcard': return 6;      // ?
    default: return 999;
  }
}

/**
 * Compare values of tokens within the same group
 */
function compareTokenValues(a: AmathToken, b: AmathToken): number {
  const aInfo = AMATH_TOKENS[a];
  const bInfo = AMATH_TOKENS[b];
  
  // Light numbers and heavy numbers are sorted by their numeric value
  if ((aInfo.type === 'lightNumber' || aInfo.type === 'heavyNumber') &&
      (bInfo.type === 'lightNumber' || bInfo.type === 'heavyNumber')) {
    return parseInt(a) - parseInt(b);
  }
  
  // Operators are sorted by +, -, ×, ÷
  if (aInfo.type === 'operator' && bInfo.type === 'operator') {
    const operatorOrder = ['+', '-', '×', '÷'];
    return operatorOrder.indexOf(a) - operatorOrder.indexOf(b);
  }
  
  // Choice operators are sorted by +/-, ×/÷
  if (aInfo.type === 'choice' && bInfo.type === 'choice') {
    const choiceOrder = ['+/-', '×/÷'];
    return choiceOrder.indexOf(a) - choiceOrder.indexOf(b);
  }
  
  // Others are sorted by string
  return a.localeCompare(b);
}

/**
 * Validate options
 */
export function validateMathBingoOptions(options: MathBingoOptions): string | null {
  const { totalCount, operatorCount, equalsCount, heavyNumberCount, wildcardCount, zeroCount } = options;
  const lightNumberCount = totalCount - operatorCount - equalsCount - heavyNumberCount - wildcardCount - zeroCount;
  
  if (totalCount < 8) {
    return "Total number of tiles and operators must be at least 8.";
  }
  
  if (totalCount > 20) {
    return "Total number of tiles and operators must not exceed 20.";
  }
  
  if (operatorCount < 1) {
    return "Must have at least 1 operator.";
  }
  
  if (equalsCount < 1) {
    return "Must have at least 1 equals (=) sign.";
  }
  
  if (lightNumberCount < 0) {
    return "Not enough light numbers. Please adjust your options.";
  }
  
  if (lightNumberCount + heavyNumberCount + zeroCount < 2) {
    return "Must have at least 2 numbers.";
  }
  
  // Check if the requested number is available in the pool
  const totalAvailableTokens = Object.values(AMATH_TOKENS).reduce((sum, token) => sum + token.count, 0);
  if (totalCount > totalAvailableTokens) {
    return `Requested number of sets (${totalCount}) exceeds available tokens (${totalAvailableTokens}).`;
  }
  
  // Check equals sign
  const availableEquals = AMATH_TOKENS['='].count;
  if (equalsCount > availableEquals) {
    return `Requested number of equals (=) (${equalsCount}) exceeds available tokens (${availableEquals}).`;
  }
  
  // Check operators
  const availableOperators = AMATH_TOKENS['+'].count + AMATH_TOKENS['-'].count + 
                            AMATH_TOKENS['×'].count + AMATH_TOKENS['÷'].count;
  if (operatorCount > availableOperators) {
    return `Requested number of operators (${operatorCount}) exceeds available tokens (${availableOperators}).`;
  }
  
  // Check heavy numbers
  const availableHeavyNumbers = Object.entries(AMATH_TOKENS)
    .filter(([, info]) => info.type === 'heavyNumber')
    .reduce((sum, [, info]) => sum + info.count, 0);
  if (heavyNumberCount > availableHeavyNumbers) {
    return `Requested number of heavy numbers (${heavyNumberCount}) exceeds available tokens (${availableHeavyNumbers}).`;
  }
  
  // Check wildcard
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
 * Check if a set of numbers and operators can form a valid equation
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
 * Find all possible equations from a given set of numbers and operators
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