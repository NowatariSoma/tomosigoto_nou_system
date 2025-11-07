/**
 * 日付フォーマットのデバッグスクリプト
 * 問題を特定するための検証
 */

console.log('=== 日付フォーマット問題のデバッグ ===\n');

// formatDateToYYYYMMDD関数（実装と同じ）
function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// シナリオ1: カレンダーで10月12日をクリック
console.log('シナリオ1: カレンダーで10月12日をクリックした場合');
const clickedDate = new Date(2024, 9, 12); // 2024年10月12日
console.log(`クリックした日付: ${clickedDate}`);
console.log(`期待されるURL: /schedule?date=2024-10-12`);

const urlWithToISOString = `/schedule?date=${clickedDate.toISOString().split('T')[0]}`;
const urlWithFormatFunc = `/schedule?date=${formatDateToYYYYMMDD(clickedDate)}`;

console.log(`toISOString()使用: ${urlWithToISOString}`);
console.log(`formatDateToYYYYMMDD()使用: ${urlWithFormatFunc}`);
console.log(`結果: ${urlWithFormatFunc.includes('2024-10-12') ? '✓ 正しい' : '✗ 間違い'}\n`);

// シナリオ2: URLから日付を解析してボトムシートに表示
console.log('シナリオ2: URLパラメータからボトムシートで日付を表示');
const urlParam = '2024-10-12';
const [year, month, day] = urlParam.split('-').map(Number);
const parsedDate = new Date(year, month - 1, day);
console.log(`URLパラメータ: ${urlParam}`);
console.log(`解析した日付: ${parsedDate}`);
console.log(`表示される日付: ${parsedDate.getFullYear()}年${parsedDate.getMonth() + 1}月${parsedDate.getDate()}日`);
console.log(`結果: ${parsedDate.getFullYear() === 2024 && parsedDate.getMonth() === 9 && parsedDate.getDate() === 12 ? '✓ 正しい' : '✗ 間違い'}\n`);

// シナリオ3: ボトムシートで翌日ボタンをクリック
console.log('シナリオ3: ボトムシート（10月12日）で翌日ボタンをクリック');
const currentDate = new Date(2024, 9, 12);
const nextDate = new Date(currentDate);
nextDate.setDate(nextDate.getDate() + 1);
console.log(`現在の日付: ${currentDate}`);
console.log(`翌日: ${nextDate}`);
console.log(`期待されるURL: /schedule?date=2024-10-13`);

const nextUrlWithToISOString = `/schedule?date=${nextDate.toISOString().split('T')[0]}`;
const nextUrlWithFormatFunc = `/schedule?date=${formatDateToYYYYMMDD(nextDate)}`;

console.log(`toISOString()使用: ${nextUrlWithToISOString}`);
console.log(`formatDateToYYYYMMDD()使用: ${nextUrlWithFormatFunc}`);
console.log(`結果: ${nextUrlWithFormatFunc.includes('2024-10-13') ? '✓ 正しい' : '✗ 間違い'}\n`);

// シナリオ4: 月をまたぐケース（10月31日→11月1日）
console.log('シナリオ4: 月をまたぐケース（10月31日→11月1日）');
const endOfMonth = new Date(2024, 9, 31); // 10月31日
const nextMonth = new Date(endOfMonth);
nextMonth.setDate(nextMonth.getDate() + 1);
console.log(`10月31日: ${endOfMonth}`);
console.log(`翌日（11月1日）: ${nextMonth}`);
console.log(`期待されるURL: /schedule?date=2024-11-01`);

const crossMonthUrlWithToISOString = `/schedule?date=${nextMonth.toISOString().split('T')[0]}`;
const crossMonthUrlWithFormatFunc = `/schedule?date=${formatDateToYYYYMMDD(nextMonth)}`;

console.log(`toISOString()使用: ${crossMonthUrlWithToISOString}`);
console.log(`formatDateToYYYYMMDD()使用: ${crossMonthUrlWithFormatFunc}`);
console.log(`結果: ${crossMonthUrlWithFormatFunc.includes('2024-11-01') ? '✓ 正しい' : '✗ 間違い'}\n`);

// シナリオ5: タイムゾーンの影響確認
console.log('シナリオ5: タイムゾーンの影響確認');
const date = new Date(2024, 9, 12, 0, 0, 0); // 2024年10月12日 00:00:00 ローカル
console.log(`ローカル日付: ${date}`);
console.log(`getFullYear(): ${date.getFullYear()}`);
console.log(`getMonth(): ${date.getMonth()}`);
console.log(`getDate(): ${date.getDate()}`);
console.log(`toISOString(): ${date.toISOString()}`);
console.log(`toISOString().split('T')[0]: ${date.toISOString().split('T')[0]}`);
console.log(`formatDateToYYYYMMDD(): ${formatDateToYYYYMMDD(date)}`);

const isoDate = date.toISOString().split('T')[0];
const formattedDate = formatDateToYYYYMMDD(date);
console.log(`\nタイムゾーンによるズレ: ${isoDate !== formattedDate ? `あり (${isoDate} vs ${formattedDate})` : 'なし'}\n`);

console.log('=== デバッグ完了 ===');
console.log('\n結論:');
console.log('- toISOString()はUTCに変換するため、JSTでは9時間前の日付になる可能性がある');
console.log('- formatDateToYYYYMMDD()はローカルタイムゾーンをそのまま使用するため正確');
