import { isValidEquationByRules } from '../equationAnagramLogic';

describe('isValidEquationByRules', () => {
  test('ควรผ่านเมื่อสมการถูกต้องทางคณิตศาสตร์', () => {
    expect(isValidEquationByRules('1+2=3')).toBe(true);
    expect(isValidEquationByRules('2×3=6')).toBe(true);
  });

  test('ควรไม่ผ่านเมื่อสมการผิด', () => {
    expect(isValidEquationByRules('1+2=4')).toBe(false);
    expect(isValidEquationByRules('1++2=3')).toBe(false);
  });

  test('ควรผ่านเมื่อมีลำดับการคำนวณที่ถูกต้อง (× ก่อน +)', () => {
    expect(isValidEquationByRules('2+3×4=14')).toBe(true); // 2+12=14
  });

  test('ควรผ่านเมื่อมีเศษส่วนในสมการ', () => {
    expect(isValidEquationByRules('7÷2=7÷2')).toBe(true); // 3.5=3.5
    expect(isValidEquationByRules('7÷2+1=9÷2')).toBe(true); // 3.5+1=4.5
  });

  test('ควรผ่านเมื่อทุกจำนวน ≤ 999', () => {
    expect(isValidEquationByRules('999+0=999')).toBe(true);
  });

  test('ควรไม่ผ่านเมื่อมีจำนวน > 999', () => {
    expect(isValidEquationByRules('1000+1=1001')).toBe(false);
  });

  test('ควรผ่านเมื่อมี "=" มากกว่า 1 ตัวและค่าทั้งหมดเท่ากัน', () => {
    expect(isValidEquationByRules('1+1=2=2')).toBe(true);
  });

  test('ควรผ่านเฉพาะกรณีเครื่องหมายติดกันแบบ =-', () => {
    expect(isValidEquationByRules('1=-2+3')).toBe(true);
  });

  test('ควรไม่ผ่านเมื่อมีเครื่องหมายติดกันแบบอื่น', () => {
    expect(isValidEquationByRules('1=+2+3')).toBe(false);
  });

  test('ควรไม่ผ่านเมื่อมี -0', () => {
    expect(isValidEquationByRules('-0×789=0')).toBe(false);
  });

  test('ควรผ่านเมื่อเป็น - ตามด้วยเลขอื่นที่ไม่ใช่ 0', () => {
    expect(isValidEquationByRules('6=6-0')).toBe(true);
  });

  test('ควรผ่านเมื่อสมการอยู่ในช่วง 8–15 ตัว', () => {
    expect(isValidEquationByRules('1+2+3+4+5=15')).toBe(true); // 11 ตัว
    expect(isValidEquationByRules('12×34=408')).toBe(true);    // 10 ตัว
    expect(isValidEquationByRules('100+200=300=300')).toBe(true); // 14 ตัว
  });
});