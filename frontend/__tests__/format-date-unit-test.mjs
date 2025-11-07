/**
 * formatDateToYYYYMMDD のユニットテスト
 */

function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

console.log('=== formatDateToYYYYMMDD Unit Test ===\n');

// Test 1: 2025年11月12日
const date1 = new Date(2025, 10, 12); // 月は0始まり、10 = 11月
const result1 = formatDateToYYYYMMDD(date1);
console.log('Test 1: new Date(2025, 10, 12)');
console.log('  Expected: 2025-11-12');
console.log('  Got:      ' + result1);
console.log('  Result:   ' + (result1 === '2025-11-12' ? '✓ PASS' : '✗ FAIL'));
console.log();

// Test 2: 実際のDate詳細
console.log('Test 2: Date details');
console.log('  date.getFullYear():', date1.getFullYear());
console.log('  date.getMonth():', date1.getMonth());
console.log('  date.getMonth() + 1:', date1.getMonth() + 1);
console.log('  date.getDate():', date1.getDate());
console.log();

// Test 3: タイムゾーン確認
const date3 = new Date(2025, 10, 12, 0, 0, 0);
console.log('Test 3: タイムゾーン確認');
console.log('  Local:', date3.toString());
console.log('  ISO:   ', date3.toISOString());
console.log('  formatDateToYYYYMMDD:', formatDateToYYYYMMDD(date3));
console.log('  ISO split:', date3.toISOString().split('T')[0]);
console.log();

console.log('===完了===');
