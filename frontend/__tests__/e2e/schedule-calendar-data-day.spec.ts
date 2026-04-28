import { test, expect } from '@playwright/test';

/**
 * data-day属性を確認するテスト
 */

test.describe('スケジュールカレンダー - data-day属性確認', () => {

  test('日付セルのdata-day属性を確認', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    await page.goto('/schedule');
    await page.waitForSelector('text=/\\d{4}年\\d{1,2}月/', { timeout: 10000 });

    console.log('\n=== 任意のクリック可能な日付セルを探す ===');
    const calendarGrid = page.locator('.grid-cols-7');
    const dayCell = calendarGrid
      .locator('.cursor-pointer:not(.bg-transparent)')
      .first();

    await dayCell.waitFor({ state: 'visible', timeout: 5000 });

    const dataDay = await dayCell.getAttribute('data-day');
    console.log('data-day attribute:', dataDay);

    const text = await dayCell.textContent();
    const dayNumber = text?.trim().match(/(\d+)/)?.[1];
    console.log('Visible text:', text);

    await dayCell.click();
    await page.waitForTimeout(500);

    const url = page.url();
    console.log('URL after click:', url);

    const urlObj = new URL(url);
    const dateParam = urlObj.searchParams.get('date');
    console.log('date parameter:', dateParam);

    // dateパラメータが正しい形式であることを確認
    expect(dateParam).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // クリックした日番号とURLの末尾が一致することを確認
    if (dayNumber) {
      const paddedDay = dayNumber.padStart(2, '0');
      expect(dateParam).toMatch(new RegExp(`-${paddedDay}$`));
    }
  });
});
