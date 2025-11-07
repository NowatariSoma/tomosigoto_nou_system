import { test, expect } from '@playwright/test';

/**
 * スケジュールカレンダーのE2Eテスト
 *
 * このテストは以下を検証します：
 * 1. カレンダーの日付をクリックすると、正しい日付のボトムシートが表示される
 * 2. ボトムシートに表示される日付が、クリックした日付と一致する
 * 3. 前日・翌日ボタンをクリックすると、正しく日付が変わる
 * 4. 月をまたぐ場合も正しく動作する
 */

test.describe('スケジュールカレンダー - 日付の一致テスト', () => {

  test.beforeEach(async ({ page }) => {
    // スケジュールページに移動
    await page.goto('/schedule');

    // カレンダーが表示されるまで待機
    await page.waitForSelector('text=/\\d{4}年\\d{1,2}月/');
  });

  test('カレンダーで日付をクリックすると、正しい日付のボトムシートが表示される', async ({ page }) => {
    // カレンダーのヘッダーから現在の年月を取得
    const headerText = await page.locator('text=/\\d{4}年\\d{1,2}月/').first().textContent();
    console.log('カレンダーヘッダー:', headerText);

    // カレンダーから12日のセルを探してクリック
    // 日付は中央に表示されているので、正確なセレクタを使用
    const dayCell = page.locator('[class*="Card"]').filter({ hasText: /^12$/ }).first();

    // セルが見つかることを確認
    await expect(dayCell).toBeVisible();
    console.log('12日のセルをクリック');

    // クリック
    await dayCell.click();

    // ボトムシートが表示されるまで待機
    await page.waitForTimeout(500); // アニメーション待機

    // ボトムシートのヘッダーから日付を取得
    const bottomSheetHeader = await page.locator('text=/\\d{4}年\\d{1,2}月\\d{1,2}日/').textContent();
    console.log('ボトムシートに表示された日付:', bottomSheetHeader);

    // ボトムシートに「12日」が含まれていることを確認
    expect(bottomSheetHeader).toContain('12日');

    // URLパラメータも確認
    const url = page.url();
    console.log('現在のURL:', url);
    expect(url).toContain('date=');
    expect(url).toMatch(/-12$/); // 日付が12で終わることを確認
  });

  test('ボトムシートで翌日ボタンをクリックすると、13日に移動する', async ({ page }) => {
    // 12日をクリック
    const dayCell = page.locator('[class*="Card"]').filter({ hasText: /^12$/ }).first();
    await dayCell.click();
    await page.waitForTimeout(500);

    // 翌日ボタンをクリック
    const nextButton = page.locator('button').filter({ has: page.locator('[class*="ChevronRight"]') });
    await nextButton.click();
    await page.waitForTimeout(500);

    // ボトムシートのヘッダーを確認
    const bottomSheetHeader = await page.locator('text=/\\d{4}年\\d{1,2}月\\d{1,2}日/').textContent();
    console.log('翌日ボタンクリック後の日付:', bottomSheetHeader);

    // 13日が表示されていることを確認
    expect(bottomSheetHeader).toContain('13日');

    // URLも確認
    const url = page.url();
    expect(url).toMatch(/-13$/);
  });

  test('ボトムシートで前日ボタンをクリックすると、11日に移動する', async ({ page }) => {
    // 12日をクリック
    const dayCell = page.locator('[class*="Card"]').filter({ hasText: /^12$/ }).first();
    await dayCell.click();
    await page.waitForTimeout(500);

    // 前日ボタンをクリック
    const prevButton = page.locator('button').filter({ has: page.locator('[class*="ChevronLeft"]') });
    await prevButton.click();
    await page.waitForTimeout(500);

    // ボトムシートのヘッダーを確認
    const bottomSheetHeader = await page.locator('text=/\\d{4}年\\d{1,2}月\\d{1,2}日/').textContent();
    console.log('前日ボタンクリック後の日付:', bottomSheetHeader);

    // 11日が表示されていることを確認
    expect(bottomSheetHeader).toContain('11日');

    // URLも確認
    const url = page.url();
    expect(url).toMatch(/-11$/);
  });

  test('月末の日付から翌日に移動すると、翌月1日になる', async ({ page }) => {
    // まず、月末近くの日付（例：31日）があるか確認
    const day31Cell = page.locator('[class*="Card"]').filter({ hasText: /^31$/ }).first();

    // 31日が存在する場合のみテスト
    if (await day31Cell.isVisible().catch(() => false)) {
      console.log('31日をクリック');
      await day31Cell.click();
      await page.waitForTimeout(500);

      // 翌日ボタンをクリック
      const nextButton = page.locator('button').filter({ has: page.locator('[class*="ChevronRight"]') });
      await nextButton.click();
      await page.waitForTimeout(500);

      // ボトムシートのヘッダーを確認
      const bottomSheetHeader = await page.locator('text=/\\d{4}年\\d{1,2}月\\d{1,2}日/').textContent();
      console.log('月末の翌日:', bottomSheetHeader);

      // 1日が表示されていることを確認
      expect(bottomSheetHeader).toContain('1日');

      // URLも確認
      const url = page.url();
      expect(url).toMatch(/-01$/);
    } else {
      console.log('31日が存在しないため、このテストをスキップ');
      test.skip();
    }
  });

  test('直接URLで日付を指定すると、正しい日付のボトムシートが表示される', async ({ page }) => {
    // 直接URLで2024-10-15を指定
    await page.goto('/schedule?date=2024-10-15');
    await page.waitForTimeout(500);

    // ボトムシートが表示されることを確認
    const bottomSheetHeader = await page.locator('text=/\\d{4}年\\d{1,2}月\\d{1,2}日/').textContent();
    console.log('URLパラメータで指定した日付:', bottomSheetHeader);

    // 15日が表示されていることを確認
    expect(bottomSheetHeader).toContain('2024年10月15日');
  });

  test('カレンダーの異なる日付をクリックすると、それぞれ正しい日付が表示される', async ({ page }) => {
    // 複数の日付をテスト
    const daysToTest = ['5', '10', '20', '25'];

    for (const day of daysToTest) {
      console.log(`\n${day}日をテスト中...`);

      // カレンダーページに戻る
      await page.goto('/schedule');
      await page.waitForTimeout(300);

      // 日付をクリック
      const dayCell = page.locator('[class*="Card"]').filter({ hasText: new RegExp(`^${day}$`) }).first();

      if (await dayCell.isVisible().catch(() => false)) {
        await dayCell.click();
        await page.waitForTimeout(500);

        // ボトムシートのヘッダーを確認
        const bottomSheetHeader = await page.locator('text=/\\d{4}年\\d{1,2}月\\d{1,2}日/').textContent();
        console.log(`  表示された日付: ${bottomSheetHeader}`);

        // 正しい日付が表示されていることを確認
        expect(bottomSheetHeader).toContain(`${day}日`);

        // URLパラメータも確認
        const url = page.url();
        const dayPadded = day.padStart(2, '0');
        expect(url).toMatch(new RegExp(`-${dayPadded}$`));
      } else {
        console.log(`  ${day}日は表示されていません（スキップ）`);
      }
    }
  });
});
