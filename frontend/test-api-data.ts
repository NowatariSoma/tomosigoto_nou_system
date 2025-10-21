/**
 * APIデータ取得テストスクリプト
 * バックエンドから適切にデータが取得できているか確認する
 */

import { IdealScheduleData } from './features/practice-slots/types/schedule';

// テスト用の日付（実際に存在するスケジュールの日付に変更してください）
const TEST_DATE = '2025-01-15';

// APIベースURL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface TestResult {
  success: boolean;
  testName: string;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

/**
 * テスト結果を記録
 */
function recordTest(testName: string, success: boolean, message: string, data?: any) {
  results.push({ testName, success, message, data });
  console.log(`${success ? '✓' : '✗'} ${testName}: ${message}`);
  if (data && !success) {
    console.log('  Data:', JSON.stringify(data, null, 2));
  }
}

/**
 * Ideal形式のスケジュールデータを取得してテスト
 */
async function testIdealScheduleEndpoint(date: string) {
  console.log('\n=== Testing /practice-slots/date/{date}/ideal endpoint ===\n');

  try {
    const response = await fetch(`${API_BASE_URL}/practice-slots/date/${date}/ideal`);

    // レスポンスステータスを確認
    if (!response.ok) {
      recordTest(
        'API Response Status',
        false,
        `Failed with status ${response.status}`,
        { status: response.status, statusText: response.statusText }
      );
      return;
    }
    recordTest('API Response Status', true, `Success (${response.status})`);

    // JSONデータを取得
    const data = await response.json() as IdealScheduleData;

    // データ構造の検証
    validateIdealScheduleData(data);

    return data;
  } catch (error) {
    recordTest('API Request', false, `Error: ${error}`, { error });
  }
}

/**
 * Ideal形式のデータ構造を検証
 */
function validateIdealScheduleData(data: any) {
  // schedule_infoの検証
  if (!data.schedule_info) {
    recordTest('schedule_info', false, 'Missing schedule_info field');
  } else {
    recordTest('schedule_info', true, 'Present');

    const requiredFields = ['id', 'schedule_date', 'start_time', 'end_time', 'description'];
    requiredFields.forEach(field => {
      if (data.schedule_info[field] === undefined) {
        recordTest(`  schedule_info.${field}`, false, 'Missing');
      } else {
        recordTest(`  schedule_info.${field}`, true, `= ${data.schedule_info[field]}`);
      }
    });
  }

  // venuesの検証
  if (!Array.isArray(data.venues)) {
    recordTest('venues', false, 'Not an array or missing', { venues: data.venues });
  } else {
    recordTest('venues', true, `Array with ${data.venues.length} items`);

    if (data.venues.length > 0) {
      const venue = data.venues[0];
      const requiredVenueFields = ['id', 'name', 'priority', 'color'];
      requiredVenueFields.forEach(field => {
        if (venue[field] === undefined) {
          recordTest(`  venues[0].${field}`, false, 'Missing');
        } else {
          recordTest(`  venues[0].${field}`, true, `= ${venue[field]}`);
        }
      });
    }
  }

  // time_scheduleの検証
  if (!data.time_schedule || typeof data.time_schedule !== 'object') {
    recordTest('time_schedule', false, 'Not an object or missing', { time_schedule: data.time_schedule });
  } else {
    const timeSlots = Object.keys(data.time_schedule);
    recordTest('time_schedule', true, `Object with ${timeSlots.length} time slots`);

    if (timeSlots.length > 0) {
      const firstTimeSlot = timeSlots[0];
      recordTest(`  time_schedule["${firstTimeSlot}"]`, true, `Present`);

      const venueSlots = data.time_schedule[firstTimeSlot];
      if (typeof venueSlots === 'object') {
        const venueIds = Object.keys(venueSlots);
        recordTest(`    venues in time slot`, true, `${venueIds.length} venues`);

        // 最初の会場の最初のパートを検証
        for (const venueId of venueIds) {
          const parts = venueSlots[venueId];
          if (Array.isArray(parts) && parts.length > 0) {
            const part = parts[0];
            recordTest(`    venue "${venueId}" parts`, true, `${parts.length} parts`);

            const requiredPartFields = [
              'part_id',
              'part_name',
              'part_color',
              'session_title',
              'instructors',
              'participants',
              'status'
            ];

            console.log('\n    First part details:');
            requiredPartFields.forEach(field => {
              if (part[field] === undefined) {
                recordTest(`      ${field}`, false, 'Missing');
              } else {
                const value = Array.isArray(part[field])
                  ? `[${part[field].join(', ')}]`
                  : part[field];
                recordTest(`      ${field}`, true, `= ${value}`);
              }
            });
            break;
          }
        }
      }
    }
  }

  // debug_infoの検証（オプション）
  if (data.debug_info) {
    recordTest('debug_info', true, 'Present (optional)');
    console.log('  Debug info:', JSON.stringify(data.debug_info, null, 2));
  }
}

/**
 * メイン実行関数
 */
async function main() {
  console.log('====================================');
  console.log('API Data Validation Test');
  console.log('====================================');
  console.log(`Testing date: ${TEST_DATE}`);
  console.log(`API URL: ${API_BASE_URL}`);
  console.log('');

  const data = await testIdealScheduleEndpoint(TEST_DATE);

  // サマリー
  console.log('\n====================================');
  console.log('Test Summary');
  console.log('====================================');
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  console.log(`Total: ${results.length} tests`);
  console.log(`✓ Success: ${successCount}`);
  console.log(`✗ Failed: ${failCount}`);

  if (failCount > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.testName}: ${r.message}`);
    });
  }

  console.log('\n====================================');

  // フロントエンドの期待値と一致するか確認
  if (data) {
    console.log('\n📊 Frontend Compatibility Check:');
    console.log('');

    if (data.venues && Array.isArray(data.venues) && data.venues.length > 0) {
      console.log('✓ Venues data is compatible with ScheduleTable component');
    } else {
      console.log('✗ WARNING: Venues data may cause issues in ScheduleTable component');
    }

    if (data.time_schedule && Object.keys(data.time_schedule).length > 0) {
      console.log('✓ Time schedule data is compatible with ScheduleTable component');
    } else {
      console.log('✗ WARNING: Time schedule data may cause issues in ScheduleTable component');
    }

    // セッション情報の詳細確認
    let hasSessionData = false;
    if (data.time_schedule) {
      for (const timeSlot of Object.values(data.time_schedule)) {
        for (const parts of Object.values(timeSlot as any)) {
          if (Array.isArray(parts) && parts.length > 0) {
            hasSessionData = true;
            const part = parts[0];

            console.log('');
            console.log('📝 Sample session data that will be displayed:');
            console.log(`  - Session Title: ${part.session_title || 'N/A'}`);
            console.log(`  - Part Name: ${part.part_name || 'N/A'}`);
            console.log(`  - Instructors: ${part.instructors?.length > 0 ? part.instructors.join(', ') : '指導者未定'}`);
            console.log(`  - Participants: ${part.participants > 0 ? `${part.participants}名` : 'N/A'}`);
            console.log(`  - Status: ${part.status === 'confirmed' ? '確定' : part.status === 'tentative' ? '仮' : part.status || 'N/A'}`);
            break;
          }
        }
        if (hasSessionData) break;
      }
    }

    if (!hasSessionData) {
      console.log('⚠️  No session data found in the response');
      console.log('   This may indicate:');
      console.log('   1. No sessions have been created for this date');
      console.log('   2. Sessions exist but are not being included in the ideal format');
    }
  }
}

// スクリプトとして実行された場合
if (require.main === module) {
  main().catch(console.error);
}

export { testIdealScheduleEndpoint, validateIdealScheduleData };
