import { 
  canFormValidEquation, 
  findAllPossibleEquations, 
  isValidEquationByRules,
  generateEquationAnagram 
} from '../equationAnagramLogic';
import type { EquationAnagramOptions } from '@/app/types/EquationAnagram';

describe('Equation Anagram Logic Tests', () => {
  
  describe('🔢 1. ระบบเช็คสมการ (Equation Validation Tests)', () => {
    
    describe('✅ สมการที่ถูกต้อง - ควร Return True', () => {
      test('สมการบวกง่าย', () => {
        const equation = '1+2=3';
        expect(isValidEquationByRules(equation)).toBe(true);
      });

      test('สมการคูณง่าย', () => {
        const equation = '2×3=6';
        expect(isValidEquationByRules(equation)).toBe(true);
      });

      test('สมการหาร', () => {
        const equation = '6÷2=3';
        expect(isValidEquationByRules(equation)).toBe(true);
      });

      test('สมการหลายขั้นตอน', () => {
        const equation = '1+2×3=7';
        expect(isValidEquationByRules(equation)).toBe(true);
      });

      test('สมการซับซ้อน', () => {
        const equation = '2+3×4=14';
        expect(isValidEquationByRules(equation)).toBe(true);
      });

      test('สมการที่มี zero เป็นจำนวนบวก', () => {
        const equation = '6=6-0×5';
        expect(isValidEquationByRules(equation)).toBe(true);
      });

      test('สมการที่มีเลขหนัก', () => {
        const equation = '10+5=15';
        expect(isValidEquationByRules(equation)).toBe(true);
      });

      test('สมการที่มี equals หลายตัว', () => {
        const equation = '-1+3=2=2';
        expect(isValidEquationByRules(equation)).toBe(true);
      });

      test('สมการที่มี zero กลาง expression', () => {
        const equation = '5+0+3=8';
        expect(isValidEquationByRules(equation)).toBe(true);
      });

      test('สมการที่มี zero ท้าย expression', () => {
        const equation = '3+2=5+0';
        expect(isValidEquationByRules(equation)).toBe(true);
      });

      test('สมการที่มีเศษส่วน', () => {
        const equation = '1÷2=1÷2';
        expect(isValidEquationByRules(equation)).toBe(true);
      });

      test('สมการที่มีจำนวนลบ', () => {
        const equation = '1=-2+3';
        expect(isValidEquationByRules(equation)).toBe(true);
      });
    });

    describe('❌ สมการที่ผิด - ควร Return False', () => {
      test('สมการที่ไม่มี equals sign', () => {
        const equation = '1+2+3';
        expect(isValidEquationByRules(equation)).toBe(false);
      });

      test('สมการที่มี equals อยู่ต้น', () => {
        const equation = '=1+2';
        expect(isValidEquationByRules(equation)).toBe(false);
      });

      test('สมการที่มี equals อยู่ท้าย', () => {
        const equation = '1+2=';
        expect(isValidEquationByRules(equation)).toBe(false);
      });

      test('สมการที่มีผลลัพธ์ผิด', () => {
        const equation = '1+1=3';
        expect(isValidEquationByRules(equation)).toBe(false);
      });

      test('สมการที่มี expression ว่าง', () => {
        const equation = '=5';
        expect(isValidEquationByRules(equation)).toBe(false);
      });

      test('สมการที่มี operators ติดกัน', () => {
        const equation = '1++2=3';
        expect(isValidEquationByRules(equation)).toBe(false);
      });

      test('สมการที่มีเลขเกิน 999', () => {
        const equation = '1000+1=1001';
        expect(isValidEquationByRules(equation)).toBe(false);
      });

      test('สมการที่มี negative zero', () => {
        const equation = '-0×789=0';
        expect(isValidEquationByRules(equation)).toBe(false);
      });

      test('สมการที่มี negative zero ในสมการ', () => {
        const equation = '0=-0÷678';
        expect(isValidEquationByRules(equation)).toBe(false);
      });

      test('สมการที่มีเลขหนักติดกับเลข', () => {
        const equation = '1010=20';
        expect(isValidEquationByRules(equation)).toBe(false);
      });

      test('สมการที่มี equals ติดกับ operators (ยกเว้นจำนวนลบ)', () => {
        const equation = '1=+2';
        expect(isValidEquationByRules(equation)).toBe(false);
      });
    });

    describe('🧪 Test Cases สำหรับโยนสมการเข้าไปทดสอบ', () => {
      test('โยนสมการที่ซับซ้อนเข้าไป', () => {
        const complexEquations = [
          '10+5×2=20',
          '15÷3+7=12',
          '2×3×4=24',
          '100-50÷2=75',
          '1+2+3+4=10'
        ];

        complexEquations.forEach(equation => {
          const result = isValidEquationByRules(equation);
          console.log(`สมการ: ${equation} → ${result ? '✅ ถูกต้อง' : '❌ ผิด'}`);
          expect(typeof result).toBe('boolean');
        });
      });

      test('โยนสมการที่มี edge cases', () => {
        const edgeCaseEquations = [
          '0+0=0',
          '1×0=0',
          '5-0=5',
          '0÷1=0',
          '1+0+1=2'
        ];

        edgeCaseEquations.forEach(equation => {
          const result = isValidEquationByRules(equation);
          console.log(`Edge Case: ${equation} → ${result ? '✅ ถูกต้อง' : '❌ ผิด'}`);
          expect(typeof result).toBe('boolean');
        });
      });
    });
  });

  describe('📋 2. ระบบเช็คกฎ (Rule Validation Tests)', () => {
    
    describe('✅ ชุดตัวเบี้ยที่ถูกต้องตามกฎ - ควร Return True', () => {
      test('ชุดตัวเบี้ยพื้นฐาน', () => {
        const tokens = ['1', '+', '2', '=', '3'];
        expect(canFormValidEquation(tokens)).toBe(true);
      });

      test('ชุดตัวเบี้ยที่มีเลขหนัก', () => {
        const tokens = ['10', '+', '5', '=', '15'];
        expect(canFormValidEquation(tokens)).toBe(true);
      });

      test('ชุดตัวเบี้ยที่มี zero', () => {
        const tokens = ['5', '-', '0', '=', '5'];
        expect(canFormValidEquation(tokens)).toBe(true);
      });

      test('ชุดตัวเบี้ยที่มี equals หลายตัว', () => {
        const tokens = ['1', '+', '1', '=', '2', '=', '2'];
        expect(canFormValidEquation(tokens)).toBe(true);
      });

      test('ชุดตัวเบี้ยที่มี blank', () => {
        const tokens = ['1', '?', '2', '=', '3'];
        expect(canFormValidEquation(tokens)).toBe(true);
      });

      test('ชุดตัวเบี้ยที่มี choice tokens', () => {
        const tokens = ['1', '+/-', '2', '=', '3'];
        expect(canFormValidEquation(tokens)).toBe(true);
      });

      test('ชุดตัวเบี้ยที่มีเลขหลายหลัก', () => {
        const tokens = ['1', '2', '3', '+', '4', '=', '1', '2', '7'];
        expect(canFormValidEquation(tokens)).toBe(true);
      });
    });

    describe('❌ ชุดตัวเบี้ยที่ผิดกฎ - ควร Return False', () => {
      test('ชุดตัวเบี้ยที่ไม่มี equals', () => {
        const tokens = ['1', '+', '2', '+', '3'];
        expect(canFormValidEquation(tokens)).toBe(false);
      });

      test('ชุดตัวเบี้ยที่มี operators ติดกัน', () => {
        const tokens = ['1', '+', '+', '2', '=', '3'];
        expect(canFormValidEquation(tokens)).toBe(false);
      });

      test('ชุดตัวเบี้ยที่มี equals อยู่ต้น', () => {
        const tokens = ['=', '1', '+', '2'];
        expect(canFormValidEquation(tokens)).toBe(false);
      });

      test('ชุดตัวเบี้ยที่มี equals อยู่ท้าย', () => {
        const tokens = ['1', '+', '2', '='];
        expect(canFormValidEquation(tokens)).toBe(false);
      });

      test('ชุดตัวเบี้ยที่มี negative zero', () => {
        const tokens = ['-', '0', '×', '7', '8', '9', '=', '0'];
        expect(canFormValidEquation(tokens)).toBe(false);
      });

      test('ชุดตัวเบี้ยที่มีเลขหนักติดกับเลข', () => {
        const tokens = ['1', '0', '5', '=', '1', '5'];
        expect(canFormValidEquation(tokens)).toBe(false);
      });

      test('ชุดตัวเบี้ยที่มีเลขเกิน 3 หลัก', () => {
        const tokens = ['1', '2', '3', '4', '+', '5', '=', '1', '2', '3', '9'];
        expect(canFormValidEquation(tokens)).toBe(false);
      });

      test('ชุดตัวเบี้ยที่สั้นเกินไป', () => {
        const tokens = ['1', '=', '1'];
        expect(canFormValidEquation(tokens)).toBe(false);
      });
    });

    describe('🧪 Test Cases สำหรับโยนชุดตัวเบี้ยเข้าไปทดสอบ', () => {
      test('โยนชุดตัวเบี้ยที่ซับซ้อนเข้าไป', () => {
        const complexTokenSets = [
          ['1', '0', '+', '5', '×', '2', '=', '2', '0'],
          ['1', '5', '÷', '3', '+', '7', '=', '1', '2'],
          ['2', '×', '3', '×', '4', '=', '2', '4'],
          ['1', '0', '0', '-', '5', '0', '÷', '2', '=', '7', '5']
        ];

        complexTokenSets.forEach(tokens => {
          const result = canFormValidEquation(tokens);
          console.log(`ชุดตัวเบี้ย: [${tokens.join(', ')}] → ${result ? '✅ ถูกต้อง' : '❌ ผิด'}`);
          expect(typeof result).toBe('boolean');
        });
      });

      test('โยนชุดตัวเบี้ยที่มี blanks', () => {
        const blankTokenSets = [
          ['1', '?', '2', '=', '3'],
          ['?', '+', '5', '=', '6'],
          ['1', '0', '?', '=', '1', '5'],
          ['?', '×', '?', '=', '?']
        ];

        blankTokenSets.forEach(tokens => {
          const result = canFormValidEquation(tokens);
          console.log(`ชุดตัวเบี้ย (มี blanks): [${tokens.join(', ')}] → ${result ? '✅ ถูกต้อง' : '❌ ผิด'}`);
          expect(typeof result).toBe('boolean');
        });
      });

      test('โยนชุดตัวเบี้ยที่มี edge cases', () => {
        const edgeCaseTokenSets = [
          ['0', '+', '0', '=', '0'],
          ['1', '×', '0', '=', '0'],
          ['5', '-', '0', '=', '5'],
          ['0', '÷', '1', '=', '0']
        ];

        edgeCaseTokenSets.forEach(tokens => {
          const result = canFormValidEquation(tokens);
          console.log(`Edge Case: [${tokens.join(', ')}] → ${result ? '✅ ถูกต้อง' : '❌ ผิด'}`);
          expect(typeof result).toBe('boolean');
        });
      });
    });

    describe('🔍 ระบบค้นหาสมการทั้งหมดที่เป็นไปได้', () => {
      test('ค้นหาสมการจากชุดตัวเบี้ยที่ถูกต้อง', () => {
        const tokens = ['1', '+', '2', '=', '3'];
        const equations = findAllPossibleEquations(tokens);
        
        expect(equations.length).toBeGreaterThan(0);
        console.log(`สมการที่เป็นไปได้จาก [${tokens.join(', ')}]:`);
        equations.forEach((eq, index) => {
          console.log(`  ${index + 1}. ${eq}`);
        });
        
        // ตรวจสอบว่าสมการทั้งหมดถูกต้อง
        equations.forEach(equation => {
          expect(isValidEquationByRules(equation)).toBe(true);
        });
      });

      test('ค้นหาสมการจากชุดตัวเบี้ยที่มี blanks', () => {
        const tokens = ['1', '?', '2', '=', '3'];
        const equations = findAllPossibleEquations(tokens);
        
        console.log(`สมการที่เป็นไปได้จาก [${tokens.join(', ')}] (มี blanks):`);
        equations.forEach((eq, index) => {
          console.log(`  ${index + 1}. ${eq}`);
        });
        
        expect(equations.length).toBeGreaterThan(0);
      });

      test('ค้นหาสมการจากชุดตัวเบี้ยที่ผิดกฎ', () => {
        const tokens = ['1', '+', '+', '2', '=', '3'];
        const equations = findAllPossibleEquations(tokens);
        
        expect(equations.length).toBe(0);
        console.log(`ชุดตัวเบี้ย [${tokens.join(', ')}] ไม่สามารถสร้างสมการได้`);
      });
    });
  });

  describe('🎲 3. ระบบสร้างสมการ (Equation Generation Tests)', () => {
    test('สร้างสมการด้วย options พื้นฐาน', async () => {
      const options: EquationAnagramOptions = {
        totalCount: 8,
        operatorCount: 2,
        equalsCount: 1,
        heavyNumberCount: 0,
        BlankCount: 0,
        zeroCount: 0,
        operatorMode: 'random'
      };

      const result = await generateEquationAnagram(options);
      
      expect(result.elements).toHaveLength(8);
      expect(result.sampleEquation).toBeDefined();
      expect(result.possibleEquations?.length).toBeGreaterThan(0);
      
      console.log('ผลลัพธ์การสร้างสมการ:');
      console.log(`Elements: [${result.elements.join(', ')}]`);
      console.log(`Sample Equation: ${result.sampleEquation}`);
      console.log(`Possible Equations: ${result.possibleEquations?.length} equations`);
      
              // ตรวจสอบว่าสมการตัวอย่างถูกต้อง
        expect(isValidEquationByRules(result.sampleEquation!)).toBe(true);
    });

    test('สร้างสมการด้วย specific operators', async () => {
      const options: EquationAnagramOptions = {
        totalCount: 10,
        operatorCount: 3,
        equalsCount: 1,
        heavyNumberCount: 1,
        BlankCount: 0,
        zeroCount: 0,
        operatorMode: 'specific',
        operatorFixed: {
          '+': 2,
          '-': 1,
          '×': null,
          '÷': null
        }
      };

      const result = await generateEquationAnagram(options);
      
      expect(result.elements).toHaveLength(10);
      expect(result.sampleEquation).toBeDefined();
      
      console.log('ผลลัพธ์การสร้างสมการ (specific operators):');
      console.log(`Elements: [${result.elements.join(', ')}]`);
      console.log(`Sample Equation: ${result.sampleEquation}`);
      
      // นับ operators ในสมการ
      const plusCount = (result.sampleEquation!.match(/\+/g) || []).length;
      const minusCount = (result.sampleEquation!.match(/-/g) || []).length;
      
      console.log(`+ operators: ${plusCount}, - operators: ${minusCount}`);
      expect(plusCount).toBeGreaterThanOrEqual(2);
      expect(minusCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('🔧 4. Utility Functions สำหรับการทดสอบ', () => {
    test('ทดสอบฟังก์ชัน canFormValidEquation กับชุดตัวเบี้ยต่างๆ', () => {
      const testCases = [
        { tokens: ['1', '+', '2', '=', '3'], expected: true, description: 'ชุดตัวเบี้ยถูกต้อง' },
        { tokens: ['1', '+', '+', '2', '=', '3'], expected: false, description: 'operators ติดกัน' },
        { tokens: ['-', '0', '=', '0'], expected: false, description: 'negative zero' },
        { tokens: ['1', '0', '5', '=', '1', '5'], expected: false, description: 'เลขหนักติดกับเลข' },
        { tokens: ['1', '?', '2', '=', '3'], expected: true, description: 'มี blank' }
      ];

      testCases.forEach(({ tokens, expected, description }) => {
        const result = canFormValidEquation(tokens);
        console.log(`${description}: [${tokens.join(', ')}] → ${result === expected ? '✅' : '❌'} (expected: ${expected}, got: ${result})`);
        expect(result).toBe(expected);
      });
    });
  });
});
