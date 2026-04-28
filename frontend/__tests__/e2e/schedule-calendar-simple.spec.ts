import { test, expect } from '@playwright/test';

/**
 * スケジュールカレンダーの簡略版E2Eテスト
 * 基本的な機能のみを素早くテスト
 */

test.describe('スケジュールカレンダー - 基本テスト', () => {

  test('カレンダーで日付をクリック → ボトムシートに日付が表示される', async ({ page }) => {
    await page.goto('/schedule');
    await page.waitForSelector('text=/\\d{4}年\\d{1,2}月/', { timeout: 10000 });

    const calendarGrid = page.locator('.grid-cols-7');
    const dayCell = calendarGrid
      .locator('.cursor-pointer:not(.bg-transparent)')
      .first();
    await dayCell.waitFor({ state: 'visible', timeout: 5000 });

    const dayCellText = await dayCell.textContent();
    const dayNumber = dayCellText?.trim().match(/(\d+)/)?.[1];
    console.log('クリックする日付:', dayNumber);

    await dayCell.click();
    await page.waitForURL(/date=/, { timeout: 5000 });
    await page.waitForTimeout(300);

    const dateText = await page.getByRole('heading', { name: /\d{4}年\d{1,2}月\d{1,2}日/ }).first().textContent();
    console.log('表示された日付:', dateText);

    expect(dateText).toMatch(/\d{4}年\d{1,2}月\d{1,2}日/);
    if (dayNumber) {
      expect(dateText).toContain(`${dayNumber}日`);
    }
  });

  test('ボトムシートで翌日ボタン → 翌日の日付に変わる', async ({ page }) => {
    // URLで直接日付を指定してボトムシートを開く
    await page.goto('/schedule?date=2026-05-10');
    await page.waitForTimeout(500);

    // ボトムシートに日付が表示されることを確認
    const heading = page.getByRole('heading', { name: /2026年5月10日/ }).first();
    await heading.waitFor({ state: 'visible', timeout: 5000 });

    const initialDateText = await heading.textContent();
    console.log('初期日付:', initialDateText);

    // 翌日ボタン（flex gap-1 内の2番目のボタン）をクリック
    const navContainer = page.locator('.flex.gap-1').filter({
      has: page.locator('button.h-8')
    }).first();
    await navContainer.locator('button').last().click();

    await page.waitForURL(/2026-05-11/, { timeout: 5000 });
    await page.waitForTimeout(300);

    const nextDateText = await page.getByRole('heading', { name: /\d{4}年\d{1,2}月\d{1,2}日/ }).first().textContent();
    console.log('翌日ボタン後の日付:', nextDateText);

    expect(nextDateText).toContain('11日');
  });

  test('ボトムシートで前日ボタン → 前日の日付に変わる', async ({ page }) => {
    // URLで直接日付を指定してボトムシートを開く
    await page.goto('/schedule?date=2026-05-10');
    await page.waitForTimeout(500);

    const heading = page.getByRole('heading', { name: /2026年5月10日/ }).first();
    await heading.waitFor({ state: 'visible', timeout: 5000 });

    const initialDateText = await heading.textContent();
    console.log('初期日付:', initialDateText);

    // 前日ボタン（flex gap-1 内の1番目のボタン）をクリック
    const navContainer = page.locator('.flex.gap-1').filter({
      has: page.locator('button.h-8')
    }).first();
    await navContainer.locator('button').first().click();

    await page.waitForURL(/2026-05-09/, { timeout: 5000 });
    await page.waitForTimeout(300);

    const prevDateText = await page.getByRole('heading', { name: /\d{4}年\d{1,2}月\d{1,2}日/ }).first().textContent();
    console.log('前日ボタン後の日付:', prevDateText);

    expect(prevDateText).toContain('9日');
  });
});
