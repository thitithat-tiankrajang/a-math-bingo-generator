# 🔄 Equation Anagram Generation Flow - Detailed Documentation

## 📋 Overview
This document describes the complete flow of generating valid mathematical equations from a set of tokens according to AMath Bingo rules.

---

## 🎯 Main Entry Point: `generateEquationAnagram(options)`

### Phase 1: Input Validation
```typescript
const validation = validateEquationAnagramOptions(options);
if (validation) {
  throw new Error(validation);
}
```

**Validation Checks:**
- ✅ **Total Tiles**: Must be between 8-15
- ✅ **Operator Count**: Must not exceed available tokens
- ✅ **Equals Count**: Must not exceed available tokens (11 max)
- ✅ **Heavy Numbers**: Must not exceed available tokens
- ✅ **Blanks**: Must not exceed available tokens (4 max)
- ✅ **Zeros**: Must not exceed available tokens (4 max)
- ✅ **Light Numbers**: Must not exceed available tokens
- ✅ **Specific Operator Configuration**: Must be valid if in specific mode

**Error Examples:**
- `totalCount: 5` → "Total count must be at least 8"
- `operatorCount: 20` → "Requested number of operators exceeds available tokens"
- `equalsCount: 15` → "Requested number of equals exceeds available tokens"

---

### Phase 2: Generation Loop (Max 300 Attempts)
```typescript
let attempts = 0;
const maxAttempts = 300;

while (attempts < maxAttempts) {
  try {
    const tokens = generateTokensBasedOnOptions(options);
    const equations = findValidEquations(tokens, options.equalsCount);
    
    if (equations.length > 0) {
      return {
        elements: tokens.map(t => t.originalToken),
        sampleEquation: equations[0],
        possibleEquations: equations.slice(0, 10)
      };
    }
  } catch (error) {
    // Continue to next attempt
  }
  attempts++;
}
```

**Why 300 attempts?**
- Each attempt generates a new random token set
- Some combinations may not produce valid equations
- Prevents infinite loops
- Balances performance with success rate

---

## 🎲 Phase 3: Token Generation (`generateTokensBasedOnOptions`)

### 3.1 Create Token Pool
```typescript
const availablePool = createAvailableTokenPool();
```

**Pool Contents (based on AMATH_TOKENS):**
```
Numbers (Light): 1(6), 2(6), 3(5), 4(5), 5(4), 6(4), 7(4), 8(4), 9(4)
Numbers (Heavy): 10(2), 11(1), 12(2), 13(1), 14(1), 15(1), 16(1), 17(1), 18(1), 19(1), 20(1)
Operators: +(4), -(4), ×(4), ÷(4)
Equals: =(11)
Blanks: ?(4)
Zeros: 0(4)
```

### 3.2 Token Selection Order
**Priority-based selection (removes from pool after each pick):**

1. **Equals Tokens** (`=`)
   ```typescript
   for (let i = 0; i < equalsCount; i++) {
     const token = pickTokenFromPool('equals');
     selectedTokens.push(createElementFromToken(token));
   }
   ```

2. **Operator Tokens** (based on mode)
   
   **Random Mode:**
   ```typescript
   for (let i = 0; i < operatorCount; i++) {
     const token = pickTokenFromPool('operator'); // Random from +, -, ×, ÷
     selectedTokens.push(createElementFromToken(token));
   }
   ```
   
   **Specific Mode:**
   ```typescript
   // Fixed operators first
   for (const { type, count } of fixedOps) {
     for (let i = 0; i < count; i++) {
       const token = pickTokenFromPool('operator', type);
       selectedTokens.push(createElementFromToken(token));
     }
   }
   
   // Random remaining operators
   for (let i = 0; i < remain; i++) {
     const type = randomOps[Math.floor(Math.random() * randomOps.length)];
     const token = pickTokenFromPool('operator', type);
     selectedTokens.push(createElementFromToken(token));
   }
   ```

3. **Heavy Number Tokens** (`10-20`)
   ```typescript
   for (let i = 0; i < heavyNumberCount; i++) {
     const token = pickTokenFromPool('heavy');
     selectedTokens.push(createElementFromToken(token));
   }
   ```

4. **Blank Tokens** (`?`)
   ```typescript
   for (let i = 0; i < BlankCount; i++) {
     const token = pickTokenFromPool('Blank');
     selectedTokens.push(createElementFromToken(token));
   }
   ```

5. **Zero Tokens** (`0`)
   ```typescript
   for (let i = 0; i < zeroCount; i++) {
     const token = pickTokenFromPool('zero');
     selectedTokens.push(createElementFromToken(token));
   }
   ```

6. **Light Number Tokens** (`1-9`)
   ```typescript
   for (let i = 0; i < lightNumberCount; i++) {
     const token = pickTokenFromPool('light');
     selectedTokens.push(createElementFromToken(token));
   }
   ```

### 3.3 Token Sorting
```typescript
const sortedTokens = sortTokensByPriority(selectedTokens);
```

**Priority Order:**
1. Numbers (light → heavy)
2. Operators
3. Equals
4. Choice tokens
5. Blanks

---

## 🔍 Phase 4: Equation Finding (`findValidEquations`)

### 4.1 Blank Expansion
```typescript
const expandedTokenSets = expandBlanks(tokenValues);
```

**Blank Replacement Options:**
```typescript
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
```

**Example:**
- Input: `['1', '?', '2', '=', '3']`
- Output: `[['1', '0', '2', '=', '3'], ['1', '1', '2', '=', '3'], ['1', '+', '2', '=', '3'], ...]`

### 4.2 Permutation Generation
```typescript
for (const expandedTokens of expandedTokenSets) {
  // Skip if no equals in expansion
  const equalsInSet = expandedTokens.filter(t => t === '=').length;
  if (equalsInSet === 0) continue;
  
  const permutations = generateLimitedPermutations(expandedTokens, 10000);
  // Process each permutation...
}
```

**Permutation Limit:**
- Maximum 10,000 permutations per expanded set
- Prevents exponential explosion
- Balances completeness with performance

### 4.3 Equation Creation & Validation
```typescript
for (const perm of permutations) {
  try {
    const equation = createEquationFromPermutation(perm, Math.max(equalsCount, 1));
    if (equation && isValidEquationByRules(equation, Math.max(equalsCount, 1))) {
      validEquations.push(equation);
      if (validEquations.length >= 15) break;
    }
  } catch {
    continue;
  }
}
```

---

## 🔧 Phase 5: Equation Creation (`createEquationFromPermutation`)

### 5.1 Number Combination
```typescript
const processed = combineAdjacentNumbers(tokens);
```

**Combination Rules:**

**Heavy Numbers (10-20):**
- ✅ Must be isolated
- ❌ Cannot combine with other numbers
- Example: `['1', '0', '5']` → `['1', '0', '5']` (no combination)

**Zero (0):**
- ✅ Must be isolated
- ❌ Cannot combine with other numbers
- Example: `['1', '0', '5']` → `['1', '0', '5']` (no combination)

**Light Numbers (1-9):**
- ✅ Can combine up to 3 digits
- ✅ Can combine with other light numbers only
- ❌ Cannot exceed 999
- Example: `['1', '2', '3', '4']` → `['123', '4']`
- Example: `['1', '2', '3', '4', '5']` → `[]` (too many digits)

**Invalid Combinations:**
- `['1', '0', '5']` → `[]` (0 cannot combine)
- `['1', '0', '1', '0']` → `[]` (0 cannot combine)
- `['1', '2', '3', '4', '5']` → `[]` (exceeds 3 digits)

### 5.2 Token Structure Validation
```typescript
if (!isValidTokenStructure(processed, minEqualsCount)) return null;
```

**Structure Rules:**

**Equals Sign Rules:**
- ✅ Must have at least 1 equals sign
- ❌ Cannot be at beginning or end
- ✅ Can have multiple equals (e.g., `1+1=2=2`)

**Heavy Number Rules:**
- ✅ Must be adjacent to operators or equals only
- ❌ Cannot be adjacent to other numbers
- Example: `['10', '5', '=', '15']` → ❌ Invalid
- Example: `['10', '+', '5', '=', '15']` → ✅ Valid

**Zero Rules:**
- ❌ Cannot be negative (`-0`)
- ✅ Can be subtracted from positive numbers (`5-0`)
- Example: `['-', '0']` → ❌ Invalid (negative zero)
- Example: `['5', '-', '0']` → ✅ Valid

**Operator Rules:**
- ❌ Cannot be adjacent (except for negative numbers)
- ✅ `=` followed by `-` is allowed (for negative numbers)
- Example: `['1', '+', '+', '2']` → ❌ Invalid
- Example: `['1', '=', '-', '2']` → ✅ Valid (negative number)

### 5.3 Choice Token Resolution
```typescript
let equation = processed.join('');

// Handle choice tokens
equation = equation.replace(/\+\/-/g, () => Math.random() < 0.5 ? '+' : '-');
equation = equation.replace(/×\/÷/g, () => Math.random() < 0.5 ? '×' : '÷');
```

**Choice Token Examples:**
- `1+/-2=3` → `1+2=3` or `1-2=3`
- `2×/÷3=6` → `2×3=6` or `2÷3=6`

---

## ✅ Phase 6: Final Validation (`isValidEquationByRules`)

### 6.1 Structure Validation
```typescript
const parts = equation.split('=');
if (parts.length < 2) return false;

const actualEquals = parts.length - 1;
if (equalsCount > 0 && actualEquals !== equalsCount) return false;
if (actualEquals < 1) return false;
if (parts.some(part => part.length === 0)) return false;
```

**Structure Examples:**
- `1+2=3` → ✅ Valid (1 equals)
- `1+2` → ❌ Invalid (no equals)
- `=1+2` → ❌ Invalid (empty left side)
- `1+2=` → ❌ Invalid (empty right side)
- `1+1=2=2` → ✅ Valid (2 equals)

### 6.2 Mathematical Validation
```typescript
const fractions: Fraction[] = [];
for (const part of parts) {
  const fraction = evaluateExpressionAsFraction(part);
  if (!fraction) return false;
  fractions.push(fraction);
}

// Check if all fractions are equal
const firstFraction = fractions[0];
return fractions.every(fraction => compareFractions(fraction, firstFraction));
```

**Mathematical Examples:**
- `1+2=3` → ✅ Valid (3 = 3)
- `2×3=6` → ✅ Valid (6 = 6)
- `1+1=3` → ❌ Invalid (2 ≠ 3)
- `6÷2=3` → ✅ Valid (3 = 3)
- `1+2×3=7` → ✅ Valid (7 = 7)

**Fraction Handling:**
- `1÷2=0.5` → ✅ Valid (handled as fractions)
- `3÷2=1.5` → ✅ Valid (handled as fractions)

---

## 📤 Phase 7: Result Return

### 7.1 Success Case
```typescript
return {
  elements: tokens.map(t => t.originalToken),        // Original token array
  sampleEquation: equations[0],                      // First valid equation
  possibleEquations: equations.slice(0, 10)          // Up to 10 valid equations
};
```

**Example Result:**
```typescript
{
  elements: ['1', '+', '2', '=', '3'],
  sampleEquation: '1+2=3',
  possibleEquations: ['1+2=3', '2+1=3', '3=1+2', '3=2+1']
}
```

### 7.2 Failure Case
```typescript
throw new Error('Could not generate a valid problem. Please adjust your options or reduce the number of tiles/operators.');
```

---

## 🎯 Key Decision Points & Optimization

### 1. Token Selection Strategy
**Random Mode:**
- Completely random operator selection
- Faster generation
- Less predictable results

**Specific Mode:**
- Fixed operator counts
- More controlled generation
- Predictable operator distribution

### 2. Blank Expansion Strategy
**Comprehensive Expansion:**
- Expands to ALL possible values
- Ensures maximum equation coverage
- May be computationally expensive

**Optimization:**
- Skip expansions without equals
- Early termination when enough equations found

### 3. Permutation Limiting
**Performance vs Completeness:**
- 10,000 permutations per expansion
- 15 equations maximum
- 300 attempts maximum

### 4. Validation Layers
**Multi-level Validation:**
1. **Token Structure**: Basic arrangement rules
2. **Mathematical**: Actual computation validation
3. **Business Rules**: Special cases (negative zero, etc.)

### 5. Error Handling
**Graceful Degradation:**
- Continue on individual permutation failures
- Retry with new token sets
- Clear error messages for configuration issues

---

## 🔍 Debugging & Troubleshooting

### Common Issues:

**1. No Valid Equations Found:**
- Check token counts vs available pool
- Verify operator mode configuration
- Reduce complexity (fewer operators, more numbers)

**2. Performance Issues:**
- Reduce permutation limits
- Use specific operator mode
- Limit blank tokens

**3. Invalid Equations:**
- Check for negative zero patterns
- Verify heavy number isolation
- Ensure proper equals placement

### Debug Tools:
```typescript
// Test individual equation validation
testFractionEquation('1+2=3') // Returns boolean

// Check if tokens can form valid equation
canFormValidEquation(['1', '+', '2', '=', '3']) // Returns boolean

// Find all possible equations
findAllPossibleEquations(['1', '+', '2', '=', '3']) // Returns string[]
```

---

## 📊 Performance Characteristics

### Time Complexity:
- **Token Generation**: O(n) where n = totalCount
- **Blank Expansion**: O(k^m) where k = replacement options, m = blank count
- **Permutation Generation**: O(n!) limited to 10,000
- **Equation Validation**: O(p) where p = expression complexity

### Space Complexity:
- **Token Pool**: O(1) - fixed size
- **Expanded Sets**: O(k^m) - exponential with blanks
- **Permutations**: O(10,000 × n) - limited by permutation count

### Success Rate Factors:
- **Token Distribution**: Balanced numbers/operators
- **Blank Count**: Fewer blanks = higher success rate
- **Operator Mode**: Specific mode more predictable
- **Equals Count**: 1-2 equals optimal

---

## 🚀 Best Practices

### 1. Configuration Guidelines:
```typescript
// Optimal configuration for high success rate
const optimalOptions = {
  totalCount: 10,           // Balanced size
  operatorCount: 2,         // Moderate operators
  equalsCount: 1,           // Single equals
  heavyNumberCount: 1,      // Some heavy numbers
  BlankCount: 0,            // No blanks for predictability
  zeroCount: 0,             // No zeros for simplicity
  operatorMode: 'random'    // Faster generation
};
```

### 2. Performance Optimization:
- Use specific operator mode for predictable results
- Limit blank tokens to 1-2 maximum
- Avoid excessive heavy numbers
- Balance operator count with total tiles

### 3. Error Prevention:
- Always validate options before generation
- Handle generation failures gracefully
- Provide clear error messages
- Implement retry logic with different configurations

---

*This flow ensures robust, efficient generation of valid mathematical equations while maintaining strict adherence to AMath Bingo rules and mathematical correctness.* 




# 🔄 กระบวนการสร้างโจทย์สมการ A-Math Bingo (ฉบับแปลไทย)

## 📋 ภาพรวม  
เอกสารนี้อธิบายขั้นตอนการสร้างสมการคณิตศาสตร์ที่ถูกต้อง จากชุดตัวอักษรตามกติกา A-Math Bingo

---

## 🎯 จุดเริ่มต้น: `generateEquationAnagram(options)`

### ขั้นที่ 1: ตรวจสอบความถูกต้องของค่าที่ส่งเข้า (Validation)

- จำนวน tile รวมต้องอยู่ระหว่าง 8 ถึง 15
- จำนวนเครื่องหมาย + - × ÷ ห้ามเกินจำนวน tile ที่เหลือ
- เครื่องหมาย `=` ต้องไม่เกิน 11
- เลขหนัก (10–20), blank (`?`), และเลข 0 ต้องไม่เกินจำนวนที่มีใน pool
- ถ้าเลือกใช้โหมด operator แบบเจาะจง (specific) ต้องระบุประเภทและจำนวนที่ถูกต้อง

**ตัวอย่าง error:**
- totalCount = 5 → "ต้องมีอย่างน้อย 8 tile"
- operatorCount = 20 → "จำนวน operator เกินจำนวนที่มี"
- equalsCount = 15 → "มีเครื่องหมายเท่ากับมากเกินไป"

---

### ขั้นที่ 2: วนลูปสุ่มโจทย์ (ไม่เกิน 300 ครั้ง)

ในแต่ละรอบ:
- สุ่มตัวอักษรจาก pool ตาม options
- ตรวจสอบว่าสร้างสมการได้จริงไหม
- ถ้าได้อย่างน้อย 1 สมการ → หยุดและคืนค่า
- ถ้าไม่สำเร็จภายใน 300 รอบ → แจ้ง error

---

## 🎲 ขั้นที่ 3: สุ่มตัวอักษร (Token Generation)

1. สร้าง pool ตัวอักษรที่มีทั้งหมด เช่น  
   - เลขเบา: 1–9  
   - เลขหนัก: 10–20  
   - เครื่องหมาย: + - × ÷  
   - เครื่องหมายเท่ากับ `=`  
   - Blank `?`  
   - Zero `0`

2. เลือกลำดับตาม priority:
   - `=` → operator → เลขหนัก → blank → zero → เลขเบา

3. นำมาจัดเรียงใหม่เพื่อให้ได้โครงสร้างที่เหมาะสม (เช่น เอาเลขไว้ต้น)

---

## 🔍 ขั้นที่ 4: ค้นหาสมการจากชุดตัวอักษร

1. แทนที่ blank (`?`) ด้วยค่าที่เป็นไปได้ เช่น 0-9, +, -, ×, ÷, =  
2. สร้างคำสั่งสลับตำแหน่งตัวอักษร (permutation) แต่จำกัดไว้ไม่เกิน 10,000 ชุดต่อกรณี  
3. ตรวจสอบว่าเป็นสมการที่ถูกต้องตามโครงสร้าง และคำนวณได้จริงหรือไม่  
4. หากเจอมากกว่า 15 สมการ → ตัดเหลือแค่ 10 ผลลัพธ์แรก

---

## 🧠 ขั้นที่ 5: ตรวจสอบความถูกต้องของสมการ

- เครื่องหมาย `=` ต้องอยู่กลาง ไม่อยู่ต้นหรือท้าย
- เลข 0 ห้ามติดลบ เช่น `-0` ❌
- เลขหนัก ต้องไม่อยู่ติดกับเลขอื่น เช่น `10 5` ❌
- เครื่องหมายต้องไม่ซ้อน เช่น `++` ❌
- ต้องคำนวณแล้วค่าทั้งสองฝั่งของ `=` เท่ากันจริง

---

## ✅ ผลลัพธ์ที่คืนกลับ

หากสำเร็จ จะคืน:
- รายการตัวอักษรที่ใช้ทั้งหมด (elements)
- สมการตัวอย่างที่เจอ (sampleEquation)
- รายการสมการทั้งหมดที่เป็นไปได้ (possibleEquations)

หากล้มเหลว:
- แจ้ง error ให้ผู้ใช้ปรับ options ใหม่

---

## 💡 เคล็ดลับการตั้งค่า

- ใช้ `equalsCount = 1` เพื่อเพิ่มโอกาสได้สมการ
- อย่าใส่ blank (`?`) เยอะเกินไป
- จำกัด operator ประมาณ 2-3 ตัว
- ถ้าเลือกโหมด operator แบบเจาะจง จะควบคุมรูปแบบสมการได้ดีขึ้น