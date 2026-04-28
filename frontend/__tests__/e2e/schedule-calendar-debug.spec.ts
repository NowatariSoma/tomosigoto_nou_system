import { test, expect } from '@playwright/test';

/**
 * デバッグ用テスト - 日付の問題を特定する
 */

test.describe('スケジュールカレンダー - デバッグ', () => {

  test('日付をクリックしたときのURLパラメータを確認', async ({ page }) => {
    page.on('console', msg => {
      console.log(`BROWSER LOG [${msg.type()}]:`, msg.text());
    });

    await page.goto('/schedule');
    await page.waitForSelector('text=/\\d{4}年\\d{1,2}月/', { timeout: 10000 });

    console.log('\n=== クリックする前のURL ===');
    console.log(page.url());

    // 任意のクリック可能な日付セルをクリック
    const calendarGrid = page.locator('.grid-cols-7');
    const dayCell = calendarGrid.locator('.cursor-pointer:not(.bg-transparent)').first();
    await dayCell.waitFor({ state: 'visible', timeout: 5000 });

    const cellText = await dayCell.textContent();
    const dayNumber = cellText?.trim().match(/(\d+)/)?.[1];
    const cellHtml = await dayCell.innerHTML();
    console.log('\n=== クリック対象の要素 ===');
    console.log('Text:', cellText);
    console.log('HTML (first 200 chars):', cellHtml?.substring(0, 200));

    await dayCell.click();

    await page.waitForURL(/date=/, { timeout: 5000 });

    console.log('\n=== クリックした後のURL ===');
    const currentUrl = page.url();
    console.log(currentUrl);

    const url = new URL(currentUrl);
    const dateParam = url.searchParams.get('date');
    console.log('\n=== URLパラメータの date 値 ===');
    console.log(dateParam);

    await page.waitForTimeout(500);

    const dateText = await page.getByRole('heading', { name: /\d{4}年\d{1,2}月\d{1,2}日/ }).first().textContent();
    console.log('\n=== ボトムシートに表示された日付 ===');
    console.log(dateText);

    // URLにdateパラメータがあることを確認
    expect(dateParam).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // ボトムシートにクリックした日付が表示されていることを確認
    if (dayNumber) {
      expect(dateText).toContain(`${dayNumber}日`);
    }
  });
});
