// ฟังก์ชันเกี่ยวกับ permutation
export function generateLimitedPermutations<T>(arr: T[], maxCount: number): T[][] {
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

export function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= Math.min(n, 10); i++) {
    result *= i;
  }
  return result;
}

export function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
} 