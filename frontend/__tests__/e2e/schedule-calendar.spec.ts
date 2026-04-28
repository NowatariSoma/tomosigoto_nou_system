import { test, expect } from '@playwright/test';

/**
 * スケジュールカレンダーのE2Eテスト
 *
 * このテストは以下を検証します：
 * 1. カレンダーの日付をクリックすると、正しい日付のボトムシートが表示される
 * 2. ボトムシートに表示される日付が、クリックした日付と一致する
 * 3. 前日・翌日ボタンをクリックすると、正しく日付が変わる
 */

test.describe('スケジュールカレンダー - 日付の一致テスト', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/schedule');
    await page.waitForSelector('text=/\\d{4}年\\d{1,2}月/', { timeout: 10000 });
  });

  test('カレンダーで日付をクリックすると、正しい日付のボトムシートが表示される', async ({ page }) => {
    const headerText = await page.locator('text=/\\d{4}年\\d{1,2}月/').first().textContent();
    console.log('カレンダーヘッダー:', headerText);

    const calendarGrid = page.locator('.grid-cols-7');
    const dayCell = calendarGrid.locator('.cursor-pointer:not(.bg-transparent)').first();
    await dayCell.waitFor({ state: 'visible', timeout: 5000 });

    const dayCellText = await dayCell.textContent();
    const dayNumber = dayCellText?.trim().match(/(\d+)/)?.[1];
    console.log('クリックする日付:', dayNumber);

    await dayCell.click();
    await page.waitForURL(/date=/, { timeout: 5000 });
    await page.waitForTimeout(300);

    const bottomSheetHeader = await page.locator('text=/\\d{4}年\\d{1,2}月\\d{1,2}日/').textContent();
    console.log('ボトムシートに表示された日付:', bottomSheetHeader);

    expect(bottomSheetHeader).toMatch(/\d{4}年\d{1,2}月\d{1,2}日/);
    if (dayNumber) {
      expect(bottomSheetHeader).toContain(`${dayNumber}日`);
    }

    const url = page.url();
    expect(url).toContain('date=');
  });

  test('ボトムシートで翌日ボタンをクリックすると、翌日に移動する', async ({ page }) => {
    // URLで直接日付を指定
    await page.goto('/schedule?date=2026-05-10');
    await page.waitForTimeout(500);

    const heading = page.getByRole('heading', { name: /2026年5月10日/ }).first();
    await heading.waitFor({ state: 'visible', timeout: 5000 });
    console.log('初期日付: 2026年5月10日');

    // 翌日ボタン（flex gap-1 内の最後のボタン）をクリック
    const navContainer = page.locator('.flex.gap-1').filter({
      has: page.locator('button.h-8')
    }).first();
    await navContainer.locator('button').last().click();

    await page.waitForURL(/2026-05-11/, { timeout: 5000 });
    await page.waitForTimeout(300);

    const nextDateText = await page.locator('text=/\\d{4}年\\d{1,2}月\\d{1,2}日/').textContent();
    console.log('翌日ボタンクリック後の日付:', nextDateText);

    expect(nextDateText).toContain('11日');
    expect(page.url()).toMatch(/2026-05-11/);
  });

  test('ボトムシートで前日ボタンをクリックすると、前日に移動する', async ({ page }) => {
    // URLで直接日付を指定
    await page.goto('/schedule?date=2026-05-10');
    await page.waitForTimeout(500);

    const heading = page.getByRole('heading', { name: /2026年5月10日/ }).first();
    await heading.waitFor({ state: 'visible', timeout: 5000 });
    console.log('初期日付: 2026年5月10日');

    // 前日ボタン（flex gap-1 内の最初のボタン）をクリック
    const navContainer = page.locator('.flex.gap-1').filter({
      has: page.locator('button.h-8')
    }).first();
    await navContainer.locator('button').first().click();

    await page.waitForURL(/2026-05-09/, { timeout: 5000 });
    await page.waitForTimeout(300);

    const prevDateText = await page.locator('text=/\\d{4}年\\d{1,2}月\\d{1,2}日/').textContent();
    console.log('前日ボタンクリック後の日付:', prevDateText);

    expect(prevDateText).toContain('9日');
    expect(page.url()).toMatch(/2026-05-09/);
  });

  test('直接URLで日付を指定すると、正しい日付のボトムシートが表示される', async ({ page }) => {
    await page.goto('/schedule?date=2024-10-15');
    await page.waitForTimeout(500);

    const bottomSheetHeader = await page.locator('text=/\\d{4}年\\d{1,2}月\\d{1,2}日/').textContent();
    console.log('URLパラメータで指定した日付:', bottomSheetHeader);

    expect(bottomSheetHeader).toContain('2024年10月15日');
  });

  test('カレンダーの複数日付をクリックすると、それぞれ正しい日付が表示される', async ({ page }) => {
    const calendarGrid = page.locator('.grid-cols-7');
    const dayCells = calendarGrid.locator('.cursor-pointer:not(.bg-transparent)');
    const cellCount = await dayCells.count();

    const testCount = Math.min(3, cellCount);

    for (let i = 0; i < testCount; i++) {
      await page.goto('/schedule');
      await page.waitForSelector('text=/\\d{4}年\\d{1,2}月/', { timeout: 10000 });

      const cells = page.locator('.grid-cols-7').locator('.cursor-pointer:not(.bg-transparent)');
      const cell = cells.nth(i);
      const cellText = await cell.textContent();
      const dayNumber = cellText?.trim().match(/(\d+)/)?.[1];
      console.log(`\n${dayNumber}日をテスト中...`);

      await cell.click();
      await page.waitForURL(/date=/, { timeout: 5000 });
      await page.waitForTimeout(300);

      const bottomSheetHeader = await page.locator('text=/\\d{4}年\\d{1,2}月\\d{1,2}日/').textContent();
      console.log(`  表示された日付: ${bottomSheetHeader}`);

      if (dayNumber) {
        expect(bottomSheetHeader).toContain(`${dayNumber}日`);
      }
    }
  });
});
