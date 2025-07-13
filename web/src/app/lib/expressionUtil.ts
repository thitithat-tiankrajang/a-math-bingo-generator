/* eslint-disable @typescript-eslint/no-unused-vars */
// ฟังก์ชันเกี่ยวกับการประเมินผลนิพจน์
import { Fraction, addFractions, subtractFractions, multiplyFractions, divideFractions } from './fractionUtil';
import { isValidNumberToken } from './tokenUtil';

export function evaluateExpressionAsFraction(expression: string): Fraction | null {
  try {
    expression = expression.trim().replace(/\s/g, '');
    if (!/^[\-0-9+\-×÷\.]+$/.test(expression)) {
      return null;
    }
    if (containsInvalidZeroLeadingNumbers(expression)) {
      return null;
    }
    if (expression.startsWith('-')) {
      if (/^\-\d+$/.test(expression)) {
        const num = parseInt(expression);
        if (isNaN(num)) return null;
        return { numerator: num, denominator: 1 };
      }
    }
    if (/^\d+$/.test(expression)) {
      if (expression.length > 1 && expression.startsWith('0')) {
        return null;
      }
      return { numerator: parseInt(expression), denominator: 1 };
    }
    return evaluateLeftToRight(expression);
  } catch {
    return null;
  }
}

export function containsInvalidZeroLeadingNumbers(expression: string): boolean {
  const numbers = expression.match(/\d+/g);
  if (!numbers) return false;
  for (const num of numbers) {
    if (num.length > 1 && num.startsWith('0')) {
      return true;
    }
    if (num.length > 3) {
      return true;
    }
  }
  return false;
}

export function evaluateLeftToRight(expression: string): Fraction | null {
  try {
    const tokens = tokenizeExpression(expression);
    if (!tokens || tokens.length === 0) return null;
    if (isNaN(parseInt(tokens[0]))) return null;
    const numbers: Fraction[] = [];
    const operators: string[] = [];
    for (let i = 0; i < tokens.length; i++) {
      if (i % 2 === 0) {
        const num = parseInt(tokens[i]);
        if (isNaN(num)) return null;
        numbers.push({ numerator: num, denominator: 1 });
      } else {
        operators.push(tokens[i]);
      }
    }
    if (operators.length !== numbers.length - 1) return null;
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
          if (right.numerator === 0) return null;
          result = divideFractions(left, right);
        }
        processedNumbers[i] = result;
        processedNumbers.splice(i + 1, 1);
        processedOperators.splice(i, 1);
      } else {
        i++;
      }
    }
    let result = processedNumbers[0];
    for (let i = 0; i < processedOperators.length; i++) {
      const operator = processedOperators[i];
      const nextNumber = processedNumbers[i + 1];
      if (operator === '+') {
        result = addFractions(result, nextNumber);
      } else if (operator === '-') {
        result = subtractFractions(result, nextNumber);
      } else {
        return null;
      }
    }
    return result;
  } catch {
    return null;
  }
}

export function tokenizeExpression(expression: string): string[] | null {
  try {
    const tokens: string[] = [];
    let currentNumber = '';
    let i = 0;
    while (i < expression.length) {
      const char = expression[i];
      if (/\d/.test(char)) {
        currentNumber += char;
      } else if (['+', '-', '×', '÷'].includes(char)) {
        if (currentNumber) {
          if (!isValidNumberToken(currentNumber)) {
            return null;
          }
          tokens.push(currentNumber);
          currentNumber = '';
        }
        if (char === '-') {
          const isNegativeNumber = (
            tokens.length === 0 ||
            tokens[tokens.length - 1] === '=' ||
            tokens[tokens.length - 1] === '+' ||
            tokens[tokens.length - 1] === '-' ||
            tokens[tokens.length - 1] === '×' ||
            tokens[tokens.length - 1] === '÷'
          );
          if (isNegativeNumber && i + 1 < expression.length && /\d/.test(expression[i + 1])) {
            currentNumber = '-';
          } else {
            tokens.push(char);
          }
        } else {
          tokens.push(char);
        }
      } else {
        return null;
      }
      i++;
    }
    if (currentNumber) {
      if (!isValidNumberToken(currentNumber)) {
        return null;
      }
      tokens.push(currentNumber);
    }
    return tokens;
  } catch {
    return null;
  }
} 