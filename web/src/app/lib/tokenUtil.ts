// ฟังก์ชันเกี่ยวกับ token
export function isNumber(token: string): boolean {
  return /^\d+$/.test(token);
}

export function isLightNumber(token: string): boolean {
  return /^[1-9]$/.test(token);
}

export function isHeavyNumber(token: string): boolean {
  const num = parseInt(token);
  return num >= 10 && num <= 20;
}

export function isOperator(token: string): boolean {
  return ['+', '-', '×', '÷'].includes(token);
}

import { AMATH_TOKENS } from './equationAnagramLogic';
import type { EquationElement } from '@/app/types/EquationAnagram';

export function getElementType(token: string): EquationElement['type'] {
  const tokenInfo = AMATH_TOKENS[token as keyof typeof AMATH_TOKENS];
  if (!tokenInfo) return 'Blank';
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
    case 'Blank':
      return 'Blank';
    default:
      return 'Blank';
  }
}

export function isValidNumberToken(numberStr: string): boolean {
  let actualNumber = numberStr;
  let isNegative = false;
  if (numberStr.startsWith('-')) {
    isNegative = true;
    actualNumber = numberStr.substring(1);
  }
  if (!/^\d+$/.test(actualNumber)) return false;
  if (actualNumber.length > 1 && actualNumber.startsWith('0')) {
    return false;
  }
  if (actualNumber.length > 3) {
    return false;
  }
  const numValue = parseInt(actualNumber);
  if (numValue > 999) {
    return false;
  }
  if (isNegative) {
    if (actualNumber === '0') {
      return false;
    }
  }
  return true;
} 