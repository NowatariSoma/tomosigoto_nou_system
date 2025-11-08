import { test, expect } from '@playwright/test';

/**
 * スケジュールカレンダーの簡略版E2Eテスト
 * 基本的な機能のみを素早くテスト
 */

test.describe('スケジュールカレンダー - 基本テスト', () => {

  test('カレンダーで12日をクリック → ボトムシートに12日が表示される', async ({ page }) => {
    // ページに移動
    await page.goto('/schedule');

    // カレンダーが表示されるまで待機
    await page.waitForSelector('text=/\\d{4}年\\d{1,2}月/', { timeout: 10000 });

    // カレンダーグリッド内の12日のセルを探してクリック
    // 前月・翌月の日付はbg-transparentクラスを持つので除外
    // 当月の日付のみを対象にする
    const calendarGrid = page.locator('.grid-cols-7');
    const dayCell = calendarGrid
      .locator('.cursor-pointer:not(.bg-transparent)')
      .filter({ hasText: /^12$/ })
      .first();
    await dayCell.waitFor({ state: 'visible', timeout: 5000 });
    await dayCell.click();

    // アニメーションを待機
    await page.waitForTimeout(500);

    // ボトムシートのヘッダーの日付を確認（最初の見出し要素を取得）
    const dateText = await page.getByRole('heading', { name: /\d{4}年\d{1,2}月\d{1,2}日/ }).first().textContent();
    console.log('表示された日付:', dateText);

    // 12日が表示されていることを確認
    expect(dateText).toContain('12日');
  });

  test('ボトムシートで翌日ボタン → 13日に変わる', async ({ page }) => {
    await page.goto('/schedule');
    await page.waitForSelector('text=/\\d{4}年\\d{1,2}月/', { timeout: 10000 });

    // カレンダーグリッド内の12日をクリック（当月のみ）
    const calendarGrid = page.locator('.grid-cols-7');
    const dayCell = calendarGrid
      .locator('.cursor-pointer:not(.bg-transparent)')
      .filter({ hasText: /^12$/ })
      .first();
    await dayCell.waitFor({ state: 'visible', timeout: 5000 });
    await dayCell.click();
    await page.waitForTimeout(500);

    // 翌日ボタンをクリック
    await page.locator('button').filter({ has: page.locator('svg') }).last().click();
    await page.waitForTimeout(500);

    // 13日が表示されることを確認
    const dateText = await page.getByRole('heading', { name: /\d{4}年\d{1,2}月\d{1,2}日/ }).first().textContent();
    console.log('翌日ボタン後の日付:', dateText);

    expect(dateText).toContain('13日');
  });

  test('ボトムシートで前日ボタン → 11日に変わる', async ({ page }) => {
    await page.goto('/schedule');
    await page.waitForSelector('text=/\\d{4}年\\d{1,2}月/', { timeout: 10000 });

    // カレンダーグリッド内の12日をクリック（当月のみ）
    const calendarGrid = page.locator('.grid-cols-7');
    const dayCell = calendarGrid
      .locator('.cursor-pointer:not(.bg-transparent)')
      .filter({ hasText: /^12$/ })
      .first();
    await dayCell.waitFor({ state: 'visible', timeout: 5000 });
    await dayCell.click();
    await page.waitForTimeout(500);

    // 前日ボタンをクリック
    await page.locator('button').filter({ has: page.locator('svg') }).first().click();
    await page.waitForTimeout(500);

    // 11日が表示されることを確認
    const dateText = await page.getByRole('heading', { name: /\d{4}年\d{1,2}月\d{1,2}日/ }).first().textContent();
    console.log('前日ボタン後の日付:', dateText);

    expect(dateText).toContain('11日');
  });
});
