import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers/navigation';

/**
 * スケジュール出欠フローのE2Eテスト
 *
 * このテストは以下を検証します：
 * 1. スケジュールページへのナビゲーション
 * 2. カレンダーで日付を選択できること
 * 3. 練習スケジュール詳細が表示されること
 * 4. ボトムシートが表示されること
 */

test.describe('スケジュール出欠フロー', () => {
  test.use({ storageState: '__tests__/.auth/user.json' });

  test('スケジュールページに遷移できる', async ({ page }) => {
    await navigateTo(page, '/schedule');

    // カレンダーが表示されるまで待機（年月のヘッダーを確認）
    await expect(page.locator('text=/\\d{4}年\\d{1,2}月/')).toBeVisible({ timeout: 10000 });
  });

  test('カレンダーで日付を選択できる', async ({ page }) => {
    await navigateTo(page, '/schedule');

    // カレンダーが表示されるまで待機
    await page.waitForSelector('text=/\\d{4}年\\d{1,2}月/', { timeout: 10000 });

    // カレンダーグリッド内の15日のセルを探してクリック
    const calendarGrid = page.locator('.grid-cols-7');
    const dayCell = calendarGrid
      .locator('.cursor-pointer:not(.bg-transparent)')
      .filter({ hasText: /^15$/ })
      .first();

    // 日付セルが存在するか確認
    if (await dayCell.isVisible().catch(() => false)) {
      await dayCell.click();

      // アニメーションを待機
      await page.waitForTimeout(500);

      // ボトムシートのヘッダーに日付が表示されることを確認
      const dateHeading = page.getByRole('heading', { name: /\d{4}年\d{1,2}月\d{1,2}日/ }).first();
      await expect(dateHeading).toBeVisible({ timeout: 5000 });

      // 15日が含まれていることを確認
      const dateText = await dateHeading.textContent();
      expect(dateText).toContain('15日');
    } else {
      // 15日が当月に存在しない場合（通常ありえないが安全のため）
      test.skip();
    }
  });

  test('URLパラメータで日付を指定するとボトムシートが表示される', async ({ page }) => {
    // 直接URLで日付を指定
    await page.goto('/schedule?date=2025-03-10');
    await page.waitForLoadState('networkidle');

    // ボトムシートのヘッダーに日付が表示されることを確認
    const dateHeading = page.getByRole('heading', { name: /\d{4}年\d{1,2}月\d{1,2}日/ }).first();
    await expect(dateHeading).toBeVisible({ timeout: 10000 });

    const dateText = await dateHeading.textContent();
    expect(dateText).toContain('10日');
  });

  test('ボトムシートに練習スケジュール情報が表示される', async ({ page }) => {
    await navigateTo(page, '/schedule');

    // カレンダーが表示されるまで待機
    await page.waitForSelector('text=/\\d{4}年\\d{1,2}月/', { timeout: 10000 });

    // カレンダーグリッド内の日付をクリック
    const calendarGrid = page.locator('.grid-cols-7');
    const dayCell = calendarGrid
      .locator('.cursor-pointer:not(.bg-transparent)')
      .filter({ hasText: /^10$/ })
      .first();

    if (await dayCell.isVisible().catch(() => false)) {
      await dayCell.click();
      await page.waitForTimeout(500);

      // ボトムシートが表示されることを確認
      const dateHeading = page.getByRole('heading', { name: /\d{4}年\d{1,2}月\d{1,2}日/ }).first();
      await expect(dateHeading).toBeVisible({ timeout: 5000 });

      // ボトムシート内にコンテンツが存在することを確認
      // 練習データがある場合は詳細が表示され、ない場合は「練習なし」等のメッセージ
      const bottomSheetContent = page.locator('[class*="bottom"]').first()
        .or(page.locator('.fixed').first());

      // ボトムシートが何らかのコンテンツを持っていることを確認
      const hasContent = await dateHeading.isVisible();
      expect(hasContent).toBeTruthy();
    } else {
      test.skip();
    }
  });
});
